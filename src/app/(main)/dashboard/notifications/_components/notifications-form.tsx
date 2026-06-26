"use client";

import { useState, useTransition } from "react";

import { BellRingIcon, SendIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { saveNotificationSettings, sendTestNotification } from "./actions";
import type { NotificationSettings } from "./notification-settings";
const templateVariables = [
  {
    token: "order_code",
    scope: "Don hang",
    label: "Ma don hang",
    description: "Ma he thong tao cho don moi, vi du FOB-A1B2C.",
  },
  {
    token: "customer_name",
    scope: "Don hang / Lien he",
    label: "Ten khach hang",
    description: "Ten nguoi gui cua don hang hoac ten khach hang gan voi lien he.",
  },
  {
    token: "phone",
    scope: "Don hang / Lien he",
    label: "So dien thoai",
    description: "So dien thoai nguoi gui trong don hang hoac so dien thoai cua lien he.",
  },
  {
    token: "receiver_name",
    scope: "Don hang",
    label: "Nguoi nhan",
    description: "Ten nguoi nhan hang trong don moi.",
  },
  {
    token: "total_charge_vnd",
    scope: "Don hang",
    label: "Tong tien",
    description: "Gia tri thanh tien cua don hang, tu dong dinh dang theo tien VND.",
  },
  {
    token: "contact_name",
    scope: "Lien he",
    label: "Ten lien he",
    description: "Ten nguoi lien he moi vua duoc tao.",
  },
  {
    token: "title",
    scope: "Lien he",
    label: "Chuc danh",
    description: "Vai tro cua lien he nhu ke toan, mua hang, van hanh.",
  },
  {
    token: "email",
    scope: "Lien he",
    label: "Email",
    description: "Dia chi email cua lien he moi neu co nhap.",
  },
  {
    token: "note",
    scope: "Don hang / Lien he",
    label: "Ghi chu",
    description: "Ghi chu noi bo tu form tao don hang hoac tao lien he.",
  },
];

function hiddenBoolean(name: string, checked: boolean) {
  return <input type="hidden" name={name} value={checked ? "on" : "off"} />;
}

function SettingSwitch({
  checked,
  label,
  note,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  note: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-md border p-3">
      <div className="grid gap-1">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-muted-foreground text-xs">{note}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function NotificationsForm({ settings }: { settings: NotificationSettings }) {
  const [larkEnabled, setLarkEnabled] = useState(settings.larkEnabled);
  const [telegramEnabled, setTelegramEnabled] = useState(settings.telegramEnabled);
  const [orderEnabled, setOrderEnabled] = useState(settings.orderEnabled);
  const [contactEnabled, setContactEnabled] = useState(settings.contactEnabled);
  const [isSaving, startSaving] = useTransition();
  const [isTesting, startTesting] = useTransition();

  function handleSubmit(formData: FormData) {
    startSaving(async () => {
      try {
        await saveNotificationSettings(formData);
        toast.success("Da luu cau hinh thong bao.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Khong the luu cau hinh thong bao.");
      }
    });
  }

  function handleTest() {
    startTesting(async () => {
      try {
        await sendTestNotification();
        toast.success("Da gui thong bao kiem tra.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Khong the gui thong bao kiem tra.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      {hiddenBoolean("larkEnabled", larkEnabled)}
      {hiddenBoolean("telegramEnabled", telegramEnabled)}
      {hiddenBoolean("orderEnabled", orderEnabled)}
      {hiddenBoolean("contactEnabled", contactEnabled)}

      <div className="grid gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRingIcon className="size-4" />
              Kenh nhan thong bao
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-2">
              <SettingSwitch
                checked={larkEnabled}
                label="Bat Lark Messenger"
                note="Gui den group Lark qua webhook endpoint."
                onCheckedChange={setLarkEnabled}
              />
              <SettingSwitch
                checked={telegramEnabled}
                label="Bat Telegram"
                note="Gui den group Telegram qua bot token."
                onCheckedChange={setTelegramEnabled}
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="larkWebhookUrl">Webhook endpoint Lark </Label>
                  <a href="#" className="hover:text-primary">Xem tai lieu</a>
                </div>
                <Input
                  id="larkWebhookUrl"
                  name="larkWebhookUrl"
                  defaultValue={settings.larkWebhookUrl}
                  placeholder="https://open.larksuite.com/open-apis/bot/v2/hook/..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="telegramBotToken">Telegram bot token</Label>
                    <a href="#" className="hover:text-primary">Xem tai lieu</a>
                  </div>
                  <Input
                    id="telegramBotToken"
                    name="telegramBotToken"
                    defaultValue={settings.telegramBotToken}
                    placeholder="123456789:ABC..."
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex justify-between">
                    <Label htmlFor="telegramChatId">Telegram group id</Label>
                    <a href="#" className="hover:text-primary">Xem tai lieu</a>
                </div>
                  <Input
                    id="telegramChatId"
                    name="telegramChatId"
                    defaultValue={settings.telegramChatId}
                    placeholder="-1001234567890"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mau noi dung don hang moi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <p className="text-muted-foreground text-xs">
                  Dung cac bien trong dau ngoac nhon, vi du {"{order_code}"} hoac {"{total_charge_vnd}"}. Bien khong co
                  du lieu se hien thi dau "-".
                </p>
                <Textarea
                  id="orderTemplate"
                  name="orderTemplate"
                  defaultValue={settings.orderTemplate}
                  className="min-h-36 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mau noi dung lien he moi</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <p className="text-muted-foreground text-xs">
                  Co the xuong dong tuy y. Noi dung sau khi luu se duoc gui y nguyen sang Lark va Telegram khi bat su
                  kien lien he moi.
                </p>
                <Textarea
                  id="contactTemplate"
                  name="contactTemplate"
                  defaultValue={settings.contactTemplate}
                  className="min-h-36 font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid h-fit gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Su kien thong bao</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SettingSwitch
              checked={orderEnabled}
              label="Don hang moi"
              note="Gui thong bao khi don hang moi dc tao."
              onCheckedChange={setOrderEnabled}
            />
            <SettingSwitch
              checked={contactEnabled}
              label="Lien he moi"
              note="Gui thong bao khi co lien he moi tu website."
              onCheckedChange={setContactEnabled}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bien co the dung</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {templateVariables.map((item) => (
              <div key={item.token} className="grid gap-1 rounded-md border p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-sm">{item.label}</span>
                  <Badge variant="secondary">{`{${item.token}}`}</Badge>
                </div>
                <div className="text-muted-foreground text-xs">{item.scope}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          <Button type="submit" disabled={isSaving}>
            <SaveIcon />
            {isSaving ? "Dang luu..." : "Luu cau hinh"}
          </Button>
          <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
            <SendIcon />
            {isTesting ? "Dang gui..." : "Gui thu"}
          </Button>
        </div>
      </div>
    </form>
  );
}
