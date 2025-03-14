<script>
	// @ts-ignore
	import { onMount, tick, getContext, setContext } from 'svelte';
	import { Controller } from '$lib/domain/controller';
	import ExifReader from 'exifreader';
	import { StringRounder } from '$lib/domain/utils/string-rounder';
	// import zip from "$lib/domain/utils/zip";

	/**
	 * @type {Controller}
	 */
	let controller;

	/**
	 * @type {HTMLElement | null}
	 */
	let dropzone = null;
	/**
	 * @type {HTMLElement | null}
	 */
	let dropzoneText = null;
	/**
	 * @type {HTMLElement | null}
	 */
	let gridContainer = null;
	/**
	 * @type {HTMLInputElement | null}
	 */
	let fileInput = null;

	/**
	 * @type {Worker}
	 */
	let librawWorker;

	onMount(() => {
		showDropImageHereText();
		controller = Controller.getInstance();
		controller.globalStore.set('showImageLoader', showImageLoader);
		controller.globalStore.set('showDropImageHereText', showDropImageHereText);

		dropzone = document.getElementById('dropzone');
		dropzoneText = document.getElementById('dropzone-text');
		gridContainer = document.getElementById('gridContainer');
		// @ts-ignore
		fileInput = document.getElementById('fileInput');
		librawWorker = new Worker(`libraw/libraw-worker.js`, { type: 'module' });
		setupLibrawWorker();

		['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
			dropzone?.addEventListener(
				eventName,
				(/** @type {{ preventDefault: () => void; stopPropagation: () => void; }} */ e) => {
					e.preventDefault();
					e.stopPropagation();
				},
				false
			);
		});

		dropzone?.addEventListener('dragover', () => {
			dropzone?.classList.add('dragover');
		});

		dropzone?.addEventListener('dragleave', () => {
			dropzone?.classList.remove('dragover');
		});

		dropzone?.addEventListener('drop', async (e) => {
			dropzone?.classList.remove('dragover');
			const files = e.dataTransfer?.files;
			showImageLoader();
			if (files) {
				processFiles(files);
			}
		});

		dropzone?.addEventListener('click', () => {
			fileInput?.click();
		});

		fileInput?.addEventListener('change', async (e) => {
			// Turn on loader
			showImageLoader();
			// @ts-ignore
			const files = e.target.files;
			if (files) {
				processFiles(files);
			}
			// @ts-ignore
			fileInput.value = '';
		});
	});

	function setupLibrawWorker() {
		librawWorker.onmessage = async (event) => {
			const { type, width, height, colors, imageSize, cameraInfo, buffer } = event.data;

			if (type === 'processed') {
				// buffer is a transferred ArrayBuffer containing the processed image data
				const processedImageData = new Uint16Array(buffer);

				// Add widht height to camera info for display
				cameraInfo['width'] = width;
				cameraInfo['height'] = height;
				setCameraInfo(cameraInfo);

				controller.setRawImage(processedImageData, width, height);
				//  insere le thumbnail dans la dropzone
				await insertThumbnailImage();
				// genere une premiere tonemap avec parametres par defaut
				controller.generateTonemapHableFilmic();
				// Configurer les parametres d affichage et afficher l image
				controller.callStoreFunc('resetZoom');
				controller.callStoreFunc('showImagePanel');

				// outputDiv.textContent = `Processed Image: ${width} x ${height}, Colors=${colors}, Size=${imageSize} bytes`;
			} else if (type === 'error') {
			}
		};
	}

	/**
	 * @type {File[]}
	 */
	let currentFiles = [];

	/**
	 * @param {Iterable<File>} files
	 */
	function processFiles(files) {
		// If we drop or select new files, add them to the global array:
		Array.from(files).forEach(async (file) => {
			// const exif = await getExifData(file);
			// console.log(exif);
			if (file.type.startsWith('image/')) {
				try {
					const arrayBuffer = await file.arrayBuffer();

					// Send the file's ArrayBuffer to the Worker as a Transferable
					librawWorker.postMessage(
						{ type: 'process', fileBuffer: arrayBuffer },
						[arrayBuffer] // Transfer ownership to worker
					);
				} catch (err) {
					console.log(`Error reading file: ${err}`);
				}
				currentFiles.push(file);
			}
		});
	}

	async function insertThumbnailImage() {
		// Retrieve raw image data (expected to be a Uint16Array along with dimensions)
		const rawImage = controller.rawImage;
		if (!rawImage) {
			console.error('Thumbnail data not available');
			return;
		}

		// Extract image data and dimensions.
		const processedImageArray = rawImage.data;
		const width = rawImage.width;
		const height = rawImage.height;

		// Clear the container where the image will be displayed.
		// @ts-ignore
		gridContainer.innerHTML = '';
		// @ts-ignore
		dropzoneText.style.display = 'none';

		// Create and configure the canvas.
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;
		// @ts-ignore
		gridContainer.appendChild(canvas);

		const ctx = canvas.getContext('2d');
		if (ctx) {
			const imageData = ctx.createImageData(width, height);

			// Loop through the processed image array, converting each 16-bit value to 8-bit by dividing by 256.
			// The processedImageArray is assumed to have values for R, G, and B consecutively.
			for (let i = 0, j = 0; i < processedImageArray.length; i += 3, j += 4) {
				imageData.data[j] = processedImageArray[i] / 256; // R
				imageData.data[j + 1] = processedImageArray[i + 1] / 256; // G
				imageData.data[j + 2] = processedImageArray[i + 2] / 256; // B
				imageData.data[j + 3] = 255; // A (fully opaque)
			}

			// Render the image data onto the canvas.
			ctx.putImageData(imageData, 0, 0);
		}
		scaleCanvasToFit(canvas, gridContainer);
	}

	// @ts-ignore
	function scaleCanvasToFit(canvas, container) {
		// Force the canvas to be block-level & centered
		canvas.style.display = 'block';
		canvas.style.margin = '0 auto';

		const containerWidth = container.clientWidth;
		const containerHeight = container.clientHeight;
		const canvasAspect = canvas.width / canvas.height;
		const containerAspect = containerWidth / containerHeight;

		// Decide whether we fill via height or width, then clamp with max-*
		if (containerAspect > canvasAspect) {
			// Container is relatively wider => fill container's height
			canvas.style.width = 'auto';
			canvas.style.height = '100%';
		} else {
			// Container is relatively taller => fill container's width
			canvas.style.width = '100%';
			canvas.style.height = 'auto';
		}

		// Also ensure it can’t overflow past container
		canvas.style.maxWidth = (parseInt(containerWidth) - 10 * containerAspect).toString() + 'px';
		canvas.style.maxHeight = (parseInt(containerHeight) - 10).toString() + 'px';
	}

	function updateGrid() {
		// @ts-ignore
		const count = gridContainer.children.length;
		if (count === 1) {
			// @ts-ignore
			gridContainer.style.gridTemplateColumns = '1fr';
			// @ts-ignore
			gridContainer.style.gridTemplateRows = '1fr';
		} else {
			// @ts-ignore
			gridContainer.style.gridTemplateColumns = `repeat(${2}, 1fr)`;
			// @ts-ignore
			gridContainer.style.gridTemplateRows = `repeat(${Math.ceil(count / 2)}, 1fr)`;
		}
	}

	// Initialize all variables as empty strings
	let cameraModel = '';
	let imageSize = '';
	let aperture = '';
	let iso = '';
	let shutterSpeed = '';

	/**
	 * @param {any} camInfos
	 */
	function setCameraInfo(camInfos) {
		cameraModel = camInfos['cameraModel'];
		imageSize = camInfos['width'] + ' x ' + camInfos['height'];
		aperture = 'f/' + new StringRounder(parseFloat((camInfos['aperture']).toFixed(4))).toString();
		iso = new StringRounder(camInfos['iso']).toString();
		shutterSpeed = new StringRounder(camInfos['shutterSpeed']).toString();
	}

	function emptyCameraInfo() {
		cameraModel = '';
		imageSize = '';
		aperture = '';
		iso = '';
		shutterSpeed = '';
	}

	function clearImages() {
		// Optional: stop any ongoing processing or workers if needed

		// Clear the global array
		currentFiles = [];

		if (dropzoneText && gridContainer) {
			// Clear the thumbnail grid
			gridContainer.innerHTML = '';

			// Show the dropzone text again
			dropzoneText.style.display = 'block';

			// Reset any bracket info displayed
			emptyCameraInfo();
			controller.callStoreFunc('clearImagePanel');
			// Desactiver bouton Reset zoom
			controller.callStoreFunc('deactivateResetZoomButton');
			// Afficher texte dans la dropzone
			showDropImageHereText();
		}
	}

	let imageIsLoading = false; // set to true to show the loader
	function showImageLoader() {
		imageIsLoading = true;
	}
	function showDropImageHereText() {
		imageIsLoading = false;
	}

	/**
	 * @param {File} file
	 * @returns {Promise<object>}
	 */
	function getExifData(file) {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onload = function (event) {
				try {
					// @ts-ignore
					const arrayBuffer = event.target.result;
					const tags = ExifReader.load(arrayBuffer);
					resolve(tags);
				} catch (error) {
					reject(error);
				}
			};

			reader.onerror = function (error) {
				reject(error);
			};

			reader.readAsArrayBuffer(file);
		});
	}
