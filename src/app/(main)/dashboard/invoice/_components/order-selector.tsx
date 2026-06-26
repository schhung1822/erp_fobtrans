import { useCallback, useEffect } from "react";

import { Controller, useFormContext, useWatch } from "react-hook-form";

import { Field, FieldLabel } from "@/components/ui/field";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { InvoiceFormValues } from "./data";
import type { InvoiceOrderOption } from "./invoice-orders";

function buildOrderItem(order: InvoiceOrderOption) {
  const goods = order.cargoName ?? `${order.totalPackages.toLocaleString("vi-VN")} kien`;
  const meta = `${order.totalWeightKg.toLocaleString("vi-VN")} kg / ${order.totalVolumeM3.toLocaleString("vi-VN")} m3`;

  return {
    id: order.id,
    description: `Don ${order.code} - ${goods} (${meta})`,
    quantity: 1,
    unitPrice: order.remainingAmountVnd > 0 ? order.remainingAmountVnd : order.totalChargeVnd,
  };
}

export function OrderSelector({ orders }: { orders: InvoiceOrderOption[] }) {
  const { control, setValue } = useFormContext<InvoiceFormValues>();
  const selectedOrderId = useWatch({ control, name: "orderId" });
  const applyOrder = useCallback(
    (orderId: string, shouldDirty: boolean) => {
      const selectedOrder = orders.find((order) => order.id === orderId);

      if (!selectedOrder) return;

      setValue("referenceNumber", `INV-${selectedOrder.code}`, { shouldDirty });
      setValue("issuedDate", new Date().toISOString().slice(0, 10), { shouldDirty });
      setValue(
        "paymentDueDate",
        selectedOrder.deliveryDate ?? selectedOrder.orderDate ?? new Date().toISOString().slice(0, 10),
        {
          shouldDirty,
        },
      );
      setValue(
        "to",
        {
          id: selectedOrder.id,
          name: selectedOrder.customerName,
          email: selectedOrder.customerEmail,
          addressLines: selectedOrder.addressLines,
          taxId: selectedOrder.customerTaxId,
        },
        { shouldDirty },
      );
      setValue("items", [buildOrderItem(selectedOrder)], { shouldDirty });
    },
    [orders, setValue],
  );

  useEffect(() => {
    if (!selectedOrderId) return;
    applyOrder(selectedOrderId, false);
  }, [applyOrder, selectedOrderId]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-medium tracking-tight">Don hang thanh toan</h2>
      <Controller
        control={control}
        name="orderId"
        render={({ field }) => (
          <Field className="gap-1">
            <FieldLabel className="text-xs">Chon don hang</FieldLabel>
            <Select
              value={field.value}
              onValueChange={(orderId) => {
                field.onChange(orderId);
                applyOrder(orderId, true);
              }}
            >
              <SelectTrigger className="w-full data-[size=default]:h-auto">
                <SelectValue placeholder="Chon don hang" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.code} - {order.customerName} - {order.totalChargeVnd.toLocaleString("vi-VN")} VND
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        )}
      />
    </section>
  );
}
