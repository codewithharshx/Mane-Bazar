export type Role = "USER" | "ADMIN";
export type DiscountType = "PERCENT" | "FLAT";
export type PaymentMethod = "RAZORPAY" | "COD";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUND_PENDING" | "REFUNDED";
export type OrderStatus = "PENDING_PAYMENT" | "PLACED" | "CONFIRMED" | "PACKED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  lat?: number | null;
  lng?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  addresses?: Address[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  image?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  phone?: string | null;
  whatsapp?: string | null;
  images: string[];
  categories: string[];
  rating: number;
  totalReviews: number;
  openingHours: string;
  isOpen: boolean;
  deliveryRadiusKm: number;
  estimatedDeliveryMin: number;
  estimatedDeliveryMax: number;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  categoryId: string;
  category?: Category;
  storeId?: string | null;
  slug: string;
  price: number;
  mrp: number;
  discount: number;
  stock: number;
  soldCount: number;
  lowStockThreshold: number;
  image?: string | null;
  images: string[];
  description: string;
  tags: string[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  user?: User;
  storeId?: string | null;
  store?: Store;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  tax: number;
  total: number;
  couponCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  deliveryLabel?: string | null;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPincode: string;
  deliveryPhone: string;
  deliverySlotDate: string;
  deliverySlotTime: string;
  status: OrderStatus;
  invoicePath?: string | null;
  pendingPaymentExpiry?: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  statusHistory?: OrderStatusHistory[];
}
