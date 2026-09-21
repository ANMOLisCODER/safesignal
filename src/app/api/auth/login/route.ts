import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email?.trim();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required.",
        },
        { status: 400 },
      );
    }

    const authorityEmail = process.env.AUTHORITY_EMAIL;
    const authorityPassword =
      process.env.AUTHORITY_PASSWORD;

    if (!authorityEmail || !authorityPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Authority login is not configured.",
        },
        { status: 500 },
      );
    }

    if (
      email !== authorityEmail ||
      password !== authorityPassword
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set(
      "safesignal-authority",
      "authenticated",
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 8,
      },
    );

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unable to process login.",
      },
      { status: 400 },
    );
  }
}