import { Download, FileSpreadsheet, Save, TrendingUp, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";

import { updateFinanceEntry } from "./_components/actions";
import { type FinanceEntry, getFinanceData } from "./_components/data";
import {
  CollectionStatusSelect,
  FormattedMoneyInput,
  MonthSelect,
  StaffCommissionTable,
} from "./_components/finance-controls";
import { FinanceTableScroller } from "./_components/finance-table-scroller";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ month?: string }> | { month?: string };
};

function formatVnd(value: number) {
  return formatCurrency(value, { currency: "VND", locale: "vi-VN", noDecimals: true });
}

function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits }).format(value);
}

function dateLabel(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function StatusBadge({ status }: { status: string }) {
  const label: Record<string, string> = {
    bad_debt: "No xau",
    cancelled: "Da huy",
    collected: "Da thu",
    draft: "Nhap",
    issued: "Da ky",
    not_collected: "Chua thu",
    not_issued: "Chua xuat",
    overdue: "Qua han",
    partial: "Thu mot phan",
    sent: "Da gui",
  };
  const isGood = ["collected", "issued", "sent"].includes(status);
  const isBad = ["bad_debt", "overdue", "cancelled"].includes(status);

  return (
    <Badge
      className={cn(isGood && "bg-emerald-500/10 text-emerald-700", isBad && "bg-destructive/10 text-destructive")}
      variant="outline"
    >
      {label[status] ?? status}
    </Badge>
  );
}

function KpiCard({ title, value, note, tone }: { title: string; value: string; note: string; tone?: "good" | "bad" }) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-normal text-muted-foreground text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-1">
        <div
          className={cn(
            "font-semibold text-2xl tracking-tight",
            tone === "good" && "text-emerald-700",
            tone === "bad" && "text-destructive",
          )}
        >
          {value}
        </div>
        <p className="text-muted-foreground text-xs">{note}</p>
      </CardContent>
    </Card>
  );
}

