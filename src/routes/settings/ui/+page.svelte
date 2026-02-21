<script>
	import {
		get_theme_setting,
		save_theme_setting,
		get_image_size_setting,
		save_image_size_setting
	} from '$lib/funcs/settings.remote';

	const themes = [
		'light',
		'dark',
		'cupcake',
		'bumblebee',
		'emerald',
		'corporate',
		'synthwave',
		'retro',
		'cyberpunk',
		'valentine',
		'halloween',
		'garden',
		'forest',
		'aqua',
		'lofi',
		'pastel',
		'fantasy',
		'wireframe',
		'black',
		'luxury',
		'dracula',
		'cmyk',
		'autumn',
		'business',
		'acid',
		'lemonade',
		'night',
		'coffee',
		'winter',
		'dim',
		'nord',
		'sunset'
	];

	const themeData = get_theme_setting();
	const themeSetting = $derived(themeData.current);
	let selectedTheme = $state('dim');

	$effect(() => {
		if (themeSetting) {
			selectedTheme = themeSetting.theme;
		}
	});

	/** @param {string} theme */
	function applyTheme(theme) {
		selectedTheme = theme;
		document.documentElement.setAttribute('data-theme', theme);
		save_theme_setting({ theme });
	}

	// Image Size
	const imageSizeData = get_image_size_setting();
	const imageSizeSetting = $derived(imageSizeData.current);
	/** @type {'small' | 'medium' | 'large'} */
	let selectedImageSize = $state('medium');

	$effect(() => {
		if (imageSizeSetting) {
			selectedImageSize = imageSizeSetting.image_size;
		}
	});

	/** @param {'small' | 'medium' | 'large'} size */
	function setImageSize(size) {
		selectedImageSize = size;
		save_image_size_setting({ size });
	}
</script>

<div class="rounded-xl border border-base-content/10 bg-base-100 p-4">
	<h2 class="text-sm font-semibold text-base-content/60 mb-3">Appearance</h2>
	<div class="form-control">
		<span class="label">
			<span class="label-text text-xs">Colour Theme</span>
		</span>
		<div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
			{#each themes as theme}
				<button
					class="rounded-lg overflow-hidden border-2 transition-all {selectedTheme === theme
						? 'border-primary ring-1 ring-primary/30'
						: 'border-base-content/10 hover:border-base-content/20'}"
					onclick={() => applyTheme(theme)}
					data-theme={theme}
				>
					<div class="bg-base-100 p-2">
						<div class="flex items-center justify-between mb-1.5">
							<span class="text-[10px] font-medium text-base-content truncate">
								{theme.charAt(0).toUpperCase() + theme.slice(1)}
							</span>
							{#if selectedTheme === theme}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 16 16"
									fill="currentColor"
									class="w-3 h-3 text-primary shrink-0"
								>
									<path
										fill-rule="evenodd"
										d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
										clip-rule="evenodd"
									/>
								</svg>
							{/if}
						</div>
						<div class="flex gap-1">
							<span class="size-3 rounded-full bg-primary"></span>
							<span class="size-3 rounded-full bg-secondary"></span>
							<span class="size-3 rounded-full bg-accent"></span>
							<span class="size-3 rounded-full bg-neutral"></span>
						</div>
					</div>
				</button>
			{/each}
		</div>
	</div>
</div>

<div class="rounded-xl border border-base-content/10 bg-base-100 p-4 mt-3">
	<h2 class="text-sm font-semibold text-base-content/60 mb-3">Image Upload Size</h2>
	<p class="text-[11px] text-base-content/40 mb-3">
		Maximum resolution for uploaded images. Larger images will be resized.
	</p>
	<div class="flex flex-col gap-2">
		{#each [{ value: 'small', label: 'Small', desc: '800px max' }, { value: 'medium', label: 'Medium', desc: '1200px max' }, { value: 'large', label: 'Large', desc: '1600px max' }] as option}
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="radio"
					name="image-size"
					class="radio radio-sm radio-primary"
					value={option.value}
					checked={selectedImageSize === option.value}
					onchange={() =>
						setImageSize(/** @type {'small' | 'medium' | 'large'} */ (option.value))}
				/>
				<div>
					<span class="text-sm font-medium">{option.label}</span>
					<span class="text-[11px] text-base-content/40 ml-1.5">{option.desc}</span>
				</div>
			</label>
		{/each}
	</div>
</div>
