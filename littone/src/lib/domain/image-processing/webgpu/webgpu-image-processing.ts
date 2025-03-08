import { HableFilmicTonemap } from '$lib/domain/image-processing/filmic-hable-tonemap/filmic-hable-tonemap';
import type { HableFilmicParams } from '$lib/domain/interfaces';

// Shader code
const tonemapHableFilmicShaderCodeRaw2: string = `
struct Uniforms {
    width: f32,
    height: f32,
    hdrMin: f32,
    hdrMax: f32,
    linColorFilterExposureR: f32,
    linColorFilterExposureG: f32,
    linColorFilterExposureB: f32,
    luminanceWeightsR: f32,
    luminanceWeightsG: f32,
    luminanceWeightsB: f32,
	saturation: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> dataArray: array<f32>;
@group(0) @binding(2) var<storage, read> rgbCurves: array<f32>; // New binding for RGB curves

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
}

@vertex
fn vertexMain(@location(0) position: vec2<f32>,
              @location(1) texCoord: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(position, 0.0, 1.0);
    output.texCoord = texCoord;
    return output;
}

// Sample a 1D curve
fn sample_table(norm_x: f32, offset: i32) -> f32 {
    let size = 255.0;
    let x = norm_x * size + 0.5;
    let base_index = max(0.0, floor(x - 0.5));
    let t = (x - 0.5) - base_index;
    let x0 = max(0.0, min(base_index, size));
    let x1 = max(0.0, min(base_index + 1.0, size));

    let v0 = rgbCurves[offset + i32(x0)];
    let v1 = rgbCurves[offset + i32(x1)];

    return v0 * (1.0 - t) + v1 * t;
}

// Evaluate color using filmic color grading parameters
fn eval_color(src_color: vec3<f32>, u: Uniforms) -> vec3<f32> {
    var rgb = src_color;
    // exposure and color filter
    rgb *= vec3(
        u.linColorFilterExposureR,
        u.linColorFilterExposureG,
        u.linColorFilterExposureB
    );

    let luminanceWeights = vec3(
        u.luminanceWeightsR,
        u.luminanceWeightsG,
        u.luminanceWeightsB
    );

    // saturation
    let grey = dot(rgb, luminanceWeights);
    rgb = vec3<f32>(grey) + u.saturation * (rgb - vec3<f32>(grey));

    rgb.x = sqrt(rgb.x);
    rgb.y = sqrt(rgb.y);
    rgb.z = sqrt(rgb.z);

    // contrast, filmic curve, gamma
    rgb.x = sample_table(rgb.x, 0);
    rgb.y = sample_table(rgb.y, 256);
    rgb.z = sample_table(rgb.z, 512);

    return rgb;
}
    
@fragment
fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
    // Map texture coordinates to the full viewport
    let x = u32(texCoord.x * uniforms.width);
    let y = u32(texCoord.y * uniforms.height);
    // Check bounds to avoid accessing out-of-bounds elements
    if (x >= u32(uniforms.width) || y >= u32(uniforms.height)) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color for out-of-bounds
    }

    let dataSize = arrayLength(&dataArray);
    
    let index = (y * u32(uniforms.width) + x) * 3u;
    if (index >= dataSize) { // for CRF
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red for out-of-bounds
    }

    // Read HDR color in RGB order
    let R_hdr = (dataArray[index + 0u] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);
    let G_hdr = (dataArray[index + 1u] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);
    let B_hdr = (dataArray[index + 2u] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);

    var rgb = vec3(R_hdr, G_hdr, B_hdr);
    var rgb = eval_color(rgb, uniforms);

    return vec4<f32>(rgb, 1.0);
}
`;

