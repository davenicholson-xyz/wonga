<script>
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const calendarFeedUrl = $derived(page.url.origin + '/calendar/feed');
	const webcalUrl = $derived(calendarFeedUrl.replace(/^https?:\/\//, 'webcal://'));
	const googleCalUrl = $derived(
		'https://calendar.google.com/calendar/r?cid=' + encodeURIComponent(calendarFeedUrl)
	);
	let calendarCopied = $state(false);

	async function copyCalendarUrl() {
		await navigator.clipboard.writeText(calendarFeedUrl);
		calendarCopied = true;
		setTimeout(() => (calendarCopied = false), 2000);
	}

	// Data import/export
	let importing = $state(false);
	let importError = $state('');
	let importSuccess = $state(false);
	let showImportConfirm = $state(false);
	/** @type {HTMLInputElement | undefined} */
	let fileInput = $state();
	/** @type {any} */
	let pendingImportData = $state(null);

	/** @param {Event} e */
	function handleFileSelect(e) {
		const input = /** @type {HTMLInputElement} */ (e.target);
		const file = input.files?.[0];
		if (!file) return;

		importError = '';
		importSuccess = false;

		const reader = new FileReader();
		reader.onload = (evt) => {
			try {
				pendingImportData = JSON.parse(/** @type {string} */ (evt.target?.result));
				if (!pendingImportData?.version || !pendingImportData?.exported_at) {
					importError = 'Invalid backup file format.';
					pendingImportData = null;
				} else {
					showImportConfirm = true;
				}
			} catch {
				importError = 'Could not parse file. Make sure it is a valid Shyft backup.';
			}
			input.value = '';
		};
		reader.readAsText(file);
	}

	async function doImport() {
		showImportConfirm = false;
		importing = true;
		importError = '';
		importSuccess = false;
		try {
			const res = await fetch(resolve('/settings/import'), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(pendingImportData)
			});
			const result = await res.json();
			if (!res.ok) {
				importError = result.error ?? 'Import failed';
			} else {
				importSuccess = true;
				setTimeout(() => (importSuccess = false), 3000);
			}
		} catch (/** @type {any} */ e) {
			importError = e?.message ?? 'Import failed';
		}
		importing = false;
		pendingImportData = null;
	}
</script>

<div class="flex flex-col gap-3">
	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-1">Export</h2>
		<p class="text-[11px] text-base-content/40 mb-3">
			Download a backup of all your data including invoices, customers, timesheets, budget, and
			settings.
		</p>
		<a href={resolve('/settings/export')} download class="btn btn-primary btn-sm">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="size-4"
			>
				<path
					d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"
				/>
				<path
					d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
				/>
			</svg>
			Download Backup
		</a>
	</div>

	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-1">Import</h2>
		<p class="text-[11px] text-base-content/40 mb-3">
			Restore from a backup file. This will replace all existing data.
		</p>
		<button
			class="btn btn-sm btn-outline"
			onclick={() => fileInput?.click()}
			disabled={importing}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 20 20"
				fill="currentColor"
				class="size-4"
			>
				<path
					d="M9.25 13.25a.75.75 0 0 0 1.5 0V4.636l2.955 3.129a.75.75 0 0 0 1.09-1.03l-4.25-4.5a.75.75 0 0 0-1.09 0l-4.25 4.5a.75.75 0 1 0 1.09 1.03L9.25 4.636v8.614Z"
				/>
				<path
					d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"
				/>
			</svg>
			{importing ? 'Importing...' : 'Upload Backup'}
		</button>
		<input
			bind:this={fileInput}
			type="file"
			accept=".json"
			class="hidden"
			onchange={handleFileSelect}
		/>
		{#if importError}
			<div class="alert alert-error mt-3 text-xs">{importError}</div>
		{/if}
		{#if importSuccess}
			<div class="alert alert-success mt-3 text-xs">Data restored successfully.</div>
		{/if}
	</div>

	<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
		<h2 class="text-sm font-semibold text-base-content/60 mb-1">Calendar Sync</h2>
		<p class="text-[11px] text-base-content/40 mb-3">
			Subscribe to your shifts in Apple Calendar, Google Calendar, or any app that supports iCal
			feeds. Only working shifts are included.
		</p>
		<div class="flex gap-2 mb-3">
			<a href={webcalUrl} class="btn btn-primary btn-sm">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="size-4"
					viewBox="0 0 24 24"
					fill="currentColor"
				>
					<path
						d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
					/>
				</svg>
				Apple Calendar
			</a>
			<a
				href={googleCalUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="btn btn-primary btn-sm"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				Google Calendar
			</a>
		</div>
		<div class="form-control">
			<label class="label" for="calendar-url">
				<span class="label-text text-xs">Feed URL</span>
			</label>
			<div class="flex gap-2">
				<input
					id="calendar-url"
					type="text"
					class="input input-bordered input-sm w-full font-mono text-xs"
					readonly
					value={calendarFeedUrl}
				/>
				<button class="btn btn-sm btn-outline shrink-0" onclick={copyCalendarUrl}>
					{calendarCopied ? 'Copied!' : 'Copy'}
				</button>
			</div>
			<p class="text-[11px] text-base-content/40 mt-2">
				Or copy the URL above to add manually in any calendar app.
			</p>
		</div>
	</div>
</div>

<!-- Import Confirmation Modal -->
<dialog class="modal" class:modal-open={showImportConfirm}>
	<div class="modal-box">
		<h3 class="font-bold text-lg">Restore Data</h3>
		<p class="py-4 text-sm text-base-content/70">
			This will <strong>replace all existing data</strong> with the backup from
			{#if pendingImportData}
				<strong
					>{new Date(pendingImportData.exported_at).toLocaleDateString('en-GB', {
						day: 'numeric',
						month: 'long',
						year: 'numeric'
					})}</strong
				>.
			{/if}
			This cannot be undone.
		</p>
		<div class="modal-action">
			<button
				class="btn btn-ghost btn-sm"
				onclick={() => {
					showImportConfirm = false;
					pendingImportData = null;
				}}>Cancel</button
			>
			<button class="btn btn-error btn-sm" onclick={doImport}>Restore</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button
			onclick={() => {
				showImportConfirm = false;
				pendingImportData = null;
			}}>close</button
		>
	</form>
</dialog>
