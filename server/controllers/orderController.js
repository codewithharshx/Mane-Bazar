const fs = require("fs");
const path = require("path");
const Coupon = require("../models/Coupon");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Product = require("../models/Product");
const Store = require("../models/Store");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { validateCoupon } = require("./couponController");
const { generateInvoice } = require("../services/invoiceService");
const {
  calculatePricing,
  generateOrderId,
  isCancellableStatus,
  normalizeDeliverySlot,
  calculateDistance,
  mockCoordinatesFromPincode
} = require("../utils/order");

const SLOT_LIMIT = 20;

const validateDeliverySlot = async ({ date, timeSlot }) => {
  const ordersInSlot = await Order.countDocuments({
    "deliverySlot.date": date,
    "deliverySlot.timeSlot": timeSlot,
    status: { $ne: "cancelled" }
  });

  if (ordersInSlot >= SLOT_LIMIT) {
    throw new Error("Selected delivery slot is full. Please choose another one.");
  }
};

const normalizeItemsFromProducts = (items, productsMap) =>
  items.map((item) => {
    const product = productsMap.get(item.productId);
    return {
      product: product._id,
      name: product.name,
      price: product.price,
      qty: Number(item.qty),
      image: product.images?.[0] || ""
    };
  });

const adjustStock = async (items, mode = "decrement") => {
  const bulkOps = items.map((item) => ({
    updateOne: {
      filter: { _id: item.product },
      update: {
        $inc: { stock: mode === "decrement" ? -item.qty : item.qty }
      }
    }
  }));

  await Product.bulkWrite(bulkOps);
};

const buildOrderPayload = async ({
  userId,
  items,
  storeId,
  deliveryAddress,
  deliverySlot,
  paymentMethod,
  paymentStatus,
  razorpayMeta = {},
  couponCode = "",
  forcedOrderId = ""
}) => {
  if (!items?.length) {
    throw new Error("At least one cart item is required");
  }

  const normalizedTimeSlot = normalizeDeliverySlot(deliverySlot?.timeSlot);
  if (!normalizedTimeSlot) {
    throw new Error("Invalid delivery slot");
  }

  const normalizedDeliverySlot = {
    ...deliverySlot,
    timeSlot: normalizedTimeSlot
  };

  await validateDeliverySlot(normalizedDeliverySlot);

  const productIds = items.map((item) => item.productId);
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true
  }).populate("storeId", "name isOpen pincode deliveryRadiusKm location");
  const productsMap = new Map(products.map((product) => [product._id.toString(), product]));

  const inferredStoreIds = new Set(
    products
      .map((product) => (product.storeId ? product.storeId._id.toString() : ""))
      .filter(Boolean)
  );

  if (storeId && inferredStoreIds.size && !inferredStoreIds.has(storeId.toString())) {
    throw new Error("Selected store does not match cart products");
  }

  if (inferredStoreIds.size > 1) {
    throw new Error("Cart contains items from multiple stores. Place separate orders per store.");
  }

  const resolvedStoreId = storeId || Array.from(inferredStoreIds)[0] || null;
  let store = null;

  if (resolvedStoreId) {
    store = await Store.findById(resolvedStoreId);
    if (!store) {
      throw new Error("Store not found for this order");
    }
    if (!store.isOpen) {
      throw new Error("Store is currently closed. Please order when the store is open.");
    }
    if (store.pincode && deliveryAddress?.pincode && store.pincode !== deliveryAddress.pincode) {
      // Relax pincode exact match if we are doing 25km radius check
      // We will rely on the 25km distance rule instead
    }

    if (store.location && store.location.coordinates) {
      const storeLng = store.location.coordinates[0];
      const storeLat = store.location.coordinates[1];
      
      let userLat = deliveryAddress.lat;
      let userLng = deliveryAddress.lng;
      
      if (!userLat || !userLng) {
        const mockCoord = mockCoordinatesFromPincode(deliveryAddress.pincode);
        userLat = mockCoord.lat;
        userLng = mockCoord.lng;
      }

      const distance = calculateDistance(storeLat, storeLng, userLat, userLng);
      // Let's console log for debugging distance
      console.log(`Calculated distance between store and delivery address: ${distance.toFixed(2)} km`);
      if (distance > 25) {
        throw new Error("Delivery not available. Your location is outside our 25km delivery radius.");
      }
    }
  }

  items.forEach((item) => {
    const product = productsMap.get(item.productId);
    if (!product) {
      throw new Error("One or more products are no longer available");
    }
    if (product.stock < Number(item.qty)) {
      throw new Error(`${product.name} does not have enough stock`);
    }
  });

  const normalizedItems = normalizeItemsFromProducts(items, productsMap);
  const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryCharge = subtotal >= 499 ? 0 : 40;

  let appliedCoupon = null;
  let couponDiscount = 0;
  if (couponCode) {
    const { coupon, discount } = await validateCoupon({ code: couponCode, subtotal });
    appliedCoupon = coupon;
    couponDiscount = discount;
  }

  const pricing = calculatePricing({
    items: normalizedItems,
    couponDiscount,
    deliveryCharge
  });

  return {
    orderId: forcedOrderId || (await generateOrderId()),
    user: userId,
    storeId: resolvedStoreId,
    items: normalizedItems,
    pricing,
    couponCode: appliedCoupon?.code || "",
    paymentMethod,
    paymentStatus,
    razorpayOrderId: razorpayMeta.razorpayOrderId || "",
    razorpayPaymentId: razorpayMeta.razorpayPaymentId || "",
    razorpaySignature: razorpayMeta.razorpaySignature || "",
    deliveryAddress,
    deliverySlot: normalizedDeliverySlot,
    status: "placed",
    statusHistory: [
      {
        status: "placed",
        updatedAt: new Date(),
        note: "Order placed successfully"
      }
    ],
    appliedCoupon
  };
};

