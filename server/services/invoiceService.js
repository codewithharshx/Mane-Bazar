const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

const invoicesDir = path.join(__dirname, "..", "invoices");

const ensureInvoicesDir = () => {
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
};

/**
 * Generate UPI payment QR code data
 * Format: upi://pay?pa=upiid@bank&pn=name&am=amount&tr=reference
 */
const generateUPIQRCode = async (order, UPI_ID = "manebazar@upi") => {
  const upiString = `upi://pay?pa=${UPI_ID}&pn=ManeBazar&am=${order.pricing.total}&tr=${order.orderId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(upiString);
    return qrDataUrl;
  } catch (error) {
    console.warn("Failed to generate QR code:", error.message);
    return null;
  }
};

const generateInvoice = (order, user) =>
  new Promise(async (resolve, reject) => {
    try {
      ensureInvoicesDir();

      const invoiceFilename = `${order.orderId}.pdf`;
      const invoicePath = path.join(invoicesDir, invoiceFilename);
      const doc = new PDFDocument({ margin: 48 });
      const stream = fs.createWriteStream(invoicePath);

      // Generate QR code for payment
      const qrDataUrl = await generateUPIQRCode(order);

      doc.pipe(stream);
      doc
        .fontSize(22)
        .fillColor("#16a34a")
        .text("Mane Bazar", { continued: true })
        .fillColor("#1f2937")
        .text("  |  Grocery Invoice");

      doc.moveDown(0.5);
      doc
        .fontSize(10)
        .fillColor("#4b5563")
        .text(`Invoice Number: ${order.orderId}`)
        .text(`Invoice Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`)
        .text(`Payment Method: ${order.paymentMethod.toUpperCase()}`)
        .text(`Payment Status: ${order.paymentStatus.toUpperCase()}`);

      doc.moveDown();
      doc.fontSize(14).fillColor("#111827").text("Bill To");
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(user.name)
        .text(order.deliveryAddress.street)
        .text(`${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}`)
        .text(order.deliveryAddress.phone || "Phone not provided");

      doc.moveDown();
      doc.fontSize(14).fillColor("#111827").text("Delivery Slot");
      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(`${order.deliverySlot.date} | ${order.deliverySlot.timeSlot}`);

      doc.moveDown();
      doc.fontSize(13).fillColor("#111827").text("Items");

      const tableTop = doc.y + 12;
      const columns = { item: 48, qty: 300, price: 360, total: 450 };

      doc
        .fontSize(11)
        .fillColor("#6b7280")
        .text("Product", columns.item, tableTop)
        .text("Qty", columns.qty, tableTop)
        .text("Unit Price", columns.price, tableTop)
        .text("Total", columns.total, tableTop);

      let y = tableTop + 22;
      order.items.forEach((item) => {
        doc
          .fontSize(10)
          .fillColor("#111827")
          .text(item.name, columns.item, y, { width: 230 })
          .text(String(item.qty), columns.qty, y)
          .text(`Rs. ${item.price.toFixed(2)}`, columns.price, y)
          .text(`Rs. ${(item.qty * item.price).toFixed(2)}`, columns.total, y);
        y += 24;
      });

      y += 16;
      doc.moveTo(48, y).lineTo(540, y).strokeColor("#d1d5db").stroke();
      y += 12;

      const rightX = 360;
      const addSummaryRow = (label, value) => {
        doc.fontSize(11).fillColor("#374151").text(label, rightX, y);
        doc.text(value, 470, y, { align: "right", width: 70 });
        y += 18;
      };

      addSummaryRow("Subtotal", `Rs. ${order.pricing.subtotal.toFixed(2)}`);
      addSummaryRow("Coupon Discount", `- Rs. ${order.pricing.discount.toFixed(2)}`);
      addSummaryRow("GST (5%)", `Rs. ${order.pricing.tax.toFixed(2)}`);
      addSummaryRow("Delivery Charge", `Rs. ${order.pricing.deliveryCharge.toFixed(2)}`);

      doc.fontSize(13).fillColor("#111827").text("Grand Total", rightX, y);
      doc.text(`Rs. ${order.pricing.total.toFixed(2)}`, 470, y, {
        align: "right",
        width: 70
      });

      // Add QR code if available
      if (qrDataUrl) {
        y += 36;
        doc.fontSize(12).fillColor("#111827").text("Scan to Pay", 48, y);
        doc.moveDown(0.3);
        try {
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
          doc.image(qrBuffer, 48, doc.y, { width: 100, height: 100 });
          y = doc.y + 12;
        } catch {
          console.warn("Failed to embed QR code in PDF");
        }
      }

      y = Math.max(y, doc.y + 12);
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .text("Thank you for shopping with Mane Bazar.", 48, y)
        .text("Fresh groceries delivered with care.", 48, y + 14);

      doc.end();

      stream.on("finish", () => resolve(invoicePath));
      stream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });

module.exports = {
  generateInvoice,
  generateUPIQRCode
};
