"use client";

import { PencilIcon, PlusIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

import { createCustomer, deleteCustomer, updateCustomer } from "./actions";
import type { CustomerRow } from "./schema";

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
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

function CustomerStats({ customer }: { customer: CustomerRow }) {
  const stats = [
    { label: "So don", value: `${customer.orderCount.toLocaleString("vi-VN")} don` },
    { label: "Doanh thu", value: formatVnd(customer.totalRevenueVnd) },
    { label: "Cong no", value: formatVnd(customer.totalReceivableVnd) },
  ];

  return (
    <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="grid gap-1">
          <span className="text-muted-foreground text-xs">{stat.label}</span>
          <span className="font-medium text-sm">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CustomerFormDialog({
  customer,
  triggerLabel,
  triggerVariant,
}: {
  customer?: CustomerRow;
  triggerLabel?: string;
  triggerVariant?: "button" | "link";
}) {
  const isEditing = Boolean(customer);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerVariant === "link" ? (
          <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-foreground">
            <span className="truncate">{triggerLabel ?? customer?.name ?? "Sua khach hang"}</span>
          </Button>
        ) : isEditing ? (
          <Button variant="ghost" className="w-full justify-start px-2" size="sm">
            <PencilIcon />
            {triggerLabel ?? "Sua khach hang"}
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            Them khach hang
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[min(760px,90vh)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Cap nhat khach hang" : "Them khach hang"}</DialogTitle>
        </DialogHeader>

        <form action={isEditing ? updateCustomer : createCustomer} className="grid gap-5">
          <input type="hidden" name="customerId" value={customer?.id ?? ""} />
          {customer ? <CustomerStats customer={customer} /> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Ma khach hang"
              name="code"
              defaultValue={customer?.code}
              placeholder="Tu tao neu de trong"
            />
            <TextField label="So dien thoai" name="phone" defaultValue={customer?.phone} placeholder="090..." />
            <TextField
              label="Ma so thue"
              name="taxCode"
              defaultValue={customer?.taxCode}
              placeholder="MST / tax code"
            />
            <div className="md:col-span-2">
              <TextField label="Ten khach hang" name="name" defaultValue={customer?.name} required />
            </div>
            <TextAreaField label="Dia chi giao hang" name="deliveryAddress" defaultValue={customer?.deliveryAddress} />
            <TextAreaField label="Dia chi hoa don" name="billingAddress" defaultValue={customer?.billingAddress} />
            <div className="md:col-span-2">
              <TextAreaField label="Ghi chu" name="note" defaultValue={customer?.note} placeholder="Ghi chu noi bo" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                <XIcon />
                Huy
              </Button>
            </DialogClose>
            <Button type="submit">
              <SaveIcon />
              {isEditing ? "Luu thay doi" : "Them khach hang"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCustomerDialog({ customer }: { customer: CustomerRow }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 text-destructive" size="sm">
          <Trash2Icon />
          Xoa khach hang
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoa khach hang?</AlertDialogTitle>
          <AlertDialogDescription>
            Khach hang "{customer.name}" se bi xoa neu chua co rang buoc don hang trong he thong.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huy</AlertDialogCancel>
          <form action={deleteCustomer}>
            <input type="hidden" name="customerId" value={customer.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Xoa
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
