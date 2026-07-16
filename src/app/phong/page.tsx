import RoomManagementPage from "@/components/phong/RoomManagementPage";
import { listLoaiPhong } from "@/lib/services/loaiPhongService";
import { listPhong } from "@/lib/services/phongService";

export const dynamic = "force-dynamic";

export default async function PhongPage() {
	const [{ items }, roomTypes] = await Promise.all([listPhong({ pageSize: 500 }), listLoaiPhong()]);
	return <RoomManagementPage initialRooms={items} roomTypes={roomTypes} />;
}
