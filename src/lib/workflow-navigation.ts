import type { Role } from "@/lib/auth";

export type WorkflowAction = {
	slug: string;
	label: string;
	description: string;
	roles: Role[];
	href?: string;
};

export type WorkflowGroup = {
	slug: string;
	label: string;
	iconPath?: string;
	actions: WorkflowAction[];
};

export const workflowGroups: WorkflowGroup[] = [
	{
		slug: "dang-ky-thue-phong",
		label: "Đăng ký thuê phòng",
		iconPath: "/icons/dang-ky-thue.svg",
		actions: [
			{
				slug: "kiem-tra-thong-tin",
				label: "Kiểm tra thông tin",
				description: "Kiểm tra thông tin khách hàng và nhu cầu thuê phòng.",
				roles: ["nhanvien"],
			},
			{
				slug: "lap-lich-xem-phong",
				label: "Lập lịch xem phòng",
				description: "Lập lịch hẹn xem phòng cho khách hàng từ yêu cầu thuê.",
				roles: ["nhanvien"],
			},
			{ slug: "lap-ho-so-thue", label: "Lập hồ sơ thuê", description: "Lập hồ sơ thuê phòng từ yêu cầu đã được kiểm tra.", roles: ["nhanvien"] },
			{ slug: "phe-duyet-ho-so", label: "Phê duyệt hồ sơ", description: "Đánh giá và phê duyệt hồ sơ thuê phòng.", roles: ["quanly"] },
		],
	},
	{
		slug: "deposit",
		label: "Đặt cọc và xác nhận thuê",
		iconPath: "/icons/dat-coc.svg",
		actions: [
			{
				slug: "danh-sach-ho-so-dat-coc",
				label: "Danh sách hồ sơ đặt cọc",
				description: "Tra cứu, lập mới và cập nhật hồ sơ đặt cọc.",
				roles: ["nhanvien", "quanly", "ketoan"],
				href: "/deposit",
			},
			// { slug: "xac-nhan-thanh-toan", label: "Xác nhận thanh toán", description: "Xác nhận giao dịch đặt cọc đã được thanh toán.", roles: ["ketoan"] },
			// {
			// 	slug: "xac-nhan-thue",
			// 	label: "Xác nhận điều kiện đặt cọc",
			// 	description: "Xác nhận điều kiện thuê sau khi hoàn tất đặt cọc.",
			// 	roles: ["nhanvien", "quanly"],
			// 	href: "/dat-coc-xac-nhan-thue/xac-nhan-dieu-kien-dat-coc",
			// },
		],
	},
	{
		slug: "checkin",
		label: "Nhận phòng",
		iconPath: "/icons/nhan-phong.svg",
		actions: [
			{
				slug: "kiem-tra-thong-tin",
				label: "Kiểm tra thông tin",
				description: "Đối chiếu hồ sơ, người thuê và phòng trước khi nhận phòng.",
				roles: ["nhanvien"],
			},
			{ slug: "phe-duyet-ho-so", label: "Phê duyệt hồ sơ", description: "Phê duyệt hồ sơ đủ điều kiện nhận phòng.", roles: ["quanly"] },
			{ slug: "ban-giao-phong", label: "Bàn giao phòng", description: "Ghi nhận tình trạng và thực hiện bàn giao phòng.", roles: ["quanly"] },
			{ slug: "lap-hop-dong", label: "Lập hợp đồng", description: "Tạo hợp đồng thuê cho hồ sơ đã được phê duyệt.", roles: ["nhanvien"] },
			{
				slug: "thanh-toan-dau-ky",
				label: "Thanh toán đầu kỳ",
				description: "Xác nhận các khoản thanh toán trước khi nhận phòng.",
				roles: ["ketoan"],
			},
		],
	},
	{
		slug: "tra-phong",
		label: "Trả phòng",
		iconPath: "/icons/tra-phong.svg",
		actions: [
			{ slug: "dang-ky-tra-phong", label: "Đăng ký trả phòng", description: "Tiếp nhận yêu cầu trả phòng của khách hàng.", roles: ["nhanvien"] },
			{
				slug: "kiem-tra-tinh-trang",
				label: "Kiểm tra tình trạng phòng",
				description: "Kiểm tra phòng và xác định các chi phí phát sinh.",
				roles: ["quanly"],
			},
			{ slug: "lap-bien-ban-thanh-ly", label: "Lập biên bản thanh lý", description: "Lập biên bản thanh lý hợp đồng thuê phòng.", roles: ["quanly"] },
			{ slug: "doi-soat-hoan-coc", label: "Đối soát hoàn cọc", description: "Đối soát số tiền cọc có thể hoàn cho khách hàng.", roles: ["ketoan"] },
			{ slug: "thuc-hien-hoan-coc", label: "Thực hiện hoàn cọc", description: "Thực hiện hoàn tiền cọc sau khi đối soát.", roles: ["ketoan"] },
		],
	},
];

export function canAccessWorkflowAction(role: Role, action: WorkflowAction) {
	return role === "admin" || action.roles.includes(role);
}

export function getWorkflowAction(feature: string, action: string) {
	const group = workflowGroups.find((item) => item.slug === feature);
	const workflowAction = group?.actions.find((item) => item.slug === action);
	return group && workflowAction ? { group, action: workflowAction } : null;
}

export function getWorkflowActionHref(group: WorkflowGroup, action: WorkflowAction) {
	return action.href ?? `/${group.slug}/${action.slug}`;
}

export function getWorkflowActionByPath(pathname: string) {
	for (const group of workflowGroups) {
		const action = group.actions.find((item) => getWorkflowActionHref(group, item) === pathname);
		if (action) {
			return { group, action };
		}
	}

	return null;
}
