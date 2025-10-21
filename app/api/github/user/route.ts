import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { githubFetch } from "@/lib/github-fetch";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await githubFetch({
      accessToken: session.accessToken,
      endpoint: "/user",
    });

    return NextResponse.json(data);
  } catch (e: any) {
    console.error("GitHub API Error:", e);
    return NextResponse.json({ 
      error: "Unexpected error", 
      detail: e?.message || String(e),
      cause: e?.cause?.message || e?.cause || "Unknown"
    }, { status: 500 });
  }
}
