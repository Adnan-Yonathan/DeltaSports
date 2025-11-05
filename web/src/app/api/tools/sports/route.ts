import { NextRequest } from "next/server";
import { handleSportsRequest } from "@/lib/tools/sports";

export async function GET(req: NextRequest) {
  return handleSportsRequest(req);
}
