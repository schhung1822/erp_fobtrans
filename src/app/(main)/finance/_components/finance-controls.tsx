"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatThousands(value: string) {
  const digits = onlyDigits(value);
  if (!digits) return "";

  return new Intl.NumberFormat("vi-VN").format(Number(digits));
}

const collectionStatusOptions = [
  ["not_collected", "Chua thu"],
  ["partial", "Thu mot phan"],
  ["collected", "Da thu"],
  ["overdue", "Qua han"],
  ["bad_debt", "No xau"],
] as const;

export function CollectionStatusSelect({ formId, value }: { formId: string; value: string }) {
  const [selectedValue, setSelectedValue] = React.useState(value);

  return (
    <>
      <input form={formId} name="collectionStatus" type="hidden" value={selectedValue} />
      <Select value={selectedValue} onValueChange={setSelectedValue}>
        <SelectTrigger className="h-8 w-32 rounded-md bg-background px-2 text-xs" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start" position="popper">
          <SelectGroup>
            {collectionStatusOptions.map(([optionValue, label]) => (
              <SelectItem key={optionValue} value={optionValue}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </>
  );
}
export function FormattedMoneyInput({
  formId,
  name,
  value,
  className,
}: {
  formId: string;
  name: string;
  value: number;
  className?: string;
}) {
  const initialValue = value ? formatThousands(Math.round(Math.abs(value)).toString()) : "";
  const [displayValue, setDisplayValue] = React.useState(initialValue);

  return (
    <>
      <Input
        className={cn("h-8 w-32 text-right tabular-nums", className)}
        data-finance-cell="true"
        inputMode="numeric"
        onChange={(event) => setDisplayValue(formatThousands(event.target.value))}
        placeholder="0"
        value={displayValue}
      />
      <input form={formId} name={name} type="hidden" value={onlyDigits(displayValue)} />
    </>
  );
}

export function MonthSelect({
  basePath = "/dashboard/finance",
  months,
  selectedMonth,
}: {
  basePath?: string;
  months: string[];
  selectedMonth: string;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground text-sm">Thang bao cao</span>
      <Select onValueChange={(month) => router.push(`${basePath}?month=${month}`)} value={selectedMonth}>
        <SelectTrigger className="w-36" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {months.map((month) => (
              <SelectItem key={month} value={month}>
                {month}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}

type StaffCommissionRow = {
  staffName: string;
  totalOrders: number;
  totalRevenueVnd: number;
  totalReceivableVnd: number;
  grossProfitVnd: number;
};

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(value);
}

function parsePercent(value: string) {
  const parsed = Number(value.replace(/,/g, "."));
  if (!Number.isFinite(parsed)) return 0;

  return Math.min(Math.max(parsed, 0), 100);
}

function CommissionPercentInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="relative w-24">
      <Input
        className="h-8 pr-7 text-right tabular-nums"
        inputMode="decimal"
        max={100}
        min={0}
        onChange={(event) => onChange(parsePercent(event.target.value))}
        placeholder="0"
        type="number"
        value={value || ""}
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground text-xs">
        %
      </span>
    </div>
  );
}

export function StaffCommissionTable({ rows }: { rows: StaffCommissionRow[] }) {
  const [commissionRates, setCommissionRates] = React.useState<Record<string, number>>({});
  const totalCommission = rows.reduce((total, row) => {
    const rate = commissionRates[row.staffName] ?? 0;
    return total + Math.max(row.grossProfitVnd, 0) * (rate / 100);
  }, 0);

  return (
    <Card>
      <CardHeader className="flex w-[100%] items-center justify-between gap-3">
        <CardTitle className="font-normal">Thong ke theo nhan su phu trach</CardTitle>
        <div className="text-right text-muted-foreground text-xs">
          Tong hoa hong: <span className="font-medium text-foreground tabular-nums">{formatVnd(totalCommission)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/60">
              <TableRow>
                <TableHead>Nhan su</TableHead>
                <TableHead className="text-right">Don</TableHead>
                <TableHead className="text-right">Doanh thu</TableHead>
                <TableHead className="text-right">Cong no</TableHead>
                <TableHead className="text-right">Loi nhuan</TableHead>
                <TableHead className="text-right">% hoa hong</TableHead>
                <TableHead className="text-right">Thuong hoa hong</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell className="h-24 text-center text-muted-foreground" colSpan={7}>
                    Chua co du lieu trong thang nay.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const rate = commissionRates[row.staffName] ?? 0;
                  const commission = Math.max(row.grossProfitVnd, 0) * (rate / 100);

                  return (
                    <TableRow key={row.staffName}>
                      <TableCell className="min-w-44 font-medium">{row.staffName}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.totalOrders.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatVnd(row.totalRevenueVnd)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatVnd(row.totalReceivableVnd)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-medium tabular-nums",
                          row.grossProfitVnd < 0 ? "text-destructive" : "text-emerald-700",
                        )}
                      >
                        {formatVnd(row.grossProfitVnd)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <CommissionPercentInput
                            onChange={(value) =>
                              setCommissionRates((current) => ({ ...current, [row.staffName]: value }))
                            }
                            value={rate}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{formatVnd(commission)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
