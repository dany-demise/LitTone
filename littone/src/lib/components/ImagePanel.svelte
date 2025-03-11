<script>
    import { Controller } from "$lib/domain/controller";
    import { onMount } from "svelte";

    /**
     * @type {Controller}
     */
    let controller;

    /**
     * @type {HTMLCanvasElement} e
     */
    let imagePanelCanvas;

    /**
     * @type {HTMLDivElement} e
     */
    let imagePanel;

    /**
     * @param {string} pixelString
     * @param {number} increment
     */
    function addPixel(pixelString, increment) {
        const number = parseFloat(pixelString);
        return `${number + increment}px`;
    }

    onMount(() => {
        controller = Controller.getInstance();
        controller.globalStore.set("resetZoom", resetCanvasZoom);
        controller.globalStore.set("clearImagePanel", clearImagePanel);
        controller.globalStore.set("showImagePanel", showImagePanel);
        // @ts-ignore
        imagePanelCanvas = document.getElementById("image-canvas");
        controller.globalStore.set("getImagePanelCanvas", getImagePanelCanvas);
        // @ts-ignore
        imagePanel = document.getElementById("editor-panel");
    });

    function getImagePanelCanvas() {
        return imagePanelCanvas;
    }
    function clearImagePanel() {
        imagePanelCanvas.hidden = true;
    }
    function showImagePanel() {
        imagePanelCanvas.hidden = false;
    }

    let isMouseDown = false;
    function editorMouseUp() {
        isMouseDown = false;
    }
    function editorMouseDown() {
        isMouseDown = true;
    }

    // Store "logical" size so we don’t keep calling getBoundingClientRect()

    /**
     * @type {number}
     */
    let zoomScale = 1.0;

    /**
     * @param {WheelEvent} e
     */
    function editorWheel(e) {
        e.preventDefault();

        // Zoom in if deltaY < 0, otherwise zoom out
        if (e.deltaY < 0 && zoomScale < 1000) {
            zoomScale *= 1.0728;
        } else if (e.deltaY > 0 && zoomScale > 0.01) {
            zoomScale *= 1 / 1.15;
        }

        // We still need the mouse pointer’s offset in *current* screen coords
        const rect = imagePanelCanvas.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;
        const ratioX = offsetX / rect.width;
        const ratioY = offsetY / rect.height;

        // Compute new logical sizes
        if (!controller.rawImage) {
            return;
        }
        const wh = {
            width: controller.rawImage?.width,
            height: controller.rawImage?.height
        };
        const newWidth = wh?.width * zoomScale;
        const newHeight = wh?.height * zoomScale;

        // Get current CSS position (defaulting to 0 if unset)
        const currentLeft = parseFloat(imagePanelCanvas.style.left) || 0;
        const currentTop = parseFloat(imagePanelCanvas.style.top) || 0;

        // Keep the cursor position fixed
        const newLeft = currentLeft - (newWidth - rect.width) * ratioX;
        const newTop = currentTop - (newHeight - rect.height) * ratioY;

        // Apply
        imagePanelCanvas.style.width = `${newWidth}px`;
        imagePanelCanvas.style.height = `${newHeight}px`;
        imagePanelCanvas.style.left = `${newLeft}px`;
        imagePanelCanvas.style.top = `${newTop}px`;
    }

    /**
     * @param {MouseEvent} e
     */
    function editorDrag(e) {
        if (isMouseDown && controller.rawImage) {
            imagePanelCanvas.style.top = addPixel(
                imagePanelCanvas.style.top,
                e.movementY,
            );
            imagePanelCanvas.style.left = addPixel(
                imagePanelCanvas.style.left,
                e.movementX,
            );
        }
    }

    /**
     * @param {number} realWidth
     * @param {number} newDisplayWidth
     */
    function setZoomScale(realWidth, newDisplayWidth) {
        // When zoom is reseted we need to readjust zoom scale with new canvas width
        const adjustRatio = newDisplayWidth / realWidth;
        zoomScale = 1.0 * adjustRatio;
    }

    function resetCanvasSize() {
        // Compute new logical sizes
        if (!controller.rawImage) {
            return;
        }
        let width = controller.rawImage.width;
        let height = controller.rawImage.height;

        // Recalculate the display size using the current zoomScale
        const newWidth = width * zoomScale;
        const newHeight = height * zoomScale;

        // Optionally adjust position (commented out below):
        // luminanceCanvas.style.top = '0px';
        // luminanceCanvas.style.left = '0px';

        imagePanelCanvas.style.width = `${newWidth}px`;
        imagePanelCanvas.style.height = `${newHeight}px`;
    }

    function resetCanvasZoom() {
        // Get editor panel dimensions
        const editorRect = imagePanel.getBoundingClientRect();
        const editorWidth = editorRect.width;
        const editorHeight = editorRect.height;

        // Get theoretical canvas dimensions from bracket
        if (!controller.rawImage) {
            return;
        }
        const canvasWidth = controller.rawImage.width;
        const canvasHeight = controller.rawImage.height;
        if (!canvasWidth || !canvasHeight) return;

        // Calculate aspect ratios
        const editorRatio = editorWidth / editorHeight;
        const canvasRatio = canvasWidth / canvasHeight;

        // Determine whether to match width or height
        if (editorRatio > canvasRatio) {
            // Editor is wider than canvas aspect ratio - canvas should take full height
            const newWidth = (editorHeight - 10) * canvasRatio;
            const newHeight = editorHeight - 10;
            const newPositionLeft = (editorWidth - newWidth) / 2; // 5px loose on each side
            const newPositionTop = (editorHeight - newHeight) / 2;

            imagePanelCanvas.style.width = `${newWidth}px`;
            imagePanelCanvas.style.height = `${newHeight}px`;
            imagePanelCanvas.style.left = `${newPositionLeft}px`;
            imagePanelCanvas.style.top = `${newPositionTop}px`;
            setZoomScale(canvasWidth, newWidth);
            resetCanvasSize();
        } else {
            // Editor is taller than canvas aspect ratio - canvas should take full width
            const newWidth = editorWidth - 10;
            const newHeight = (editorWidth - 10) / canvasRatio;
            const newPositionLeft = (editorWidth - newWidth) / 2; // 5px loose on each side
            const newPositionTop = (editorHeight - newHeight) / 2;

            imagePanelCanvas.style.width = `${newWidth}px`;
            imagePanelCanvas.style.height = `${newHeight}px`;
            imagePanelCanvas.style.left = `${newPositionLeft}px`;
            imagePanelCanvas.style.top = `${newPositionTop}px`;
            setZoomScale(canvasWidth, newWidth);
            resetCanvasSize();
        }
    }

    function generateTonemappedImage() {
        
    }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
    on:mousedown={editorMouseDown}
    on:mouseleave={editorMouseUp}
    on:mouseup={editorMouseUp}
    on:mousemove={editorDrag}
    on:wheel={editorWheel}
    id="editor-panel"
    style="height: 100%; width:100%;position: relative;"
>
    <!-- The canvas -->
    <canvas
        id="image-canvas"
        style="top: 0px;left: 0px;"
        width="100px"
        height="100px"
    >
    </canvas>
</div>

<style>
    .text-light {
        color: #eee;
    }
    #editor-panel {
        overflow: hidden;
        background-color: #171717;
    }
    #image-canvas {
        position: absolute;
        /* border: 1px solid white; */
        /* max-width: 1200px;
        max-height: 675px;  */
    }
</style>
