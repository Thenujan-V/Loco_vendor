export const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'ASSIGNED',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id?: string | number;
  name?: string;
  title?: string;
  quantity?: number;
  qty?: number;
  price?: number | string;
  image?: string;
  imageUrl?: string;
  productImage?: string;
};

export type OrderCustomer = {
  name?: string;
  fullName?: string;
  username?: string;
  phone?: string;
  phoneNumber?: string;
  email?: string;
};

export type OrderRestaurant = {
  name?: string;
  address?: string;
};

export type VendorOrder = {
  id: string | number;
  status?: string;
  seatNumber?: string | number;
  total?: number | string;
  totalAmount?: number | string;
  grandTotal?: number | string;
  createdAt?: string;
  orderedAt?: string;
  user?: OrderCustomer;
  customer?: OrderCustomer;
  restaurant?: OrderRestaurant;
  items?: OrderItem[];
};

export const extractOrderList = (payload: any): VendorOrder[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }

  if (Array.isArray(payload?.result)) {
    return payload.result;
  }

  return [];
};

export const extractOrderDetail = (payload: any): VendorOrder | null => {
  if (!payload) {
    return null;
  }

  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload?.order && !Array.isArray(payload.order)) {
    return payload.order;
  }

  if (payload?.result && !Array.isArray(payload.result)) {
    return payload.result;
  }

  if (payload?.id !== undefined) {
    return payload;
  }

  return null;
};

export const getOrderStatus = (order?: VendorOrder | null): OrderStatus | string =>
  String(order?.status || 'PENDING').toUpperCase();

export const getOrderTimestamp = (order?: VendorOrder | null) => {
  const rawValue = order?.createdAt || order?.orderedAt;
  const timestamp = rawValue ? new Date(rawValue).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

export const sortOrdersNewestFirst = (orders: VendorOrder[]) =>
  [...orders].sort((left, right) => getOrderTimestamp(right) - getOrderTimestamp(left));

export const formatOrderAge = (createdAt?: string) => {
  if (!createdAt) {
    return 'Just now';
  }

  const createdTime = new Date(createdAt).getTime();

  if (!Number.isFinite(createdTime)) {
    return 'Just now';
  }

  const diffInMinutes = Math.max(0, Math.floor((Date.now() - createdTime) / 60000));

  if (diffInMinutes < 1) {
    return 'Just now';
  }

  if (diffInMinutes === 1) {
    return '1 min ago';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} mins ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);

  if (diffInHours === 1) {
    return '1 hour ago';
  }

  return `${diffInHours} hours ago`;
};

export const formatOrderDateTime = (value?: string) => {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return 'Not available';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatOrderItems = (items?: OrderItem[]) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Items not available';
  }

  return items
    .slice(0, 3)
    .map((item) => {
      const itemName = item?.name || item?.title || 'Item';
      const quantity = item?.quantity ?? item?.qty ?? 1;
      return `${itemName} x${quantity}`;
    })
    .join(', ');
};

export const formatCurrency = (value?: number | string | null) => {
  if (typeof value === 'number') {
    return `Rs. ${value.toFixed(2)}`;
  }

  if (typeof value === 'string' && value.trim()) {
    return value.startsWith('Rs.') ? value : `Rs. ${value}`;
  }

  return 'Rs. --';
};

export const formatOrderTotal = (order?: VendorOrder | null) =>
  formatCurrency(order?.grandTotal ?? order?.totalAmount ?? order?.total ?? null);

export const getCustomerName = (order?: VendorOrder | null) =>
  order?.user?.name ||
  order?.user?.fullName ||
  order?.user?.username ||
  order?.customer?.name ||
  order?.customer?.fullName ||
  'Customer';

export const getCustomerPhone = (order?: VendorOrder | null) =>
  order?.user?.phone ||
  order?.user?.phoneNumber ||
  order?.customer?.phone ||
  order?.customer?.phoneNumber ||
  'Not available';

export const getCustomerEmail = (order?: VendorOrder | null) =>
  order?.user?.email || order?.customer?.email || 'Not available';

export const getRestaurantName = (order?: VendorOrder | null) =>
  order?.restaurant?.name || 'Restaurant';

export const getRestaurantAddress = (order?: VendorOrder | null) =>
  order?.restaurant?.address || 'Not available';

export const getItemCount = (order?: VendorOrder | null) =>
  Array.isArray(order?.items)
    ? order.items.reduce((sum, item) => sum + Number(item?.quantity ?? item?.qty ?? 1), 0)
    : 0;

export const getItemImage = (item?: OrderItem | null) =>
  item?.image || item?.imageUrl || item?.productImage || null;
