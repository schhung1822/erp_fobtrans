"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function focusInput(input: HTMLInputElement | null) {
  if (!input) return;

  input.focus();
  requestAnimationFrame(() => input.select());
}

function getFinanceInput(element: EventTarget | null) {
  if (!(element instanceof HTMLInputElement)) return null;
  return element.matches('input[data-finance-cell="true"]') ? element : null;
}

function getRowInputByCellIndex(row: HTMLTableRowElement | null, cellIndex: number) {
  if (!row) return null;

  return row.cells[cellIndex]?.querySelector<HTMLInputElement>('input[data-finance-cell="true"]') ?? null;
}

export function FinanceTableScroller({ children, className }: { children: React.ReactNode; className?: string }) {
  const bottomScrollRef = React.useRef<HTMLDivElement>(null);
  const tableScrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = React.useState(0);
  const isSyncingRef = React.useRef(false);

  React.useLayoutEffect(() => {
    const tableScroll = tableScrollRef.current;
    if (!tableScroll) return;

    function updateWidth() {
      setScrollWidth(tableScroll?.scrollWidth ?? 0);
    }

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(tableScroll);
    if (tableScroll.firstElementChild) resizeObserver.observe(tableScroll.firstElementChild);

    return () => resizeObserver.disconnect();
  }, []);

  function syncScroll(source: "bottom" | "table") {
    if (isSyncingRef.current) return;

    const bottomScroll = bottomScrollRef.current;
    const tableScroll = tableScrollRef.current;
    if (!bottomScroll || !tableScroll) return;

    isSyncingRef.current = true;
    if (source === "bottom") {
      tableScroll.scrollLeft = bottomScroll.scrollLeft;
    } else {
      bottomScroll.scrollLeft = tableScroll.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const input = getFinanceInput(event.target);
    if (!input || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;

    const row = input.closest("tr") as HTMLTableRowElement | null;
    const cell = input.closest("td") as HTMLTableCellElement | null;
    if (!row || !cell) return;

    event.preventDefault();

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      const inputs = Array.from(
        tableScrollRef.current?.querySelectorAll<HTMLInputElement>('input[data-finance-cell="true"]') ?? [],
      );
      const currentIndex = inputs.indexOf(input);
      const nextIndex = event.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1;
      focusInput(inputs[nextIndex] ?? null);
      return;
    }

    const nextRow = event.key === "ArrowUp" ? row.previousElementSibling : row.nextElementSibling;
    focusInput(getRowInputByCellIndex(nextRow as HTMLTableRowElement | null, cell.cellIndex));
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <section
        ref={tableScrollRef}
        aria-label="Bang ke toan theo doi"
        className="relative max-h-[72vh] overflow-y-auto overflow-x-hidden rounded-t-lg border border-b-0 [&_[data-slot=table-container]]:overflow-visible"
        onKeyDown={handleKeyDown}
        onScroll={() => syncScroll("table")}
      >
        {children}
      </section>
      <div
        ref={bottomScrollRef}
        className="sticky bottom-0 z-50 h-4 overflow-x-auto overflow-y-hidden rounded-b-lg border bg-muted/20"
        onScroll={() => syncScroll("bottom")}
      >
        <div style={{ height: 1, width: scrollWidth || "100%" }} />
      </div>
    </div>
  );
}
