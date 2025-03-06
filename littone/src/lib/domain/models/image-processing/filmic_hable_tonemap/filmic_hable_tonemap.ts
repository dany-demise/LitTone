import type { HableFilmicParams } from '$lib/domain/interfaces';
import createFilmicModule from '$lib/domain/models/image-processing/filmic_hable_tonemap/filmic_es6';

export class HableFilmicTonemap {
    private filmicModule:any | null = null;
    private tonemap:any | null = null;
    constructor() {}

    async load() {
        if (!this.tonemap && !this.filmicModule) { 
            this.filmicModule = await createFilmicModule();
            this.tonemap = await new this.filmicModule.FilmicWrapper();
            this.tonemap.resetUserParams();
        }
    }

    async resetUserParams() {
        this.tonemap.resetUserParams();
    }

    async getRgbCurves(): Promise<number[][]> {
        return this.tonemap.getRgbCurves();
    }

    async getShaderParams() {
        return this.tonemap.getShaderParams();
    }

    async setUserParams(params: HableFilmicParams) {
        this.tonemap.setUserParams(
            params.saturation,
            params.exposureBias,
            params.contrast,
            params.toeStrength,
            params.toeLength,
            params.shoulderStrength,
            params.shoulderLength,
            params.shoulderAngle,
            params.gamma,
            params.postGamma
        );
    }
}