// Optimized Shader Code
const tonemapHableFilmicShaderCodeRaw = `
struct Uniforms {
    width: f32,
    height: f32,
    hdrMin: f32,
    hdrMax: f32,
    linColorFilterExposureR: f32,
    linColorFilterExposureG: f32,
    linColorFilterExposureB: f32,
    luminanceWeightsR: f32,
    luminanceWeightsG: f32,
    luminanceWeightsB: f32,
	saturation: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> dataArray: array<f32>;
@group(0) @binding(2) var<storage, read> rgbCurves: array<f32>;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) texCoord: vec2<f32>,
}

@vertex
fn vertexMain(@location(0) position: vec2<f32>,
              @location(1) texCoord: vec2<f32>) -> VertexOutput {
    var output: VertexOutput;
    output.position = vec4<f32>(position, 0.0, 1.0);
    output.texCoord = texCoord;
    return output;
}

fn sample_table(norm_x: f32, offset: u32) -> f32 {
    let idx = clamp(u32(norm_x * 255.0), 0u, 255u);
    return rgbCurves[offset + idx];
}

fn eval_color(rgb: vec3<f32>, u: Uniforms) -> vec3<f32> {
    var color = rgb * vec3(u.linColorFilterExposureR, u.linColorFilterExposureG, u.linColorFilterExposureB);
    let grey = dot(rgb, vec3(u.luminanceWeightsR, u.luminanceWeightsG, u.luminanceWeightsB));
    let saturated_rgb = vec3<f32>(grey) + u.saturation * (color - vec3<f32>(grey));
    return vec3(
        sample_table(saturated_rgb.x, 0u),
        sample_table(saturated_rgb.y, 256u),
        sample_table(saturated_rgb.z, 512u)
    );
}

@fragment
fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
    let x = u32(texCoord.x * uniforms.width);
    let y = u32(texCoord.y * uniforms.height);

    if (x >= u32(uniforms.width) || y >= u32(uniforms.height)) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
    }

    let index = (y * u32(uniforms.width) + x) * 3u;
    let R_hdr = (dataArray[index] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);
    let G_hdr = (dataArray[index + 1u] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);
    let B_hdr = (dataArray[index + 2u] - uniforms.hdrMin) / (uniforms.hdrMax - uniforms.hdrMin);

    let rgb = eval_color(vec3(R_hdr, G_hdr, B_hdr), uniforms);
    return vec4<f32>(rgb, 1.0);
}`


export class WebGPUImageProcessor {
    private device: GPUDevice | null = null;
    private tonemapCanvasContext: GPUCanvasContext | null = null;
    private width: number = 0;
    private height: number = 0;
    private hdrRenderPipeline: GPURenderPipeline | null = null;
    private tonemapHableFilmicRenderPipeline: GPURenderPipeline | null = null;
    private vertexBuffer: GPUBuffer | null = null;
    private numberOfTiles: number = 0;
    private hableFilmicTonemap: HableFilmicTonemap = new HableFilmicTonemap();

    constructor() { this.initialize(); }

    async initialize(): Promise<void> {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported');
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('No adapter found');
        }
        this.device = await adapter.requestDevice();
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        // Create render pipeline and vertex buffer
        const vertices = new Float32Array([
            -1, -1, 0, 1,
            1, -1, 1, 1,
            -1, 1, 0, 0,
            1, 1, 1, 0,
        ]);
        
