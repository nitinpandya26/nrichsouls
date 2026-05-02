import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function POST(request) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const { slug } = await request.json().catch(() => ({}));

  if (slug) {
    // Revalidate a specific post
    revalidatePath(`/blog/${slug}`);
  } else {
    // Revalidate the entire blog listing + all post pages
    revalidatePath("/blog", "layout");
  }

  return NextResponse.json({
    revalidated: true,
    target: slug ? `/blog/${slug}` : "/blog (all)",
    timestamp: new Date().toISOString(),
  });
}

export async function GET(request) {
  const secret = request.nextUrl.searchParams.get("secret");

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  revalidatePath("/blog", "layout");

  return NextResponse.json({
    revalidated: true,
    target: "/blog (all)",
    timestamp: new Date().toISOString(),
  });
}
