import { DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function ConversionProgress({ value }: { value: number }) {
  const percent = Math.min(Math.max(value * 100, 0), 100);

  return (
    <div className="ml-auto grid w-36 gap-1.5">
      <div className="text-right font-medium text-xs tabular-nums">{formatPercent(value)}</div>
      <Progress value={percent} className="h-2" />
    </div>
  );
}

export function SubscriberOverview({ data }: { data: StaffOrderReportRow[]; fromMonth: string; toMonth: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="leading-none">Báo cáo đơn hàng theo nhân sự phụ trách</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" disabled title="Xuất file sẽ được bổ sung sau">
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
                <TableHead className="h-11 text-right">Tổng đơn hàng</TableHead>
                <TableHead className="h-11 text-right">Đơn theo lead</TableHead>
                <TableHead className="h-11 text-right">Đơn khách cũ</TableHead>
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
                        <span className="text-muted-foreground text-xs">{row.staffCode ?? "Chưa có mã nhân sự"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.leadCount.toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.orderCount.toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.leadOrderCount.toLocaleString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.oldCustomerOrderCount.toLocaleString("vi-VN")}
                    </TableCell>
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
                  <TableCell colSpan={9} className="h-24 text-center">
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
