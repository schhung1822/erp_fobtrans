"use client";

import { PencilIcon, PlusIcon, SaveIcon, ShoppingCartIcon, Trash2Icon, XIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatCurrency } from "@/lib/utils";

import { createContact, deleteContact, updateContact } from "./actions";
import { leadStatusLabels, leadStatuses, type ContactRow, type ContactStaffOption, type LeadStatus } from "./schema";

const leadStatusClasses: Record<LeadStatus, string> = {
  new: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  potential: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  loyal: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  silent: "border-muted-foreground/30 bg-muted text-muted-foreground",
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Textarea id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} rows={3} />
    </div>
  );
}

function LeadStatusSelect({ defaultValue }: { defaultValue?: LeadStatus }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="leadStatus">Trang thai lead</Label>
      <Select name="leadStatus" defaultValue={defaultValue ?? "new"}>
        <SelectTrigger id="leadStatus" className="w-full">
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
    </div>
  );
}

function StaffSelect({ defaultValue, options }: { defaultValue?: string | null; options: ContactStaffOption[] }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="assignedStaffId">NV tiep nhan</Label>
      <Select name="assignedStaffId" defaultValue={defaultValue ?? "none"}>
        <SelectTrigger id="assignedStaffId" className="w-full">
          <SelectValue placeholder="Khong chon" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Khong chon</SelectItem>
          {options.map((staff) => (
            <SelectItem key={staff.id} value={staff.id}>
              {staff.code ? `${staff.code} - ${staff.name}` : staff.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function LeadOrderStats({ contact }: { contact: ContactRow }) {
  const stats = contact.orderStats;
  const hasOrders = stats.orderCount > 0;

  return (
    <section className={cn("grid gap-3 rounded-lg border p-3", hasOrders ? "bg-emerald-500/5" : "bg-muted/30")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium text-sm">
          <ShoppingCartIcon className="size-4 text-muted-foreground" />
          Hiệu quả đơn hàng
        </div>
        <Badge
          variant="outline"
          className={cn(
            hasOrders
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
          )}
        >
          {hasOrders ? `Da co ${stats.orderCount.toLocaleString("vi-VN")} don` : "Chua co don"}
        </Badge>
      </div>
      {hasOrders ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-1 rounded-md border bg-background px-3 py-2">
            <span className="text-muted-foreground text-xs">Tổng đơn</span>
            <span className="font-semibold">{stats.orderCount.toLocaleString("vi-VN")}</span>
          </div>
          <div className="grid gap-1 rounded-md border bg-background px-3 py-2">
            <span className="text-muted-foreground text-xs">Doanh thu đối soát</span>
            <span className="font-semibold">{formatVnd(stats.totalChargeVnd)}</span>
          </div>
          <div className="grid gap-1 rounded-md border bg-background px-3 py-2">
            <span className="text-muted-foreground text-xs">Công nợ</span>
            <span className="font-semibold">{formatVnd(stats.remainingAmountVnd)}</span>
          </div>
          <div className="grid gap-1 rounded-md border bg-background px-3 py-2">
            <span className="text-muted-foreground text-xs">Đơn gần nhất</span>
            <span className="font-semibold">{formatDate(stats.lastOrderAt)}</span>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Chưa tìm thấy đơn hàng nào có SDT trùng với lead này
        </p>
      )}
    </section>
  );
}

export function ContactFormDialog({
  contact,
  staffOptions = [],
  triggerLabel,
  triggerVariant,
}: {
  contact?: ContactRow;
  staffOptions?: ContactStaffOption[];
  triggerLabel?: string;
  triggerVariant?: "button" | "link";
}) {
  const isEditing = Boolean(contact);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerVariant === "link" ? (
          <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-foreground">
            <span className="truncate">{triggerLabel ?? contact?.name ?? "Sửa liên hệ"}</span>
          </Button>
        ) : isEditing ? (
          <Button variant="ghost" className="w-full justify-start px-2" size="sm">
            <PencilIcon />
            {triggerLabel ?? "Sửa liên hệ"}
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            Thêm liên hệ
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[min(840px,90vh)] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Cập nhật lead" : "Thêm lead"}</DialogTitle>
        </DialogHeader>

        <form action={isEditing ? updateContact : createContact} className="grid gap-5">
          <input type="hidden" name="contactId" value={contact?.id ?? ""} />
          {contact ? <LeadOrderStats contact={contact} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextField label="Ten lead" name="name" defaultValue={contact?.name} required />
            </div>
            <LeadStatusSelect defaultValue={contact?.leadStatus} />
            <StaffSelect defaultValue={contact?.assignedStaffId} options={staffOptions} />
            <TextField label="Chức danh" name="title" defaultValue={contact?.title} placeholder="Kế toán, mua hàng..." />
            <TextField label="Số diện thoại" name="phone" defaultValue={contact?.phone} placeholder="090..." />
            <TextField label="Email" name="email" type="email" defaultValue={contact?.email} placeholder="name@company.com" />
            <div className="md:col-span-2">
              <TextAreaField label="Ghi chú" name="note" defaultValue={contact?.note} placeholder="Ghi chú nội bộ" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                <XIcon />
                Hủy
              </Button>
            </DialogClose>
            <Button type="submit">
              <SaveIcon />
              {isEditing ? "Lưu thay đổi" : "Thêm lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteContactDialog({ contact }: { contact: ContactRow }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 text-destructive" size="sm">
          <Trash2Icon />
          Xóa lead
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa lead?</AlertDialogTitle>
          <AlertDialogDescription>Lead "{contact.name}" sẽ bị xóa khỏi bảng liên hệ.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <form action={deleteContact}>
            <input type="hidden" name="contactId" value={contact.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Xóa
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}