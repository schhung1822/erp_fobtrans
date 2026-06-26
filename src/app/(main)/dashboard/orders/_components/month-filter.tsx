"use client";

import { useMemo, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const MONTH_LABELS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

function parseMonth(value: string) {
  if (!MONTH_PATTERN.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;
  return new Date(Date.UTC(year, month - 1, 1));
}

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthKeyFromParts(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
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

function buildHref(pathname: string, fromMonth: string, toMonth: string) {
  const params = new URLSearchParams({ fromMonth, toMonth });
  return `${pathname}?${params.toString()}`;
}

function normalizeToMonth(fromMonth: string, toMonth: string) {
  const from = parseMonth(fromMonth);
  const to = parseMonth(toMonth);

  if (!from || !to || to < from) return fromMonth;

  const maxTo = monthKey(addMonths(from, 11));
  return toMonth > maxTo ? maxTo : toMonth;
}

function normalizeRange(fromMonth: string, toMonth: string) {
  const from = parseMonth(fromMonth);
  const to = parseMonth(toMonth);

  if (!from || !to) return { fromMonth, toMonth: fromMonth };
  const nextFromMonth = to < from ? toMonth : fromMonth;
  const nextToMonth = to < from ? fromMonth : toMonth;

  return {
    fromMonth: nextFromMonth,
    toMonth: normalizeToMonth(nextFromMonth, nextToMonth),
  };
}

function isMonthInRange(value: string, fromMonth: string, toMonth: string) {
  return value >= fromMonth && value <= toMonth;
}

export function MonthFilter({
  currentMonth,
  fromMonth: initialFromMonth,
  toMonth: initialToMonth,
}: {
  currentMonth: string;
  fromMonth: string;
  toMonth: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [fromMonth, setFromMonth] = useState(initialFromMonth);
  const [toMonth, setToMonth] = useState(initialToMonth);
  const [draftFromMonth, setDraftFromMonth] = useState(initialFromMonth);
  const [draftToMonth, setDraftToMonth] = useState(initialToMonth);
  const [isSelectingEnd, setIsSelectingEnd] = useState(false);
  const [viewYear, setViewYear] = useState(
    () => parseMonth(initialFromMonth)?.getUTCFullYear() ?? new Date().getFullYear(),
  );

  const currentDate = parseMonth(currentMonth) ?? new Date();
  const previousMonth = monthKey(addMonths(currentDate, -1));
  const last3Months = monthKey(addMonths(currentDate, -2));
  const last6Months = monthKey(addMonths(currentDate, -5));
  const yearStart = monthKey(new Date(Date.UTC(currentDate.getUTCFullYear(), 0, 1)));
  const yearEnd = monthKey(new Date(Date.UTC(currentDate.getUTCFullYear(), 11, 1)));
  const quickRanges = useMemo(
    () => [
      { label: "Tháng nay", fromMonth: currentMonth, toMonth: currentMonth },
      { label: "Tháng truoc", fromMonth: previousMonth, toMonth: previousMonth },
      { label: "3 tháng gần đây", fromMonth: last3Months, toMonth: currentMonth },
      { label: "6 tháng gần đây", fromMonth: last6Months, toMonth: currentMonth },
      { label: "Năm nay", fromMonth: yearStart, toMonth: yearEnd },
    ],
    [currentMonth, last3Months, last6Months, previousMonth, yearEnd, yearStart],
  );

  function applyRange(nextFromMonth: string, nextToMonth: string) {
    const range = normalizeRange(nextFromMonth, nextToMonth);
    setFromMonth(range.fromMonth);
    setToMonth(range.toMonth);
    setDraftFromMonth(range.fromMonth);
    setDraftToMonth(range.toMonth);
    setIsSelectingEnd(false);
    router.push(buildHref(pathname, range.fromMonth, range.toMonth));
  }

  function openPicker(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftFromMonth(fromMonth);
      setDraftToMonth(toMonth);
      setIsSelectingEnd(false);
      setViewYear(parseMonth(fromMonth)?.getUTCFullYear() ?? currentDate.getUTCFullYear());
    }
  }

  function chooseMonth(value: string) {
    if (!isSelectingEnd) {
      setDraftFromMonth(value);
      setDraftToMonth(value);
      setIsSelectingEnd(true);
      return;
    }

    const range = normalizeRange(draftFromMonth, value);
    setDraftFromMonth(range.fromMonth);
    setDraftToMonth(range.toMonth);
    setIsSelectingEnd(false);
  }

  function applyQuickRange(nextFromMonth: string, nextToMonth: string) {
    applyRange(nextFromMonth, nextToMonth);
    setOpen(false);
  }

  const rangeLabel = `${formatMonthLabel(fromMonth)} - ${formatMonthLabel(toMonth)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={openPicker}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="min-w-52 justify-start gap-2">
            <CalendarRangeIcon />
            <span className="truncate">{rangeLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[min(calc(100vw-2rem),42rem)] gap-0 overflow-hidden p-0">
          <div className="grid md:grid-cols-[10rem_1fr]">
            <div className="border-b bg-muted/30 p-2 md:border-r md:border-b-0">
              <div className="grid gap-1">
                {quickRanges.map((range) => (
                  <Button
                    key={range.label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyQuickRange(range.fromMonth, range.toMonth)}
                  >
                    {range.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-3">
              <div className="grid gap-2 rounded-lg border bg-background p-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="min-w-0">
                  <div className="text-muted-foreground text-xs">Tháng bắt đầu</div>
                  <div className="truncate font-medium text-sm">{formatMonthLabel(draftFromMonth)}</div>
                </div>
                <span className="hidden text-muted-foreground text-xs sm:block">-</span>
                <div className="min-w-0 sm:text-right">
                  <div className="text-muted-foreground text-xs">Tháng kết thúc</div>
                  <div className="truncate font-medium text-sm">{formatMonthLabel(draftToMonth)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Nam truoc"
                  onClick={() => setViewYear((year) => year - 1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <div className="font-semibold text-sm">Năm {viewYear}</div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Nam sau"
                  onClick={() => setViewYear((year) => year + 1)}
                >
                  <ChevronRightIcon />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {MONTH_LABELS.map((label, index) => {
                  const value = monthKeyFromParts(viewYear, index);
                  const isStart = value === draftFromMonth;
                  const isEnd = value === draftToMonth;
                  const isSelected = isStart || isEnd;
                  const isInRange = isMonthInRange(value, draftFromMonth, draftToMonth);
                  const isCurrent = value === currentMonth;

                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-10 justify-center rounded-md font-normal",
                        isInRange && !isSelected && "bg-primary/10 text-primary hover:bg-primary/15",
                        isCurrent && !isSelected && "ring-1 ring-primary/40",
                      )}
                      onClick={() => chooseMonth(value)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyQuickRange(currentMonth, currentMonth)}
                >
                  <RotateCcwIcon />
                  Đặt lại
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Đóng
                  </Button>
                  <Button type="button" size="sm" onClick={() => applyQuickRange(draftFromMonth, draftToMonth)}>
                    Áp dụng
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
