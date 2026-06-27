"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/lib/utils";

import { crmLeadStatusLabels } from "../constants";
import type { OpportunityRow } from "./schema";

const statusClasses: Record<OpportunityRow["leadStatus"], string> = {
  new: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  potential: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  loyal: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  silent: "border-muted-foreground/25 bg-muted text-muted-foreground",
};

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

export const opportunitiesColumns: ColumnDef<OpportunityRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Chọn tất cả lead"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Chọn ${row.original.name}`}
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Lead",
    cell: ({ row }) => (
      <div className="grid gap-0.5">
        <div className="font-medium text-sm">{row.original.name}</div>
        <div className="text-muted-foreground text-xs">
          {row.original.customerName ?? row.original.phone ?? "Chưa có khách hàng"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "leadStatus",
    header: "Trạng thái",
    cell: ({ row }) => (
      <Badge variant="outline" className={statusClasses[row.original.leadStatus]}>
        {crmLeadStatusLabels[row.original.leadStatus]}
      </Badge>
    ),
    filterFn: "equalsString",
  },
  {
    accessorKey: "staffName",
    header: "Nhân sự",
    cell: ({ row }) => <div className="text-sm">{row.original.staffName ?? "Chưa gán"}</div>,
  },
  {
    accessorKey: "orderCount",
    header: () => <div className="text-right">Đơn hàng</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm tabular-nums">{row.original.orderCount.toLocaleString("vi-VN")}</div>
    ),
  },
  {
    accessorKey: "totalChargeVnd",
    header: () => <div className="text-right">Doanh thu</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium text-sm tabular-nums">{formatVnd(row.original.totalChargeVnd)}</div>
    ),
  },
  {
    accessorKey: "remainingAmountVnd",
    header: () => <div className="text-right">Còn phải thu</div>,
    cell: ({ row }) => (
      <div className="text-right text-sm tabular-nums">{formatVnd(row.original.remainingAmountVnd)}</div>
    ),
  },
  {
    accessorKey: "lastOrderAt",
    header: "Đơn gần nhất",
    cell: ({ row }) => <div className="text-sm tabular-nums">{formatDate(row.original.lastOrderAt)}</div>,
  },
];
