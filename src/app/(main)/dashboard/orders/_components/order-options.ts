import type { CollectionStatus, CustomsStatus, InvoiceStatus, OrderStatus } from "./schema";

export const operationStatusLabels: Record<OrderStatus, string> = {
  new: "Mới",
  received: "Đã nhận",
  in_transit: "Đang vận chuyển",
  arrived_warehouse: "Về kho",
  customs_processing: "Kiểm hóa",
  customs_done: "Đã thông quan",
  delivered: "Đã giao",
  cancelled: "Đã hủy",
  problem: "Có vấn đề",
};

export const collectionStatusLabels: Record<CollectionStatus, string> = {
  not_collected: "Chưa thu",
  partial: "Thu một phần",
  collected: "Đã thu",
  overdue: "Quá hạn",
  bad_debt: "Nợ xấu",
};

export const customsStatusLabels: Record<CustomsStatus, string> = {
  not_started: "Chưa làm",
  processing: "Đang làm",
  cleared: "Thông quan",
  hold: "Tạm giữ",
  cancelled: "Đã hủy",
};

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  not_issued: "Chưa xuất",
  draft: "Nháp",
  issued: "Đã xuất",
  sent: "Đã gửi",
  cancelled: "Đã hủy",
};
