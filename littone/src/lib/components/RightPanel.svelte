<script>
    // @ts-nocheck

    import GUI from "$lib/domain/utils/lil-gui.esm";
    import { Controller } from "$lib/domain/controller";
    import { onMount } from "svelte";

    let controller;
    let gui;

    const hableParams = {
        saturation: 1.0,
        exposureBias: 0.0,
        contrast: 1.0,
        toeStrength: 0.0,
        toeLength: 0.5,
        shoulderStrength: 0.0,
        shoulderLength: 0.5,
        shoulderAngle: 0.0,
        gamma: 1.0,
        postGamma: 1.0,
    };

    onMount(() => {
        controller = Controller.getInstance();

        const imageParams = new GUI({
            title: "Image Parameters",
            container: document.getElementById("hable-filmic-params"),
        });

        const toneCurve = new GUI({
            title: "Tone curve parameters",
            container: document.getElementById("hable-filmic-params"),
        });

        // Create parameter groups
        // const imageParams = gui.addFolder("Image parameters");
        // const toneCurve = gui.addFolder("Tone curve parameters");

        // Add controls to Image parameters folder
        imageParams.add(hableParams, "saturation", 0, 2, 0.01).name("Saturation").onChange(applyTonemap);
        imageParams.add(hableParams, "exposureBias", -5, 5, 0.01).name("Exposure Bias").onChange(applyTonemap);
        imageParams.add(hableParams, "contrast", 0, 2, 0.01).name("Contrast").onChange(applyTonemap);

        // Add controls to Tone curve parameters folder
        toneCurve.add(hableParams, "toeStrength", 0, 1, 0.01).name("Toe Strength").onChange(applyTonemap);
        toneCurve.add(hableParams, "toeLength", 0, 1, 0.01).name("Toe Length").onChange(applyTonemap);
        toneCurve.add(hableParams, "shoulderStrength", 0, 1, 0.01).name("Shoulder Strength").onChange(applyTonemap);
        toneCurve.add(hableParams, "shoulderLength", 0, 1, 0.01).name("Shoulder Length").onChange(applyTonemap);
        toneCurve.add(hableParams, "shoulderAngle", 0, 1, 0.01).name("Shoulder Angle").onChange(applyTonemap);
        toneCurve.add(hableParams, "gamma", 0.1, 3, 0.01).name("Gamma").onChange(applyTonemap);
        toneCurve.add(hableParams, "postGamma", 0.1, 3, 0.01).name("Post Gamma").onChange(applyTonemap);

        // Hide the main title element using JavaScript

    });

    function applyTonemap() {
        controller.generateTonemapHableFilmic(hableParams);
    }
</script>

<div id="hable-filmic-params"></div>
