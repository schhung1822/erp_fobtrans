"use client";

import { format, parseISO } from "date-fns";
import { PackageCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

import {
  collectionStatusLabels,
  customsStatusLabels,
  invoiceStatusLabels,
  operationStatusLabels,
} from "./order-options";
import type { OrderRow } from "./schema";

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

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-muted/20 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="min-h-5 text-sm">{value || "-"}</div>
    </div>
  );
}

export function OrderDetailDialog({ order }: { order: OrderRow }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-foreground">
          <span className="truncate">{order.code}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-[80vw] overflow-hidden p-0 sm:max-w-[80vw]">
        <DialogHeader className="border-b px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md border bg-muted">
              <PackageCheck className="size-4 text-muted-foreground" />
            </span>
            <div className="grid gap-1">
              <DialogTitle>Chi tiết đơn {order.code}</DialogTitle>
              <div className="text-muted-foreground text-xs">Tracking: {order.trackingCode ?? order.code}</div>
            </div>
          </div>
        </DialogHeader>
        <div className="grid max-h-[calc(80vh-72px)] gap-5 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <section className="grid gap-3 rounded-lg border p-4">
              <div className="font-medium text-sm">Người gửi</div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Tên" value={order.senderName ?? order.customerName} />
                <DetailItem label="Số điện thoại" value={order.senderPhone ?? order.customerCode} />
              </div>
              <DetailItem label="Địa chỉ" value={order.senderAddress} />
            </section>
            <section className="grid gap-3 rounded-lg border p-4">
              <div className="font-medium text-sm">Người nhận</div>
              <div className="grid gap-3 md:grid-cols-2">
                <DetailItem label="Tên" value={order.receiverName} />
                <DetailItem label="Số điện thoại" value={order.receiverPhone} />
              </div>
              <DetailItem label="Địa chỉ" value={order.receiverAddress ?? order.deliveryAddress} />
            </section>
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
            <DetailItem label="Ngày tạo" value={formatDate(order.orderDate)} />
            <DetailItem label="Ngày giao" value={formatDate(order.deliveryDate)} />
            <DetailItem label="Hạn thanh toán" value={formatDate(order.paymentDueDate)} />
            <DetailItem label="Tuyến" value={order.routeName} />
            <DetailItem label="Kho" value={order.warehouseName} />
            <DetailItem label="Dịch vụ" value={order.serviceName} />
            <DetailItem label="Nhân sự" value={order.staffName} />
            <DetailItem label="Container" value={order.containerCode} />
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <DetailItem
              label="Trạng thái"
              value={<Badge variant="outline">{operationStatusLabels[order.operationStatus]}</Badge>}
            />
            <DetailItem
              label="Thông quan"
              value={<Badge variant="outline">{customsStatusLabels[order.customsStatus]}</Badge>}
            />
            <DetailItem
              label="Thu tiền"
              value={<Badge variant="outline">{collectionStatusLabels[order.collectionStatus]}</Badge>}
            />
            <DetailItem
              label="Hóa đơn"
              value={<Badge variant="outline">{invoiceStatusLabels[order.invoiceStatus]}</Badge>}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <DetailItem label="Số kiện" value={order.totalPackages.toLocaleString("vi-VN")} />
            <DetailItem label="Cân nặng" value={`${order.totalWeightKg.toLocaleString("vi-VN")} kg`} />
            <DetailItem label="Số khối" value={`${order.totalVolumeM3.toLocaleString("vi-VN")} m3`} />
            <DetailItem label="Doanh thu" value={formatVnd(order.totalChargeVnd)} />
            <DetailItem label="Đã thu" value={formatVnd(order.paidAmountVnd)} />
            <DetailItem label="Công nợ" value={formatVnd(order.remainingAmountVnd)} />
          </div>

          <DetailItem label="Ghi chú" value={order.note} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
