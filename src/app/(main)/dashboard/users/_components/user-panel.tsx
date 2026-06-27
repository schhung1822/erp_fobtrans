"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { SaveIcon, Trash2Icon, UserPlusIcon } from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { createUser, deleteUser, updateUser } from "./actions";
import type { UserRow, UsersLookups } from "./data";

function TextField({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
    </Field>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Field className="gap-1.5">
      <FieldLabel>{label}</FieldLabel>
      <Select name={name} defaultValue={defaultValue ?? "none"}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </Field>
  );
}

export function UserPanel({
  user,
  lookups,
  open,
  onOpenChange,
}: {
  user: UserRow | null;
  lookups: UsersLookups;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [isActive, setIsActive] = React.useState(user?.isActive ?? true);
  const isEditing = Boolean(user);

  React.useEffect(() => {
    setIsActive(user?.isActive ?? true);
  }, [user]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("isActive", isActive ? "on" : "off");

    startTransition(async () => {
      try {
        await (isEditing ? updateUser(formData) : createUser(formData));
        toast.success(isEditing ? "Đã cập nhật nhân sự." : "Đã thêm nhân sự.");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể lưu nhân sự.");
      }
    });
  }

  function handleDelete() {
    if (!user) return;

    const formData = new FormData();
    formData.set("userId", user.id);
    formData.set("staffId", user.staffId ?? "");

    startTransition(async () => {
      try {
        await deleteUser(formData);
        toast.success("Đã xóa nhân sự.");
        setDeleteOpen(false);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể xóa nhân sự.");
      }
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[min(92vw,460px)] overflow-y-auto sm:max-w-none">
          <SheetHeader className="border-b">
            <SheetTitle>{isEditing ? user?.name : "Thêm nhân sự"}</SheetTitle>
            <SheetDescription>
              {isEditing ? "Xem và chỉnh sửa thông tin tài khoản nhân sự." : "Tạo tài khoản và hồ sơ nhân sự mới."}
            </SheetDescription>
          </SheetHeader>

          <form key={user?.id ?? "new-user"} onSubmit={handleSubmit} className="grid gap-5 px-4">
            <input type="hidden" name="userId" value={user?.id ?? ""} />
            <input type="hidden" name="staffId" value={user?.staffId ?? ""} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField label="Họ tên" name="name" defaultValue={user?.name} required />
              </div>
              <TextField label="Tên đăng nhập" name="username" defaultValue={user?.username} required />
              <TextField
                label="Email"
                name="email"
                type="email"
                defaultValue={user?.email}
                placeholder="name@company.com"
              />
              {!isEditing ? (
                <TextField
                  label="Mã nhân sự"
                  name="staffCode"
                  defaultValue={user?.username?.toUpperCase()}
                  placeholder="Tự lấy theo tên đăng nhập"
                />
              ) : null}
              <TextField label="Số điện thoại" name="phone" defaultValue={user?.phone} placeholder="090..." />
              <TextField
                label="Chức danh"
                name="roleTitle"
                defaultValue={user?.roleTitle}
                placeholder="Kế toán, vận hành..."
              />
              <TextField
                label={isEditing ? "Mật khẩu mới" : "Mật khẩu"}
                name="password"
                type="password"
                placeholder={isEditing ? "Để trống nếu không đổi" : "Tùy chọn"}
              />
              <SelectField label="Vai trò" name="roleId" defaultValue={user?.roleId}>
                <SelectItem value="none">Chưa gán quyền</SelectItem>
                {lookups.roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name} ({role.code})
                  </SelectItem>
                ))}
              </SelectField>
              <SelectField label="Phòng ban" name="departmentId" defaultValue={user?.departmentId}>
                <SelectItem value="none">Chưa gán phòng ban</SelectItem>
                {lookups.departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectField>
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 sm:col-span-2">
                <div className="grid gap-0.5">
                  <div className="font-medium text-sm">Tài khoản đang hoạt động</div>
                  <div className="text-muted-foreground text-xs">
                    Tắt để vô hiệu hóa đăng nhập và chuyển sang trạng thái không hoạt động.
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <Field className="gap-1.5 sm:col-span-2">
                <FieldLabel htmlFor="note">Ghi chú</FieldLabel>
                <Textarea id="note" name="note" defaultValue={user?.note ?? ""} rows={4} />
              </Field>
            </div>

            <SheetFooter className="-mx-4 border-t bg-muted/30">
              <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="destructive"
                  className={!isEditing ? "invisible" : undefined}
                  onClick={() => setDeleteOpen(true)}
                  disabled={!isEditing || isPending}
                >
                  <Trash2Icon />
                  Xóa
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isEditing ? <SaveIcon /> : <UserPlusIcon />}
                  {isPending ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Thêm nhân sự"}
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa nhân sự?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản "{user?.username}" sẽ bị xóa. Hồ sơ nhân sự sẽ bị xóa nếu chưa có ràng buộc dữ liệu; nếu không,
              tài khoản sẽ chuyển sang trạng thái không hoạt động.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
