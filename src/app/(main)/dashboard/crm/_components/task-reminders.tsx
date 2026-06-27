import { AlertTriangle, CheckCircle2, Info, UsersRound } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

import type { CrmAlert, CrmStaffReport } from "./data";

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

function AlertIcon({ tone }: { tone: CrmAlert["tone"] }) {
  if (tone === "warning") return <AlertTriangle className="size-4" />;
  if (tone === "success") return <CheckCircle2 className="size-4" />;
  return <Info className="size-4" />;
}

export function TaskReminders({ alerts, staffReports }: { alerts: CrmAlert[]; staffReports: CrmStaffReport[] }) {
  return (
    <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-4">
        <CardHeader>
          <CardTitle>Cảnh báo chăm sóc lead</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 rounded-lg border p-3">
              <span
                className={cn(
                  "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border",
                  alert.tone === "warning" && "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  alert.tone === "info" && "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                  alert.tone === "success" &&
                    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                )}
              >
                <AlertIcon tone={alert.tone} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-sm">{alert.title}</div>
                  <div className="font-semibold tabular-nums">{alert.count.toLocaleString("vi-VN")}</div>
                </div>
                <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{alert.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="xl:col-span-8">
        <CardHeader>
          <CardTitle>Hiệu suất nhân sự phụ trách</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-11">Nhân sự</TableHead>
                  <TableHead className="h-11 text-right">Lead</TableHead>
                  <TableHead className="h-11 text-right">Tiềm năng</TableHead>
                  <TableHead className="h-11 text-right">Đơn theo lead</TableHead>
                  <TableHead className="h-11 text-right">Chuyển đổi</TableHead>
                  <TableHead className="h-11 text-right">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffReports.length ? (
                  staffReports.map((row) => (
                    <TableRow key={row.staffId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-md border bg-muted">
                            <UsersRound className="size-4 text-muted-foreground" />
                          </span>
                          <div className="grid gap-0.5">
                            <span className="font-medium">{row.staffName}</span>
                            <span className="text-muted-foreground text-xs">
                              {row.staffCode ?? "Chưa có mã nhân sự"}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.leadCount.toLocaleString("vi-VN")}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.potentialLeadCount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.leadOrderCount.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="ml-auto grid w-28 gap-1.5">
                          <div className="text-right font-medium text-xs tabular-nums">
                            {formatPercent(row.conversionRate)}
                          </div>
                          <Progress value={Math.min(row.conversionRate * 100, 100)} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVnd(row.revenueVnd)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Chưa có dữ liệu nhân sự phụ trách
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
