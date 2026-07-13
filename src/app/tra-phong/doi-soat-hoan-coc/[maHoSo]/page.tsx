import { TraPhongRoleGuard } from "@/components/tra-phong/TraPhongRoleGuard";
import { TinhToanDoiSoatHoanCocPage } from "@/features/traphong/TinhToanDoiSoatHoanCocPage";

export default function Page() {
	return (
		<TraPhongRoleGuard roles={["ketoan"]}>
			<TinhToanDoiSoatHoanCocPage />
		</TraPhongRoleGuard>
	);
}
