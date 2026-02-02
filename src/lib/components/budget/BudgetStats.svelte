<script lang="ts">
	import { formatCurrency } from '$lib/helpers';

	const { net, outgoing, bills_pot = $bindable(0) } = $props();

	const remaining = $derived(net - outgoing);
	let expanded = $state(false);
</script>

<div
	class="card bg-base-200 shadow-sm cursor-pointer"
	onclick={() => (expanded = !expanded)}
	onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
	role="button"
	tabindex="0"
>
	<div class="card-body p-3">
		<div class="flex justify-between">
			<div class="text-center">
				<div class="text-xs opacity-70">
					{new Date(new Date().getFullYear(), new Date().getMonth() + 1).toLocaleDateString(
						'en-GB',
						{ month: 'long' }
					)} Income
				</div>
				<div class="text-xl font-bold">{formatCurrency(net)}</div>
			</div>
			<div class="text-center">
				<div class="text-xs opacity-70">Remaining</div>
				<div
					class="text-xl font-bold"
					class:text-success={remaining >= 0}
					class:text-error={remaining < 0}
				>
					{formatCurrency(remaining)}
				</div>
			</div>
		</div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-3 h-3 mx-auto mt-1 opacity-50 transition-transform"
			class:rotate-180={expanded}
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>

		{#if expanded}
			<div class="divider my-1"></div>
			<div class="flex justify-around">
				<div class="text-center">
					<div class="text-xs opacity-70">Outgoing</div>
					<div class="font-bold text-error">{formatCurrency(outgoing)}</div>
				</div>
				<div class="text-center">
					<div class="text-xs opacity-70">Bills Pot</div>
					<div class="font-bold">{formatCurrency(bills_pot)}</div>
				</div>
			</div>
		{/if}
	</div>
</div>
