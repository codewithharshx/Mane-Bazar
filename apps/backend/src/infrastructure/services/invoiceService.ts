import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Invoices directory is apps/backend/invoices
const invoicesDir = path.join(__dirname, "..", "..", "..", "invoices");

const ensureInvoicesDir = (): void => {
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }
};

/**
 * Generate UPI payment QR code data URL
 * Format: upi://pay?pa=upiid@bank&pn=name&am=amount&tr=reference
 */
export const generateUPIQRCode = async (order: any, UPI_ID: string = "manebazar@upi"): Promise<string | null> => {
  const totalAmount = order.pricing?.total ?? order.total;
  const upiString = `upi://pay?pa=${UPI_ID}&pn=ManeBazar&am=${totalAmount}&tr=${order.orderId}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(upiString);
    return qrDataUrl;
  } catch (error: any) {
    console.warn("Failed to generate QR code:", error.message);
    return null;
  }
};

export const generateInvoice = (order: any, user: any): Promise<string> =>
  new Promise(async (resolve, reject) => {
    try {
      ensureInvoicesDir();

      const invoiceFilename = `${order.orderId}.pdf`;
      const invoicePath = path.join(invoicesDir, invoiceFilename);

      // Create PDF Kit document - note that types for PDFKit may need pdfkit module.
      // We can use instantiation directly.
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
        .text(`Payment Method: ${String(order.paymentMethod).toUpperCase()}`)
        .text(`Payment Status: ${String(order.paymentStatus).toUpperCase()}`);

      doc.moveDown();
      doc.fontSize(14).fillColor("#111827").text("Bill To");
      
      const deliveryAddress = order.deliveryAddress;
      const addressStreet = deliveryAddress?.street ?? "";
      const addressCity = deliveryAddress?.city ?? "";
      const addressPincode = deliveryAddress?.pincode ?? "";
      const addressPhone = deliveryAddress?.phone ?? "Phone not provided";

      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(user.name)
        .text(addressStreet)
        .text(`${addressCity} - ${addressPincode}`)
        .text(addressPhone);

      doc.moveDown();
      doc.fontSize(14).fillColor("#111827").text("Delivery Slot");
      
      const deliverySlot = order.deliverySlot;
      const slotDate = deliverySlot?.date ?? "";
      const slotTime = deliverySlot?.timeSlot ?? deliverySlot?.time ?? "";

      doc
        .fontSize(11)
        .fillColor("#374151")
        .text(`${slotDate} | ${slotTime}`);

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
      const itemsList = order.items || [];
      itemsList.forEach((item: any) => {
        doc
          .fontSize(10)
          .fillColor("#111827")
          .text(item.name, columns.item, y, { width: 230 })
          .text(String(item.qty), columns.qty, y)
          .text(`Rs. ${Number(item.price).toFixed(2)}`, columns.price, y)
          .text(`Rs. ${(item.qty * item.price).toFixed(2)}`, columns.total, y);
        y += 24;
      });

      y += 16;
      doc.moveTo(48, y).lineTo(540, y).strokeColor("#d1d5db").stroke();
      y += 12;

      const rightX = 360;
      const addSummaryRow = (label: string, value: string) => {
        doc.fontSize(11).fillColor("#374151").text(label, rightX, y);
        doc.text(value, 470, y, { align: "right", width: 70 });
        y += 18;
      };

      const subtotal = order.pricing?.subtotal ?? order.subtotal ?? 0;
      const discount = order.pricing?.discount ?? order.discount ?? 0;
      const tax = order.pricing?.tax ?? order.tax ?? 0;
      const deliveryCharge = order.pricing?.deliveryCharge ?? order.deliveryCharge ?? 0;
      const total = order.pricing?.total ?? order.total ?? 0;

      addSummaryRow("Subtotal", `Rs. ${Number(subtotal).toFixed(2)}`);
      addSummaryRow("Coupon Discount", `- Rs. ${Number(discount).toFixed(2)}`);
      addSummaryRow("GST (5%)", `Rs. ${Number(tax).toFixed(2)}`);
      addSummaryRow("Delivery Charge", `Rs. ${Number(deliveryCharge).toFixed(2)}`);

      doc.fontSize(13).fillColor("#111827").text("Grand Total", rightX, y);
      doc.text(`Rs. ${Number(total).toFixed(2)}`, 470, y, {
        align: "right",
        width: 70,
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
