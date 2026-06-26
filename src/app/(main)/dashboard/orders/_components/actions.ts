"use server";

import { revalidatePath } from "next/cache";

import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { getDbPool } from "@/lib/db";

import { sendOrderCreatedNotification } from "../../notifications/_components/notification-sender";
import { ensureOrderContactColumns } from "./data";

interface IdRow extends RowDataPacket {
  id: string;
}

interface OrderFinanceRow extends RowDataPacket {
  total_charge_vnd: number | string | null;
  paid_amount_vnd: number | string | null;
  total_cost_vnd: number | string | null;
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function numberValue(formData: FormData, key: string) {
  const value = text(formData, key);
  if (!value) return 0;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(value);
}

async function makeUuid(conn: PoolConnection) {
  const [rows] = await conn.query<IdRow[]>("select uuid() as id");
  return rows[0].id;
}

async function makeOrderCode(conn: PoolConnection) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const code = `FOB-${suffix}`;
    const [existing] = await conn.query<IdRow[]>("select order_id as id from orders where order_code = ? limit 1", [
      code,
    ]);

    if (!existing[0]?.id) return code;
  }

  return `FOB-${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

async function ensureCustomerContact(
  conn: PoolConnection,
  contact: { name: string | null; phone: string | null; address: string | null; codePrefix: string },
) {
  if (!contact.name && !contact.phone) return null;

  if (contact.phone) {
    const [byPhone] = await conn.query<IdRow[]>("select customer_id as id from customers where phone = ? limit 1", [
      contact.phone,
    ]);

    if (byPhone[0]?.id) {
      await conn.query(
        `
          update customers
          set
            customer_name = coalesce(?, customer_name),
            delivery_address = coalesce(?, delivery_address),
            updated_at = current_timestamp
          where customer_id = ?
        `,
        [contact.name, contact.address, byPhone[0].id],
      );

      return byPhone[0].id;
    }
  }

  if (!contact.name) return null;

  const customerId = await makeUuid(conn);
  const generatedCode = `${contact.codePrefix}-${Date.now().toString(36).toUpperCase()}`;

  await conn.query(
    `
      insert into customers (customer_id, customer_code, customer_name, phone, delivery_address)
      values (?, ?, ?, ?, ?)
    `,
    [customerId, generatedCode, contact.name, contact.phone, contact.address],
  );

  return customerId;
}

async function resolveCustomerId(conn: PoolConnection, formData: FormData) {
  const selectedCustomerId = text(formData, "customerId");
  const senderName = text(formData, "senderName");
  const senderPhone = text(formData, "senderPhone");
  const senderAddress = text(formData, "senderAddress");
  const customerCode = text(formData, "customerCode");

  if (selectedCustomerId) {
    await conn.query(
      `
        update customers
        set
          customer_name = coalesce(?, customer_name),
          phone = coalesce(?, phone),
          delivery_address = coalesce(?, delivery_address),
          updated_at = current_timestamp
        where customer_id = ?
      `,
      [senderName, senderPhone, senderAddress, selectedCustomerId],
    );

    return selectedCustomerId;
  }

  if (senderPhone) {
    const [byPhone] = await conn.query<IdRow[]>("select customer_id as id from customers where phone = ? limit 1", [
      senderPhone,
    ]);

    if (byPhone[0]?.id) return byPhone[0].id;
  }

  if (customerCode) {
    const [byCode] = await conn.query<IdRow[]>(
      "select customer_id as id from customers where customer_code = ? limit 1",
      [customerCode],
    );

    if (byCode[0]?.id) return byCode[0].id;
  }

  if (!senderName) {
    throw new Error("Vui long nhap ten nguoi gui.");
  }

  const customerId = await makeUuid(conn);
  const generatedCode = customerCode ?? `KH-${Date.now().toString(36).toUpperCase()}`;

  await conn.query(
    `
      insert into customers (customer_id, customer_code, customer_name, phone, delivery_address)
      values (?, ?, ?, ?, ?)
    `,
    [customerId, generatedCode, senderName, senderPhone, senderAddress],
  );

  return customerId;
}

async function getOrderPayload(
  conn: PoolConnection,
  formData: FormData,
  customerId: string,
  isCreate: boolean,
  orderId?: string,
) {
  const orderCode = text(formData, "orderCode") ?? (isCreate ? await makeOrderCode(conn) : null);
  if (!orderCode) throw new Error("Thieu ma don hang.");

  const orderDate = text(formData, "orderDate") ?? (isCreate ? todayString() : null);
  const [financeRows] = orderId
    ? await conn.query<OrderFinanceRow[]>(
        "select total_charge_vnd, paid_amount_vnd, total_cost_vnd from orders where order_id = ? limit 1",
        [orderId],
      )
    : [[] as OrderFinanceRow[]];
  const existingFinance = financeRows[0];
  const totalChargeVnd = isCreate ? 0 : toNumber(existingFinance?.total_charge_vnd);
  const paidAmountVnd = text(formData, "paidAmountVnd") ? numberValue(formData, "paidAmountVnd") : toNumber(existingFinance?.paid_amount_vnd);
  const totalCostVnd = isCreate ? 0 : toNumber(existingFinance?.total_cost_vnd);

  return {
    orderCode,
    customerId,
    assignedStaffId: text(formData, "assignedStaffId"),
    warehouseId: text(formData, "warehouseId"),
    serviceTypeId: text(formData, "serviceTypeId"),
    orderDate,
    deliveryDate: text(formData, "deliveryDate"),
    paymentDueDate: text(formData, "paymentDueDate"),
    deliveryAddress: text(formData, "receiverAddress") ?? text(formData, "deliveryAddress"),
    senderName: text(formData, "senderName"),
    senderPhone: text(formData, "senderPhone"),
    senderAddress: text(formData, "senderAddress"),
    receiverName: text(formData, "receiverName"),
    receiverPhone: text(formData, "receiverPhone"),
    receiverAddress: text(formData, "receiverAddress"),
    routeName: null,
    containerCode: text(formData, "containerCode"),
    trackingCode: text(formData, "trackingCode") ?? orderCode,
    cargoName: text(formData, "cargoName"),
    cargoValueVnd: numberValue(formData, "cargoValueVnd"),
    operationStatus: text(formData, "operationStatus") ?? "new",
    customsStatus: text(formData, "customsStatus") ?? "not_started",
    collectionStatus: text(formData, "collectionStatus") ?? "not_collected",
    invoiceStatus: text(formData, "invoiceStatus") ?? "not_issued",
    totalWeightKg: numberValue(formData, "totalWeightKg"),
    totalVolumeM3: numberValue(formData, "totalVolumeM3"),
    totalPackages: numberValue(formData, "totalPackages"),
    totalCostVnd,
    totalChargeVnd,
    paidAmountVnd,
    remainingAmountVnd: Math.max(totalChargeVnd - paidAmountVnd, 0),
    grossProfitVnd: totalChargeVnd - totalCostVnd,
    note: text(formData, "note"),
  };
}

function revalidateOrders() {
  revalidatePath("/orders");
  revalidatePath("/dashboard/orders");
}

async function ensureReceiverCustomer(conn: PoolConnection, formData: FormData) {
  await ensureCustomerContact(conn, {
    name: text(formData, "receiverName"),
    phone: text(formData, "receiverPhone"),
    address: text(formData, "receiverAddress"),
    codePrefix: "KHN",
  });
}

export async function createOrder(formData: FormData) {
  await ensureOrderContactColumns();
  const pool = getDbPool();
  const conn = await pool.getConnection();
  let createdPayload: Awaited<ReturnType<typeof getOrderPayload>> | null = null;

  try {
    await conn.beginTransaction();
    const customerId = await resolveCustomerId(conn, formData);
    await ensureReceiverCustomer(conn, formData);
    const payload = await getOrderPayload(conn, formData, customerId, true);
    createdPayload = payload;

    await conn.query(
      `
        insert into orders (
          order_code, customer_id, assigned_staff_id, warehouse_id, service_type_id,
          order_date, delivery_date, payment_due_date, delivery_address,
          sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
          route_name, container_code, tracking_code, cargo_name, cargo_value_vnd, operation_status, customs_status,
          collection_status, invoice_status, total_weight_kg, total_volume_m3, total_packages,
          total_cost_vnd, total_charge_vnd, paid_amount_vnd, remaining_amount_vnd, gross_profit_vnd, note
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        payload.orderCode,
        payload.customerId,
        payload.assignedStaffId,
        payload.warehouseId,
        payload.serviceTypeId,
        payload.orderDate,
        payload.deliveryDate,
        payload.paymentDueDate,
        payload.deliveryAddress,
        payload.senderName,
        payload.senderPhone,
        payload.senderAddress,
        payload.receiverName,
        payload.receiverPhone,
        payload.receiverAddress,
        payload.routeName,
        payload.containerCode,
        payload.trackingCode,
        payload.cargoName,
        payload.cargoValueVnd,
        payload.operationStatus,
        payload.customsStatus,
        payload.collectionStatus,
        payload.invoiceStatus,
        payload.totalWeightKg,
        payload.totalVolumeM3,
        payload.totalPackages,
        payload.totalCostVnd,
        payload.totalChargeVnd,
        payload.paidAmountVnd,
        payload.remainingAmountVnd,
        payload.grossProfitVnd,
        payload.note,
      ],
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  revalidateOrders();

  if (createdPayload) {
    await sendOrderCreatedNotification({
      order_code: createdPayload.orderCode,
      customer_name: createdPayload.senderName,
      phone: createdPayload.senderPhone,
      receiver_name: createdPayload.receiverName,
      total_charge_vnd: createdPayload.totalChargeVnd,
      note: createdPayload.note,
    }).catch((error) => {
      console.error("Failed to send order notification", error);
    });
  }
}

