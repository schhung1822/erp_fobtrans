import {
  ArrowRight,
  type Banknote,
  CircleDollarSign,
  Landmark,
  ReceiptText,
  TrendingUp,
  WalletCards,
} from "lucide-react";

import { type FinanceEntry, getFinanceData } from "@/app/(main)/finance/_components/data";
import { MonthSelect } from "@/app/(main)/finance/_components/finance-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ month?: string }> | { month?: string };
};

function formatVnd(value: number) {
  return formatCurrency(value, { currency: "VND", locale: "vi-VN", noDecimals: true });
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function CollectionBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    bad_debt: "Nợ xấu",
    collected: "Đã thu",
    not_collected: "Chưa thu",
    overdue: "Quá hạn",
    partial: "Thu một phần",
  };
  const tone = status === "collected" ? "good" : status === "overdue" || status === "bad_debt" ? "bad" : "warn";

  return (
    <Badge
      variant="outline"
      className={cn(
        tone === "good" && "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        tone === "bad" && "border-destructive/25 bg-destructive/10 text-destructive",
        tone === "warn" && "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      )}
    >
      {labels[status] ?? status}
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  note,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  note: string;
  icon: typeof Banknote;
  tone?: "good" | "bad";
}) {
  return (
    <Card size="sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-muted-foreground text-sm">{title}</CardTitle>
        <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </span>
      </CardHeader>
      <CardContent className="grid gap-1">
        <div
          className={cn(
            "font-semibold text-2xl tracking-tight",
            tone === "good" && "text-emerald-700 dark:text-emerald-300",
            tone === "bad" && "text-destructive",
          )}
        >
          {value}
        </div>
        <CardDescription>{note}</CardDescription>
      </CardContent>
    </Card>
  );
}

function ReconciliationCard({ summary }: { summary: Awaited<ReturnType<typeof getFinanceData>>["summary"] }) {
  const rows = [
    ["Hóa đơn đã xuất", summary.invoiceAmountVnd],
    ["Thuế khách ứng", summary.taxAdvanceVnd],
    ["Thuế NK", summary.importTaxVnd],
    ["Thuế GTGT", summary.vatVnd],
    ["Chi phí vận hành", summary.totalCostVnd],
    ["Chi phí tính công BHN", summary.totalBusinessCostVnd],
  ] as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đối soát tài chính tháng {summary.month}</CardTitle>
        <CardDescription>Những số liệu dùng cho kế toán, thuế, hóa đơn và công nợ.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md border bg-muted/30 p-3">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 font-medium tabular-nums">{formatVnd(value)}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StaffFinanceTable({ rows }: { rows: Awaited<ReturnType<typeof getFinanceData>>["staffRows"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hiệu suất tài chính theo nhân sự</CardTitle>
        <CardDescription>Doanh thu, công nợ và lợi nhuận theo người phụ trách đơn hàng.</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Nhân sự</TableHead>
                <TableHead className="text-right">Đơn</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Công nợ</TableHead>
                <TableHead className="text-right">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((row) => (
                  <TableRow key={row.staffName}>
                    <TableCell className="font-medium">{row.staffName}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.totalOrders.toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(row.totalRevenueVnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(row.totalReceivableVnd)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        row.grossProfitVnd >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
                      )}
                    >
                      {formatVnd(row.grossProfitVnd)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Chưa có dữ liệu nhân sự trong tháng này
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentFinanceOrders({ entries }: { entries: FinanceEntry[] }) {
  const recentEntries = entries.slice(0, 8);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Đơn hàng cần theo dõi</CardTitle>
          <CardDescription>Những đơn mới nhất trong tháng, kèm trạng thái thu tiền và công nợ.</CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href="/finance">
            Mở bảng kế toán
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Đơn hàng</TableHead>
                <TableHead>Ngày giao</TableHead>
                <TableHead>Thu tiền</TableHead>
                <TableHead className="text-right">Cần thu</TableHead>
                <TableHead className="text-right">Đã thu</TableHead>
                <TableHead className="text-right">Còn lại</TableHead>
                <TableHead className="text-right">Lợi nhuận</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.length ? (
                recentEntries.map((entry) => (
                  <TableRow key={entry.orderId}>
                    <TableCell>
                      <div className="grid gap-0.5">
                        <span className="font-medium">{entry.orderCode}</span>
                        <span className="text-muted-foreground text-xs">
                          {entry.customerCode ? `${entry.customerCode} - ` : ""}
                          {entry.customerName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{formatDate(entry.deliveryDate)}</TableCell>
                    <TableCell>
                      <CollectionBadge status={entry.collectionStatus} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(entry.totalChargeVnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(entry.paidAmountVnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(entry.remainingAmountVnd)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-medium tabular-nums",
                        entry.grossProfitVnd >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-destructive",
                      )}
                    >
                      {formatVnd(entry.grossProfitVnd)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    Chưa có đơn hàng trong tháng này
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const data = await getFinanceData(resolvedSearchParams.month);
  const { summary } = data;
  const collectionRate = Math.min(Math.max(summary.collectionRatePercent, 0), 100);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Báo cáo tài chính</h1>
          <p className="text-muted-foreground text-sm">
            Tổng hợp doanh thu đối soát, công nợ, chi phí, thuế, hóa đơn và lợi nhuận theo tháng.
          </p>
        </div>
        <MonthSelect basePath="/dashboard/finance" months={data.availableMonths} selectedMonth={summary.month} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Tổng cần thu"
          value={formatVnd(summary.totalRevenueVnd)}
          note={`${summary.totalOrders.toLocaleString("vi-VN")} đơn hàng trong tháng ${summary.month}`}
          icon={CircleDollarSign}
        />
        <KpiCard
          title="Đã thu"
          value={formatVnd(summary.totalCollectedVnd)}
          note={`Tỷ lệ thu ${formatNumber(summary.collectionRatePercent)}%`}
          icon={WalletCards}
          tone="good"
        />
        <KpiCard
          title="Công nợ còn lại"
          value={formatVnd(summary.totalReceivableVnd)}
          note={`Quá hạn ${formatVnd(summary.overdueAmountVnd)}`}
          icon={Landmark}
          tone={summary.totalReceivableVnd > 0 ? "bad" : undefined}
        />
        <KpiCard
          title="Lợi nhuận gộp"
          value={formatVnd(summary.grossProfitVnd)}
          note={`Chi phí ${formatVnd(summary.totalCostVnd)}`}
          icon={TrendingUp}
          tone={summary.grossProfitVnd >= 0 ? "good" : "bad"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tiến độ thu tiền</CardTitle>
          <CardDescription>
            Đã thu {formatVnd(summary.totalCollectedVnd)} / {formatVnd(summary.totalRevenueVnd)} cần thu.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Progress value={collectionRate} className="h-2.5" />
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>0%</span>
            <span className="font-medium text-foreground tabular-nums">{formatNumber(collectionRate)}%</span>
            <span>100%</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
        <ReconciliationCard summary={summary} />
        <Card>
          <CardHeader>
            <CardTitle>Lợi nhuận phòng kinh doanh</CardTitle>
            <CardDescription>Số liệu sau khi tách chi phí tính công BHN.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
              <span className="text-muted-foreground text-sm">Lợi nhuận KD</span>
              <span className="font-semibold text-xl tabular-nums">{formatVnd(summary.businessProfitVnd)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ReceiptText className="size-4" />
              Hóa đơn đã xuất:{" "}
              <span className="font-medium text-foreground tabular-nums">{formatVnd(summary.invoiceAmountVnd)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <StaffFinanceTable rows={data.staffRows} />
      <RecentFinanceOrders entries={data.entries} />
    </div>
  );
}
