"use client";

import type React from "react";
import { useMemo, useRef, useState } from "react";

import Link from "next/link";

import { LoaderCircleIcon, PencilIcon, PlusIcon, ReceiptTextIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";

import {
  AlertDialog,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createOrder, deleteOrder, updateOrder } from "./actions";
import { collectionStatusLabels, invoiceStatusLabels, operationStatusLabels } from "./order-options";
import type { OrderLookupOption, OrderLookups, OrderRow } from "./schema";

export interface InitialOrderContact {
  customerId: string | null;
  name: string;
  phone: string | null;
  note?: string | null;
  assignedStaffId?: string | null;
}

function inputDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function displayDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function numberInput(value: number | undefined) {
  return value && value > 0 ? String(value) : "";
}

function formatVnd(value: number | null | undefined) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value ?? 0);
}

const EMPTY_SELECT_VALUE = "__empty__";

function invoiceHref(orderId: string) {
  return `/invoice?orderId=${encodeURIComponent(orderId)}`;
}

type SelectOption = {
  value: string;
  label: string;
};

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  options: SelectOption[];
}) {
  const [value, setValue] = useState(defaultValue ?? EMPTY_SELECT_VALUE);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={value === EMPTY_SELECT_VALUE ? "" : value} />
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={name} className="h-9 w-full">
          <SelectValue placeholder="Khong chon" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value={EMPTY_SELECT_VALUE}>Khong chon</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  readOnly,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        type={type}
      />
    </div>
  );
}

