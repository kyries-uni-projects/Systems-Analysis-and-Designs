const ITERATIONS = 120_000;
const KEY_LENGTH = 32;

function toHex(bytes: Uint8Array) {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(value: string) {
	if (!/^[0-9a-f]+$/i.test(value) || value.length % 2 !== 0) return null;
	return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
}

async function derive(password: string, salt: Uint8Array, iterations: number) {
	const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
	const saltBuffer = Uint8Array.from(salt).buffer;
	const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBuffer, iterations }, key, KEY_LENGTH * 8);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt, ITERATIONS);
	return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string) {
	const [algorithm, iterationText, saltText, hashText, extra] = encoded.split("$");
	const iterations = Number(iterationText);
	const salt = fromHex(saltText ?? "");
	const expected = fromHex(hashText ?? "");
	if (algorithm !== "pbkdf2" || extra || !Number.isInteger(iterations) || iterations < 1 || !salt || !expected) return false;
	const actual = await derive(password, salt, iterations);
	if (actual.length !== expected.length) return false;
	let difference = 0;
	for (let index = 0; index < actual.length; index += 1) difference |= actual[index] ^ expected[index];
	return difference === 0;
}
