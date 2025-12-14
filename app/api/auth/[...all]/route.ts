import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

// Get the original handlers
const handlers = toNextJsHandler(auth);

// Wrap POST to disable public registration
export const GET = handlers.GET;

export async function POST(request: NextRequest) {
  // Check if this is a sign-up request
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Block sign-up endpoints - only admins can create users via /api/users
  if (pathname.includes('/sign-up') || pathname.includes('/signup')) {
    return NextResponse.json(
      {
        error: 'Public registration is disabled. Please contact an administrator to create an account.'
      },
      { status: 403 }
    );
  }

  // Allow all other auth requests (sign-in, sign-out, etc.)
  return handlers.POST(request);
}
