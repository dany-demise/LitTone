<script>
	// @ts-nocheck
	import GUI from '$lib/domain/utils/lil-gui.esm';

	import { Controller } from '$lib/domain/controller';
	import { onMount, setContext } from 'svelte';
	import { writable } from 'svelte/store';
	import LeftPanel from '$lib/components/LeftPanel.svelte';
	import RightPanel from '$lib/components/RightPanel.svelte';
	import ImagePanel from '$lib/components/ImagePanel.svelte';

	/**
	 * @type {Controller}
	 */
	let controller; // le controleur est assigne lorsque onMount() est appellee

	onMount(() => {
		// On commence par assigner le controlleur
		controller = Controller.getInstance();
		controller.globalStore.set('activateResetZoomButton', activateResetZoomButton);
		controller.globalStore.set('deactivateResetZoomButton', deactivateResetZoomButton);

		/**
		 * A simple helper to find a target element from a parent using a selector.
		 */
		function selectTarget(fromElement, selector) {
			if (!(fromElement instanceof HTMLElement)) {
				return null;
			}
			return fromElement.querySelector(selector);
		}

		/**
		 * Object to track the resize state.
		 */
		const resizeData = {
			tracking: false,
			startWidth: null,
			startCursorScreenX: null,
			handleWidth: 10,
			resizeTarget: null,
			parentElement: null,
			maxWidth: null
		};

		/**
		 * Minimal debounce implementation.
		 * Adjust or replace if you have your own debounce in SvelteKit.
		 */
		function debounce(func, wait) {
			let timeout;
			return function (...args) {
				const context = this;
				clearTimeout(timeout);
				timeout = setTimeout(() => func.apply(context, args), wait);
			};
		}

		/**
		 * Helper to get “outerWidth” like jQuery’s .outerWidth().
		 * This is a simplified version focusing on offsetWidth.
		 */
		function getOuterWidth(element) {
			return element.offsetWidth;
		}

		/**
		 * Helper to set “outerWidth” in a jQuery-like way.
		 * Again, this is simplified; it sets the inline width in px.
		 */
		function setOuterWidth(element, width) {
			element.style.width = width + 'px';
		}

		document.body.addEventListener('mousedown', (event) => {
			if (event.button !== 0) return;

			// Match both handles:
			if (!event.target.matches('.resize-handle--x0, .resize-handle--x1')) return;

			event.preventDefault();
			event.stopPropagation();

			const handleElement = event.target;
			const targetSelector = handleElement.getAttribute('data-target');
			const targetElement = document.querySelector(targetSelector);

			if (!targetElement) return;

			resizeData.tracking = true;
			resizeData.startWidth = getOuterWidth(targetElement);
			resizeData.startCursorScreenX = event.screenX;
			resizeData.resizeTarget = targetElement;
			resizeData.isRightHandle = handleElement.matches('.resize-handle--x1');

			// For maximum width, you might base this on the container, for example:
			const container = targetElement.parentElement;
			resizeData.maxWidth = (container?.clientWidth || 9999) - resizeData.handleWidth;
		});

		const onMouseMove = debounce((event) => {
			if (!resizeData.tracking) return;

			// Calculate how far we've moved from the initial screenX.
			// For the right handle, invert the movement so dragging left = smaller width.
			const moveDelta = event.screenX - resizeData.startCursorScreenX;
			const cursorScreenXDelta = resizeData.isRightHandle ? -moveDelta : moveDelta;

			const newWidth = Math.min(resizeData.startWidth + cursorScreenXDelta, resizeData.maxWidth);
			setOuterWidth(resizeData.resizeTarget, newWidth);
		}, 1);

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', () => {
			resizeData.tracking = false;
		});
	});

	function onThreeSixtyClick() {}

	function onResetZoom() {
		const resetZoom = controller.globalStore.get('resetZoom');
		if (resetZoom && typeof resetZoom === 'function') {
			resetZoom();
		}
	}

	function activateResetZoomButton() {
		const resetZoomButton = document.getElementById('reset-zoom');
		if (resetZoomButton) {
			resetZoomButton.disabled = false;
		}
	}

	function deactivateResetZoomButton() {
		const resetZoomButton = document.getElementById('reset-zoom');
		if (resetZoomButton) {
			resetZoomButton.disabled = true;
		}
	}
