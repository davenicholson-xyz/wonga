import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'child_process';

function git(args: string): string | null {
	try {
		return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
			.toString()
			.trim();
	} catch {
		return null;
	}
}

// Baked in at build time so the settings page can show which commit is running.
// wonga-deploy builds from a git clone; GIT_COMMIT overrides (e.g. builds without .git).
const appVersion = {
	commit: process.env.GIT_COMMIT || git('rev-parse --short HEAD') || 'unknown'
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	define: {
		__APP_VERSION__: JSON.stringify(appVersion)
	}
});
