import { NextResponse } from "next/server";
import { productionReadiness } from "@/lib/runtime/readiness";

export const dynamic = "force-dynamic";

function response() {
  const readiness = productionReadiness();
  return NextResponse.json(readiness, {
    status: readiness.readyForLektaHandoff ? 200 : 503,
    headers: {
      "cache-control": "no-store, max-age=0",
      "content-type": "application/json; charset=utf-8",
    },
  });
}

export async function GET() {
  return response();
}

export async function HEAD() {
  const readiness = productionReadiness();
  return new Response(null, {
    status: readiness.readyForLektaHandoff ? 200 : 503,
    headers: { "cache-control": "no-store, max-age=0" },
  });
}
