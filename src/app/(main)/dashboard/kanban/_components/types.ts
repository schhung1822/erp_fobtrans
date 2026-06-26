export type ColumnId =
  | "new"
  | "received"
  | "in_transit"
  | "arrived_warehouse"
  | "customs_processing"
  | "customs_done"
  | "delivered"
  | "cancelled"
  | "problem";

export type Column = {
  id: ColumnId;
  title: string;
};

export type TaskPriority = "High" | "Medium" | "Low";

export type CustomsStatus = "not_started" | "processing" | "cleared" | "hold" | "cancelled";
export type CollectionStatus = "not_collected" | "partial" | "collected" | "overdue" | "bad_debt";
export type InvoiceStatus = "not_issued" | "draft" | "issued" | "sent" | "cancelled";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  customerName: string;
  customerCode: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  receiverAddress: string | null;
  deliveryAddress: string | null;
  orderDate: string | null;
  deliveryDate: string | null;
  paymentDueDate: string | null;
  routeName: string | null;
  containerCode: string | null;
  trackingCode: string | null;
  cargoName: string | null;
  operationStatus: ColumnId;
  customsStatus: CustomsStatus;
  collectionStatus: CollectionStatus;
  invoiceStatus: InvoiceStatus;
  totalChargeVnd: number;
  paidAmountVnd: number;
  remainingAmountVnd: number;
  totalPackages: number;
  totalWeightKg: number;
  totalVolumeM3: number;
  note: string | null;
};

export type BoardState = Record<ColumnId, Task[]>;
