import { theme } from './stores';
import { getSettings, updateSettings } from './db';
import type { ThemeMode } from './types';

let mediaQuery: MediaQueryList | null = null;
let isInitialized = false;
let unsubscribe: (() => void) | null = null;

export async function initializeTheme() {
	try {
		// Load saved theme from IndexedDB
		const settings = await getSettings();
		
		// Apply theme first
		applyTheme(settings.theme);
		
		// Then set the store (this will trigger the subscription)
		theme.set(settings.theme);
		
		// Mark as initialized
		isInitialized = true;

		// Subscribe to future theme changes
		unsubscribe = theme.subscribe((mode) => {
			applyTheme(mode);
			// Only persist changes made after initialization
			if (isInitialized) {
				updateSettings({ theme: mode }).catch((err) => {
					console.error('Failed to save theme preference:', err);
				});
			}
		});
	} catch (error) {
		console.error('Failed to initialize theme:', error);
		// Apply default theme on error
		applyTheme('system');
		isInitialized = true;
		
		// Still subscribe to handle future changes
		unsubscribe = theme.subscribe((mode) => {
			applyTheme(mode);
		});
	}
}

export function applyTheme(mode: ThemeMode) {
	// Clean up previous listener
	if (mediaQuery) {
		mediaQuery.removeEventListener('change', handleSystemThemeChange);
	}

	if (mode === 'system') {
		mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);
		handleSystemThemeChange(mediaQuery);
	} else {
		setThemeClass(mode === 'dark');
	}
}

function handleSystemThemeChange(e: MediaQueryList | MediaQueryListEvent) {
	setThemeClass(e.matches);
}

function setThemeClass(isDark: boolean) {
	if (isDark) {
		document.documentElement.classList.add('dark');
	} else {
		document.documentElement.classList.remove('dark');
	}
}
