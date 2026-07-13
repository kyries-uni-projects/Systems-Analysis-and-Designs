import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle, ClipboardList, HelpCircle, LogIn, LogOut, UsersRound, type LucideIcon } from "lucide-react";

const featurePages: Record<string, { title: string; description: string; icon: LucideIcon }> = {
	"dang-ky-thue-phong": {
		title: "Đăng ký thuê phòng",
		description: "Ghi nhận yêu cầu thuê phòng và thông tin khách hàng.",
		icon: ClipboardList,
	},
	deposit: {
		title: "Đặt cọc và xác nhận thuê",
		description: "Theo dõi khoản đặt cọc và xác nhận hồ sơ thuê phòng.",
		icon: CheckCircle,
	},
	checkin: {
		title: "Nhận phòng",
		description: "Hoàn tất thủ tục nhận phòng cho các hợp đồng đã xác nhận.",
		icon: LogIn,
	},
	"tra-phong": {
		title: "Trả phòng",
		description: "Quản lý thủ tục trả phòng, thanh lý và hoàn cọc.",
		icon: LogOut,
	},
	status: {
		title: "Tình trạng phòng",
		description: "Theo dõi công suất và trạng thái sử dụng của từng phòng.",
		icon: CheckCircle,
	},
	users: {
		title: "Quản lý người dùng",
		description: "Quản lý thành viên, tài khoản và quyền truy cập hệ thống.",
		icon: UsersRound,
	},
	catalog: {
		title: "Quản lý danh mục",
		description: "Cấu hình các danh mục dùng chung cho nghiệp vụ ký túc xá.",
		icon: BookOpen,
	},
	help: {
		title: "Trợ giúp",
		description: "Tìm hướng dẫn sử dụng và thông tin hỗ trợ hệ thống.",
		icon: HelpCircle,
	},
};

export function generateStaticParams() {
	return Object.keys(featurePages).map((feature) => ({ feature }));
}

export default async function FeaturePage({ params }: { params: Promise<{ feature: string }> }) {
	const { feature } = await params;
	const page = featurePages[feature];

	if (!page) {
		notFound();
	}

	const Icon = page.icon;

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 lg:px-8">
			<section className="border-b border-slate-200 pb-8">
				<div className="flex size-12 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
					<Icon className="size-6" aria-hidden="true" />
				</div>
				<h1 className="mt-5 text-2xl font-semibold text-slate-900">{page.title}</h1>
				<p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{page.description}</p>
			</section>

			<section className="mt-8 border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
				<h2 className="text-base font-semibold text-slate-800">Chức năng đang được chuẩn bị</h2>
				<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
					Tuyến điều hướng đã sẵn sàng. Màn hình nghiệp vụ chi tiết sẽ được bổ sung tại đây.
				</p>
				<span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-700">
					<ArrowRight className="size-4" aria-hidden="true" />
					Bạn đang ở đúng khu vực chức năng
				</span>
			</section>
		</main>
	);
}
