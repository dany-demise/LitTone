<script>
	// @ts-nocheck

	import GUI from '$lib/domain/utils/lil-gui.esm';
	import { Controller } from '$lib/domain/controller';
	import { onMount } from 'svelte';

	let controller;
	let gui;

	let hableParams;

	onMount(() => {
		controller = Controller.getInstance();
		hableParams = controller.getDefaultHableFilmicParams();

		const imageParams = new GUI({
			title: 'Image Parameters',
			container: document.getElementById('hable-filmic-params')
		});
        
        const whiteBalance = new GUI({
			title: 'White balance',
			container: document.getElementById('hable-filmic-params')
		});

		const toneCurve = new GUI({
			title: 'Filmic tone curve',
			container: document.getElementById('hable-filmic-params')
		});

		// Create parameter groups
		// const imageParams = gui.addFolder("Image parameters");
		// const toneCurve = gui.addFolder("Tone curve parameters");

		// Add controls to Image parameters folder
		imageParams
			.add(hableParams, 'saturation', 0, 2, 0.01)
			.name('Saturation')
			.onChange(applyTonemap);
		imageParams
			.add(hableParams, 'exposureBias', -5, 5, 0.01)
			.name('Exposure Bias')
			.onChange(applyTonemap);
		imageParams.add(hableParams, 'contrast', 0, 2, 0.01).name('Contrast').onChange(applyTonemap);


		whiteBalance.add(hableParams, 'redWhiteBalance', 0, 2, 0.01).name('Red').onChange(applyTonemap);
		whiteBalance.add(hableParams, 'greenWhiteBalance', 0, 2, 0.01).name('Green').onChange(applyTonemap);
		whiteBalance.add(hableParams, 'blueWhiteBalance', 0, 2, 0.01).name('Blue').onChange(applyTonemap);

		// Add controls to Tone curve parameters folder
		toneCurve
			.add(hableParams, 'toeStrength', 0, 1, 0.01)
			.name('Toe Strength')
			.onChange(applyTonemap);
		toneCurve.add(hableParams, 'toeLength', 0, 1, 0.01).name('Toe Length').onChange(applyTonemap);
		toneCurve
			.add(hableParams, 'shoulderStrength', 0, 1, 0.01)
			.name('Shoulder str.')
			.onChange(applyTonemap);
		toneCurve
			.add(hableParams, 'shoulderLength', 0, 1, 0.01)
			.name('Shoulder Length')
			.onChange(applyTonemap);
		toneCurve
			.add(hableParams, 'shoulderAngle', 0, 1, 0.01)
			.name('Shoulder Angle')
			.onChange(applyTonemap);
		toneCurve.add(hableParams, 'gamma', 0.1, 3, 0.01).name('Gamma').onChange(applyTonemap);
		toneCurve.add(hableParams, 'postGamma', 0.1, 3, 0.01).name('Post Gamma').onChange(applyTonemap);

		// Hide the main title element using JavaScript
	});

	function applyTonemap() {
		controller.setHableFilmicParams(hableParams);
		controller.generateTonemapHableFilmic();
	}
</script>

<div id="hable-filmic-params"></div>
