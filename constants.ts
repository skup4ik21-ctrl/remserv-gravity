import { UserRole, OrderStatus, ServiceCategory, PartStatus } from './types';

export const ROLES = [UserRole.Administrator, UserRole.Owner];

export const STATUS_COLORS: { [key in OrderStatus]: string } = {
  [OrderStatus.New]: 'bg-blue-100 text-blue-800',
  [OrderStatus.InProgress]: 'bg-yellow-100 text-yellow-800',
  [OrderStatus.AwaitingParts]: 'bg-orange-100 text-orange-800',
  [OrderStatus.Completed]: 'bg-green-100 text-green-800',
  [OrderStatus.Cancelled]: 'bg-red-100 text-red-800',
};

// FIX: Added missing PartStatus.StockDeducted to PART_STATUS_COLORS to satisfy the mapped type requirement.
export const PART_STATUS_COLORS: { [key in PartStatus]: string } = {
  [PartStatus.Ordered]: 'bg-yellow-100 text-yellow-800',
  [PartStatus.Received]: 'bg-green-100 text-green-800',
  [PartStatus.Reordered]: 'bg-purple-100 text-purple-800',
  [PartStatus.StockDeducted]: 'bg-blue-100 text-blue-800',
};