"use client";
"use no memo";

import * as React from "react";

import {
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  Search,
  Settings2,
  TruckIcon,
  UserCogIcon,
  WalletCards,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { createOrdersColumns } from "./columns";
import { OrderFormSheet } from "./order-form";
import { collectionStatusLabels, operationStatusLabels } from "./order-options";
import type { CollectionStatus, OrderLookups, OrderRow, OrderStatus } from "./schema";

const operationOptions: Array<{ value: "all" | OrderStatus; label: string }> = [
  { value: "all", label: "Tat ca" },
  ...Object.entries(operationStatusLabels).map(([value, label]) => ({ value: value as OrderStatus, label })),
];

const collectionOptions: Array<{ value: "all" | CollectionStatus; label: string }> = [
  { value: "all", label: "Tat ca" },
  ...Object.entries(collectionStatusLabels).map(([value, label]) => ({ value: value as CollectionStatus, label })),
];

const sortOptions = [
  { value: "created-desc", label: "Ngày tạo mới nhất" },
  { value: "created-asc", label: "Ngày tạo cũ nhất" },
  { value: "delivery-desc", label: "Ngày giao mới nhất" },
  { value: "delivery-asc", label: "Ngày giao cũ nhất" },
  { value: "revenue-desc", label: "Doanh thu cao nhất" },
  { value: "debt-desc", label: "Công nợ cao nhất" },
] as const;

type OrdersView = "all" | "active" | "debt";

function getSortValue(sorting: SortingState) {
  const currentSort = sorting[0];

  if (!currentSort) return "created-desc";
  if (currentSort.id === "createdAt" && currentSort.desc) return "created-desc";
  if (currentSort.id === "createdAt" && !currentSort.desc) return "created-asc";
  if (currentSort.id === "deliveryDate" && currentSort.desc) return "delivery-desc";
  if (currentSort.id === "deliveryDate" && !currentSort.desc) return "delivery-asc";
  if (currentSort.id === "totalChargeVnd" && currentSort.desc) return "revenue-desc";
  if (currentSort.id === "remainingAmountVnd" && currentSort.desc) return "debt-desc";

  return "created-desc";
}

function getSortingFromValue(value: string): SortingState {
  switch (value) {
    case "created-asc":
      return [{ id: "createdAt", desc: false }];
    case "created-desc":
      return [{ id: "createdAt", desc: true }];
    case "delivery-asc":
      return [{ id: "deliveryDate", desc: false }];
    case "delivery-desc":
      return [{ id: "deliveryDate", desc: true }];
    case "revenue-desc":
      return [{ id: "totalChargeVnd", desc: true }];
    case "debt-desc":
      return [{ id: "remainingAmountVnd", desc: true }];
    default:
      return [{ id: "createdAt", desc: true }];
  }
}

export function OrdersTable({ data, lookups }: { data: OrderRow[]; lookups: OrderLookups }) {
  const [activeView, setActiveView] = React.useState<OrdersView>("all");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "createdAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    createdAt: false,
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const filteredData = React.useMemo(() => {
    if (activeView === "active") {
      return data.filter((order) => !["delivered", "cancelled"].includes(order.operationStatus));
    }

    if (activeView === "debt") {
      return data.filter((order) => order.remainingAmountVnd > 0);
    }

    return data;
  }, [activeView, data]);

  const activeCount = data.filter((order) => !["delivered", "cancelled"].includes(order.operationStatus)).length;
  const debtCount = data.filter((order) => order.remainingAmountVnd > 0).length;

  const table = useReactTable({
    data: filteredData,
    columns: createOrdersColumns(lookups),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const searchQuery = (table.getColumn("search")?.getFilterValue() as string) ?? "";
  const operationFilter = (table.getColumn("operationStatus")?.getFilterValue() as string) ?? "all";
  const collectionFilter = (table.getColumn("collectionStatus")?.getFilterValue() as string) ?? "all";
  const staffFilter = (table.getColumn("staffName")?.getFilterValue() as string) ?? "all";
  const sortValue = getSortValue(sorting);
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => {
        setActiveView(value as OrdersView);
        table.setPageIndex(0);
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">Tat ca</TabsTrigger>
            <TabsTrigger value="active">
              Đang xử lý <Badge variant="secondary">{activeCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="debt">
              Công nợ <Badge variant="secondary">{debtCount}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Tìm mã đơn, khách hàng, tracking..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <TruckIcon />
                Trạng thái
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuRadioGroup
                value={operationFilter}
                onValueChange={(value) => {
                  table.getColumn("operationStatus")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                {operationOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <WalletCards />
                Thu tiền
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-44" align="end">
              <DropdownMenuRadioGroup
                value={collectionFilter}
                onValueChange={(value) => {
                  table.getColumn("collectionStatus")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                {collectionOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCogIcon />
                NV phụ trách
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuRadioGroup
                value={staffFilter}
                onValueChange={(value) => {
                  table.getColumn("staffName")?.setFilterValue(value === "all" ? undefined : value);
                  table.setPageIndex(0);
                }}
              >
                <DropdownMenuRadioItem value="all">Tat ca</DropdownMenuRadioItem>
                {lookups.staff.map((staff) => (
                  <DropdownMenuRadioItem key={staff.id} value={staff.name}>
                    {staff.code ? `${staff.code} - ${staff.name}` : staff.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ArrowUpDown />
                Sắp xếp
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={sortValue}
                onValueChange={(value) => setSorting(getSortingFromValue(value))}
              >
                {sortOptions.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 data-icon="inline-start" />
                Kiểu xem
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel>Hiển thị cột</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <OrderFormSheet lookups={lookups} />
        </div>
      </div>

      <TabsContent value={activeView} className="relative flex flex-col gap-4 overflow-auto">
        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/60">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={table.getVisibleLeafColumns().length} className="h-28 text-center">
                    Chưa có đơn hàng phù hợp
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} đơn được chọn.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="orders-rows-per-page" className="font-medium text-sm">
                Dòng mỗi trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="orders-rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  <SelectGroup>
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center font-medium text-sm">
              Trang {Math.min(table.getState().pagination.pageIndex + 1, pageCount)} / {pageCount}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang đầu</span>
                <ChevronsLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Trang trước</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang sau</span>
                <ChevronRightIcon />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Trang cuối</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
