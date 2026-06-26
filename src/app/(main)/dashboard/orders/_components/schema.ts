export type OrderStatus =
  | "new"
  | "received"
  | "in_transit"
  | "arrived_warehouse"
  | "customs_processing"
  | "customs_done"
  | "delivered"
  | "cancelled"
  | "problem";

export type CustomsStatus = "not_started" | "processing" | "cleared" | "hold" | "cancelled";

export type CollectionStatus = "not_collected" | "partial" | "collected" | "overdue" | "bad_debt";

export type InvoiceStatus = "not_issued" | "draft" | "issued" | "sent" | "cancelled";

export interface OrderRow {
  id: string;
  code: string;
  customerId: string;
  customerCode: string | null;
  customerName: string;
  serviceTypeId: string | null;
  serviceName: string | null;
  assignedStaffId: string | null;
  staffName: string | null;
  warehouseId: string | null;
  warehouseName: string | null;
  orderDate: string | null;
  createdAt: string | null;
  deliveryDate: string | null;
  paymentDueDate: string | null;
  deliveryAddress: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  routeName: string | null;
  containerCode: string | null;
  trackingCode: string | null;
  cargoName: string | null;
  cargoValueVnd: number;
  operationStatus: OrderStatus;
  customsStatus: CustomsStatus;
  collectionStatus: CollectionStatus;
  invoiceStatus: InvoiceStatus;
  totalWeightKg: number;
  totalVolumeM3: number;
  totalPackages: number;
  totalCostVnd: number;
  totalChargeVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  grossProfitVnd: number;
  note: string | null;
}

export interface OrdersSummary {
  totalOrders: number;
  pendingImportRows: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
  totalProfitVnd: number;
}

export interface OrderLookupOption {
  id: string;
  code: string | null;
  name: string;
  phone: string | null;
  address: string | null;
}

export interface OrderLookups {
  customers: OrderLookupOption[];
  staff: OrderLookupOption[];
  warehouses: OrderLookupOption[];
  serviceTypes: OrderLookupOption[];
}
