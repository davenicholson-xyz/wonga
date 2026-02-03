<script lang="ts">
	import { formatCurrency } from '$lib/helpers';

	const { net, outgoing, bills_pot = $bindable(0) } = $props();

	const remaining = $derived(net - outgoing);
	let expanded = $state(false);

	const spentPercent = $derived(net > 0 ? Math.min((outgoing / net) * 100, 100) : 0);
</script>

<div
	class="rounded-xl border border-base-content/10 bg-base-100 overflow-hidden cursor-pointer"
	onclick={() => (expanded = !expanded)}
	onkeydown={(e) => e.key === 'Enter' && (expanded = !expanded)}
	role="button"
	tabindex="0"
>
	<div class="p-4">
		<div class="grid grid-cols-2 gap-3">
			<div class="rounded-xl bg-gradient-to-br from-info/10 to-info/5 border border-info/20 p-2.5">
				<div class="flex items-center gap-1.5 mb-1">
					<div class="w-6 h-6 rounded-md bg-info/20 flex items-center justify-center">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-3.5 h-3.5 text-info"
						>
							<path
								fill-rule="evenodd"
								d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 1a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM2 15.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5ZM2 17.5a.5.5 0 0 1 .5-.5h15a.5.5 0 0 1 0 1h-15a.5.5 0 0 1-.5-.5Z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<span class="text-[10px] font-medium text-base-content/50">
						{new Date(new Date().getFullYear(), new Date().getMonth() + 1).toLocaleDateString(
							'en-GB',
							{ month: 'long' }
						)} Income
					</span>
				</div>
				<div class="text-lg font-bold">{formatCurrency(net)}</div>
			</div>
			<div
				class="rounded-xl bg-gradient-to-br {remaining >= 0
					? 'from-success/10 to-success/5 border border-success/20'
					: 'from-error/10 to-error/5 border border-error/20'} p-2.5"
			>
				<div class="flex items-center gap-1.5 mb-1">
					<div
						class="w-6 h-6 rounded-md {remaining >= 0
							? 'bg-success/20'
							: 'bg-error/20'} flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 20 20"
							fill="currentColor"
							class="w-3.5 h-3.5 {remaining >= 0 ? 'text-success' : 'text-error'}"
						>
							<path
								d="M10.75 10.818v2.614A3.13 3.13 0 0 0 11.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 0 0-1.138-.432ZM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603c-.348.07-.66.2-.918.39-.26.19-.462.44-.528.72a.67.67 0 0 0 .056.543Z"
							/>
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-6a.75.75 0 0 1 .75.75v.316a3.78 3.78 0 0 1 1.653.713c.426.33.744.74.925 1.2a.75.75 0 0 1-1.395.55 1.35 1.35 0 0 0-.447-.563 2.19 2.19 0 0 0-.736-.363V9.3c.514.1.98.27 1.388.492.582.315 1.012.754 1.232 1.292.22.539.199 1.1-.052 1.592-.249.49-.726.9-1.381 1.167-.213.087-.44.155-.677.203v.316a.75.75 0 0 1-1.5 0v-.316a3.78 3.78 0 0 1-1.653-.713 3.08 3.08 0 0 1-.925-1.2.75.75 0 0 1 1.395-.55c.12.303.292.508.447.563.225.08.469.135.736.363V8.7a5.38 5.38 0 0 1-1.388-.492C6.852 7.893 6.422 7.454 6.202 6.916a2.35 2.35 0 0 1 .052-1.592c.249-.49.726-.9 1.381-1.167.213-.087.44-.155.677-.203V4.75A.75.75 0 0 1 10 4Z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<span class="text-[10px] font-medium text-base-content/50">Remaining</span>
				</div>
				<div class="text-lg font-bold {remaining >= 0 ? 'text-success' : 'text-error'}">
					{formatCurrency(remaining)}
				</div>
			</div>
		</div>

		<!-- Progress bar -->
		<div class="mt-3">
			<div class="flex justify-between text-[10px] text-base-content/40 mb-1">
				<span>{formatCurrency(outgoing)} spent</span>
				<span>{Math.round(spentPercent)}%</span>
			</div>
			<div class="h-1.5 rounded-full bg-base-content/5 overflow-hidden">
				<div
					class="h-full rounded-full transition-all {spentPercent > 90
						? 'bg-error'
						: spentPercent > 70
							? 'bg-warning'
							: 'bg-success'}"
					style="width: {spentPercent}%"
				></div>
			</div>
		</div>

		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="w-3 h-3 mx-auto mt-2 opacity-30 transition-transform"
			class:rotate-180={expanded}
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
		</svg>

		{#if expanded}
			<div class="grid grid-cols-2 gap-3 mt-3">
				<div
					class="rounded-xl bg-gradient-to-br from-error/10 to-error/5 border border-error/20 p-2.5"
				>
					<div class="flex items-center gap-1.5 mb-1">
						<div class="w-6 h-6 rounded-md bg-error/20 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-3.5 h-3.5 text-error"
							>
								<path
									fill-rule="evenodd"
									d="M12.577 4.878a.75.75 0 0 1 .919-.53l4.78 1.281a.75.75 0 0 1 .531.919l-1.281 4.78a.75.75 0 0 1-1.449-.387l.81-3.022a19.407 19.407 0 0 0-5.594 5.203.75.75 0 0 1-1.139.093L7 10.06l-4.72 4.72a.75.75 0 0 1-1.06-1.06l5.25-5.25a.75.75 0 0 1 1.06 0l3.046 3.046a20.902 20.902 0 0 1 5.441-5.185l-2.829-.757a.75.75 0 0 1-.53-.919Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span class="text-[10px] font-medium text-base-content/50">Outgoing</span>
					</div>
					<div class="text-lg font-bold text-error">{formatCurrency(outgoing)}</div>
				</div>
				<div
					class="rounded-xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 p-2.5"
				>
					<div class="flex items-center gap-1.5 mb-1">
						<div class="w-6 h-6 rounded-md bg-warning/20 flex items-center justify-center">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								class="w-3.5 h-3.5 text-warning"
							>
								<path
									fill-rule="evenodd"
									d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<span class="text-[10px] font-medium text-base-content/50">Bills Pot</span>
					</div>
					<div class="text-lg font-bold text-warning">{formatCurrency(bills_pot)}</div>
				</div>
			</div>
		{/if}
	</div>
</div>
