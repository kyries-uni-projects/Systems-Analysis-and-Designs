import { TraPhongRoleGuard } from "@/components/tra-phong/TraPhongRoleGuard";
import { ThucHienHoanCocPage } from "@/features/traphong/ThucHienHoanCocPage";

export default function Page() {
	return (
		<TraPhongRoleGuard roles={["ketoan"]}>
			<ThucHienHoanCocPage />
		</TraPhongRoleGuard>
	);
}
