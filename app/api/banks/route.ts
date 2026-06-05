import { NextResponse } from "next/server";
import { errorMessage } from "@/lib/log-redact";

interface Bank {
  id: number;
  code: string;
  name: string;
}

let cachedBanks: Bank[] | null = null;
let cachedAt = 0;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  try {
    const now = Date.now();
    const cacheAge = now - cachedAt;

    if (cachedBanks && cacheAge < CACHE_DURATION_MS) {
      return NextResponse.json(
        { banks: cachedBanks, cached: true },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, s-maxage=86400",
          },
        },
      );
    }

    const response = await fetch("https://api.flutterwave.com/v3/banks/NG", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Flutterwave API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== "success" || !Array.isArray(data.data)) {
      throw new Error("Invalid response from Flutterwave");
    }

    const banks: Bank[] = data.data
      .map((bank: { id: number; code: string; name: string }) => ({
        id: bank.id,
        code: bank.code,
        name: bank.name,
      }))
      .sort((a: Bank, b: Bank) => a.name.localeCompare(b.name));

    cachedBanks = banks;
    cachedAt = now;

    return NextResponse.json(
      { banks, cached: false },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, s-maxage=86400",
        },
      },
    );
  } catch (error: unknown) {
    console.error("[api/banks] error:", errorMessage(error));

    if (cachedBanks) {
      return NextResponse.json(
        { banks: cachedBanks, cached: true, stale: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to load banks" },
      { status: 500 },
    );
  }
}