export async function updateOrder(formData: FormData) {
  await ensureOrderContactColumns();
  const orderId = text(formData, "orderId");
  if (!orderId) throw new Error("Thieu order_id de cap nhat.");

  const pool = getDbPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    const customerId = await resolveCustomerId(conn, formData);
    await ensureReceiverCustomer(conn, formData);
    const payload = await getOrderPayload(conn, formData, customerId, false, orderId);

    await conn.query(
      `
        update orders
        set
          order_code = ?, customer_id = ?, assigned_staff_id = ?, warehouse_id = ?, service_type_id = ?,
          order_date = coalesce(?, order_date), delivery_date = ?, payment_due_date = ?, delivery_address = ?,
          sender_name = ?, sender_phone = ?, sender_address = ?, receiver_name = ?, receiver_phone = ?, receiver_address = ?,
          container_code = ?, tracking_code = ?, cargo_name = ?, cargo_value_vnd = ?, operation_status = ?, customs_status = ?,
          collection_status = ?, invoice_status = ?, total_weight_kg = ?, total_volume_m3 = ?, total_packages = ?,
          total_cost_vnd = ?, total_charge_vnd = ?, paid_amount_vnd = ?, remaining_amount_vnd = ?, gross_profit_vnd = ?,
          note = ?, updated_at = current_timestamp
        where order_id = ?
      `,
      [
        payload.orderCode,
        payload.customerId,
        payload.assignedStaffId,
        payload.warehouseId,
        payload.serviceTypeId,
        payload.orderDate,
        payload.deliveryDate,
        payload.paymentDueDate,
        payload.deliveryAddress,
        payload.senderName,
        payload.senderPhone,
        payload.senderAddress,
        payload.receiverName,
        payload.receiverPhone,
        payload.receiverAddress,
        payload.containerCode,
        payload.trackingCode,
        payload.cargoName,
        payload.cargoValueVnd,
        payload.operationStatus,
        payload.customsStatus,
        payload.collectionStatus,
        payload.invoiceStatus,
        payload.totalWeightKg,
        payload.totalVolumeM3,
        payload.totalPackages,
        payload.totalCostVnd,
        payload.totalChargeVnd,
        payload.paidAmountVnd,
        payload.remainingAmountVnd,
        payload.grossProfitVnd,
        payload.note,
        orderId,
      ],
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }

  revalidateOrders();
}