function formatIntegerPart(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatNumberDisplay(value: string | number | null | undefined, allowDecimal = false) {
  if (value === null || value === undefined || value === "") return "";
  const cleaned = String(value).replace(/[^\d,.]/g, "");

  if (!allowDecimal) {
    return formatIntegerPart(cleaned.replace(/\D/g, ""));
  }

  const commaIndex = cleaned.indexOf(",");
  const dotIndex = cleaned.indexOf(".");
  const hasDecimalDot = commaIndex === -1 && dotIndex > -1 && cleaned.slice(dotIndex + 1).length !== 3;
  const decimalIndex = commaIndex > -1 ? commaIndex : hasDecimalDot ? dotIndex : -1;

  if (decimalIndex === -1) {
    return formatIntegerPart(cleaned.replace(/\D/g, ""));
  }

  const integerPart = cleaned.slice(0, decimalIndex).replace(/\D/g, "");
  const decimalPart = cleaned.slice(decimalIndex + 1).replace(/\D/g, "");

  return `${formatIntegerPart(integerPart)},${decimalPart}`;
}

function rawNumberValue(displayValue: string) {
  return displayValue.replace(/\./g, "").replace(",", ".");
}

function FormattedNumberField({
  label,
  name,
  defaultValue,
  required,
  allowDecimal,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  allowDecimal?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(() => formatNumberDisplay(defaultValue, allowDecimal));
  const rawValue = rawNumberValue(displayValue);

  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <input type="hidden" name={name} value={rawValue} />
      <Input
        id={name}
        inputMode="decimal"
        value={displayValue}
        onChange={(event) => setDisplayValue(formatNumberDisplay(event.target.value, allowDecimal))}
        required={required}
      />
    </div>
  );
}

function toLookupOptions(options: OrderLookups[keyof OrderLookups]): SelectOption[] {
  return options.map((option) => ({
    value: option.id,
    label: option.code ? `${option.code} - ${option.name}` : option.name,
  }));
}

function toStatusOptions(labels: Record<string, string>): SelectOption[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

function findCustomerByPhone(customers: OrderLookupOption[], phone: string) {
  const normalized = phone.replace(/\s/g, "");
  return customers.find((customer) => customer.phone?.replace(/\s/g, "") === normalized) ?? null;
}

export function OrderFormSheet({
  order,
  lookups,
  initialContact,
  triggerLabel,
  triggerVariant,
}: {
  order?: OrderRow;
  lookups: OrderLookups;
  initialContact?: InitialOrderContact;
  triggerLabel?: string;
  triggerVariant?: "button" | "link" | "menu";
}) {
  const isEditing = Boolean(order);
  const [selectedCustomer, setSelectedCustomer] = useState<OrderLookupOption | null>(() => {
    const customerId = order?.customerId ?? initialContact?.customerId;
    if (!customerId) return null;
    return lookups.customers.find((customer) => customer.id === customerId) ?? null;
  });
  const [senderName, setSenderName] = useState(order?.senderName ?? initialContact?.name ?? order?.customerName ?? "");
  const [senderPhone, setSenderPhone] = useState(order?.senderPhone ?? initialContact?.phone ?? selectedCustomer?.phone ?? "");
  const [senderAddress, setSenderAddress] = useState(order?.senderAddress ?? selectedCustomer?.address ?? "");
  const customerPhoneOptions = useMemo(
    () => lookups.customers.filter((customer) => customer.phone),
    [lookups.customers],
  );
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false);

  function applyCustomer(customer: OrderLookupOption | null) {
    setSelectedCustomer(customer);

    if (!customer) return;

    setSenderName(customer.name);
    setSenderPhone(customer.phone ?? "");
    setSenderAddress(customer.address ?? "");
  }

  function handleSenderPhoneChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSenderPhone(value);

    const matchedCustomer = findCustomerByPhone(lookups.customers, value);
    if (matchedCustomer) {
      applyCustomer(matchedCustomer);
    } else {
      setSelectedCustomer(null);
    }
  }

  async function handleSubmit(formData: FormData) {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      if (isEditing) {
        await updateOrder(formData);
      } else {
        await createOrder(formData);
      }

      setOpen(false);
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerVariant === "link" ? (
          <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-foreground">
            <span className="truncate">{triggerLabel ?? order?.code ?? "Sửa đơn"}</span>
          </Button>
        ) : triggerVariant === "menu" && !isEditing ? (
          <Button variant="ghost" className="w-full justify-start px-2" size="sm">
            <PlusIcon />
            {triggerLabel ?? "Tạo đơn hàng"}
          </Button>
        ) : isEditing ? (
          <Button variant="ghost" className="w-full justify-start px-2" size="sm">
            <PencilIcon />
            {triggerLabel ?? "Sửa đơn"}
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon data-icon="inline-start" />
            <span className="hidden lg:inline">{triggerLabel ?? "Thêm đơn"}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        className="max-h-[90vh] max-w-[1600px] overflow-hidden p-0 sm:max-w-[1600px]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        showCloseButton
      >
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{isEditing ? `Sửa đơn ${order?.code}` : "Thêm đơn hàng"}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="flex max-h-[calc(90vh-64px)] flex-col">
          <div className="grid gap-5 overflow-y-auto px-5 py-4">
            {order ? <input type="hidden" name="orderId" value={order.id} /> : null}
            <input type="hidden" name="customerId" value={selectedCustomer?.id ?? order?.customerId ?? ""} />
            <input type="hidden" name="customerCode" value={selectedCustomer?.code ?? order?.customerCode ?? ""} />
            {order ? <input type="hidden" name="orderCode" value={order.code} /> : null}
            {isEditing ? <input type="hidden" name="orderDate" value={inputDate(order?.orderDate)} /> : null}

            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Mã đơn hàng"
                name="displayOrderCode"
                defaultValue={order?.code ?? "FOB-XXXXX"}
                readOnly
              />
              <TextField
                label="Ngày tạo"
                name="displayOrderDate"
                defaultValue={
                  isEditing ? displayDateTime(order?.createdAt ?? order?.orderDate) : "Tự động lấy ngày giờ hiện tại"
                }
                readOnly
              />
              <TextField
                label="Tracking"
                name="displayTrackingCode"
                defaultValue={order?.trackingCode ?? "Tự động bằng mã đơn hàng"}
                readOnly
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <section className="grid gap-4 rounded-lg border p-4">
                <div className="font-medium text-sm">Thông tin người gửi</div>
                <datalist id="customer-phone-options">
                  {customerPhoneOptions.map((customer) => (
                    <option key={customer.id} value={customer.phone ?? ""}>
                      {customer.code ? `${customer.code} - ${customer.name}` : customer.name}
                    </option>
                  ))}
                </datalist>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="senderPhone">Số điện thoại người gửi</Label>
                    <Input
                      id="senderPhone"
                      name="senderPhone"
                      list="customer-phone-options"
                      value={senderPhone}
                      onChange={handleSenderPhoneChange}
                      placeholder="Nhập số điện thoại để chọn nhanh khách hàng"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="senderName">Tên người gửi</Label>
                    <Input
                      id="senderName"
                      name="senderName"
                      value={senderName}
                      onChange={(event) => setSenderName(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="senderAddress">Địa chỉ người gửi</Label>
                  <Textarea
                    id="senderAddress"
                    name="senderAddress"
                    value={senderAddress}
                    onChange={(event) => setSenderAddress(event.target.value)}
                  />
                </div>
              </section>

              <section className="grid gap-4 rounded-lg border p-4">
                <div className="font-medium text-sm">Thông tin người nhận</div>
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Số điện thoại người nhận"
                    name="receiverPhone"
                    defaultValue={order?.receiverPhone}
                    required
                  />
                  <TextField label="Tên người nhận" name="receiverName" defaultValue={order?.receiverName} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="receiverAddress">Đại chỉ người nhận</Label>
                  <Textarea
                    id="receiverAddress"
                    name="receiverAddress"
                    defaultValue={order?.receiverAddress ?? ""}
                    required
                  />
                </div>
              </section>
            </div>

            <input type="hidden" name="customsStatus" value={order?.customsStatus ?? "not_started"} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.42fr)]">
              <section className="grid content-start gap-4 rounded-lg border p-4">
                <div className="font-medium text-sm">Thông tin đơn hàng</div>
                <div className="grid gap-2 md:grid-cols-3">
                  <SelectField
                    label="Kho"
                    name="warehouseId"
                    defaultValue={order?.warehouseId}
                    options={toLookupOptions(lookups.warehouses)}
                  />
                  <SelectField
                    label="Dịch vụ"
                    name="serviceTypeId"
                    defaultValue={order?.serviceTypeId}
                    options={toLookupOptions(lookups.serviceTypes)}
                  />
                  <SelectField
                    label="Nhân sự phụ trách"
                    name="assignedStaffId"
                    defaultValue={order?.assignedStaffId ?? initialContact?.assignedStaffId}
                    options={toLookupOptions(lookups.staff)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <TextField label="Tên/loại hàng" name="cargoName" defaultValue={order?.cargoName} />
                  <FormattedNumberField
                    label="Giá trị hàng VND"
                    name="cargoValueVnd"
                    defaultValue={numberInput(order?.cargoValueVnd)}
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <FormattedNumberField
                    label="Số kiện"
                    name="totalPackages"
                    defaultValue={numberInput(order?.totalPackages)}
                  />
                  <FormattedNumberField
                    label="Trọng lượng kg"
                    name="totalWeightKg"
                    defaultValue={numberInput(order?.totalWeightKg)}
                    allowDecimal
                  />
                  <FormattedNumberField
                    label="Số khối m3"
                    name="totalVolumeM3"
                    defaultValue={numberInput(order?.totalVolumeM3)}
                    allowDecimal
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="note">Ghi chú</Label>
                  <Textarea id="note" name="note" className="min-h-24" defaultValue={order?.note ?? initialContact?.note ?? ""} />
                </div>
              </section>

              <section className="grid content-start gap-4 rounded-lg border p-4">
                <div className="font-medium text-sm">Trạng thái và thanh toán</div>
                <SelectField
                  label="Trạng thái"
                  name="operationStatus"
                  defaultValue={order?.operationStatus ?? "new"}
                  options={toStatusOptions(operationStatusLabels)}
                />
                <SelectField
                  label="Thu tiền"
                  name="collectionStatus"
                  defaultValue={order?.collectionStatus ?? "not_collected"}
                  options={toStatusOptions(collectionStatusLabels)}
                />
                <SelectField
                  label="Hóa đơn"
                  name="invoiceStatus"
                  defaultValue={order?.invoiceStatus ?? "not_issued"}
                  options={toStatusOptions(invoiceStatusLabels)}
                />
                <TextField
                  label="Ngày giao"
                  name="deliveryDate"
                  defaultValue={inputDate(order?.deliveryDate)}
                  type="date"
                />
                <TextField
                  label="Hạn thanh toán"
                  name="paymentDueDate"
                  defaultValue={inputDate(order?.paymentDueDate)}
                  type="date"
                />

                <FormattedNumberField
                  label="Đã thu"
                  name="paidAmountVnd"
                  defaultValue={numberInput(order?.paidAmountVnd)}
                />
                <div className="grid gap-3 rounded-lg border bg-muted/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="grid gap-0.5">
                      <div className="font-medium text-sm">Doanh thu đối soát</div>
                    </div>
                    <div className="whitespace-nowrap font-semibold text-base">{formatVnd(order?.totalChargeVnd)}</div>
                  </div>
                  <div className="grid gap-1 text-muted-foreground text-xs">
                    <div>Da thu: {formatVnd(order?.paidAmountVnd)}</div>
                    <div>Con phai thu: {formatVnd(order?.remainingAmountVnd)}</div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="mt-auto items-center border-t bg-muted/30 px-8 pt-4 pb-6 sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                <XIcon data-icon="inline-start" />
                Đóng
              </Button>
            </DialogClose>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {order ? (
                <Button type="button" variant="outline" className="min-w-36" asChild>
                  <Link href={invoiceHref(order.id)}>
                    <ReceiptTextIcon data-icon="inline-start" />
                    Xuất hóa đơn
                  </Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-36"
                  disabled
                  title="Lưu đơn hàng trước khi xuất hóa đơn"
                >
                  <ReceiptTextIcon data-icon="inline-start" />
                  Xuất hóa đơn
                </Button>
              )}
              <Button type="submit" className="min-w-36 shadow-sm" disabled={isSaving} aria-busy={isSaving}>
                {isSaving ? (
                  <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
                ) : (
                  <SaveIcon data-icon="inline-start" />
                )}
                {isSaving ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Thêm đơn hàng"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteOrderDialog({ order }: { order: OrderRow }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 text-destructive" size="sm">
          <Trash2Icon />
          Xóa đơn
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xóa đơn {order.code}?</AlertDialogTitle>
          <AlertDialogDescription>
            Cac du lieu lien quan nhu chi phi, phi thu, hang hoa, cong no va thue cua don nay se bi xoa theo rang buoc
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huy</AlertDialogCancel>
          <form action={deleteOrder}>
            <input type="hidden" name="orderId" value={order.id} />
            <Button type="submit" variant="destructive">
              Xóa đơn
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
