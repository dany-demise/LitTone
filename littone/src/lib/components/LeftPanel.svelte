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

        gui = new GUI({
            title: "Hable Filmic Parameters",
            container: document.getElementById("hable-filmic-params"),
        });

        gui.add(hableParams, "saturation", 0, 2, 0.01).name("Saturation").onChange(applyTonemap);
        gui.add(hableParams, "exposureBias", -5, 5, 0.01).name("Exposure Bias").onChange(applyTonemap);
        gui.add(hableParams, "contrast", 0, 2, 0.01).name("Contrast").onChange(applyTonemap);
        gui.add(hableParams, "toeStrength", 0, 1, 0.01).name("Toe Strength").onChange(applyTonemap);
        gui.add(hableParams, "toeLength", 0, 1, 0.01).name("Toe Length").onChange(applyTonemap);
        gui.add(hableParams, "shoulderStrength", 0, 1, 0.01).name("Shoulder Strength").onChange(applyTonemap);
        gui.add(hableParams, "shoulderLength", 0, 1, 0.01).name("Shoulder Length").onChange(applyTonemap);
        gui.add(hableParams, "shoulderAngle", 0, 1, 0.01).name("Shoulder Angle").onChange(applyTonemap);
        gui.add(hableParams, "gamma", 0.1, 3, 0.01).name("Gamma").onChange(applyTonemap);
        gui.add(hableParams, "postGamma", 0.1, 3, 0.01).name("Post Gamma").onChange(applyTonemap);

        gui.add(hableParams, "applyTonemap").name("Apply Tonemap");
    });

    function applyTonemap() {
        // controller.applyHableFilmicTonemap(hableParams);
        console.log("Applied Hable Filmic Parameters", hableParams);
    }
</script>

<div id="hable-filmic-params"></div>
