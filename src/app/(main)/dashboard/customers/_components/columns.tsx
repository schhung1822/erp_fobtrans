"use client";
"use no memo";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { EllipsisVerticalIcon, MapPinIcon, PhoneIcon, UserRoundIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";

import { CustomerFormDialog, DeleteCustomerDialog } from "./customer-form";
import type { CustomerRow } from "./schema";

function formatDate(value: string | null) {
  if (!value) return "-";

  return format(parseISO(value), "dd/MM/yyyy");
}

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function CustomerCell({ customer }: { customer: CustomerRow }) {
  return (
    <div className="flex w-64 min-w-0 max-w-64 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <UserRoundIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <CustomerFormDialog customer={customer} triggerLabel={customer.name} triggerVariant="link" />
        <span className="truncate text-muted-foreground text-xs leading-none" title={customer.code ?? "Chua co ma KH"}>
          {customer.code ?? "Chua co ma KH"}
        </span>
      </div>
    </div>
  );
}

export const customersColumns: ColumnDef<CustomerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chon tat ca khach hang tren trang"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label={`Chon khach hang ${row.original.name}`}
        />
      </div>
    ),
    enableHiding: false,
    enableSorting: false,
  },
  {
    id: "search",
    accessorFn: (row) =>
      [row.code, row.name, row.phone, row.taxCode, row.deliveryAddress, row.billingAddress, row.note].join(" "),
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
    header: "Khach hang",
    cell: ({ row }) => <CustomerCell customer={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    header: "Lien he",
    cell: ({ row }) => (
      <div className="flex w-40 min-w-0 max-w-40 items-center gap-2 text-sm">
        <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate" title={row.original.phone ?? "Chua co SDT"}>
          {row.original.phone ?? "Chua co SDT"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "taxCode",
    header: "Thue",
    cell: ({ row }) => (
      <div className="w-36 min-w-0 max-w-36 text-sm">
        <span className="block truncate" title={row.original.taxCode ?? "Chua co MST"}>
          {row.original.taxCode ?? "Chua co MST"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "deliveryAddress",
    header: "Dia chi",
    cell: ({ row }) => (
      <div className="flex w-72 min-w-0 max-w-72 items-center gap-2 text-sm">
        <MapPinIcon className="size-4 shrink-0 text-muted-foreground" />
        <span
          className="truncate"
          title={row.original.deliveryAddress ?? row.original.billingAddress ?? "Chua co dia chi"}
        >
          {row.original.deliveryAddress ?? row.original.billingAddress ?? "Chua co dia chi"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "note",
    header: "Ghi chu",
    cell: ({ row }) => (
      <div className="w-48 min-w-0 max-w-48 text-sm">
        <span className="block truncate" title={row.original.note ?? "Chua co ghi chu"}>
          {row.original.note ?? "Chua co ghi chu"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "orderCount",
    header: "Don hang",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.orderCount.toLocaleString("vi-VN")} don
      </Badge>
    ),
  },
  {
    accessorKey: "lastOrderDate",
    header: "Gan nhat",
    cell: ({ row }) => <div className="whitespace-nowrap text-sm">{formatDate(row.original.lastOrderDate)}</div>,
  },
  {
    accessorKey: "totalRevenueVnd",
    header: () => <div className="text-right">Doanh thu</div>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right text-sm">{formatVnd(row.original.totalRevenueVnd)}</div>
    ),
  },
  {
    accessorKey: "totalReceivableVnd",
    header: () => <div className="text-right">Cong no</div>,
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-right text-sm">{formatVnd(row.original.totalReceivableVnd)}</div>
    ),
  },
  {
    id: "actions",
    header: () => <div className="text-right">Tac vu</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label={`Mo tac vu cho ${row.original.name}`}
              className="size-8 rounded-md text-muted-foreground hover:bg-muted/50"
              size="icon"
              variant="ghost"
            >
              <EllipsisVerticalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <CustomerFormDialog customer={row.original} />
            <DropdownMenuSeparator />
            <DeleteCustomerDialog customer={row.original} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    enableSorting: false,
  },
];
