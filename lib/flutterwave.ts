/**
 * Flutterwave API helper functions
 */

export interface FlutterwaveTransaction {
  status: string;
  amount: number;
  currency: string;
  tx_ref: string;
  customer: {
    email: string;
    name: string;
  };
}

/**
 * Verify a Flutterwave transaction by transaction ID
 * @param transactionId - The Flutterwave transaction ID
 * @returns Parsed transaction data
 * @throws Error if verification fails
 */
export async function verifyFlutterwaveTransaction(
  transactionId: string
): Promise<FlutterwaveTransaction> {
  const response = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Flutterwave API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== "success") {
    throw new Error(data.message || "Transaction verification failed");
  }

  const txData = data.data;

  return {
    status: txData.status,
    amount: txData.amount,
    currency: txData.currency,
    tx_ref: txData.tx_ref,
    customer: {
      email: txData.customer?.email || "",
      name: txData.customer?.name || "",
    },
  };
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$",
    GBP: "£",
    EUR: "€",
    NGN: "₦",
    GHS: "GH₵",
    KES: "KSh",
    ZAR: "R",
  };

  const symbol = symbols[currency] || currency + " ";

  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Extract invoice ID from Flutterwave tx_ref
 * Format: PAIDLY-{invoice_id}-{timestamp}
 */
export function extractInvoiceIdFromTxRef(txRef: string): string | null {
  const parts = txRef.split("-");

  if (parts[0] !== "PAIDLY" || parts.length < 3) {
    return null;
  }

  // Handle invoice IDs that may contain dashes
  return parts.slice(1, -1).join("-");
}
