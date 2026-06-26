export interface CustomerRow {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  taxCode: string | null;
  deliveryAddress: string | null;
  billingAddress: string | null;
  note: string | null;
  orderCount: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
  lastOrderDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CustomersSummary {
  totalCustomers: number;
  customersWithOrders: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
}
