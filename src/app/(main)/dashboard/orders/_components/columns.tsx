"use client";
"use no memo";

import { useTransition } from "react";

import Link from "next/link";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { EllipsisVerticalIcon, PackageCheck, PackageSearch, ReceiptTextIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";

import { updateOrderInlineStatus } from "./actions";
import { DeleteOrderDialog, OrderFormSheet } from "./order-form";
import { collectionStatusLabels, invoiceStatusLabels, operationStatusLabels } from "./order-options";
import type { OrderLookups, OrderRow } from "./schema";

function invoiceHref(orderId: string) {
  return `/invoice?orderId=${encodeURIComponent(orderId)}`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return format(parseISO(value), "dd/MM/yyyy");
}

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return format(parseISO(value), "dd/MM/yyyy HH:mm");
}

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function statusSelectClass(name: "collectionStatus" | "operationStatus", value: string) {
  if (name === "collectionStatus") {
    return cn(
      value === "collected" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      value === "partial" && "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
      value === "not_collected" && "border-muted-foreground/25 bg-muted/40 text-muted-foreground",
      value === "overdue" && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      value === "bad_debt" && "border-destructive/40 bg-destructive/10 text-destructive",
    );
  }

  return cn(
    value === "delivered" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    value === "customs_done" && "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    value === "in_transit" && "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    value === "arrived_warehouse" && "border-cyan-500/40 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    value === "received" && "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    value === "customs_processing" && "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    value === "new" && "border-muted-foreground/25 bg-muted/40 text-muted-foreground",
    value === "problem" && "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    value === "cancelled" && "border-destructive/40 bg-destructive/10 text-destructive",
  );
}

function InlineStatusSelect({
  name,
  orderId,
  options,
  value,
}: {
  name: "collectionStatus" | "operationStatus";
  orderId: string;
  options: Record<string, string>;
  value: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      disabled={isPending}
      value={value}
      onValueChange={(nextValue) => {
        const formData = new FormData();
        formData.set("orderId", orderId);
        formData.set(name, nextValue);
        startTransition(async () => {
          await updateOrderInlineStatus(formData);
        });
      }}
    >
      <SelectTrigger
        className={cn("h-7 w-32 rounded-md px-2 font-medium text-xs", statusSelectClass(name, value))}
        aria-label="Cập nhật nhanh"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(options).map(([optionValue, label]) => (
          <SelectItem key={optionValue} value={optionValue}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrderCell({ order, lookups }: { order: OrderRow; lookups: OrderLookups }) {
  return (
    <div className="flex min-w-56 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <PackageCheck className="size-4 text-muted-foreground" />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <OrderFormSheet order={order} lookups={lookups} triggerLabel={order.code} triggerVariant="link" />
        <span className="truncate text-muted-foreground text-xs leading-none">
          {order.trackingCode ?? order.containerCode ?? order.routeName ?? "chưa có tracking"}
        </span>
      </div>
    </div>
  );
}

export function createOrdersColumns(lookups: OrderLookups): ColumnDef<OrderRow>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Chọn tất cả đơn hàng trong trang"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Chọn đơn ${row.original.code}`}
          />
        </div>
      ),
      enableHiding: false,
    },
    {
      accessorKey: "code",
      header: "Đơn hàng",
      cell: ({ row }) => <OrderCell order={row.original} lookups={lookups} />,
      enableHiding: false,
    },
    {
      id: "search",
      accessorFn: (row) =>
        [
          row.code,
          row.customerCode,
          row.customerName,
          row.senderName,
          row.senderPhone,
          row.receiverName,
          row.receiverPhone,
          row.trackingCode,
          row.containerCode,
          row.routeName,
          row.staffName,
        ].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => formatDateTime(row.original.createdAt ?? row.original.orderDate),
    },
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="grid w-44 min-w-0 max-w-44 gap-0.5">
          <span className="truncate text-sm" title={row.original.customerName}>
            {row.original.customerName}
          </span>
          <span className="truncate text-muted-foreground text-xs">{row.original.customerCode ?? "Chua co ma KH"}</span>
        </div>
      ),
    },
    {
      accessorKey: "operationStatus",
      header: "Trạng thái",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <InlineStatusSelect
          name="operationStatus"
          orderId={row.original.id}
          options={operationStatusLabels}
          value={row.original.operationStatus}
        />
      ),
    },
    {
      accessorKey: "collectionStatus",
      header: "Thu tiền",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <InlineStatusSelect
          name="collectionStatus"
          orderId={row.original.id}
          options={collectionStatusLabels}
          value={row.original.collectionStatus}
        />
      ),
    },
    {
      accessorKey: "invoiceStatus",
      header: "Hóa đơn",
      cell: ({ row }) => (
        <Badge variant="outline" className="px-1.5 text-muted-foreground">
          {invoiceStatusLabels[row.original.invoiceStatus]}
        </Badge>
      ),
    },
    {
      accessorKey: "staffName",
      header: "NV phụ trách",
      filterFn: "equalsString",
      cell: ({ row }) => (
        <div className="w-40 min-w-0 max-w-40 truncate text-sm" title={row.original.staffName ?? undefined}>
          {row.original.staffName ?? "Chua gan"}
        </div>
      ),
    },
    {
      accessorKey: "deliveryDate",
      header: "Ngày giao",
      cell: ({ row }) => (
        <div className="grid gap-0.5 whitespace-nowrap text-sm">
          <span>{formatDate(row.original.deliveryDate)}</span>
          <span className="text-muted-foreground text-xs">
            Tao: {formatDateTime(row.original.createdAt ?? row.original.orderDate)}
          </span>
        </div>
      ),
    },
    {
      id: "cargo",
      header: "Hàng hóa",
      cell: ({ row }) => (
        <div className="flex w-56 min-w-0 max-w-56 items-center gap-2 text-sm">
          <PackageSearch className="size-4 shrink-0 text-muted-foreground" />
          <div className="grid min-w-0 gap-0.5">
            <span className="truncate" title={row.original.cargoName ?? `${row.original.totalPackages} kien`}>
              {row.original.cargoName ?? `${row.original.totalPackages} kien`}
            </span>
            <span className="text-muted-foreground text-xs">
              {row.original.totalWeightKg.toLocaleString("vi-VN")} kg /{" "}
              {row.original.totalVolumeM3.toLocaleString("vi-VN")} m3
            </span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "totalChargeVnd",
      header: () => <div className="text-right">Doanh thu</div>,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-sm">{formatVnd(row.original.totalChargeVnd)}</div>
      ),
    },
    {
      accessorKey: "remainingAmountVnd",
      header: () => <div className="text-right">Công nợ</div>,
      cell: ({ row }) => (
        <div className="whitespace-nowrap text-right text-sm">{formatVnd(row.original.remainingAmountVnd)}</div>
      ),
    },

    {
      id: "actions",
      header: () => <div className="text-right">Tác vụ</div>,
      cell: ({ row }) => (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Mở tác vụ cho ${row.original.code}`}
                className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
                size="icon"
                variant="ghost"
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <OrderFormSheet order={row.original} lookups={lookups} />
              <DropdownMenuItem asChild>
                <Link href={invoiceHref(row.original.id)}>
                  <ReceiptTextIcon />
                  Xuất hóa đơn
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteOrderDialog order={row.original} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