function ReportTemplate({ summary }: { summary: Awaited<ReturnType<typeof getFinanceData>>["summary"] }) {
  const rows = [
    ["Tong chi phi", summary.totalCostVnd],
    ["Chi phi tinh cong no BHN", summary.totalBusinessCostVnd],
    ["Tong tien can thu", summary.totalRevenueVnd],
    ["Da thu", summary.totalCollectedVnd],
    ["Cong no con lai", summary.totalReceivableVnd],
    ["Thue NK", summary.importTaxVnd],
    ["Thue GTGT", summary.vatVnd],
    ["Loi nhuan", summary.grossProfitVnd],
    ["Loi nhuan phong kinh doanh", summary.businessProfitVnd],
  ];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="font-normal">Mau bao cao ke toan thang {summary.month}</CardTitle>
        <Badge variant="outline">
          <FileSpreadsheet className="size-3.5" />
          Theo CSV KHO BHN
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map(([label, value]) => (
            <div className="rounded-md border bg-muted/30 p-3" key={label as string}>
              <div className="text-muted-foreground text-xs">{label}</div>
              <div className="font-medium tabular-nums">{formatVnd(value as number)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceRow({ entry }: { entry: FinanceEntry }) {
  const formId = `finance-${entry.orderId}`;

  return (
    <TableRow>
      <TableCell className="sticky left-0 z-10 min-w-64 bg-card align-top shadow-[1px_0_0_hsl(var(--border))]">
        <form action={updateFinanceEntry} id={formId} />
        <input form={formId} name="orderId" type="hidden" value={entry.orderId} />
        <div className="grid gap-1">
          <div className="font-medium">{entry.orderCode}</div>
          <div className="max-w-72 truncate text-muted-foreground text-xs">
            {entry.customerCode ? `${entry.customerCode} - ` : ""}
            {entry.customerName}
          </div>
          <div className="max-w-72 truncate text-muted-foreground text-xs">{entry.cargoName ?? "Chua co ten hang"}</div>
          <div className="flex flex-wrap gap-1 pt-1">
            <StatusBadge status={entry.collectionStatus} />
            <StatusBadge status={entry.invoiceStatus} />
          </div>
        </div>
      </TableCell>
      <TableCell className="align-top text-muted-foreground text-xs">
        <div>Giao: {dateLabel(entry.deliveryDate)}</div>
        <div>Han: {dateLabel(entry.paymentDueDate)}</div>
        <div>{entry.staffName ?? "Chua gan nhan su"}</div>
      </TableCell>
      <TableCell className="text-right align-top text-xs tabular-nums">
        <div>{formatNumber(entry.packages, 0)} kien</div>
        <div>{formatNumber(entry.weightKg)} kg</div>
        <div>{formatNumber(entry.volumeM3)} m3</div>
      </TableCell>
      <TableCell className="align-center">
        <CollectionStatusSelect formId={formId} value={entry.collectionStatus} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="chinaDomesticCostVnd" value={entry.chinaDomesticCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="importTaxCostVnd" value={entry.importTaxCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="vatCostVnd" value={entry.vatCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="vietnamDomesticCostVnd" value={entry.vietnamDomesticCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="threeWheelFeeVnd" value={entry.threeWheelFeeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="customsCostVnd" value={entry.customsCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="seaFreightCostVnd" value={entry.seaFreightCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="otherCostVnd" value={entry.otherCostVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="customerFreightVnd" value={entry.customerFreightVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="chinaDomesticChargeVnd" value={entry.chinaDomesticChargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="importTaxChargeVnd" value={entry.importTaxChargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="vatChargeVnd" value={entry.vatChargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="surchargeVnd" value={entry.surchargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="customsChargeVnd" value={entry.customsChargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="seaFreightChargeVnd" value={entry.seaFreightChargeVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="otherRevenueVnd" value={entry.otherRevenueVnd} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput formId={formId} name="revenueDiscountVnd" value={Math.abs(entry.revenueDiscountVnd)} />
      </TableCell>
      <TableCell>
        <FormattedMoneyInput
          className="border-primary/50"
          formId={formId}
          name="paidAmountVnd"
          value={entry.paidAmountVnd}
        />
      </TableCell>
      <TableCell className="min-w-44 text-right text-xs tabular-nums">
        <div>Tong chi: {formatVnd(entry.totalCostVnd)}</div>
        <div>Can thu: {formatVnd(entry.totalChargeVnd)}</div>
        <div>Con lai: {formatVnd(entry.remainingAmountVnd)}</div>
        <div className={cn("font-medium", entry.grossProfitVnd < 0 ? "text-destructive" : "text-emerald-700")}>
          Lai: {formatVnd(entry.grossProfitVnd)}
        </div>
      </TableCell>
      <TableCell className="sticky right-0 z-10 bg-card shadow-[-1px_0_0_hsl(var(--border))]">
        <Button form={formId} size="sm" type="submit">
          <Save className="size-4" />
          Luu
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FinanceEntryTable({ entries }: { entries: FinanceEntry[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="font-normal">Ke toan theo doi</CardTitle>
        </div>
        <Badge variant="outline">{entries.length} don</Badge>
      </CardHeader>
      <CardContent className="pt-0">
        <FinanceTableScroller>
          <Table className="min-w-[2740px] border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 left-0 z-50 min-w-64 border-b bg-card shadow-[1px_0_0_hsl(var(--border))]">
                  Don hang
                </TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Thoi gian</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card text-right">Hang</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Thu tien</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">CP noi dia TQ</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Thue NK chi</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">VAT chi</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">VC noi dia</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Ba banh</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Hai quan chi</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Cuoc tau chi</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Chi phi khac</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Cuoc tinh khach</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Noi dia TQ thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Thue NK thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">VAT thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Phu thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Hai quan thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Cuoc tau thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Thu khac</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Giam tru</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Da thu</TableHead>
                <TableHead className="sticky top-0 z-40 border-b bg-card">Ket qua</TableHead>
                <TableHead className="sticky top-0 right-0 z-50 border-b bg-card shadow-[-1px_0_0_hsl(var(--border))]">
                  Luu
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={24}>
                    Chua co don hang trong thang nay.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => <FinanceRow entry={entry} key={entry.orderId} />)
              )}
            </TableBody>
          </Table>
        </FinanceTableScroller>
      </CardContent>
    </Card>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams ?? {});
  const data = await getFinanceData(resolvedSearchParams.month);
  const { summary } = data;

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-1">
          <h1 className="font-semibold text-2xl tracking-tight">Tai chinh ke toan</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MonthSelect basePath="/finance" months={data.availableMonths} selectedMonth={summary.month} />
          <Button asChild size="sm" variant="outline">
            <a href={`/finance/export?month=${summary.month}`}>
              <Download className="size-4" />
              Xuat bao cao
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="report" className="flex flex-col gap-4">
        <TabsList className="w-fit">
          <TabsTrigger value="report">Bao cao</TabsTrigger>
          <TabsTrigger value="accounting">Ke toan theo doi</TabsTrigger>
        </TabsList>

        <TabsContent value="report" className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              note={`${summary.totalOrders.toLocaleString("vi-VN")} don trong thang`}
              title="Tong can thu"
              value={formatVnd(summary.totalRevenueVnd)}
            />
            <KpiCard
              note={`Ty le thu ${formatNumber(summary.collectionRatePercent, 1)}%`}
              title="Da thu"
              tone="good"
              value={formatVnd(summary.totalCollectedVnd)}
            />
            <KpiCard
              note={`Qua han ${formatVnd(summary.overdueAmountVnd)}`}
              title="Cong no con lai"
              tone={summary.totalReceivableVnd > 0 ? "bad" : undefined}
              value={formatVnd(summary.totalReceivableVnd)}
            />
            <KpiCard
              note={`Chi phi ${formatVnd(summary.totalCostVnd)}`}
              title="Loi nhuan"
              tone={summary.grossProfitVnd >= 0 ? "good" : "bad"}
              value={formatVnd(summary.grossProfitVnd)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.6fr)]">
            <ReportTemplate summary={summary} />
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Doi soat nhanh</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Hoa don da xuat</span>
                  <span className="font-medium tabular-nums">{formatVnd(summary.invoiceAmountVnd)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Thue khach ung</span>
                  <span className="font-medium tabular-nums">{formatVnd(summary.taxAdvanceVnd)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Thue NK / GTGT</span>
                  <span className="font-medium tabular-nums">
                    {formatVnd(summary.importTaxVnd)} / {formatVnd(summary.vatVnd)}
                  </span>
                </div>
                <div className="rounded-md border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs">
                    <TrendingUp className="size-4" />
                    Loi nhuan phong kinh doanh
                  </div>
                  <div className="mt-1 font-semibold text-xl tabular-nums">{formatVnd(summary.businessProfitVnd)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
            <StaffCommissionTable rows={data.staffRows} />
            <Card>
              <CardHeader>
                <CardTitle className="font-normal">Luong du lieu</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex items-start gap-3">
                  <WalletCards className="mt-0.5 size-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Khi luu mot dong, he thong cap nhat chi phi, khoan thu, tong cong no va loi nhuan cua don hang.
                  </p>
                </div>
                <div className="rounded-md border p-3 text-muted-foreground text-xs">
                  Cot bao cao tuong ung CSV: Tong chi phi, Chi phi tinh cong no BHN, Tong so tien can thu, Da thu, Cong
                  no con lai, Doanh thu khac/chi phi khac, Loi nhuan.
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accounting">
          <FinanceEntryTable entries={data.entries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
