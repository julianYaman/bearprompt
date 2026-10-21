export function formatPercent(value: number): string {
	return `${Math.round(value * 1000) / 10}%`;
}

export function formatScore(value: number): string {
	return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function questionTypeLabel(type: 'noul' | 'choice' | 'score'): string {
	if (type === 'noul') return 'Noul';
	if (type === 'choice') return 'Choice';
	return 'Score';
}
