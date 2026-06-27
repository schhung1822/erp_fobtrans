"use client";

import { FormProvider, useForm, useWatch } from "react-hook-form";

import type { InvoiceFormValues } from "./data";
import { InvoiceForm } from "./invoice-form";
import type { InvoiceOrderOption } from "./invoice-orders";
import { InvoicePreview } from "./invoice-preview";

export function Invoice({
  orders,
  defaultValues,
  selectedOrderId,
}: {
  orders: InvoiceOrderOption[];
  defaultValues: InvoiceFormValues;
  selectedOrderId?: string;
}) {
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      ...defaultValues,
      orderId: selectedOrderId ?? defaultValues.orderId,
    },
  });
  const invoice = useWatch({ control: form.control }) as InvoiceFormValues;

  return (
    <FormProvider {...form}>
      <form className="grid gap-5 xl:grid-cols-2" noValidate onSubmit={(event) => event.preventDefault()}>
        <InvoiceForm orders={orders} />
        <InvoicePreview invoice={invoice} />
      </form>
    </FormProvider>
  );
}
