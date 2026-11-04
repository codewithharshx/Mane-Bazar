import api from "./apiClient";

export const paymentApi = {
  /**
   * Step 1: Reserve stock + create Razorpay order.
   * Returns { orderId, order: { id, amount, currency }, pricing }
   */
  createOrder: (payload, config = {}) =>
    api.post("/payment/create-order", payload, config),

  /**
   * Step 2: Verify Razorpay signature and confirm order.
   * Payload: { razorpayOrderId, razorpayPaymentId, razorpaySignature }
   */
  verify: (payload, config = {}) =>
    api.post("/payment/verify", payload, config),

  /**
   * Step 3 (failure path): Notify server that payment failed/was cancelled.
   * Restores reserved stock. Call from Razorpay modal's onDismiss/error handler.
   * Payload: { razorpayOrderId, reason? }
   */
  paymentFailed: (payload, config = {}) =>
    api.post("/payment/payment-failed", payload, config)
};
