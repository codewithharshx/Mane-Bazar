import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155552671";

let client: any = null;

const initTwilio = () => {
  if (!accountSid || !authToken) {
    console.warn("[WhatsApp] Twilio credentials not configured. WhatsApp notifications disabled.");
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    console.log("[WhatsApp] Twilio client initialized successfully");
    return client;
  } catch (error: any) {
    console.error("[WhatsApp] Failed to initialize Twilio client:", error.message);
    return null;
  }
};

interface SendResult {
  success?: boolean;
  messageSid?: string;
  skipped?: boolean;
  reason?: string;
  error?: string;
}

export const sendWhatsAppMessage = async (phoneNumber: string, messageBody: string): Promise<SendResult> => {
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
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/\D/g, "");
    }

    const message = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`,
      body: messageBody,
    });

    console.log(`[WhatsApp] Message sent to ${formattedPhone}. SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to send message to ${phoneNumber}:`, error.message);
    return { error: error.message };
  }
};

export const sendWhatsAppMessageWithMedia = async (
  phoneNumber: string,
  messageBody: string,
  mediaUrl?: string,
): Promise<SendResult> => {
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

    const messageObj: any = {
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`,
      body: messageBody,
    };

    if (mediaUrl) {
      messageObj.mediaUrl = [mediaUrl];
    }

    const message = await client.messages.create(messageObj);

    console.log(`[WhatsApp] Message with media sent to ${formattedPhone}. SID: ${message.sid}`);
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error(`[WhatsApp] Failed to send message with media:`, error.message);
    return { error: error.message };
  }
};

export const sendOrderConfirmation = async (phoneNumber: string, order: any, customerName: string): Promise<SendResult> => {
  const itemsList = order.items.map((item: any) => `• ${item.name} x${item.qty}`).join("\n");

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

export const sendPaymentConfirmation = async (
  phoneNumber: string,
  order: any,
  customerName: string,
  billPdfUrl: string,
): Promise<SendResult> => {
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

export const sendDeliveryUpdate = async (
  phoneNumber: string,
  order: any,
  customerName: string,
  status: string,
): Promise<SendResult> => {
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

export const sendOrderNotificationToAdminAndCustomer = async (order: any, user: any, status: string): Promise<any> => {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER;
  const results: any = {};

  if (user.phone) {
    results.customer = await sendDeliveryUpdate(user.phone, order, user.name, status);
  }

  if (adminPhone) {
    const adminMessage = `New Order #${order.orderId}\nCustomer: ${user.name}\nAmount: Rs. ${order.pricing.total}\nStatus: ${status}`;
    results.admin = await sendWhatsAppMessage(adminPhone, adminMessage);
  }

  return results;
};
