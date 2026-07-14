import { notFound } from "next/navigation";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { getWorkflowAction, workflowGroups } from "@/lib/workflow-navigation";
import NhanPhongMockApp, { type NhanPhongScreen } from "@/components/nhan-phong/NhanPhongMockApp";

const checkinScreens: Record<string, NhanPhongScreen> = {
	"kiem-tra-thong-tin": "check-in",
	"phe-duyet-ho-so": "approve-list",
	"ban-giao-phong": "handover",
	"lap-hop-dong": "contract",
	"thanh-toan-dau-ky": "payment",
};

export function generateStaticParams() {
	return workflowGroups.flatMap((group) => group.actions.map((action) => ({ feature: group.slug, action: action.slug })));
}

export default async function WorkflowActionPage({ params }: { params: Promise<{ feature: string; action: string }> }) {
	const { feature, action } = await params;
	const workflow = getWorkflowAction(feature, action);

	if (!workflow) {
		notFound();
	}

	if (feature === "checkin" && checkinScreens[action]) {
		return <NhanPhongMockApp initialScreen={checkinScreens[action]} />;
	}

	return (
		<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10 lg:px-8">
			<p className="text-sm font-medium text-[#155DFC]">{workflow.group.label}</p>
			<h1 className="mt-2 text-2xl font-semibold text-slate-900">{workflow.action.label}</h1>
			<p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{workflow.action.description}</p>

			<section className="mt-8 border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
				<div className="mx-auto flex size-11 items-center justify-center rounded-lg bg-blue-50 text-[#155DFC]">
					<ClipboardCheck className="size-5" aria-hidden="true" />
				</div>
				<h2 className="mt-4 text-base font-semibold text-slate-800">Chức năng đã được phân quyền</h2>
				<p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Tuyến nghiệp vụ này đã sẵn sàng cho nhóm người dùng phù hợp.</p>
				<span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#155DFC]">
					<ArrowRight className="size-4" aria-hidden="true" />
					Bạn đang ở đúng bước xử lý
				</span>
			</section>
		</main>
	);
}
