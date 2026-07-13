import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_USER_COOKIE_NAME } from "@/lib/auth";

export function POST() {
	const response = NextResponse.json({ ok: true });
	response.cookies.delete(SESSION_COOKIE_NAME);
	response.cookies.delete(SESSION_USER_COOKIE_NAME);
	return response;
}
