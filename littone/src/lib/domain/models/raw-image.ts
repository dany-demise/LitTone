export class RawImage {
    private _data: Float32Array;
    private _width: number;
    private _height: number;

    constructor(data: Uint16Array, width: number, height: number) {
        this._data = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
            this._data[i] = data[i];
        }
        this._width = width;
        this._height = height;
    }

    get data(): Float32Array {
        return this._data;
    }

    get width(): number {
        return this._width;
    }

    set width(width: number) {
        this._width = width;
    }

    get height(): number {
        return this._height;
    }

    set height(height: number) {
        this._height = height;
    }
}
