<script>
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let { children } = $props();

	const pathname = $derived(page.url.pathname);
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
