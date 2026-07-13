import { TraPhongRoleGuard } from "@/components/tra-phong/TraPhongRoleGuard";
import { KiemTraTinhTrangPhongGiuongPage } from "@/features/traphong/KiemTraTinhTrangPhongGiuongPage";

export default function Page() {
	return (
		<TraPhongRoleGuard roles={["quanly"]}>
			<KiemTraTinhTrangPhongGiuongPage />
		</TraPhongRoleGuard>
	);
}
