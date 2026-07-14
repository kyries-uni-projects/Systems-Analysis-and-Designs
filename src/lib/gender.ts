export const GENDER_OPTIONS = ["Nam", "Nữ", "Khác"] as const;

export type Gender = (typeof GENDER_OPTIONS)[number];

export function isGender(value: string): value is Gender {
	return GENDER_OPTIONS.includes(value as Gender);
}
