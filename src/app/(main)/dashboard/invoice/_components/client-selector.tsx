import { useFormContext } from "react-hook-form";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getInitials } from "@/lib/utils";

import type { InvoiceFormValues } from "./data";

export function ClientSelector() {
  const { register, watch } = useFormContext<InvoiceFormValues>();
  const selectedClient = watch("to");

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">Thông tin khách hàng</h2>

      <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
        <Avatar className="after:rounded-md">
          <AvatarFallback className="rounded-md bg-card text-foreground">
            {getInitials(selectedClient.name).slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium">{selectedClient.name}</div>
          <div className="truncate text-muted-foreground">{selectedClient.email || "Chưa có email"}</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="client-name">
            Tên khách hàng
          </FieldLabel>
          <Input id="client-name" {...register("to.name")} />
        </Field>
        <Field className="gap-1">
          <FieldLabel className="text-xs" htmlFor="client-tax-id">
            Mã số thuế
          </FieldLabel>
          <Input id="client-tax-id" {...register("to.taxId")} />
        </Field>
        <Field className="gap-1 md:col-span-2">
          <FieldLabel className="text-xs" htmlFor="client-email">
            Email
          </FieldLabel>
          <Input id="client-email" {...register("to.email")} />
        </Field>
      </div>
    </section>
  );
}
