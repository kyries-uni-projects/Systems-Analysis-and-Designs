import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import path from "node:path";
import { canReadDepositAtStatus } from "../src/lib/api-auth";
import { createSessionToken, verifySessionToken } from "../src/lib/session";
import { getWorkflowActionByPath, getWorkflowRouteAccessRule } from "../src/lib/workflow-navigation";

process.env.AUTH_SECRET = "test-only-auth-secret-with-sufficient-entropy";

test("signed demo sessions preserve the preset identity", async () => {
	const token = await createSessionToken("nhanvien01");
	assert.deepEqual(await verifySessionToken(token), {
		username: "nhanvien01",
		name: "Phạm Thị Dung",
		role: "nhanvien",
	});
});

test("tampered and legacy cookie values are rejected", async () => {
	const token = await createSessionToken("quanly01");
	const signatureStart = token.indexOf(".") + 1;
	const replacement = token[signatureStart] === "a" ? "b" : "a";
	const tamperedToken = `${token.slice(0, signatureStart)}${replacement}${token.slice(signatureStart + 1)}`;
	assert.equal(await verifySessionToken(tamperedToken), null);
	assert.equal(await verifySessionToken("authenticated"), null);
});

test("nested workflow routes resolve to their intended roles", () => {
	assert.deepEqual(getWorkflowRouteAccessRule("/deposit/lap-phieu-dat-coc")?.roles, ["nhanvien"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/deposit/lap-yeu-cau-thanh-toan/42")?.roles, ["ketoan"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/deposit/xac-nhan-thanh-toan/42")?.roles, ["quanly"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/deposit/ghi-nhan-dat-coc/42")?.roles, ["nhanvien"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/tra-phong/kiem-tra-tinh-trang/TP-1")?.roles, ["quanly"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/khach-hang/42")?.roles, ["nhanvien"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/phong")?.roles, ["admin"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/phong/new")?.roles, ["admin"]);
	assert.deepEqual(getWorkflowRouteAccessRule("/khach-hang")?.roles, ["nhanvien"]);
});

test("sidebar route resolution covers deposit aliases and return-room base list", () => {
	assert.equal(
		getWorkflowActionByPath("/dat-coc-xac-nhan-thue/xac-nhan-dieu-kien-dat-coc")?.action.slug,
		"danh-sach-ho-so-dat-coc",
	);
	assert.equal(getWorkflowActionByPath("/deposit/cap-nhat-chung-tu/4")?.action.slug, "danh-sach-ho-so-dat-coc");
	assert.equal(getWorkflowActionByPath("/deposit/ghi-nhan-dat-coc/4")?.action.slug, "ghi-nhan-dat-coc");
	assert.equal(getWorkflowActionByPath("/tra-phong")?.action.slug, "danh-sach-tra-phong");
	assert.equal(getWorkflowActionByPath("/tra-phong/doi-soat-hoan-coc/TP-1")?.action.slug, "doi-soat-hoan-coc");
});

test("deposit detail reads follow role and stage", () => {
	assert.equal(canReadDepositAtStatus("nhanvien", "Mới tạo"), true);
	assert.equal(canReadDepositAtStatus("quanly", "Chờ xác nhận quản lý"), true);
	assert.equal(canReadDepositAtStatus("quanly", "Mới tạo"), false);
	assert.equal(canReadDepositAtStatus("ketoan", "Đã xác nhận điều kiện"), true);
	assert.equal(canReadDepositAtStatus("ketoan", "Chờ xác nhận quản lý"), false);
});

test("every non-auth API route declares a server-side guard", async () => {
	async function routeFiles(directory: string): Promise<string[]> {
		const entries = await readdir(directory, { withFileTypes: true });
		const nested = await Promise.all(
			entries.map((entry) => {
				const target = path.join(directory, entry.name);
				return entry.isDirectory() ? routeFiles(target) : entry.name === "route.ts" ? [target] : [];
			}),
		);
		return nested.flat();
	}

	const apiRoot = path.join(process.cwd(), "src/app/api");
	const routes = (await routeFiles(apiRoot)).filter((file) => !file.includes(`${path.sep}api${path.sep}auth${path.sep}`));
	const missing: string[] = [];
	for (const file of routes) {
		const source = await readFile(file, "utf8");
		if (!source.includes("requireApiSession") && !source.includes("requireTraPhongRole")) missing.push(path.relative(process.cwd(), file));
	}
	assert.deepEqual(missing, []);
});
