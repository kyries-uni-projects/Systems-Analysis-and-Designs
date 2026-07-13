import { NextRequest, NextResponse } from "next/server";
import { demoAccounts, SESSION_COOKIE_NAME, SESSION_COOKIE_VALUE, SESSION_USER_COOKIE_NAME } from "@/lib/auth";
import { canAccessWorkflowAction, getWorkflowActionByPath } from "@/lib/workflow-navigation";

function canAccessPath(pathname: string, username: string | undefined) {
	const account = username ? demoAccounts[username] : undefined;
	if (!account) {
		return false;
	}

	const workflow = getWorkflowActionByPath(pathname);
	return !workflow || canAccessWorkflowAction(account.role, workflow.action);
}

export function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (pathname === "/login" || pathname.startsWith("/api/")) {
		return NextResponse.next();
	}

	const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
	const username = request.cookies.get(SESSION_USER_COOKIE_NAME)?.value;
	if (session === SESSION_COOKIE_VALUE && username && canAccessPath(pathname, username)) {
		return NextResponse.next();
	}

	if (session === SESSION_COOKIE_VALUE && username) {
		return NextResponse.redirect(new URL("/", request.url));
	}

	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("next", `${pathname}${search}`);
	return NextResponse.redirect(loginUrl);
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
