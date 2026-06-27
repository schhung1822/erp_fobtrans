"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { EllipsisVerticalIcon, MapPinIcon, WarehouseIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { OperationWarehouseRow } from "./schema";
import { DeleteWarehouseDialog, WarehouseFormDialog } from "./warehouse-form";

function formatDate(value: string | null) {
  if (!value) return "-";

  return format(parseISO(value), "dd/MM/yyyy");
}

function formatCompactNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function WarehouseCell({ warehouse }: { warehouse: OperationWarehouseRow }) {
  return (
    <div className="flex w-64 min-w-0 max-w-64 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <WarehouseIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <WarehouseFormDialog warehouse={warehouse} triggerLabel={warehouse.name} triggerVariant="link" />
        <span
          className="truncate text-muted-foreground text-xs leading-none"
          title={warehouse.code ?? "Chưa có mã kho"}
        >
          {warehouse.code ?? "Chưa có mã kho"}
        </span>
      </div>
    </div>
  );
}

export const operationsColumns: ColumnDef<OperationWarehouseRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả kho trên trang"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chon kho ${row.original.name}`}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) => [row.code, row.name, row.address].join(" "),
    filterFn: "includesString",
    enableHiding: true,
  },
  {
    id: "updatedAt",
    accessorFn: (row) => row.updatedAt ?? row.createdAt ?? "",
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: "Kho",
    cell: ({ row }) => <WarehouseCell warehouse={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "isActive",
    header: "Trạng thái",
    filterFn: "equalsString",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className={
          row.original.isActive
            ? "border-emerald-500/30 px-1.5 text-emerald-700 dark:text-emerald-300"
            : "px-1.5 text-muted-foreground"
        }
      >
        {row.original.isActive ? "Đang hoạt động" : "Tạm dừng"}
      </Badge>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => (
      <div className="flex w-72 min-w-0 max-w-72 items-center gap-2 text-sm">
        <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate" title={row.original.address ?? "Chưa có địa chỉ"}>
          {row.original.address ?? "Chưa có địa chỉ"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "orderCount",
    header: "Tổng đơn",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {formatCompactNumber(row.original.orderCount)} đơn
      </Badge>
    ),
  },
  {
    accessorKey: "activeOrderCount",
    header: "Đang xử lý",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{formatCompactNumber(row.original.activeOrderCount)} đơn</div>
    ),
  },
  {
    accessorKey: "deliveredOrderCount",
    header: "Đã giao",
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-sm">{formatCompactNumber(row.original.deliveredOrderCount)} đơn</div>
    ),
  },
  {
    accessorKey: "totalPackages",
    header: "Hàng hóa",
    cell: ({ row }) => (
      <div className="grid gap-0.5 whitespace-nowrap text-sm">
        <span>{formatCompactNumber(row.original.totalPackages)} kiện</span>
        <span className="text-muted-foreground text-xs">
          {formatCompactNumber(row.original.totalWeightKg)} kg / {formatCompactNumber(row.original.totalVolumeM3)} m3
        </span>
      </div>
    ),
  },
  {
    accessorKey: "lastOrderDate",
    header: "Gần nhất",
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{formatDate(row.original.lastOrderDate)}</div>,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Tác vụ</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Mở tác vụ cho ${row.original.name}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon"
              variant="ghost"
            >
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <WarehouseFormDialog warehouse={row.original} />
            <DropdownMenuSeparator />
            <DeleteWarehouseDialog warehouse={row.original} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableSorting: false,
  },
];
