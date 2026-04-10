const crypto = require("crypto");
const Razorpay = require("razorpay");

let razorpayInstance;

const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  return razorpayInstance;
};

const createRazorpayOrder = async ({ amount, receipt }) => {
  const instance = getRazorpayInstance();
  return instance.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt,
    payment_capture: 1
  });
};

const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
}) => {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return expectedSignature === razorpaySignature;
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpaySignature
};
