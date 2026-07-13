type LogoSizeProps = {
	size?: number;
};

export function HouseIcon({ size = 52 }: LogoSizeProps) {
	return (
		<svg aria-hidden="true" viewBox="0 0 156 112" width={size} height={(size * 112) / 156} fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect x="122" y="52" width="34" height="57" rx="5" fill="white" stroke="#1E3A5F" strokeWidth="8.5" strokeLinejoin="round" />
			<path
				d="M 12 109 L 12 47 L 70 8 L 128 47 L 128 109"
				fill="white"
				stroke="#1E3A5F"
				strokeWidth="10.5"
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
			<rect x="57" y="20" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
			<rect x="70" y="20" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
			<rect x="57" y="33" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
			<rect x="70" y="33" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
			<rect x="18" y="64" width="94" height="40" rx="11" fill="#1E3A5F" />
			<rect x="27" y="64" width="76" height="23" rx="9" fill="#14B8A6" />
			<circle cx="127.5" cy="81" r="3.2" fill="#1E3A5F" />
		</svg>
	);
}

export function AppIconTile({ size = 80 }: LogoSizeProps) {
	const cornerRadius = Math.round(size * 0.22);

	return (
		<svg aria-label="HomeStay Dorm" viewBox="0 0 156 156" width={size} height={size} fill="none" xmlns="http://www.w3.org/2000/svg">
			<defs>
				<linearGradient id="homeStayTileBackground" x1="0" y1="0" x2="156" y2="156" gradientUnits="userSpaceOnUse">
					<stop offset="0%" stopColor="#E8F4FF" />
					<stop offset="100%" stopColor="#E0FDF8" />
				</linearGradient>
			</defs>
			<rect width="156" height="156" rx={cornerRadius} fill="url(#homeStayTileBackground)" />
			<g transform="translate(0 22)">
				<rect x="122" y="52" width="34" height="57" rx="5" fill="white" stroke="#1E3A5F" strokeWidth="8.5" strokeLinejoin="round" />
				<path
					d="M 12 109 L 12 47 L 70 8 L 128 47 L 128 109"
					fill="white"
					stroke="#1E3A5F"
					strokeWidth="10.5"
					strokeLinejoin="round"
					strokeLinecap="round"
				/>
				<rect x="57" y="20" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
				<rect x="70" y="20" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
				<rect x="57" y="33" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
				<rect x="70" y="33" width="9.5" height="9.5" rx="1.8" fill="#1E3A5F" />
				<rect x="18" y="64" width="94" height="40" rx="11" fill="#1E3A5F" />
				<rect x="27" y="64" width="76" height="23" rx="9" fill="#14B8A6" />
				<circle cx="127.5" cy="81" r="3.2" fill="#1E3A5F" />
			</g>
		</svg>
	);
}

type HomeStayLogoProps = LogoSizeProps & {
	variant?: "horizontal" | "sidebar" | "stacked";
};

export function HomeStayLogo({ size = 52, variant = "horizontal" }: HomeStayLogoProps) {
	const isSidebar = variant === "sidebar";
	const isStacked = variant === "stacked";
	const wordmarkSize = Math.round(size * (isStacked ? 0.24 : isSidebar ? 0.34 : 0.3));

	return (
		<div className={`inline-flex ${isStacked ? "flex-col items-center gap-3" : "items-center gap-2.5"}`}>
			<HouseIcon size={size} />
			<div className={isSidebar ? "leading-tight" : "leading-none"}>
				<div className="whitespace-nowrap font-bold" style={{ fontSize: wordmarkSize }}>
					<span className={isSidebar ? "text-white" : "text-[#1e3a5f]"}>HomeStay</span>
					<span className={isSidebar ? "text-teal-200" : "text-teal-500"}> Dorm</span>
				</div>
				{isSidebar && <p className="mt-0.5 text-[10.5px] text-blue-200">Quản lý ký túc xá</p>}
			</div>
		</div>
	);
}
