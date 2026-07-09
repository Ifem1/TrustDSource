import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated endpoint. TrustDSource verification now runs through the wallet-signed unified GenLayer pipeline.",
    },
    { status: 410 }
  );
}
