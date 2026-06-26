import { AlertCircleIcon, DatabaseIcon, PackageCheckIcon, WalletCardsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

import { getOrdersData, type OrdersDateRange } from "./_components/data";
import { MonthFilter } from "./_components/month-filter";
import { OrdersTable } from "./_components/orders-table";
import type { OrdersSummary } from "./_components/schema";

export const dynamic = "force-dynamic";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function parseMonth(value: string | undefined) {
  if (!value || !MONTH_PATTERN.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

function resolveMonthRange(searchParams: Record<string, string | string[] | undefined>) {
  const now = new Date();
  const currentMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const rawFrom = Array.isArray(searchParams.fromMonth) ? searchParams.fromMonth[0] : searchParams.fromMonth;
  const rawTo = Array.isArray(searchParams.toMonth) ? searchParams.toMonth[0] : searchParams.toMonth;
  const from = parseMonth(rawFrom) ?? currentMonth;
  let to = parseMonth(rawTo) ?? from;

  if (to < from) to = from;

  const maxTo = addMonths(from, 11);
  if (to > maxTo) to = maxTo;

  return {
    currentMonth: monthKey(currentMonth),
    fromMonth: monthKey(from),
    toMonth: monthKey(to),
    range: {
      from: from.toISOString().slice(0, 10),
      to: addMonths(to, 1).toISOString().slice(0, 10),
    } satisfies OrdersDateRange,
  };
}

function formatMonthLabel(value: string) {
  const date = parseMonth(value);
  if (!date) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    month: "2-digit",
    timeZone: "UTC",
    year: "numeric",
  }).format(date);
}

function SummaryCards({ summary }: { summary: OrdersSummary }) {
  const cards = [
    {
      title: "Tổng đơn hàng",
      value: summary.totalOrders.toLocaleString("vi-VN"),
      note: `${summary.pendingImportRows.toLocaleString("vi-VN")} Số đơn hàng trong bảng`,
      icon: PackageCheckIcon,
    },
    {
      title: "Doanh thu đối soát",
      value: formatVnd(summary.totalRevenueVnd),
      note: "Tổng giá trị cần thu",
      icon: WalletCardsIcon,
    },
    {
      title: "Công nợ",
      value: formatVnd(summary.totalReceivableVnd),
      note: "Số tiền còn phải thu",
      icon: AlertCircleIcon,
    },
    {
      title: "Lợi nhuận gộp",
      value: formatVnd(summary.totalProfitVnd),
      note: "Theo dữ liệu đối soát",
      icon: DatabaseIcon,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.title} size="sm">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-muted-foreground text-sm">{card.title}</CardTitle>
              <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                <Icon className="size-4 text-muted-foreground" />
              </span>
            </CardHeader>
            <CardContent className="grid gap-1">
              <div className="font-semibold text-2xl tracking-tight">{card.value}</div>
              <div className="text-muted-foreground text-xs">{card.note}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const { currentMonth, fromMonth, toMonth, range } = resolveMonthRange(params);
  const { orders, summary, lookups } = await getOrdersData(range);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Quản lý đơn hàng</h1>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <MonthFilter currentMonth={currentMonth} fromMonth={fromMonth} toMonth={toMonth} />
          <Badge variant="outline" className="h-9 w-fit px-3">
            Đơn hàng: {summary.totalOrders.toLocaleString("vi-VN")}
          </Badge>
        </div>
      </div>

      <SummaryCards summary={summary} />
      <OrdersTable data={orders} lookups={lookups} />
    </div>
  );
}
