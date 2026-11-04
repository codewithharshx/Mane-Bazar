/**
 * whatsappService.js
 *
 * Twilio WhatsApp integration for order notifications.
 * Sends order confirmations, bill links, and delivery updates via WhatsApp.
 */

const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155552671"; // Twilio sandbox default

let client = null;

/**
 * Initialize Twilio client
 */
const initTwilio = () => {
  if (!accountSid || !authToken) {
    console.warn("[WhatsApp] Twilio credentials not configured. WhatsApp notifications disabled.");
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log("[WhatsApp] Twilio client initialized successfully");
    return client;
  } catch (error) {
    console.error("[WhatsApp] Failed to initialize Twilio client:", error.message);
    return null;
  }
};

/**
 * Send WhatsApp message
 * @param {string} phoneNumber - Recipient phone (E.164 format: +919876543210)
 * @param {string} messageBody - Message text
 * @returns {Promise<object>} Message SID or error
 */
const sendWhatsAppMessage = async (phoneNumber, messageBody) => {
  if (!client) {
    if (!accountSid || !authToken) {
      console.warn("[WhatsApp] Credentials not configured, skipping message to:", phoneNumber);
      return { skipped: true, reason: "Credentials not configured" };
    }
    client = initTwilio();
    if (!client) {
      return { error: "Failed to initialize Twilio client" };
    }
  }

  if (!phoneNumber || !messageBody) {
    return { error: "Phone number and message body are required" };
  }

  try {
    // Format phone number with +91 prefix if not already formatted
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/\D/g, "");
    }

    const message = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`,
      body: messageBody
    });

    console.log(`[WhatsApp] Message sent to ${formattedPhone}. SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send message to ${phoneNumber}:`, error.message);
    return { error: error.message };
  }
};

/**
 * Send WhatsApp message with media (image, document)
 * @param {string} phoneNumber - Recipient phone
 * @param {string} messageBody - Message text
 * @param {string} mediaUrl - URL of media to attach (optional)
 * @returns {Promise<object>} Message SID or error
 */
const sendWhatsAppMessageWithMedia = async (phoneNumber, messageBody, mediaUrl) => {
  if (!client) {
    client = initTwilio();
    if (!client) {
      return { error: "Twilio client not initialized" };
    }
  }

  if (!phoneNumber || !messageBody) {
    return { error: "Phone number and message body are required" };
  }

  try {
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/\D/g, "");
    }

    const messageObj = {
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`,
      body: messageBody
    };

    if (mediaUrl) {
      messageObj.mediaUrl = [mediaUrl];
    }

    const message = await client.messages.create(messageObj);

    console.log(`[WhatsApp] Message with media sent to ${formattedPhone}. SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error(`[WhatsApp] Failed to send message with media:`, error.message);
    return { error: error.message };
  }
};

/**
 * Send order confirmation via WhatsApp
 */
const sendOrderConfirmation = async (phoneNumber, order, customerName) => {
  const itemsList = order.items.map((item) => `• ${item.name} x${item.qty}`).join("\n");

  const messageBody = `
📦 Order Confirmed!

Hello ${customerName},

Your order #${order.orderId} has been confirmed.

Items:
${itemsList}

💰 Total: Rs. ${order.pricing.total.toFixed(2)}
📍 Delivery: ${order.deliverySlot.date} | ${order.deliverySlot.timeSlot}

Thank you for shopping with Mane Bazar! 🛒
`.trim();

  return sendWhatsAppMessage(phoneNumber, messageBody);
};

/**
 * Send payment confirmation with bill PDF via WhatsApp
 */
const sendPaymentConfirmation = async (phoneNumber, order, customerName, billPdfUrl) => {
  const messageBody = `
✅ Payment Received!

Hello ${customerName},

Your payment for order #${order.orderId} has been confirmed.

Amount: Rs. ${order.pricing.total.toFixed(2)}

Download your bill from the link in your order details.

Fresh groceries on the way! 🚚
`.trim();

  return sendWhatsAppMessageWithMedia(phoneNumber, messageBody, billPdfUrl);
};

/**
 * Send delivery update via WhatsApp
 */
const sendDeliveryUpdate = async (phoneNumber, order, customerName, status) => {
  let updateMessage = "";

  switch (status) {
    case "out_for_delivery":
      updateMessage = `
🚚 Out for Delivery!

Your order #${order.orderId} is on its way to you.

Expected Delivery: ${order.deliverySlot.date} | ${order.deliverySlot.timeSlot}
Delivery Location: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}

Keep your phone handy! 📱
`.trim();
      break;
    case "delivered":
      updateMessage = `
✨ Delivered!

Your order #${order.orderId} has been delivered successfully.

Thank you for shopping with Mane Bazar! 
See you soon 👋
`.trim();
      break;
    case "cancelled":
      updateMessage = `
❌ Order Cancelled

Your order #${order.orderId} has been cancelled.

If you have any questions, please contact our support team.

Mane Bazar Support Team 🛒
`.trim();
      break;
    default:
      updateMessage = `Order #${order.orderId} status updated: ${status}`;
  }

  return sendWhatsAppMessage(phoneNumber, updateMessage);
};

/**
 * Batch send messages to admin and customer
 */
const sendOrderNotificationToAdminAndCustomer = async (order, user, status) => {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;

  const results = {};

  // Send to customer
  if (user.phone) {
    results.customer = await sendDeliveryUpdate(
      user.phone,
      order,
      user.name,
      status
    );
  }

  // Send to admin
  if (adminPhone) {
    const adminMessage = `New Order #${order.orderId}\nCustomer: ${user.name}\nAmount: Rs. ${order.pricing.total}\nStatus: ${status}`;
    results.admin = await sendWhatsAppMessage(adminPhone, adminMessage);
  }

  return results;
};

module.exports = {
  initTwilio,
  sendWhatsAppMessage,
  sendWhatsAppMessageWithMedia,
  sendOrderConfirmation,
  sendPaymentConfirmation,
  sendDeliveryUpdate,
  sendOrderNotificationToAdminAndCustomer
};
