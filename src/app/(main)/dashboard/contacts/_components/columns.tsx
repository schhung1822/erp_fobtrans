"use client";
"use no memo";

import { useTransition } from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { Building2Icon, EllipsisVerticalIcon, MailIcon, PhoneIcon, ShoppingCartIcon, UserRoundIcon } from "lucide-react";

import { OrderFormSheet } from "@/app/(main)/dashboard/orders/_components/order-form";
import type { OrderLookups } from "@/app/(main)/dashboard/orders/_components/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { updateContactStaff, updateLeadStatus } from "./actions";
import { ContactFormDialog, DeleteContactDialog } from "./contact-form";
import { leadStatusLabels, leadStatuses, type ContactRow, type ContactStaffOption, type LeadStatus } from "./schema";

const leadStatusClasses: Record<LeadStatus, string> = {
  new: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  potential: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  loyal: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  silent: "border-muted-foreground/30 bg-muted text-muted-foreground",
};

function formatDate(value: string | null) {
  if (!value) return "-";

  return format(parseISO(value), "dd/MM/yyyy");
}

function ContactCell({ contact, staffOptions }: { contact: ContactRow; staffOptions: ContactStaffOption[] }) {
  return (
    <div className="flex w-64 min-w-0 max-w-64 items-center gap-2">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted">
        <UserRoundIcon className="size-4 text-muted-foreground" />
      </span>
      <div className="grid min-w-0 gap-0.5">
        <ContactFormDialog contact={contact} staffOptions={staffOptions} triggerLabel={contact.name} triggerVariant="link" />
        <span className="truncate text-muted-foreground text-xs leading-none" title={contact.title ?? "Chua co chuc danh"}>
          {contact.title ?? "Chua co chuc danh"}
        </span>
      </div>
    </div>
  );
}

function InlineLeadStatusSelect({ contact }: { contact: ContactRow }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      disabled={isPending}
      value={contact.leadStatus}
      onValueChange={(nextStatus) => {
        const formData = new FormData();
        formData.set("contactId", contact.id);
        formData.set("leadStatus", nextStatus);
        startTransition(async () => {
          await updateLeadStatus(formData);
        });
      }}
    >
      <SelectTrigger
        aria-label={`Cập nhật trạng thái lead ${contact.name}`}
        className={cn("h-7 w-44 rounded-md px-2 font-medium text-xs", leadStatusClasses[contact.leadStatus])}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {leadStatuses.map((status) => (
          <SelectItem key={status} value={status}>
            {leadStatusLabels[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InlineStaffSelect({ contact, staffOptions }: { contact: ContactRow; staffOptions: ContactStaffOption[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      disabled={isPending}
      value={contact.assignedStaffId ?? "none"}
      onValueChange={(nextStaffId) => {
        const formData = new FormData();
        formData.set("contactId", contact.id);
        formData.set("assignedStaffId", nextStaffId === "none" ? "" : nextStaffId);
        startTransition(async () => {
          await updateContactStaff(formData);
        });
      }}
    >
      <SelectTrigger aria-label={`Cập nhật nhân sự tiếp nhận ${contact.name}`} className="h-7 w-48 rounded-md px-2 text-xs">
        <SelectValue placeholder="Không chọn" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Khong chon</SelectItem>
        {staffOptions.map((staff) => (
          <SelectItem key={staff.id} value={staff.id}>
            {staff.code ? `${staff.code} - ${staff.name}` : staff.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OrderAlertBadge({ contact }: { contact: ContactRow }) {
  const hasOrders = contact.orderStats.orderCount > 0;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 px-1.5",
        hasOrders
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      <ShoppingCartIcon className="size-3" />
      {hasOrders ? `Có ${contact.orderStats.orderCount.toLocaleString("vi-VN")} đơn` : "Chưa có đơn"}
    </Badge>
  );
}

export function getContactsColumns(orderLookups: OrderLookups): ColumnDef<ContactRow>[] {
  const staffOptions = orderLookups.staff;

  return [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Chọn tất cả lead trên trang"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label={`Chon lead ${row.original.name}`}
          />
        </div>
      ),
      enableHiding: false,
      enableSorting: false,
    },
    {
      id: "search",
      accessorFn: (row) =>
        [
          row.name,
          row.title,
          row.phone,
          row.email,
          row.customerCode,
          row.customerName,
          row.staffCode,
          row.staffName,
          leadStatusLabels[row.leadStatus],
          row.orderStats.orderCount > 0 ? "có đơn" : "chưa có đơn",
          row.note,
        ].join(" "),
      filterFn: "includesString",
      enableHiding: true,
    },
    {
      accessorKey: "name",
      header: "Liên hệ",
      cell: ({ row }) => <ContactCell contact={row.original} staffOptions={staffOptions} />,
      enableHiding: false,
    },
    {
      accessorKey: "leadStatus",
      header: "Trạng thái",
      cell: ({ row }) => <InlineLeadStatusSelect contact={row.original} />,
    },
    {
      accessorKey: "staffName",
      header: "NV tiếp nhận",
      cell: ({ row }) => <InlineStaffSelect contact={row.original} staffOptions={staffOptions} />,
    },
    {
      id: "orderAlert",
      header: "Đơn hàng",
      accessorFn: (row) => (row.orderStats.orderCount > 0 ? "has-orders" : "no-orders"),
      filterFn: "equalsString",
      cell: ({ row }) => <OrderAlertBadge contact={row.original} />,
    },
    {
      accessorKey: "customerName",
      header: "Khách hàng",
      cell: ({ row }) => (
        <div className="flex w-60 min-w-0 max-w-60 items-center gap-2 text-sm">
          <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate" title={row.original.customerName ?? "Chưa có khách hàng"}>
            {row.original.customerName ?? "Chưa có khách hàng"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Điện thoại",
      cell: ({ row }) => (
        <div className="flex w-40 min-w-0 max-w-40 items-center gap-2 text-sm">
          <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate" title={row.original.phone ?? "Chưa có SDT"}>
            {row.original.phone ?? "Chưa có SDT"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex w-56 min-w-0 max-w-56 items-center gap-2 text-sm">
          <MailIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate" title={row.original.email ?? "Chưa có email"}>
            {row.original.email ?? "Chưa có email"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => <div className="whitespace-nowrap text-sm">{formatDate(row.original.updatedAt)}</div>,
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
            <DropdownMenuContent align="end" className="w-40">
              <ContactFormDialog contact={row.original} staffOptions={staffOptions} />
              <OrderFormSheet
                lookups={orderLookups}
                initialContact={{
                  customerId: row.original.customerId,
                  name: row.original.name,
                  phone: row.original.phone,
                  note: row.original.note,
                  assignedStaffId: row.original.assignedStaffId,
                }}
                triggerLabel="Tạo đơn hàng"
                triggerVariant="menu"
              />
              <DropdownMenuSeparator />
              <DeleteContactDialog contact={row.original} />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      enableSorting: false,
    },
  ];
}