</script>

<svelte:head>
	<link
		rel="icon"
		href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💡</text></svg>"
	/>
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
	/>
	<title>LitTone</title>

	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<script type="module"> // This is not used here but in webWorker, but still loaded for pre caching purpose
		import createLibRawModule from './libraw/libraw.js';
		async function loadWasm() {
			await createLibRawModule(); // This may initialize the WASM module
			console.log('LibRaw WASM module loaded.');
		}
		loadWasm();
	</script>
</svelte:head>

<div class="container videoway" style="height: 100vh; width:100vw;">
	<aside class="left-sidebar style-4">
		<a class="text-light" style="text-decoration:none!important;" href="/">
			<div class="text-center" style="padding:15px 7px 7px 7px;color:#eeeeee;">
				<span style="color: #F6AA1C;">Lit</span>Tone💡
			</div>
		</a>
		<hr />
		<LeftPanel />
	</aside>

	<div class="resize-handle--x0" data-target=".left-sidebar"></div>
	<main
		class="main"
		style="display: flex; flex-direction: column; height: 100%;overflow: hidden; background-color: #171717;"
	>
		<div class="top-panel" style="padding:15px 7px 7px 7px; color:#eeeeee;">
			<!-- <button class="top-button" disabled>Luminance map</button> -->
			<button class="top-button" id="reset-zoom" disabled on:click={onResetZoom}
				>Reset zoom <i class="fa-solid fa-magnifying-glass"></i></button
			>
			<!-- <button on:click={onThreeSixtyClick} class="top-button">360°</button> -->
		</div>

		<div class="editor-panel" style="flex: 1;">
			<ImagePanel />
		</div>
	</main>

	<div class="resize-handle--x1" data-target=".right-sidebar"></div>
	<aside class="right-sidebar style-4">
		<RightPanel />
	</aside>
</div>

<style>
	@import url('$lib/assets/css/style.less');
	/* Local CSS */
	@font-face {
		font-family: 'VideowayMono';
		src: url('$lib/assets/fonts/VideowayMono.ttf') format('truetype');
		font-weight: normal;
		font-style: normal;
	}

	.videoway {
		font-family: 'VideowayMono', sans-serif;
	}
	.left-sidebar {
		width: 17vw;
		max-width: 500px;
		min-width: 200px;
		background-color: #2a2a2a;
	}
	.right-sidebar {
		width: 12vw;
		max-width: 500px;
		min-width: 200px;
		background-color: #2a2a2a;
	}

	/*
   *  STYLE 4
   */

	.style-4::-webkit-scrollbar-track {
		-webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
		background-color: #f5f5f5;
	}

	.style-4::-webkit-scrollbar {
		width: 5px;
		background-color: #f5f5f5;
	}

	.style-4::-webkit-scrollbar-thumb {
		background-color: #454545;
		border: 2px solid #454545;
	}

	.main {
		background-color: #2a2a2a;
		width: auto;
	}

	.text-center {
		text-align: center;
	}
	:global(.lil-gui) {
		--width: 100%;
		--name-width: 33%;
		--font-family: 'VideowayMono', sans-serif;
	}

	.top-button {
		all: unset; /* Remove all default styles */
		background-color: #2a2a2a;
		border: 1px solid #fafafa;
		padding: 7px 10px;
		margin: 0px 4px;
		display: inline-block;
		text-align: center;
		cursor: pointer;
		height: 18px;
	}
	.top-button:hover {
		all: unset; /* Remove all default styles */
		background-color: #fafafa;
		border: 1px solid #0c0c0d;
		padding: 7px 10px;
		margin: 0px 4px;
		color: #0c0c0d;
		display: inline-block;
		text-align: center;
		cursor: pointer;
		height: 18px;
	}
	.top-button:disabled {
		all: unset; /* Remove all default styles */
		background-color: #666666;
		border: 1px solid #fafafa;
		padding: 7px 10px;
		margin: 0px 4px;
		color: #dddddd;
		display: inline-block;
		text-align: center;
		height: 18px;
	}
</style>
