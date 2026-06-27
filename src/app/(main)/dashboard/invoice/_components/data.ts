import { addDays, format } from "date-fns";

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceTaxOption {
  id: string;
  name: string;
  rate: number;
}

export type InvoiceDiscountType = "fixed" | "percent";

export const INVOICE_PAPER_WIDTH = 816;
export const INVOICE_PAPER_HEIGHT = 1056;
export const INVOICE_PAPER_SCALE = 0.6;

export interface InvoiceFromDetails {
  name: string;
  logoUrl: string;
  email: string;
  phone: string;
  website: string;
  addressLines: string[];
  taxId: string;
  paymentAccountName: string;
  paymentBankName: string;
  routingNumber: string;
  issuerName: string;
}

export interface InvoiceToDetails {
  id: string;
  name: string;
  email: string;
  addressLines: string[];
  taxId: string;
}

export interface InvoiceFormValues {
  orderId: string;
  invoiceTitle: string;
  referenceNumber: string;
  issuedDate: string;
  paymentDueDate: string;
  from: InvoiceFromDetails;
  to: InvoiceToDetails;
  taxId: string;
  discountType: InvoiceDiscountType;
  discountValue: number;
  items: InvoiceLineItem[];
}

const today = new Date();

export const defaultInvoiceValues: InvoiceFormValues = {
  orderId: "",
  invoiceTitle: "Hóa đơn",
  referenceNumber: `INV-${format(today, "yyMMdd")}`,
  issuedDate: format(today, "yyyy-MM-dd"),
  paymentDueDate: format(addDays(today, 7), "yyyy-MM-dd"),
  from: {
    name: "Fobtrans",
    logoUrl: "",
    email: "",
    phone: "",
    website: "",
    addressLines: [],
    taxId: "",
    paymentAccountName: "Tài khoản thanh toán",
    paymentBankName: "",
    routingNumber: "",
    issuerName: "Fobtrans",
  },
  to: {
    id: "",
    name: "Chọn đơn hàng để lấy khách hàng",
    email: "",
    addressLines: [],
    taxId: "",
  },
  taxId: "vat-8",
  discountType: "fixed",
  discountValue: 0,
  items: [
    {
      id: "service-fee",
      description: "Phí dịch vụ vận chuyển",
      quantity: 1,
      unitPrice: 0,
    },
  ],
};

export const invoiceTaxOptions: InvoiceTaxOption[] = [
  {
    id: "vat-8",
    name: "VAT",
    rate: 8,
  },
  {
    id: "vat-10",
    name: "VAT",
    rate: 10,
  },
  {
    id: "none",
    name: "Không tính thuế",
    rate: 0,
  },
];

export function getLineAmount(item?: InvoiceLineItem) {
  if (!item) return 0;

  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitPrice = Number.isFinite(item.unitPrice) ? item.unitPrice : 0;

  return quantity * unitPrice;
}

export function getInvoiceItems(invoice: InvoiceFormValues) {
  return invoice.items;
}

export function getInvoiceSubtotal(invoice: InvoiceFormValues) {
  return getInvoiceItems(invoice).reduce((subtotal, item) => subtotal + getLineAmount(item), 0);
}

export function getInvoiceTaxOption(invoice: InvoiceFormValues) {
  return invoiceTaxOptions.find((taxOption) => taxOption.id === invoice.taxId) ?? invoiceTaxOptions[0];
}

export function getInvoiceTax(invoice: InvoiceFormValues) {
  const taxRate = getInvoiceTaxOption(invoice).rate;

  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) * (taxRate / 100);
}

export function getInvoiceDiscount(invoice: InvoiceFormValues) {
  const subtotal = getInvoiceSubtotal(invoice);
  const discountValue = Number.isFinite(invoice.discountValue) ? invoice.discountValue : 0;
  const discount = invoice.discountType === "percent" ? subtotal * (discountValue / 100) : discountValue;

  return Math.min(Math.max(discount, 0), subtotal);
}

export function getInvoiceTotal(invoice: InvoiceFormValues) {
  return Math.max(getInvoiceSubtotal(invoice) - getInvoiceDiscount(invoice), 0) + getInvoiceTax(invoice);
}
