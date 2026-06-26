"use client";

import { PencilIcon, PlusIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { createWarehouse, deleteWarehouse, updateWarehouse } from "./actions";
import type { OperationWarehouseRow } from "./schema";

function TextField({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} />
    </div>
  );
}

function ActiveSelect({ defaultValue = true }: { defaultValue?: boolean }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="isActive">Trang thai</Label>
      <Select name="isActive" defaultValue={defaultValue ? "1" : "0"}>
        <SelectTrigger id="isActive" className="h-9 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Dang hoat dong</SelectItem>
          <SelectItem value="0">Tam dung</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function WarehouseFormDialog({
  warehouse,
  triggerLabel,
  triggerVariant,
}: {
  warehouse?: OperationWarehouseRow;
  triggerLabel?: string;
  triggerVariant?: "button" | "link";
}) {
  const isEditing = Boolean(warehouse);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerVariant === "link" ? (
          <Button variant="link" className="h-auto min-w-0 justify-start p-0 text-left font-medium text-foreground">
            <span className="truncate">{triggerLabel ?? warehouse?.name ?? "Sua kho"}</span>
          </Button>
        ) : isEditing ? (
          <Button variant="ghost" className="w-full justify-start px-2" size="sm">
            <PencilIcon />
            {triggerLabel ?? "Sua kho"}
          </Button>
        ) : (
          <Button size="sm">
            <PlusIcon />
            Them kho
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[min(640px,90vh)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Cap nhat kho" : "Them kho"}</DialogTitle>
        </DialogHeader>

        <form action={isEditing ? updateWarehouse : createWarehouse} className="grid gap-5">
          <input type="hidden" name="warehouseId" value={warehouse?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Ma kho" name="code" defaultValue={warehouse?.code} placeholder="Tu tao neu de trong" />
            <ActiveSelect defaultValue={warehouse?.isActive ?? true} />
            <div className="md:col-span-2">
              <TextField label="Ten kho" name="name" defaultValue={warehouse?.name} required />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="address">Dia chi kho</Label>
              <Textarea id="address" name="address" defaultValue={warehouse?.address ?? ""} rows={3} />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                <XIcon />
                Huy
              </Button>
            </DialogClose>
            <Button type="submit">
              <SaveIcon />
              {isEditing ? "Luu thay doi" : "Them kho"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteWarehouseDialog({ warehouse }: { warehouse: OperationWarehouseRow }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start px-2 text-destructive" size="sm">
          <Trash2Icon />
          Xoa kho
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xoa kho?</AlertDialogTitle>
          <AlertDialogDescription>
            Kho "{warehouse.name}" se bi xoa neu chua co rang buoc don hang trong he thong.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Huy</AlertDialogCancel>
          <form action={deleteWarehouse}>
            <input type="hidden" name="warehouseId" value={warehouse.id} />
            <AlertDialogAction type="submit" variant="destructive">
              Xoa
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
