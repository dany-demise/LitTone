import { RawImage } from "$lib/domain/models/raw-image";

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
    
    // Controller methods
    setupLibrawWorker() {
    }
    processRawImage() {
    }
    get rawImage(): RawImage | undefined {
        return this._rawImage;
    }
    setRawImage(data: Uint16Array, width:number, height:number ) {
        this._rawImage = new RawImage(data, width, height);
    }
}