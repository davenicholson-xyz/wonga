<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);

	const REPO = 'davenicholson-xyz/wonga';
	const commit = __APP_VERSION__.commit;

	/** Commits on main that this build doesn't have; null until known (or if GitHub can't say). */
	let behindBy = $state(/** @type {number | null} */ (null));

	$effect(() => {
		if (commit === 'unknown') return;
		const controller = new AbortController();
		// 404 for commits GitHub doesn't know (unpushed): just show no icon.
		fetch(`https://api.github.com/repos/${REPO}/compare/${commit}...main`, {
			signal: controller.signal
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data && typeof data.ahead_by === 'number') behindBy = data.ahead_by;
			})
			.catch(() => {});
		return () => controller.abort();
	});
</script>

<h1 class="text-2xl font-bold mb-4">Settings</h1>

<div class="flex gap-1.5 mb-4 overflow-x-auto">
	<a
		href={resolve('/settings/payment')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/payment')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		Payment
	</a>
	<a
		href={resolve('/settings/rates')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/rates')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		Rates
	</a>
	<a
		href={resolve('/settings/shifts')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/shifts')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		Shifts
	</a>
	<a
		href={resolve('/settings/invoices')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/invoices')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		Invoices
	</a>
	<a
		href={resolve('/settings/ui')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/ui')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		UI
	</a>
	<a
		href={resolve('/settings/data')}
		class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap
			{pathname.startsWith('/settings/data')
			? 'bg-primary text-primary-content'
			: 'bg-base-content/5 text-base-content/50 hover:text-base-content/70'}"
	>
		Data
	</a>
</div>

{@render children()}

<footer class="mt-8 flex items-center justify-center gap-1.5 text-[11px] text-base-content/40">
	<a
		class="font-mono link link-hover"
		href="https://github.com/{REPO}/commit/{commit}"
		target="_blank"
		rel="noopener noreferrer">{commit}</a
	>
	{#if behindBy}
		<a
			href="https://github.com/{REPO}/compare/{commit}...main"
			target="_blank"
			rel="noopener noreferrer"
			class="text-warning"
			title="{behindBy} newer commit{behindBy === 1 ? '' : 's'} on main"
			aria-label="{behindBy} newer commit{behindBy === 1 ? '' : 's'} on main"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="size-3.5"
			>
				<path
					fill-rule="evenodd"
					d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm-.75-4.75a.75.75 0 0 0 1.5 0V8.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L6.2 9.74a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
					clip-rule="evenodd"
				/>
			</svg>
		</a>
	{/if}
</footer>
