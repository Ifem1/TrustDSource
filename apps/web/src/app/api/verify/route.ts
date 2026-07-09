import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Deprecated endpoint. Use the wallet-signed unified GenLayer verification flow in the /verify page.",
    },
    { status: 410 }
  );
}
