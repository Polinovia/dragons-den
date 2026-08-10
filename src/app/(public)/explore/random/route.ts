import { NextResponse } from "next/server";
import { getRandomPublicContentLink } from "@/lib/server/discover";

export async function GET(request: Request) {
  const link = await getRandomPublicContentLink();
  return NextResponse.redirect(new URL(link ?? "/explore", request.url));
}
