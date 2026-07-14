import { demoAccounts, SESSION_COOKIE_NAME, type Role } from "@/lib/auth";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEVELOPMENT_SECRET = "homestay-dorm-signed-demo-session-development-only";

type SessionPayload = {
	sub: string;
	exp: number;
	nonce: string;
};

export type AuthenticatedSession = {
	username: string;
	name: string;
	role: Role;
};

function getSecret() {
	const configuredSecret = process.env.AUTH_SECRET;
	if (configuredSecret) return configuredSecret;
	if (process.env.NODE_ENV === "production") {
		throw new Error("AUTH_SECRET must be configured in production.");
	}
	return DEVELOPMENT_SECRET;
}

function encodeBase64Url(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function decodeBase64Url(value: string) {
	const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
	const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
	const binary = atob(padded);
	return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getSigningKey() {
	return crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(getSecret()),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
}

export async function createSessionToken(username: string) {
	if (!demoAccounts[username]) throw new Error("Unknown demo account.");
	const randomBytes = crypto.getRandomValues(new Uint8Array(16));
	const payload: SessionPayload = {
		sub: username,
		exp: Date.now() + SESSION_TTL_MS,
		nonce: encodeBase64Url(randomBytes),
	};
	const encodedPayload = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
	const signature = await crypto.subtle.sign("HMAC", await getSigningKey(), new TextEncoder().encode(encodedPayload));
	return `${encodedPayload}.${encodeBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<AuthenticatedSession | null> {
	if (!token) return null;
	const [encodedPayload, encodedSignature, extra] = token.split(".");
	if (!encodedPayload || !encodedSignature || extra) return null;

	try {
		const isValid = await crypto.subtle.verify(
			"HMAC",
			await getSigningKey(),
			decodeBase64Url(encodedSignature),
			new TextEncoder().encode(encodedPayload),
		);
		if (!isValid) return null;

		const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as Partial<SessionPayload>;
		if (typeof payload.sub !== "string" || typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
		const account = demoAccounts[payload.sub];
		if (!account) return null;
		return { username: payload.sub, name: account.name, role: account.role };
	} catch {
		return null;
	}
}

export async function getSessionFromCookieStore(cookieStore: { get(name: string): { value: string } | undefined }) {
	return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
