// Single source of truth for order status. Both api + ui import this.
// Why here: avoids drift (api says PENDING, ui says Pending) — classic interview point.
export const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
});

export const CANCELLABLE = Object.freeze(['PENDING', 'CONFIRMED']);
export const NON_CANCELLABLE = Object.freeze(['SHIPPED', 'DELIVERED', 'CANCELLED']);