export async function deleteOrder(formData: FormData) {
  const orderId = text(formData, "orderId");
  if (!orderId) throw new Error("Thieu order_id de xoa.");

  const pool = getDbPool();
  const [result] = await pool.query<ResultSetHeader>("delete from orders where order_id = ?", [orderId]);

  if (result.affectedRows === 0) {
    throw new Error("Không tìm thấy đơn hàng để xóa.");
  }

  revalidateOrders();
}

export async function updateOrderInlineStatus(formData: FormData) {
  const orderId = text(formData, "orderId");
  if (!orderId) throw new Error("Thiếu id đơn hàng để cập nhật.");

  const operationStatus = text(formData, "operationStatus");
  const collectionStatus = text(formData, "collectionStatus");

  if (!operationStatus && !collectionStatus) return;

  const updates: string[] = [];
  const values: Array<string | null> = [];

  if (operationStatus) {
    updates.push("operation_status = ?");
    values.push(operationStatus);
  }

  if (collectionStatus) {
    updates.push("collection_status = ?");
    values.push(collectionStatus);
  }

  values.push(orderId);

  const pool = getDbPool();
  await pool.query(
    `update orders set ${updates.join(", ")}, updated_at = current_timestamp where order_id = ?`,
    values,
  );

  revalidateOrders();
}
