import type { Column } from "./types";

export const columns = [
  { id: "new", title: "Mới" },
  { id: "received", title: "Đã nhận" },
  { id: "in_transit", title: "Đang vận chuyển" },
  { id: "arrived_warehouse", title: "Về kho" },
  { id: "customs_processing", title: "Kiểm hóa" },
  { id: "customs_done", title: "Đã Thông quan" },
  { id: "delivered", title: "Đã giao" },
  { id: "cancelled", title: "Đã hủy" },
  { id: "problem", title: "Có vấn đề" },
] as const satisfies readonly Column[];

export const columnIds = columns.map((column) => column.id);