        this.vertexBuffer = this.device.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        });

        new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
        this.vertexBuffer.unmap();

        this.tonemapHableFilmicRenderPipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: this.device.createShaderModule({ code: tonemapHableFilmicShaderCodeRaw }),
                entryPoint: 'vertexMain',
                buffers: [{
                    arrayStride: 16,
                    attributes: [
                        { format: 'float32x2', offset: 0, shaderLocation: 0 },
                        { format: 'float32x2', offset: 8, shaderLocation: 1 }
                    ],
                }],
            },
            fragment: {
                module: this.device.createShaderModule({ code: tonemapHableFilmicShaderCodeRaw }),
                entryPoint: 'fragmentMain',
                targets: [{ format: canvasFormat }],
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: undefined,
            },
        });

    }

    setTonemapCanvasContext(canvas: HTMLCanvasElement, width:number, height:number) {
        this.width = width;
        this.height = height;
        if (!this.tonemapCanvasContext) {
            canvas.width = width;
            canvas.height = height;
            this.tonemapCanvasContext = canvas.getContext('webgpu') as GPUCanvasContext;
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            if (this.device) {
                this.tonemapCanvasContext.configure({
                    device: this.device,
                    format: canvasFormat,
                    alphaMode: 'premultiplied',
                });
            }
        }
    }

    getNumberOfTiles(): number {
        let numberOfTiles = 3; // minimum 3 tiles
        while (this.height % numberOfTiles != 0) {
            numberOfTiles += 1;
        }
        return numberOfTiles;
    }

    async generateTonemapHableFilmicInTiles(
        inputArray: Float32Array,
        hdrMin: number, hdrMax: number,
        params: HableFilmicParams
    ) {
        await this.hableFilmicTonemap.load();
        await this.hableFilmicTonemap.setUserParams(params);
        const rgbCurves = await this.hableFilmicTonemap.getRgbCurves();
        const shaderParams = await this.hableFilmicTonemap.getShaderParams();

        // Creation du array res responses curves RGB
        let rgbCurveArray = [];
        for (let channel of [0, 1, 2]) {
            for (let j = 0; j < 256; j++) {
                const point = rgbCurves[j][channel];
                rgbCurveArray.push(point);
            }
        }

        if (!this.device) {
            throw new Error('Device not initialized');
        }

        // --- 1) Split the array into 3 chunks ---
        const chunkSize = Math.floor(inputArray.length / this.numberOfTiles);
        let chunks: Array<Float32Array> = [];
        for (let i = 0; i < this.numberOfTiles; i++) {
            chunks.push(inputArray.subarray(i * chunkSize, (i + 1) * chunkSize));
        }

        // We'll accumulate commands for all three passes here
        const commandEncoder = this.device.createCommandEncoder();

        // We'll clear the canvas only on the *first* pass
        // so that subsequent passes do not erase what's already drawn
        let currentLoadOp: GPULoadOp = 'clear';

        // --- 2) Loop over each chunk and issue a separate render pass ---
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Create a uniform buffer with (width, height, lowerBound, upperBound, gamma)
            const uniformBuffer = this.device.createBuffer({
                size: 11 * 4, // 11 floats * 4 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(uniformBuffer.getMappedRange()).set([
                this.width,
                this.height / this.numberOfTiles,
                hdrMin,
                hdrMax,
                shaderParams.linColorFilterExposure[0],
                shaderParams.linColorFilterExposure[1],
                shaderParams.linColorFilterExposure[2],
                shaderParams.luminanceWeights[0],
                shaderParams.luminanceWeights[1],
                shaderParams.luminanceWeights[2],
                shaderParams.saturation
            ]);
            uniformBuffer.unmap();

            // chunk.splice(chunk.length, 0, ...rgbCurveArray);

            // Create buffer for the current subarray
            const inputBuffer = this.device.createBuffer({
                size: chunk.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(inputBuffer.getMappedRange()).set(chunk);
            inputBuffer.unmap();

            const rgbCurvesBuffer = this.device.createBuffer({
                size: (new Float32Array(rgbCurveArray)).byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(rgbCurvesBuffer.getMappedRange()).set(rgbCurveArray);
            rgbCurvesBuffer.unmap();


            // Create the bind group (reuse the same pipeline but different data each time)
            const renderBindGroup = this.device.createBindGroup({
                layout: this.tonemapHableFilmicRenderPipeline!.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: { buffer: inputBuffer } },
                    { binding: 2, resource: { buffer: rgbCurvesBuffer } }, // New binding
                ],
            });


            // Begin the render pass
            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.tonemapCanvasContext!.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: currentLoadOp, // 'clear' first time, 'load' after
                        storeOp: 'store',
                    },
                ],
            });
            const tileHeight = this.height / this.numberOfTiles;

            renderPass.setPipeline(this.tonemapHableFilmicRenderPipeline!);
            renderPass.setBindGroup(0, renderBindGroup);
            renderPass.setVertexBuffer(0, this.vertexBuffer!);

            // --- 3) Position each tile in one-third of the canvas width ---
            // This sets the viewport so each sub-draw goes into its own horizontal slice.          
            // For chunk i = 0, 1, 2
            renderPass.setViewport(
                0,                 // x offset
                tileHeight * i,    // y offset changes so each chunk is a horizontal band
                this.width,        // entire width
                this.height / this.numberOfTiles, // tileHeight * 3,        // just 1/3 of the height
                0.0,
                1.0
            );

            // Draw
            renderPass.draw(4);
            renderPass.end();

            // For all subsequent chunks, preserve existing draws
            currentLoadOp = 'load';
        }

        // Submit all passes at once
        this.device.queue.submit([commandEncoder.finish()]);
    }

    async generateTonemapHableFilmicInTilesFromRaw(
        inputArray: Float32Array,
        params: HableFilmicParams
    ) {
        const hdrMin = 0.0;
        const hdrMax = 65536.0;
        if (this.numberOfTiles == 0) {
            this.numberOfTiles = this.getNumberOfTiles();
        }

        // const uint16Array = new Float16Array([1, 2, 3, 65535]);
        
        // console.log(inputArray);

        await this.hableFilmicTonemap.load();
        await this.hableFilmicTonemap.setUserParams(params);
        const rgbCurves = await this.hableFilmicTonemap.getRgbCurves();
        const shaderParams = await this.hableFilmicTonemap.getShaderParams();

        // Creation du array res responses curves RGB
        let rgbCurveArray = [];
        for (let channel of [0, 1, 2]) {
            for (let j = 0; j < 256; j++) {
                const point = rgbCurves[j][channel];
                rgbCurveArray.push(point);
            }
        }

        if (!this.device) {
            throw new Error('Device not initialized');
        }

        // --- 1) Split the array into 3 chunks ---
        const chunkSize = Math.floor(inputArray.length / this.numberOfTiles);
        let chunks: Array<Float32Array> = [];
        for (let i = 0; i < this.numberOfTiles; i++) {
            chunks.push(inputArray.subarray(i * chunkSize, (i + 1) * chunkSize));
        }

        // We'll accumulate commands for all three passes here
        const commandEncoder = this.device.createCommandEncoder();

        // We'll clear the canvas only on the *first* pass
        // so that subsequent passes do not erase what's already drawn
        let currentLoadOp: GPULoadOp = 'clear';

        // --- 2) Loop over each chunk and issue a separate render pass ---
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];

            // Create a uniform buffer with (width, height, lowerBound, upperBound, gamma)
            const uniformBuffer = this.device.createBuffer({
                size: 11 * 4, // 11 floats * 4 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(uniformBuffer.getMappedRange()).set([
                this.width,
                this.height / this.numberOfTiles,
                hdrMin,
                hdrMax,
                shaderParams.linColorFilterExposure[0],
                shaderParams.linColorFilterExposure[1],
                shaderParams.linColorFilterExposure[2],
                shaderParams.luminanceWeights[0],
                shaderParams.luminanceWeights[1],
                shaderParams.luminanceWeights[2],
                shaderParams.saturation
            ]);
            uniformBuffer.unmap();

            // Create buffer for the current subarray
            const inputBuffer = this.device.createBuffer({
                size: chunk.byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(inputBuffer.getMappedRange()).set(chunk);
            inputBuffer.unmap();

            const rgbCurvesBuffer = this.device.createBuffer({
                size: (new Float32Array(rgbCurveArray)).byteLength,
                usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(rgbCurvesBuffer.getMappedRange()).set(rgbCurveArray);
            rgbCurvesBuffer.unmap();


            // Create the bind group (reuse the same pipeline but different data each time)
            const renderBindGroup = this.device.createBindGroup({
                layout: this.tonemapHableFilmicRenderPipeline!.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: { buffer: inputBuffer } },
                    { binding: 2, resource: { buffer: rgbCurvesBuffer } }, // New binding
                ],
            });


            // Begin the render pass
            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.tonemapCanvasContext!.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: currentLoadOp, // 'clear' first time, 'load' after
                        storeOp: 'store',
                    },
                ],
            });
            const tileHeight = this.height / this.numberOfTiles;

            renderPass.setPipeline(this.tonemapHableFilmicRenderPipeline!);
            renderPass.setBindGroup(0, renderBindGroup);
            renderPass.setVertexBuffer(0, this.vertexBuffer!);

            // --- 3) Position each tile in one-third of the canvas width ---
            // This sets the viewport so each sub-draw goes into its own horizontal slice.          
            // For chunk i = 0, 1, 2
            renderPass.setViewport(
                0,                 // x offset
                tileHeight * i,    // y offset changes so each chunk is a horizontal band
                this.width,        // entire width
                this.height / this.numberOfTiles, // tileHeight * 3,        // just 1/3 of the height
                0.0,
                1.0
            );

            // Draw
            renderPass.draw(4);
            renderPass.end();

            // For all subsequent chunks, preserve existing draws
            currentLoadOp = 'load';
        }

        // Submit all passes at once
        this.device.queue.submit([commandEncoder.finish()]);
    }

    saveTonemapCanvasAsPNG(): void {
        if (!this.tonemapCanvasContext) {
            console.error('No GPUCanvasContext available.');
            return;
        }
        const canvas = this.tonemapCanvasContext.canvas as HTMLCanvasElement;
        canvas.toBlob((blob) => {
            if (!blob) {
                console.error('Failed to create blob from canvas.');
                return;
            }
            const a = document.createElement('a');
            const url = URL.createObjectURL(blob);
            a.href = url;
            a.download = 'img' + '.png'; // The filename for the downloaded image
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}
