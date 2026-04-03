const BANK_CODES: Record<string, string> = {
  "044": "044", "023": "023", "050": "050", "070": "070",
  "011": "011", "214": "214", "058": "058", "030": "030",
  "082": "082", "076": "076", "101": "101", "221": "221",
  "068": "068", "232": "232", "100": "100", "032": "032",
  "033": "033", "215": "215", "035": "035", "057": "057",
  "50211": "50211", "999992": "999992", "999991": "999991",
  "50515": "50515", "566": "566", "565": "565", "125": "125",
  "104": "104", "102": "102",
}

export interface FlutterwaveTransaction {
  status: string
  amount: number
  currency: string
  tx_ref: string
  customer: {
    email: string
    name: string
  }
}

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
  )

  if (!response.ok) {
    throw new Error(`Flutterwave API error: ${response.statusText}`)
  }

  const data = await response.json()

  if (data.status !== "success") {
    throw new Error(data.message || "Transaction verification failed")
  }

  const txData = data.data

  return {
    status: txData.status,
    amount: txData.amount,
    currency: txData.currency,
    tx_ref: txData.tx_ref,
    customer: {
      email: txData.customer?.email || "",
      name: txData.customer?.name || "",
    },
  }
}

export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    USD: "$", GBP: "£", EUR: "€", NGN: "₦",
    GHS: "GH₵", KES: "KSh", ZAR: "R",
  }
  const symbol = symbols[currency] || currency + " "
  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function extractInvoiceIdFromTxRef(txRef: string): string | null {
  const parts = txRef.split("-")
  if (parts[0] !== "PAIDLY" || parts.length < 3) return null
  return parts.slice(1, -1).join("-")
}

export async function verifyBankAccount(params: {
  account_number: string
  account_bank: string
}): Promise<{ account_name: string }> {
  const response = await fetch(
    "https://api.flutterwave.com/v3/accounts/resolve",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_number: params.account_number,
        account_bank: params.account_bank,
      }),
    }
  )

  const data = await response.json()

  if (data.status !== "success") {
    throw new Error(data.message || "Failed to verify account")
  }

  return { account_name: data.data.account_name }
}

export async function createFlutterwaveSubaccount(params: {
  account_bank: string
  account_number: string
  business_name: string
  business_email: string
  country: string
  split_type: "percentage"
  split_value: number
}): Promise<{ subaccount_id: string }> {
  const response = await fetch(
    "https://api.flutterwave.com/v3/subaccounts",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_bank: params.account_bank,
        account_number: params.account_number,
        business_name: params.business_name,
        business_email: params.business_email,
        country: params.country,
        split_type: params.split_type,
        split_value: params.split_value,
      }),
    }
  )

  const data = await response.json()

  if (data.status !== "success") {
    // Subaccount already exists — fetch it instead
    if (data.message?.includes("already exists")) {
      const listResponse = await fetch(
        "https://api.flutterwave.com/v3/subaccounts",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      )

      const listData = await listResponse.json()

      if (listData.status === "success") {
        const existing = listData.data.find(
          (s: any) => s.account_number === params.account_number
        )
        if (existing) {
          return { subaccount_id: existing.subaccount_id }
        }
      }
    }
    throw new Error(data.message || "Failed to create subaccount")
  }

  return { subaccount_id: data.data.subaccount_id }
}