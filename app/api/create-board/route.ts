import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Server-side endpoint to create a board using the SUPABASE_SERVICE_ROLE_KEY.
// Verifies Clerk session server-side and uses the Supabase service role to perform writes.
export async function POST(request: Request) {
  const session = await auth();
  const userId = (session as unknown as { userId?: string })?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let body:
    | { title?: string; description?: string; color?: string }
    | undefined;
  try {
    body = (await request.json()) as {
      title?: string;
      description?: string;
      color?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, color } = body || {};
  if (!title || typeof title !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid title" },
      { status: 400 }
    );
  }

  // Use service role key on the server. Make sure SUPABASE_SERVICE_ROLE_KEY is set in server env.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabaseAdmin
    .from("boards")
    .insert({
      title,
      description: description ?? null,
      color: color ?? "bg-blue-500",
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