const persistSuccessfulOrder = async (orderPayload) => {
  const { appliedCoupon, ...payload } = orderPayload;
  const order = await Order.create(payload);
  await adjustStock(order.items, "decrement");

  if (appliedCoupon) {
    appliedCoupon.usedCount += 1;
    await appliedCoupon.save();
  }

  const user = await User.findById(order.user);
  const invoicePath = await generateInvoice(order, user);
  order.invoicePath = invoicePath;
  await order.save();

  await Payment.create({
    order: order._id,
    user: order.user,
    razorpayOrderId: order.razorpayOrderId,
    razorpayPaymentId: order.razorpayPaymentId,
    razorpaySignature: order.razorpaySignature,
    amount: order.pricing.total,
    currency: "INR",
    status: order.paymentStatus
  });

  return { order };
};

const createCODOrder = asyncHandler(async (req, res) => {
  const orderPayload = await buildOrderPayload({
    userId: req.user._id,
    items: req.body.items,
    storeId: req.body.storeId,
    deliveryAddress: req.body.deliveryAddress,
    deliverySlot: req.body.deliverySlot,
    paymentMethod: "cod",
    paymentStatus: "pending",
    couponCode: req.body.couponCode || ""
  });

  const { order } = await persistSuccessfulOrder(orderPayload);
  const populatedOrder = await Order.findById(order._id)
    .populate("items.product", "name slug")
    .populate("user", "name email");

  res.status(201).json({
    message: "COD order placed successfully",
    order: populatedOrder
  });
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate("storeId", "name city")
    .populate("items.product", "slug");
  res.json(orders);
});

const getOrderByOrderId = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId })
    .populate("storeId", "name city address phone")
    .populate("items.product", "slug")
    .populate("user", "name email");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json(order);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = "" } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  order.statusHistory.push({
    status,
    updatedAt: new Date(),
    note: note || `Status updated to ${status}`
  });

  if (status === "delivered" && order.paymentMethod === "cod") {
    order.paymentStatus = "paid";
  }

  await order.save();
  res.json({
    message: "Order status updated successfully",
    order
  });
});

const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to cancel this order");
  }

  if (!isCancellableStatus(order.status)) {
    res.status(400);
    throw new Error("This order can no longer be cancelled");
  }

  order.status = "cancelled";
  order.statusHistory.push({
    status: "cancelled",
    updatedAt: new Date(),
    note: req.body.note || "Order cancelled"
  });

  await adjustStock(order.items, "increment");

  if (order.couponCode) {
    const coupon = await Coupon.findOne({ code: order.couponCode });
    if (coupon && coupon.usedCount > 0) {
      coupon.usedCount -= 1;
      await coupon.save();
    }
  }

  if (order.paymentStatus === "paid") {
    order.paymentStatus = "failed";
  }

  await order.save();

  res.json({
    message: "Order cancelled successfully",
    order
  });
});

const downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId }).populate(
    "user",
    "name"
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (
    req.user.role !== "admin" &&
    order.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error("Not authorized to download this invoice");
  }

  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    res.status(404);
    throw new Error("Invoice not available");
  }

  res.download(order.invoicePath, path.basename(order.invoicePath));
});

module.exports = {
  buildOrderPayload,
  persistSuccessfulOrder,
  createCODOrder,
  getMyOrders,
  getOrderByOrderId,
  updateOrderStatus,
  cancelOrder,
  downloadInvoice
};
