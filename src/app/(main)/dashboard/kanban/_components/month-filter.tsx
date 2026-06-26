"use client";

import { useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import { CalendarRangeIcon, ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_PATTERN = /^\d{4}-\d{2}$/;
const MONTH_LABELS = [
  "Thang 1",
  "Thang 2",
  "Thang 3",
  "Thang 4",
  "Thang 5",
  "Thang 6",
  "Thang 7",
  "Thang 8",
  "Thang 9",
  "Thang 10",
  "Thang 11",
  "Thang 12",
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

export function KanbanMonthFilter({ currentMonth, selectedMonth }: { currentMonth: string; selectedMonth: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const selectedDate = parseMonth(selectedMonth) ?? parseMonth(currentMonth) ?? new Date();
  const currentDate = parseMonth(currentMonth) ?? new Date();
  const [open, setOpen] = useState(false);
  const [draftMonth, setDraftMonth] = useState(selectedMonth);
  const [viewYear, setViewYear] = useState(() => selectedDate.getUTCFullYear());

  const quickMonths = [
    { label: "Thang nay", value: currentMonth },
    { label: "Thang truoc", value: monthKey(addMonths(currentDate, -1)) },
    { label: "Thang sau", value: monthKey(addMonths(currentDate, 1)) },
  ];

  function pushMonth(month: string) {
    router.push(`${pathname}?month=${month}`);
  }

  function applyMonth(month: string) {
    setDraftMonth(month);
    pushMonth(month);
  }

  function openPicker(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setDraftMonth(selectedMonth);
      setViewYear(selectedDate.getUTCFullYear());
    }
  }

  function applyQuickMonth(month: string) {
    applyMonth(month);
    setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover open={open} onOpenChange={openPicker}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="min-w-44 justify-start gap-2">
            <CalendarRangeIcon />
            <span className="truncate">{formatMonthLabel(selectedMonth)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(calc(100vw-2rem),42rem)] gap-0 overflow-hidden p-0">
          <div className="grid md:grid-cols-[10rem_1fr]">
            <div className="border-b bg-muted/30 p-2 md:border-r md:border-b-0">
              <div className="grid gap-1">
                {quickMonths.map((month) => (
                  <Button
                    key={month.label}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="justify-start font-normal"
                    onClick={() => applyQuickMonth(month.value)}
                  >
                    {month.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 p-3">
              <div className="grid gap-1 rounded-lg border bg-background p-2">
                <div className="text-muted-foreground text-xs">Thang dang xem</div>
                <div className="truncate font-medium text-sm">{formatMonthLabel(draftMonth)}</div>
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
                <div className="font-semibold text-sm">Nam {viewYear}</div>
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
                  const isSelected = value === draftMonth;
                  const isCurrent = value === currentMonth;

                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={isSelected ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-10 justify-center rounded-md font-normal",
                        isCurrent && !isSelected && "ring-1 ring-primary/40",
                      )}
                      onClick={() => setDraftMonth(value)}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 border-t pt-3">
                <Button type="button" variant="ghost" size="sm" onClick={() => applyQuickMonth(currentMonth)}>
                  <RotateCcwIcon />
                  Reset
                </Button>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
                    Dong
                  </Button>
                  <Button type="button" size="sm" onClick={() => applyQuickMonth(draftMonth)}>
                    Ap dung
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
