"use client";
"use no memo";

import * as React from "react";

import { useRouter } from "next/navigation";

import {
  type ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type PaginationState,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Download, Grid, Plus, Rows3, Search } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { deleteUser } from "./actions";
import { filters, type UserRow, type UsersLookups } from "./data";
import { UserPanel } from "./user-panel";
import { getUsersColumns } from "./users-columns";
import { UsersTable } from "./users-table";

export function Users({ users, lookups }: { users: UserRow[]; lookups: UsersLookups }) {
  const router = useRouter();
  const [isDeletePending, startDeleteTransition] = React.useTransition();
  const [rowSelection, setRowSelection] = React.useState({});
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "joinedDate", desc: true }]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({
    search: false,
    team: false,
  });
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedUser, setSelectedUser] = React.useState<UserRow | null>(null);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<UserRow | null>(null);

  const filterOptions = React.useMemo(() => {
    const mergeOptions = (base: string[], values: string[]) => ["All", ...Array.from(new Set([...base.filter((item) => item !== "All"), ...values.filter(Boolean)]))];

    return {
      role: mergeOptions(filters.role, users.map((user) => user.role)),
      team: mergeOptions(filters.team, users.map((user) => user.team)),
      status: mergeOptions(filters.status, users.map((user) => user.status)),
      workspace: mergeOptions(filters.workspace, users.flatMap((user) => user.workspace)),
    };
  }, [users]);

  const columns = React.useMemo(
    () =>
      getUsersColumns({ onOpenUser: (user) => { setSelectedUser(user); setPanelOpen(true); }, onDeleteUser: setDeleteTarget }),
    [],
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      rowSelection,
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
    getRowId: (row) => row.id,
    autoResetPageIndex: false,
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
  const roleFilter = (table.getColumn("role")?.getFilterValue() as string) ?? filterOptions.role[0];
  const teamFilter = (table.getColumn("team")?.getFilterValue() as string) ?? filterOptions.team[0];
  const statusFilter = (table.getColumn("status")?.getFilterValue() as string) ?? filterOptions.status[0];
  const workspaceFilter = (table.getColumn("workspace")?.getFilterValue() as string) ?? filterOptions.workspace[0];
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  function setColumnSelectFilter(columnId: string, value: string) {
    table.getColumn(columnId)?.setFilterValue(value === "All" ? undefined : value);
    table.setPageIndex(0);
  }

  function handleDeleteUser() {
    if (!deleteTarget) return;

    const formData = new FormData();
    formData.set("userId", deleteTarget.id);
    formData.set("staffId", deleteTarget.staffId ?? "");

    startDeleteTransition(async () => {
      try {
        await deleteUser(formData);
        toast.success("Da xoa nhan su.");
        setDeleteTarget(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Khong the xoa nhan su.");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
        <CardTitle className="text-xl leading-none">Nhan su</CardTitle>
        <CardDescription className="max-w-[400px] leading-snug">
          Quan ly cac thanh vien trong to chuc va quyen truy cap cua ho
        </CardDescription>
        <CardAction className="col-start-1 row-start-auto flex w-full flex-wrap justify-start gap-2 justify-self-stretch md:col-start-2 md:row-span-2 md:row-start-1 md:w-auto md:flex-nowrap md:justify-end md:justify-self-end">
          <InputGroup className="h-7 w-full md:w-64">
            <InputGroupAddon align="inline-start">
              <Search className="size-3.5" />
            </InputGroupAddon>
            <InputGroupInput
              className="h-7"
              placeholder="Tim nhan su..."
              value={searchQuery}
              onChange={(event) => {
                table.getColumn("search")?.setFilterValue(event.target.value || undefined);
                table.setPageIndex(0);
              }}
            />
            <InputGroupAddon align="inline-end">
              <Kbd className="h-4 text-[10px]">search</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <Button variant="outline" size="sm">
            <Download /> Xuat
          </Button>
          <Button size="sm" onClick={() => { setSelectedUser(null); setPanelOpen(true); }}><Plus /> Them nhan su</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 px-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={roleFilter} onValueChange={(value) => setColumnSelectFilter("role", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Vai tro:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filterOptions.role.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={(value) => setColumnSelectFilter("team", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Nhom:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filterOptions.team.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value) => setColumnSelectFilter("status", value)}>
              <SelectTrigger size="sm">
                <span className="text-muted-foreground">Trang thai:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                <SelectGroup>
                  {filterOptions.status.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <Select value={workspaceFilter} onValueChange={(value) => setColumnSelectFilter("workspace", value)}>
            <SelectTrigger size="sm">
              <span className="text-muted-foreground">Workspace:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper" align="end">
              <SelectGroup>
                {filterOptions.workspace.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 px-4">
          <div className="text-muted-foreground text-sm tabular-nums">{selectedCount} da chon</div>

          <Tabs defaultValue="list">
            <TabsList>
              <TabsTrigger value="list" aria-label="List view">
                <Rows3 />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <Grid />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <UsersTable table={table} />
        <UserPanel user={selectedUser} lookups={lookups} open={panelOpen} onOpenChange={setPanelOpen} />
      </CardContent>
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoa nhan su?</AlertDialogTitle>
            <AlertDialogDescription>
              Tai khoan "{deleteTarget?.username}" se bi xoa. Ho so nhan su se bi xoa neu chua co rang buoc du lieu, neu khong se chuyen sang inactive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Huy</AlertDialogCancel>
            <AlertDialogAction type="button" variant="destructive" disabled={isDeletePending} onClick={handleDeleteUser}>
              Xoa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
