export class RawImage {
    private _data: Uint16Array;

    constructor(data: Uint16Array) {
        this._data = data;
    }

    get data(): Uint16Array {
        return this._data;
    }

    set data(data: Uint16Array) {
        this._data = data;
    }
}
