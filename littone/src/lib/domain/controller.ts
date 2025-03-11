import { RawImage } from "$lib/domain/models/raw-image";
import { WebGPUImageProcessor } from "./image-processing/webgpu/webgpu-image-processing";
import type { HableFilmicParams } from "./interfaces";
import { ActionManager } from "$lib/domain/models/action-manager";

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
    callStoreFunc(funcName: string) {
        const func = this.globalStore.get(funcName);
        if (typeof func === "function") {
            func();
        }
    }

    // Controller attributes
    private _rawImage: RawImage | undefined;
    private wGpuImgProc: WebGPUImageProcessor = new WebGPUImageProcessor();
    private actionManager = ActionManager.getInstance();
    private hableFilmicParams: HableFilmicParams = this.getDefaultHableFilmicParams();

    // Controller methods
    get rawImage(): RawImage | undefined {
        return this._rawImage;
    }

    setRawImage(data: Uint16Array, width: number, height: number) {
        this._rawImage = new RawImage(data, width, height);
        const canvasCall = this.globalStore.get('getImagePanelCanvas');
        if (canvasCall) {
            const canvas = canvasCall();
            this.wGpuImgProc.setTonemapCanvasContext(
                canvas, this._rawImage.width, this._rawImage.height
            );
        }
        // Activate Reset zoom button on top
        this.callStoreFunc('activateResetZoomButton');
    }

    async generateTonemapHableFilmic() {
        this.actionManager.pushAction(() => this.generateTonemapHableFilmicReal(structuredClone(this.hableFilmicParams)));
    }

    async generateTonemapHableFilmicReal(params: HableFilmicParams) {
        if (this._rawImage) {
            this.wGpuImgProc.generateTonemapHableFilmicInTilesFromRaw(
                this._rawImage.data, params
            );
        }
    }

    setHableFilmicParams(params:HableFilmicParams) {
        this.hableFilmicParams = params;
    }

    getDefaultHableFilmicParams() {
        return {
            saturation: 1.0,
            exposureBias: 0.0,
            contrast: 1.0,
            redWhiteBalance: 1.0,
            greenWhiteBalance: 1.0,
            blueWhiteBalance: 1.0,
            toeStrength: 0.25,
            toeLength: 0.5,
            shoulderStrength: 0.25,
            shoulderLength: 0.5,
            shoulderAngle: 0.25,
            gamma: 1.0,
            postGamma: 1.0
        };
    }
}