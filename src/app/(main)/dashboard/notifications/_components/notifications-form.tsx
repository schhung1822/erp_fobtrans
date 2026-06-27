"use client";

import { useState, useTransition } from "react";

import { BellRingIcon, SaveIcon, SendIcon } from "lucide-react";
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
    scope: "Đơn hàng",
    label: "Mã đơn hàng",
    description: "Mã hệ thống tạo cho đơn mới, ví dụ FOB-A1B2C.",
  },
  {
    token: "customer_name",
    scope: "Đơn hàng / Liên hệ",
    label: "Tên khách hàng",
    description: "Tên người gửi của đơn hàng hoặc tên khách hàng gắn với liên hệ.",
  },
  {
    token: "phone",
    scope: "Đơn hàng / Liên hệ",
    label: "Số điện thoại",
    description: "Số điện thoại người gửi trong đơn hàng hoặc số điện thoại của liên hệ.",
  },
  {
    token: "receiver_name",
    scope: "Đơn hàng",
    label: "Người nhận",
    description: "Tên người nhận hàng trong đơn mới.",
  },
  {
    token: "total_charge_vnd",
    scope: "Đơn hàng",
    label: "Tổng tiền",
    description: "Giá trị thành tiền của đơn hàng, tự động định dạng theo tiền VND.",
  },
  {
    token: "contact_name",
    scope: "Liên hệ",
    label: "Tên liên hệ",
    description: "Tên người liên hệ mới vừa được tạo.",
  },
  {
    token: "title",
    scope: "Liên hệ",
    label: "Chức danh",
    description: "Vai trò của liên hệ như kế toán, mua hàng, vận hành.",
  },
  {
    token: "email",
    scope: "Liên hệ",
    label: "Email",
    description: "Địa chỉ email của liên hệ mới nếu có nhập.",
  },
  {
    token: "note",
    scope: "Đơn hàng / Liên hệ",
    label: "Ghi chú",
    description: "Ghi chú nội bộ từ biểu mẫu tạo đơn hàng hoặc tạo liên hệ.",
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
        toast.success("Đã lưu cấu hình thông báo.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể lưu cấu hình thông báo.");
      }
    });
  }

  function handleTest() {
    startTesting(async () => {
      try {
        await sendTestNotification();
        toast.success("Đã gửi thông báo kiểm tra.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Không thể gửi thông báo kiểm tra.");
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
              Kênh nhận thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-3 md:grid-cols-2">
              <SettingSwitch
                checked={larkEnabled}
                label="Bật Lark Messenger"
                note="Gửi thẻ thông báo có tiêu đề và nội dung định dạng qua webhook Lark."
                onCheckedChange={setLarkEnabled}
              />
              <SettingSwitch
                checked={telegramEnabled}
                label="Bật Telegram"
                note="Gửi đến nhóm Telegram qua bot token."
                onCheckedChange={setTelegramEnabled}
              />
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="larkWebhookUrl">Địa chỉ webhook Lark</Label>
                  <a
                    href="https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/bot-v3/use-custom-bots-in-a-group"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-primary"
                  >
                    Xem tài liệu
                  </a>
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
                    <Label htmlFor="telegramBotToken">Mã bot Telegram</Label>
                    <a
                      href="https://core.telegram.org/bots/tutorial#obtain-your-bot-token"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary"
                    >
                      Xem tài liệu
                    </a>
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
                    <Label htmlFor="telegramChatId">ID nhóm Telegram</Label>
                    <a
                      href="https://core.telegram.org/bots/api#chat"
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary"
                    >
                      Xem tài liệu
                    </a>
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
              <CardTitle className="text-base">Mẫu nội dung đơn hàng mới</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <p className="text-muted-foreground text-xs">
                  Dùng các biến trong dấu ngoặc nhọn, ví dụ {"{order_code}"} hoặc {"{total_charge_vnd}"}. Biến không có
                  dữ liệu sẽ hiển thị dấu "-".
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
              <CardTitle className="text-base">Mẫu nội dung liên hệ mới</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <p className="text-muted-foreground text-xs">
                  Có thể xuống dòng tùy ý. Nội dung sau khi lưu sẽ được gửi nguyên bản sang Lark và Telegram khi bật sự
                  kiện liên hệ mới.
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
            <CardTitle className="text-base">Sự kiện thông báo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <SettingSwitch
              checked={orderEnabled}
              label="Đơn hàng mới"
              note="Gửi thông báo khi đơn hàng mới được tạo."
              onCheckedChange={setOrderEnabled}
            />
            <SettingSwitch
              checked={contactEnabled}
              label="Liên hệ mới"
              note="Gửi thông báo khi có liên hệ mới từ website."
              onCheckedChange={setContactEnabled}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Biến có thể dùng</CardTitle>
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
            {isSaving ? "Đang lưu..." : "Lưu cấu hình"}
          </Button>
          <Button type="button" variant="outline" onClick={handleTest} disabled={isTesting}>
            <SendIcon />
            {isTesting ? "Đang gửi..." : "Gửi thử"}
          </Button>
        </div>
      </div>
    </form>
  );
}
