import { TraPhongRoleGuard } from "@/components/tra-phong/TraPhongRoleGuard";
import { LapBienBanTraPhongThanhLyPage } from "@/features/traphong/LapBienBanTraPhongThanhLyPage";

export default function Page() {
	return (
		<TraPhongRoleGuard roles={["quanly"]}>
			<LapBienBanTraPhongThanhLyPage />
		</TraPhongRoleGuard>
	);
}
