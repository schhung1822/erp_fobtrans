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
} from "lucide-react";

import type { OrderLookups } from "@/app/(main)/dashboard/orders/_components/schema";
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

import { ContactFormDialog } from "./contact-form";
import { getContactsColumns } from "./columns";
import type { ContactRow } from "./schema";

const sortOptions = [
  { value: "updated-desc", label: "Mới cập nhật" },
  { value: "name-asc", label: "Tên A-Z" },
  { value: "customer-asc", label: "Khách hàng A-Z" },
  { value: "status-asc", label: "Trạng thái lead" },
] as const;

type ContactsView = "all" | "linked" | "hasOrders" | "noOrders" | "phone";

function getSortValue(sorting: SortingState) {
  const currentSort = sorting[0];

  if (!currentSort) return "updated-desc";
  if (currentSort.id === "updatedAt" && currentSort.desc) return "updated-desc";
  if (currentSort.id === "name" && !currentSort.desc) return "name-asc";
  if (currentSort.id === "customerName" && !currentSort.desc) return "customer-asc";
  if (currentSort.id === "leadStatus" && !currentSort.desc) return "status-asc";

  return "updated-desc";
}

function getSortingFromValue(value: string): SortingState {
  switch (value) {
    case "name-asc":
      return [{ id: "name", desc: false }];
    case "customer-asc":
      return [{ id: "customerName", desc: false }];
    case "status-asc":
      return [{ id: "leadStatus", desc: false }];
    default:
      return [{ id: "updatedAt", desc: true }];
  }
}

export function ContactsTable({
  data,
  orderLookups,
}: {
  data: ContactRow[];
  orderLookups: OrderLookups;
}) {
  const [activeView, setActiveView] = React.useState<ContactsView>("all");
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "updatedAt", desc: true }]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = React.useMemo(() => getContactsColumns(orderLookups), [orderLookups]);
  const filteredData = React.useMemo(() => {
    if (activeView === "linked") return data.filter((contact) => contact.customerId);
    if (activeView === "hasOrders") return data.filter((contact) => contact.orderStats.orderCount > 0);
    if (activeView === "noOrders") return data.filter((contact) => contact.orderStats.orderCount === 0);
    if (activeView === "phone") return data.filter((contact) => contact.phone);
    return data;
  }, [activeView, data]);

  const linkedCount = data.filter((contact) => contact.customerId).length;
  const hasOrdersCount = data.filter((contact) => contact.orderStats.orderCount > 0).length;
  const noOrdersCount = data.filter((contact) => contact.orderStats.orderCount === 0).length;
  const phoneCount = data.filter((contact) => contact.phone).length;

  const table = useReactTable({
    data: filteredData,
    columns,
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
  const sortValue = getSortValue(sorting);
  const pageCount = Math.max(table.getPageCount(), 1);

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => {
        setActiveView(value as ContactsView);
        table.setPageIndex(0);
      }}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-muted-foreground/30 **:data-[slot=badge]:px-1">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="linked">
              Gần KH <Badge variant="secondary">{linkedCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="hasOrders">
              Có đơn <Badge variant="secondary">{hasOrdersCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="noOrders">
              Chưa đơn <Badge variant="secondary">{noOrdersCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="phone">
              Có SDT <Badge variant="secondary">{phoneCount}</Badge>
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-[min(var(--radius-md),12px)] pl-8"
              placeholder="Tim ten, trang thai, khach hang, SDT..."
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

          <ContactFormDialog staffOptions={orderLookups.staff} />
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
                    Chưa có lead phù hợp
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="hidden flex-1 text-muted-foreground text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} / {table.getFilteredRowModel().rows.length} lead duoc
            chon.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="contacts-rows-per-page" className="font-medium text-sm">
                Dòng mỗi trang
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger size="sm" className="w-20" id="contacts-rows-per-page">
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
                <span className="sr-only">Trang dau</span>
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
                <span className="sr-only">Trang cuôi</span>
                <ChevronsRightIcon />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
