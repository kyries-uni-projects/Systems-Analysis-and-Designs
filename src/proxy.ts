import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE } from "@/lib/auth";

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (pathname === "/login" || pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	if (session === SESSION_COOKIE_VALUE) {
		return NextResponse.next();
	}

	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("next", `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
