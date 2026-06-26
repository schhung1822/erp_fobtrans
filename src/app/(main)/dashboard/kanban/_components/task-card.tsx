"use client";

import { CalendarDays, PackageCheck, PackageSearch, UserRound, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn, formatCurrency } from "@/lib/utils";

import type { CollectionStatus, ColumnId, CustomsStatus, InvoiceStatus, Task, TaskPriority } from "./types";

const priorityBadgeConfig: Record<TaskPriority, { label: string; className: string }> = {
  High: {
    label: "Can xu ly",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  Medium: {
    label: "Dang chay",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  Low: {
    label: "On dinh",
    className: "border-muted-foreground/20 bg-muted text-muted-foreground",
  },
};

const operationStatusLabels: Record<ColumnId, string> = {
  new: "Moi",
  received: "Da nhan",
  in_transit: "Dang van chuyen",
  arrived_warehouse: "Ve kho",
  customs_processing: "Kiem hoa",
  customs_done: "Da thong quan",
  delivered: "Da giao",
  cancelled: "Da huy",
  problem: "Co van de",
};

const customsStatusLabels: Record<CustomsStatus, string> = {
  not_started: "Chua lam",
  processing: "Dang lam",
  cleared: "Thong quan",
  hold: "Tam giu",
  cancelled: "Da huy",
};

const collectionStatusLabels: Record<CollectionStatus, string> = {
  not_collected: "Chua thu",
  partial: "Thu mot phan",
  collected: "Da thu",
  overdue: "Qua han",
  bad_debt: "No xau",
};

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  not_issued: "Chua xuat",
  draft: "Nhap",
  issued: "Da xuat",
  sent: "Da gui",
  cancelled: "Da huy",
};

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function formatNumber(value: number) {
  return value.toLocaleString("vi-VN");
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border bg-muted/20 p-3">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="min-h-5 text-sm">{value || "-"}</div>
    </div>
  );
}

function CardContent({ task, columnId, isOverlay }: { task: Task; columnId?: ColumnId; isOverlay: boolean }) {
  const isDone = columnId === "delivered";
  const priority = priorityBadgeConfig[task.priority];

  return (
    <article
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border bg-card p-4 text-left text-card-foreground shadow-xs transition-colors hover:border-primary/40 hover:bg-card/95",
        isOverlay && "w-68 rotate-1 shadow-lg",
      )}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="min-w-0 truncate font-medium text-sm leading-none">{task.title}</h3>
          <Badge variant="outline" className={cn("shrink-0 rounded-md px-2 font-medium", priority.className)}>
            {priority.label}
          </Badge>
        </div>
        <p className="line-clamp-2 text-muted-foreground text-sm leading-5">{task.description}</p>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <UserRound className="size-3.5 shrink-0" />
          <span className="truncate">{task.customerName}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="size-3.5 shrink-0" />
          <span className="truncate">{task.dueDate}</span>
        </div>
        <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <PackageSearch className="size-3.5 shrink-0" />
          <span className="truncate">
            {task.cargoName ?? `${formatNumber(task.totalPackages)} kien`} - {formatNumber(task.totalWeightKg)} kg /{" "}
            {formatNumber(task.totalVolumeM3)} m3
          </span>
        </div>
      </div>

      <Separator />

      <div className="grid gap-1.5 text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <WalletCards className="size-3.5" />
            Doanh thu
          </span>
          <span className="whitespace-nowrap font-medium">{formatVnd(task.totalChargeVnd)}</span>
        </div>
        {!isDone ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Cong no</span>
            <span className={cn("whitespace-nowrap font-medium", task.remainingAmountVnd > 0 && "text-destructive")}>
              {formatVnd(task.remainingAmountVnd)}
            </span>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function TaskDetail({ task }: { task: Task }) {
  return (
    <DialogContent className="max-h-[84vh] max-w-[min(calc(100vw-2rem),64rem)] overflow-hidden p-0 sm:max-w-[min(calc(100vw-2rem),64rem)]">
      <DialogHeader className="border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-md border bg-muted">
            <PackageCheck className="size-4 text-muted-foreground" />
          </span>
          <div className="grid gap-1">
            <DialogTitle>Chi tiet don {task.title}</DialogTitle>
            <div className="text-muted-foreground text-xs">Tracking: {task.trackingCode ?? task.title}</div>
          </div>
        </div>
      </DialogHeader>
      <div className="grid max-h-[calc(84vh-72px)] gap-5 overflow-y-auto px-5 py-4">
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="grid gap-3 rounded-lg border p-4">
            <div className="font-medium text-sm">Nguoi gui</div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Ten" value={task.senderName ?? task.customerName} />
              <DetailItem label="So dien thoai" value={task.senderPhone ?? task.customerCode} />
            </div>
            <DetailItem label="Dia chi" value={task.senderAddress} />
          </section>
          <section className="grid gap-3 rounded-lg border p-4">
            <div className="font-medium text-sm">Nguoi nhan</div>
            <div className="grid gap-3 md:grid-cols-2">
              <DetailItem label="Ten" value={task.receiverName} />
              <DetailItem label="So dien thoai" value={task.receiverPhone} />
            </div>
            <DetailItem label="Dia chi" value={task.receiverAddress ?? task.deliveryAddress} />
          </section>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
          <DetailItem label="Ngay tao" value={formatDate(task.orderDate)} />
          <DetailItem label="Ngay giao" value={formatDate(task.deliveryDate)} />
          <DetailItem label="Han thanh toan" value={formatDate(task.paymentDueDate)} />
          <DetailItem label="Tuyen" value={task.routeName} />
          <DetailItem label="Container" value={task.containerCode} />
          <DetailItem label="Dia chi giao" value={task.deliveryAddress} />
          <DetailItem label="Ma khach" value={task.customerCode} />
          <DetailItem label="Hang hoa" value={task.cargoName} />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <DetailItem
            label="Trang thai"
            value={<Badge variant="outline">{operationStatusLabels[task.operationStatus]}</Badge>}
          />
          <DetailItem
            label="Thong quan"
            value={<Badge variant="outline">{customsStatusLabels[task.customsStatus]}</Badge>}
          />
          <DetailItem
            label="Thu tien"
            value={<Badge variant="outline">{collectionStatusLabels[task.collectionStatus]}</Badge>}
          />
          <DetailItem
            label="Hoa don"
            value={<Badge variant="outline">{invoiceStatusLabels[task.invoiceStatus]}</Badge>}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <DetailItem label="So kien" value={formatNumber(task.totalPackages)} />
          <DetailItem label="Can nang" value={`${formatNumber(task.totalWeightKg)} kg`} />
          <DetailItem label="So khoi" value={`${formatNumber(task.totalVolumeM3)} m3`} />
          <DetailItem label="Doanh thu" value={formatVnd(task.totalChargeVnd)} />
          <DetailItem label="Da thu" value={formatVnd(task.paidAmountVnd)} />
          <DetailItem label="Cong no" value={formatVnd(task.remainingAmountVnd)} />
        </div>

        <DetailItem label="Ghi chu" value={task.note} />
      </div>
    </DialogContent>
  );
}

export function TaskCard({
  task,
  columnId,
  isOverlay = false,
}: {
  task: Task;
  columnId?: ColumnId;
  isOverlay?: boolean;
}) {
  if (isOverlay) {
    return <CardContent task={task} columnId={columnId} isOverlay />;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="block w-full cursor-pointer p-0 text-left">
          <CardContent task={task} columnId={columnId} isOverlay={false} />
        </button>
      </DialogTrigger>
      <TaskDetail task={task} />
    </Dialog>
  );
}
