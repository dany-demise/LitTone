import { RawImage } from "$lib/domain/models/raw-image";
import { WebGPUImageProcessor } from "./image-processing/webgpu/webgpu-image-processing";
import type { HableFilmicParams } from "./interfaces";

// Singleton controller class
export class Controller {
    // Singleton class attributes and methods
    private static _instance: Controller;
    private constructor() { }
    public static getInstance() {
        if (this._instance) { return this._instance; }
        else { this._instance = new this(); return this._instance; }
    }

    // Global store de fonctions
    globalStore: Map<string, Function> = new Map();

    // Controller attributes
    private _rawImage: RawImage | undefined;
    private wGpuImgProc: WebGPUImageProcessor = new WebGPUImageProcessor();
    private lastActionTimestamp: number = 0;

    // Controller methods

    get rawImage(): RawImage | undefined {
        return this._rawImage;
    }

    setRawImage(data: Uint16Array, width: number, height: number) {
        this._rawImage = new RawImage(data, width, height);
    }

    async generateTonemapHableFilmic(canvasId: string, params: HableFilmicParams) {
        console.log(canvasId)
        const canvasCall = this.globalStore.get('getImagePanelCanvas');
        if (canvasCall)  { 
            const canvas = canvasCall();//document.getElementById(canvasId) as HTMLCanvasElement;
            console.log(canvas)
            if (!this._rawImage) { return; }
            console.log(this._rawImage.width);
            this.wGpuImgProc.setTonemapCanvasContext(
                canvas, this._rawImage.width, this._rawImage.height
            );
            this.wGpuImgProc.generateTonemapHableFilmicInTilesFromRaw(
                this._rawImage.data, params
            );
        }
        
    }

    async goPing() {
        const tempLastActionTimestamp:number = this.lastActionTimestamp;
        this.lastActionTimestamp = performance.now(); 
        // Simulate some delay (for example, using setTimeout)
        const elapsedTime = this.lastActionTimestamp - tempLastActionTimestamp;
        if (elapsedTime > 1000 / 30) {  // 1/30 of a second (≈33.33ms)
            console.log("Timestamp is older than 1/30th of a second.");
        } else {
            console.log("Timestamp is still fresh.");
        }
    }
}