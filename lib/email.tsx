import { Resend } from "resend";
import { render } from "@react-email/render";
import { InvoiceEmail } from "@/emails/InvoiceEmail";
import { PaymentReceiptEmail } from "@/emails/PaymentReceiptEmail";
import { OverdueReminderEmail } from "@/emails/OverdueReminderEmail";
import { ContractEmail } from "@/emails/ContractEmail";
import React from "react";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@getpaidly.co";

export async function sendInvoiceEmail(params: {
  to: string;
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentLink: string;
  invoiceId: string;
}): Promise<void> {
  const html = await render(
    React.createElement(InvoiceEmail, {
      clientName: params.clientName,
      freelancerName: params.freelancerName,
      businessName: params.businessName,
      invoiceNumber: params.invoiceNumber,
      amount: params.amount,
      dueDate: params.dueDate,
      paymentLink: params.paymentLink,
    }) as any,
  );

  await resend.emails.send({
    from: `${params.businessName || params.freelancerName} via Paidly <${fromEmail}>`,
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} from ${params.businessName || params.freelancerName}`,
    html,
  });
}

export async function sendPaymentConfirmation(params: {
  to: string;
  freelancerName: string;
  clientName: string;
  invoiceNumber: string;
  amount: string;
  paidAt: string;
}): Promise<void> {
  const html = await render(
    React.createElement(PaymentReceiptEmail, {
      freelancerName: params.freelancerName,
      clientName: params.clientName,
      invoiceNumber: params.invoiceNumber,
      amount: params.amount,
      paidAt: params.paidAt,
    }) as any,
  );

  await resend.emails.send({
    from: `Paidly <${fromEmail}>`,
    to: params.to,
    subject: `Payment received for ${params.invoiceNumber}`,
    html,
  });
}

export async function sendInvoiceReminder(params: {
  to: string;
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  paymentLink: string;
  daysOverdue: number;
}): Promise<void> {
  const html = await render(
    React.createElement(OverdueReminderEmail, {
      clientName: params.clientName,
      freelancerName: params.freelancerName,
      businessName: params.businessName,
      invoiceNumber: params.invoiceNumber,
      amount: params.amount,
      dueDate: params.dueDate,
      paymentLink: params.paymentLink,
      daysOverdue: params.daysOverdue,
    }) as any,
  );

  await resend.emails.send({
    from: `${params.businessName || params.freelancerName} via Paidly <${fromEmail}>`,
    to: params.to,
    subject: `Reminder: Invoice ${params.invoiceNumber} is ${params.daysOverdue} days overdue`,
    html,
  });
}

export async function sendContractEmail(params: {
  to: string;
  clientName: string;
  freelancerName: string;
  businessName: string | null;
  contractTitle: string;
  signingLink: string;
  contractType: string;
}): Promise<void> {
  const html = await render(
    React.createElement(ContractEmail, {
      clientName: params.clientName,
      freelancerName: params.freelancerName,
      businessName: params.businessName,
      contractTitle: params.contractTitle,
      signingLink: params.signingLink,
      contractType: params.contractType,
    }) as any,
  );

  await resend.emails.send({
    from: `${params.businessName || params.freelancerName} via Paidly <${fromEmail}>`,
    to: params.to,
    subject: `Contract for Signature: ${params.contractTitle}`,
    html,
  });
}
