import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

import type { StaffOrderReportRow } from "./data";

function formatVnd(value: number) {
  return formatCurrency(value, {
    currency: "VND",
    locale: "vi-VN",
    noDecimals: true,
  });
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", { month: "2-digit", timeZone: "UTC", year: "numeric" }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
}

function ConversionProgress({ value }: { value: number }) {
  const percent = Math.min(Math.max(value * 100, 0), 100);

  return (
    <div className="ml-auto grid w-36 gap-1.5">
      <div className="text-right font-medium text-xs tabular-nums">{formatPercent(value)}</div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

export function SubscriberOverview({
  data,
  fromMonth,
  toMonth,
}: {
  data: StaffOrderReportRow[];
  fromMonth: string;
  toMonth: string;
}) {
  const totalOrders = data.reduce((sum, row) => sum + row.orderCount, 0);
  const rangeLabel =
    fromMonth === toMonth ? formatMonthLabel(fromMonth) : `${formatMonthLabel(fromMonth)} - ${formatMonthLabel(toMonth)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">Báo cáo đơn hàng theo nhân sự phụ trách</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" disabled title="Xuat file se duoc bo sung sau">
            <DownloadIcon />
            Xuất
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-11">NV phụ trách</TableHead>
                <TableHead className="h-11 text-right">Lead nhận</TableHead>
                <TableHead className="h-11 text-right">Số đơn hàng</TableHead>
                <TableHead className="h-11 text-right">Tỷ lệ chuyển đổi</TableHead>
                <TableHead className="h-11 text-right">Doanh thu đối soát</TableHead>
                <TableHead className="h-11 text-right">Đã thu</TableHead>
                <TableHead className="h-11 text-right">Còn phải thu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length ? (
                data.map((row) => (
                  <TableRow key={row.staffId}>
                    <TableCell>
                      <div className="grid gap-0.5">
                        <span className="font-medium">{row.staffName}</span>
                        <span className="text-muted-foreground text-xs">{row.staffCode ?? "Chua co ma nhan su"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.leadCount.toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.orderCount.toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-right">
                      <ConversionProgress value={row.conversionRate} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(row.revenueVnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(row.paidAmountVnd)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatVnd(row.remainingAmountVnd)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    Chưa có dữ liệu trong kỳ đã chọn
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
