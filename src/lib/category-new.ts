export function isCategoryNew(
	category: { new_until?: string | null },
	now: Date = new Date()
): boolean {
	if (!category.new_until) return false;
	const until = new Date(category.new_until);
	if (Number.isNaN(until.getTime())) return false;
	return until.getTime() > now.getTime();
}
