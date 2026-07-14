import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";
import { verifySessionToken } from "@/lib/session";
import { getWorkflowRouteAccessRule } from "@/lib/workflow-navigation";

function canAccessPath(pathname: string, role: "admin" | "nhanvien" | "quanly" | "ketoan") {
	const rule = getWorkflowRouteAccessRule(pathname);
	return !rule || role === "admin" || rule.roles.includes(role);
}

export async function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (pathname === "/login" || pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	const session = await verifySessionToken(request.cookies.get(SESSION_COOKIE_NAME)?.value);
	if (session && canAccessPath(pathname, session.role)) {
		return NextResponse.next();
	}

	if (session) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("next", `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
