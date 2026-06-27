import { useFormContext } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import type { InvoiceFormValues } from "./data";
import { SaveInvoiceSettingsButton } from "./save-invoice-settings-button";

export function PaymentDetails() {
  const { register } = useFormContext<InvoiceFormValues>();

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-medium tracking-tight">Thông tin thanh toán</h2>
        <SaveInvoiceSettingsButton scope="payment" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field className="gap-1 md:col-span-2">
          <FieldLabel className="text-xs" htmlFor="payment-account-name">
            Tài khoản thanh toán
          </FieldLabel>
          <Input id="payment-account-name" {...register("from.paymentAccountName")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="payment-bank-name">
            Tài khoản ngân hàng
          </FieldLabel>
          <Input id="payment-bank-name" placeholder="Tên ngân hàng" {...register("from.paymentBankName")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="payment-routing-number">
            Số tài khoản
          </FieldLabel>
          <Input id="payment-routing-number" {...register("from.routingNumber")} />
        </Field>
      </div>
    </section>
  );
}
