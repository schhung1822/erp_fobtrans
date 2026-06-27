import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { AnalyticsStaffRow } from "./data";

function formatCompactVnd(value: number) {
  return `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value)} d`;
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(value);
}

export function TopPages({ rows }: { rows: AnalyticsStaffRow[] }) {
  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Hiệu suất nhân sự phụ trách</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        <Table className="[&_td:first-child]:pl-4 [&_td:last-child]:pr-4 [&_th:first-child]:pl-4 [&_th:last-child]:pr-4">
          <TableHeader className="[&_tr]:border-border/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 font-normal">Nhân sự</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Lead</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">Don</TableHead>
              <TableHead className="h-8 w-24 text-right font-normal">Don lead</TableHead>
              <TableHead className="h-8 w-20 text-right font-normal">CVR</TableHead>
              <TableHead className="h-8 w-28 text-right font-normal">Doanh thu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:border-border/50">
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow className="hover:bg-transparent" key={row.staffId}>
                  <TableCell className="max-w-0 truncate py-4 font-medium">
                    {row.staffName}
                    {row.staffCode ? <span className="ml-2 text-muted-foreground text-xs">{row.staffCode}</span> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.leads}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.orders}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.leadOrders}</TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatPercent(row.conversionRate)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatCompactVnd(row.revenueVnd)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-36 text-center text-muted-foreground">
                  Chưa có dữ liệu nhân sự trong kỳ này
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
