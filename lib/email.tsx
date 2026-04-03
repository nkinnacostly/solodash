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

export async function sendContractSignedEmail(params: {
  to: string;
  freelancerName: string;
  clientName: string;
  contractTitle: string;
  contractLink: string;
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 40px 20px;" align="center">
            <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #18181b; border-radius: 12px; overflow: hidden;">
              <!-- Header -->
              <tr>
                <td style="background-color: #0f0f0f; padding: 32px; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #10b981;">Paidly</h1>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: bold; color: #ffffff; text-align: center;">
                    ✓ Contract Signed!
                  </h2>
                  <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                    <strong style="color: #ffffff;">${params.clientName}</strong> has signed your contract.
                  </p>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f0f0f; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #a1a1aa;">Contract</p>
                        <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff;">${params.contractTitle}</p>
                      </td>
                    </tr>
                  </table>
                  
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="${params.contractLink}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                          View Contract →
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #a1a1aa; text-align: center;">
                    A copy of the signed contract has been sent to <strong style="color: #ffffff;">${params.clientName}</strong>'s email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #0f0f0f; padding: 24px; text-align: center; border-top: 1px solid #27272a;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #a1a1aa;">
                    Need help? Visit <a href="https://getpaidly.co" style="color: #10b981; text-decoration: none;">getpaidly.co</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await resend.emails.send({
    from: `Paidly <${fromEmail}>`,
    to: params.to,
    subject: `${params.clientName} signed your contract`,
    html,
  });
}
