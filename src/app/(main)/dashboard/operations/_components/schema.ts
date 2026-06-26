export interface OperationWarehouseRow {
  id: string;
  code: string | null;
  name: string;
  address: string | null;
  isActive: boolean;
  orderCount: number;
  activeOrderCount: number;
  deliveredOrderCount: number;
  totalPackages: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  lastOrderDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}
