function invalidDate() {
	return new Date(Number.NaN);
}

/**
 * Parse a calendar date at local midnight without allowing JavaScript to
 * normalize impossible values such as 2026-02-30 into a date in March.
 */
export function parseLocalCalendarDate(value: string) {
	let year: number;
	let month: number;
	let day: number;

	if (/^\d{4}-\d{2}-\d{2}$/u.test(value)) {
		[year, month, day] = value.split("-").map(Number);
	} else {
		const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/u);
		if (!match) return invalidDate();
		[, day, month, year] = match.map(Number);
	}

	const date = new Date(year, month - 1, day);
	if (
		Number.isNaN(date.getTime())
		|| date.getFullYear() !== year
		|| date.getMonth() !== month - 1
		|| date.getDate() !== day
	) {
		return invalidDate();
	}

	return date;
}