</script>

<div style="padding: 0 10.22px 0 7.22px;">
	<div id="dropzone">
		<div id="dropzone-text">
			{#if imageIsLoading}
				<small class="loader"></small>
			{:else}
				<small>Drop image here<br />or click to add</small>
			{/if}
		</div>
		<div id="gridContainer"></div>
	</div>
	<input
		type="file"
		id="fileInput"
		multiple
		accept=".tiff,.kdc,.3fr,.ari,.arw,.bay,.crw,.cr2,.cap,.dcr,.dng,.drf,.eip,.erf,.fff,.iiq,.k25,.kdc,.mdc,.mef,.mos,.mrw,.nef,.nrw,.obm,.orf,.pef,.ptx,.pxn,.r3d,.raf,.raw,.rw2,.rwl,.rwz,.sr2,.srf,.srw,.x3f,.hdr,.exr"
		style="display:none;"
	/>
	<div style="margin: 10 10 10 10; padding-top:10px;">
		<a
			on:click={clearImages}
			href="#0"
			class="small text-light clear-img-btn"
			style="text-decoration:none; font-size:x-small">Clear image</a
		>
	</div>

	<br />

	<div id="bracket-params" class="text-light" style="padding-top:0px;">
		<ul>
			<li>
				<span class="left">Camera</span>
				<span class="right">{cameraModel}</span>
			</li>
			<li>
				<span class="left">Image size</span>
				<span class="right">{imageSize}</span>
			</li>
			<li>
				<span class="left">Aperture</span>
				<span class="right">{aperture}</span>
			</li>
			<li>
				<span class="left">ISO</span>
				<span class="right">{iso}</span>
			</li>
			<li>
				<span class="left">Shutter speed</span>
				<span class="right">{shutterSpeed}</span>
			</li>
		</ul>
	</div>
</div>

<style>
	@import '$lib/assets/css/left-button.css';
	@import '$lib/assets/css/loader.css';

	#dropzone {
		width: 100%;
		height: 21vh;
		border: 2px solid #aaa;
		border-radius: 0px;
		position: relative;
		background-color: #eee;
		overflow: auto;
		cursor: pointer;
		-ms-overflow-style: none;
		scrollbar-width: none;
		background-color: #454545;
	}

	#dropzone::-webkit-scrollbar {
		display: none;
	}

	:global(#dropzone.dragover) {
		border-color: #333;
		background-color: #eee;
		color: #333;
	}

	#dropzone-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #aaa;
		pointer-events: none;
		text-align: center;
	}

	#gridContainer {
		width: 100%;
		height: 100%;
		/* Instead of display: grid, use a flex layout to center the child (canvas) */
		display: flex;
		align-items: center;
		justify-content: center;
		/* Optional: remove/adjust gap or margin if needed */
	}
	:global(#gridContainer canvas) {
		max-width: 100%;
		max-height: 100%;
		width: auto;
		height: auto;
		display: block;
		margin: auto;
	}

	:global(.image-wrapper) {
		position: relative;
		display: flex;
		justify-content: center;
		align-items: center;
		margin: 6px;
	}

	:global(.image-wrapper img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block !important;
		/* margin: 10px; */
	}

	:global(.image-overlay) {
		position: absolute;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 0.3s;
	}

	:global(.image-wrapper:hover .image-overlay) {
		opacity: 1;
	}

	:global(.delete-icon) {
		font-size: 9px;
		cursor: pointer;
		color: #eee;
		font-size: 20px;
		text-shadow:
			-1px -1px 0 black,
			1px -1px 0 black,
			-1px 1px 0 black,
			1px 1px 0 black;
	}

	:global(.delete-icon:hover) {
		font-size: 9px;
		cursor: pointer;
		color: black;
		font-size: 20px;
		text-shadow:
			-1px -1px 0 #eee,
			1px -1px 0 #eee,
			-1px 1px 0 #eee,
			1px 1px 0 #eee;
	}

	:global(.filename) {
		font-size: 12px;
		color: #eee;
		text-shadow:
			-1px -1px 0 black,
			1px -1px 0 black,
			-1px 1px 0 black,
			1px 1px 0 black;
		border-radius: 0px;
		overflow-x: hidden;
	}
	.text-light {
		color: #eee;
	}
	.small {
		font-size: smaller;
	}
	:global(p) {
		line-height: 1.278;
	}
	ul {
		list-style-type: none;
		padding: 0;
		font-size: x-small;
	}
	ul > li {
		display: flex;
		justify-content: space-between;
		padding: 10px 0;
		border-bottom: 1px solid #ddd;
	}
	li > .left {
		text-align: left;
	}
	li > .right {
		text-align: right;
	}
</style>
