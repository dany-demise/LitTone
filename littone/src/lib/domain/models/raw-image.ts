export class RawImage {
    private _data: Uint16Array;
    private _width: number;
    private _height: number;

    constructor(data: Uint16Array, width: number, height: number) {
        this._data = data;
        this._width = width;
        this._height = height;
    }

    get data(): Uint16Array {
        return this._data;
    }

    set data(data: Uint16Array) {
        this._data = data;
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
