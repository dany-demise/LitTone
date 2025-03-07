import { HableFilmicTonemap } from '$lib/domain/image-processing/filmic-hable-tonemap/filmic-hable-tonemap';
import type { HableFilmicParams } from '$lib/domain/interfaces';

// Shader code
const luminanceRenderShaderCode: string = `
struct Uniforms {
    width: f32,
    height: f32,
    minLuminance: f32,
    maxLuminance: f32,
    colormap: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> dataArray: array<f32>;

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

fn log10(x: f32) -> f32 {
    return log(x) / log(10.0);
}

// Hardcoded LUT for R, G, and B (raw values from 0-255)
//mendacious
const mendaciousLutB = array( 131.0, 132.0, 133.0, 134.0, 136.0, 137.0, 139.0, 141.0, 143.0, 145.0, 148.0, 150.0, 153.0, 155.0, 157.0, 160.0, 162.0, 164.0, 166.0, 168.0, 170.0, 172.0, 174.0, 175.0, 176.0, 177.0, 177.0, 178.0, 178.0, 179.0, 180.0, 180.0, 181.0, 181.0, 182.0, 182.0, 183.0, 184.0, 184.0, 184.0, 185.0, 185.0, 186.0, 186.0, 186.0, 187.0, 187.0, 187.0, 187.0, 187.0, 187.0, 187.0, 187.0, 187.0, 186.0, 186.0, 186.0, 185.0, 185.0, 184.0, 183.0, 182.0, 181.0, 180.0, 179.0, 178.0, 177.0, 175.0, 172.0, 169.0, 165.0, 161.0, 157.0, 153.0, 148.0, 143.0, 138.0, 133.0, 127.0, 122.0, 117.0, 111.0, 106.0, 101.0, 95.0, 90.0, 86.0, 81.0, 77.0, 73.0, 69.0, 66.0, 63.0, 60.0, 58.0, 57.0, 55.0, 54.0, 53.0, 53.0, 53.0, 54.0, 54.0, 55.0, 57.0, 57.0, 58.0, 60.0, 60.0, 63.0, 64.0, 66.0, 67.0, 69.0, 70.0, 71.0, 73.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 80.0, 81.0, 81.0, 81.0, 80.0, 80.0, 80.0, 79.0, 79.0, 79.0, 78.0, 78.0, 77.0, 76.0, 76.0, 75.0, 74.0, 73.0, 73.0, 71.0, 71.0, 70.0, 69.0, 67.0, 67.0, 66.0, 65.0, 64.0, 63.0, 62.0, 60.0, 60.0, 58.0, 58.0, 57.0, 55.0, 54.0, 53.0, 52.0, 51.0, 49.0, 48.0, 47.0, 46.0, 45.0, 44.0, 43.0, 42.0, 41.0, 40.0, 39.0, 38.0, 37.0, 36.0, 36.0, 35.0, 34.0, 33.0, 32.0, 32.0, 31.0, 30.0, 30.0, 28.0, 27.0, 25.0, 24.0, 23.0, 22.0, 21.0, 20.0, 20.0, 19.0, 18.0, 18.0, 17.0, 16.0, 16.0, 14.0, 14.0, 13.0, 12.0, 11.0, 11.0, 10.0,9.0, 9.0, 8.0, 7.0, 6.0, 5.0, 4.0, 3.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 2.0, 4.0, 5.0, 7.0, 9.0, 11.0, 13.0, 16.0, 19.0, 21.0, 23.0, 25.0, 27.0, 29.0, 31.0, 33.0, 34.0, 36.0, 37.0, 38.0 );
const mendaciousLutG = array( 6.0, 6.0, 5.0, 5.0, 4.0, 4.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 2.0, 5.0, 7.0, 9.0, 11.0, 14.0, 17.0, 20.0, 23.0, 27.0, 30.0, 34.0, 37.0, 41.0, 45.0, 49.0, 53.0, 58.0, 63.0, 67.0, 71.0, 76.0, 80.0, 84.0, 89.0, 93.0, 97.0, 102.0, 106.0, 110.0, 114.0, 118.0, 122.0, 126.0, 130.0, 133.0, 137.0, 140.0, 143.0, 146.0, 149.0, 151.0, 154.0, 156.0, 158.0, 161.0, 163.0, 165.0, 167.0, 169.0, 170.0, 172.0, 173.0, 174.0, 174.0, 175.0, 175.0, 176.0, 176.0, 176.0, 176.0, 175.0, 175.0, 175.0, 174.0, 174.0, 173.0, 172.0, 172.0, 171.0, 170.0, 169.0, 168.0, 167.0, 166.0, 165.0, 164.0, 163.0, 162.0, 160.0, 158.0, 157.0, 155.0, 153.0, 152.0, 150.0, 148.0, 146.0, 144.0, 142.0, 139.0, 137.0, 135.0, 133.0, 131.0, 128.0, 126.0, 124.0, 121.0, 119.0, 117.0, 114.0, 112.0, 110.0, 108.0, 106.0, 105.0, 104.0, 102.0, 101.0, 100.0, 98.0, 96.0, 95.0, 93.0, 92.0, 90.0, 89.0, 87.0, 85.0, 84.0, 82.0, 80.0, 79.0, 77.0, 75.0, 73.0, 71.0, 70.0, 67.0, 66.0, 65.0, 63.0, 60.0, 60.0, 58.0, 55.0, 54.0, 52.0, 51.0, 49.0, 47.0, 45.0, 44.0, 42.0, 41.0, 39.0, 38.0, 36.0, 35.0, 33.0, 32.0, 31.0, 30.0, 28.0, 27.0, 26.0, 25.0, 24.0, 23.0, 22.0, 21.0, 20.0, 17.0, 14.0, 11.0, 9.0, 7.0, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 4.0, 6.0, 9.0, 11.0, 16.0, 19.0, 23.0, 27.0, 31.0, 36.0, 41.0, 46.0, 51.0, 57.0, 63.0, 67.0, 74.0, 79.0, 85.0, 91.0, 96.0, 102.0, 108.0, 113.0, 118.0, 123.0, 128.0, 133.0, 138.0, 143.0, 148.0, 154.0, 159.0, 165.0, 170.0, 176.0, 181.0, 187.0, 192.0, 198.0, 203.0, 208.0, 213.0, 218.0, 223.0, 227.0, 232.0, 236.0, 240.0, 243.0, 246.0, 249.0 );
const mendaciousLutR = array( 114.0, 111.0, 108.0, 105.0, 102.0, 98.0, 93.0, 89.0, 84.0, 79.0, 74.0, 67.0, 63.0, 57.0, 51.0, 45.0, 40.0, 35.0, 30.0, 25.0, 21.0, 17.0, 12.0, 9.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 2.0, 2.0, 2.0, 3.0, 3.0, 4.0, 4.0, 4.0, 5.0, 5.0, 5.0, 6.0, 6.0, 7.0, 7.0, 7.0, 7.0, 8.0, 8.0, 8.0, 9.0, 9.0, 9.0, 10.0, 10.0, 11.0, 12.0, 12.0, 13.0, 14.0, 16.0, 17.0, 19.0, 20.0, 21.0, 23.0, 25.0, 27.0, 29.0, 31.0, 33.0, 36.0, 39.0, 41.0, 44.0, 47.0, 51.0, 54.0, 58.0, 62.0, 66.0, 69.0, 73.0, 77.0, 81.0, 84.0, 88.0, 92.0, 96.0, 99.0, 103.0, 107.0, 110.0, 113.0, 117.0, 120.0, 123.0, 126.0, 128.0, 131.0, 133.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 144.0, 145.0, 146.0, 146.0, 147.0, 148.0, 148.0, 149.0, 149.0, 150.0, 150.0, 151.0, 151.0, 151.0, 152.0, 152.0, 153.0, 153.0, 153.0, 154.0, 154.0, 154.0, 154.0, 155.0, 155.0, 155.0, 156.0, 156.0, 156.0, 157.0, 157.0, 157.0, 158.0, 158.0, 158.0, 159.0, 159.0, 159.0, 160.0, 160.0, 161.0, 161.0, 162.0, 162.0, 163.0, 163.0, 164.0, 165.0, 165.0, 168.0, 170.0, 172.0, 175.0, 177.0, 180.0, 183.0, 185.0, 188.0, 191.0, 194.0, 197.0, 199.0, 202.0, 205.0, 207.0, 210.0, 213.0, 215.0, 217.0, 219.0, 220.0, 222.0, 224.0, 226.0, 227.0, 229.0, 231.0, 232.0, 234.0, 236.0, 237.0, 239.0, 240.0, 242.0, 243.0, 245.0, 246.0, 247.0, 248.0, 250.0, 251.0, 252.0, 253.0, 254.0, 254.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 254.0, 254.0, 254.0, 254.0 );
// black and white
const bwLutB = array( 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0, 88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0, 100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 126.0, 127.0, 128.0, 129.0, 130.0, 131.0, 132.0, 133.0, 134.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 145.0, 146.0, 147.0, 148.0, 149.0, 150.0, 151.0, 152.0, 153.0, 154.0, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 171.0, 172.0, 173.0, 174.0, 175.0, 176.0, 177.0, 178.0, 179.0, 180.0, 181.0, 182.0, 183.0, 184.0, 185.0, 186.0, 187.0, 188.0, 189.0, 190.0, 191.0, 192.0, 193.0, 194.0, 195.0, 196.0, 197.0, 198.0, 199.0, 200.0, 201.0, 202.0, 203.0, 204.0, 205.0, 206.0, 207.0, 208.0, 209.0, 210.0, 211.0, 212.0, 213.0, 214.0, 215.0, 216.0, 217.0, 218.0, 219.0, 220.0, 221.0, 222.0, 223.0, 224.0, 225.0, 226.0, 227.0, 228.0, 229.0, 230.0, 231.0, 232.0, 233.0, 234.0, 235.0, 236.0, 237.0, 238.0, 239.0, 240.0, 241.0, 242.0, 243.0, 244.0, 245.0, 246.0, 247.0, 248.0, 249.0, 250.0, 251.0, 252.0, 253.0, 254.0, 255.0 );
const bwLutG = array( 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0, 88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0, 100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 126.0, 127.0, 128.0, 129.0, 130.0, 131.0, 132.0, 133.0, 134.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 145.0, 146.0, 147.0, 148.0, 149.0, 150.0, 151.0, 152.0, 153.0, 154.0, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 171.0, 172.0, 173.0, 174.0, 175.0, 176.0, 177.0, 178.0, 179.0, 180.0, 181.0, 182.0, 183.0, 184.0, 185.0, 186.0, 187.0, 188.0, 189.0, 190.0, 191.0, 192.0, 193.0, 194.0, 195.0, 196.0, 197.0, 198.0, 199.0, 200.0, 201.0, 202.0, 203.0, 204.0, 205.0, 206.0, 207.0, 208.0, 209.0, 210.0, 211.0, 212.0, 213.0, 214.0, 215.0, 216.0, 217.0, 218.0, 219.0, 220.0, 221.0, 222.0, 223.0, 224.0, 225.0, 226.0, 227.0, 228.0, 229.0, 230.0, 231.0, 232.0, 233.0, 234.0, 235.0, 236.0, 237.0, 238.0, 239.0, 240.0, 241.0, 242.0, 243.0, 244.0, 245.0, 246.0, 247.0, 248.0, 249.0, 250.0, 251.0, 252.0, 253.0, 254.0, 255.0 );
const bwLutR = array( 0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 27.0, 28.0, 29.0, 30.0, 31.0, 32.0, 33.0, 34.0, 35.0, 36.0, 37.0, 38.0, 39.0, 40.0, 41.0, 42.0, 43.0, 44.0, 45.0, 46.0, 47.0, 48.0, 49.0, 50.0, 51.0, 52.0, 53.0, 54.0, 55.0, 56.0, 57.0, 58.0, 59.0, 60.0, 61.0, 62.0, 63.0, 64.0, 65.0, 66.0, 67.0, 68.0, 69.0, 70.0, 71.0, 72.0, 73.0, 74.0, 75.0, 76.0, 77.0, 78.0, 79.0, 80.0, 81.0, 82.0, 83.0, 84.0, 85.0, 86.0, 87.0, 88.0, 89.0, 90.0, 91.0, 92.0, 93.0, 94.0, 95.0, 96.0, 97.0, 98.0, 99.0, 100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0, 110.0, 111.0, 112.0, 113.0, 114.0, 115.0, 116.0, 117.0, 118.0, 119.0, 120.0, 121.0, 122.0, 123.0, 124.0, 125.0, 126.0, 127.0, 128.0, 129.0, 130.0, 131.0, 132.0, 133.0, 134.0, 135.0, 136.0, 137.0, 138.0, 139.0, 140.0, 141.0, 142.0, 143.0, 144.0, 145.0, 146.0, 147.0, 148.0, 149.0, 150.0, 151.0, 152.0, 153.0, 154.0, 155.0, 156.0, 157.0, 158.0, 159.0, 160.0, 161.0, 162.0, 163.0, 164.0, 165.0, 166.0, 167.0, 168.0, 169.0, 170.0, 171.0, 172.0, 173.0, 174.0, 175.0, 176.0, 177.0, 178.0, 179.0, 180.0, 181.0, 182.0, 183.0, 184.0, 185.0, 186.0, 187.0, 188.0, 189.0, 190.0, 191.0, 192.0, 193.0, 194.0, 195.0, 196.0, 197.0, 198.0, 199.0, 200.0, 201.0, 202.0, 203.0, 204.0, 205.0, 206.0, 207.0, 208.0, 209.0, 210.0, 211.0, 212.0, 213.0, 214.0, 215.0, 216.0, 217.0, 218.0, 219.0, 220.0, 221.0, 222.0, 223.0, 224.0, 225.0, 226.0, 227.0, 228.0, 229.0, 230.0, 231.0, 232.0, 233.0, 234.0, 235.0, 236.0, 237.0, 238.0, 239.0, 240.0, 241.0, 242.0, 243.0, 244.0, 245.0, 246.0, 247.0, 248.0, 249.0, 250.0, 251.0, 252.0, 253.0, 254.0, 255.0 );
// opencvjet
const opjetLutB = array(131.0, 135.0, 139.0, 143.0, 147.0, 151.0, 155.0, 159.0, 163.0, 167.0, 171.0, 175.0, 179.0, 183.0, 187.0, 191.0, 195.0, 199.0, 203.0, 207.0, 211.0, 215.0, 219.0, 223.0, 227.0, 231.0, 235.0, 239.0, 243.0, 247.0, 251.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 251.0, 247.0, 243.0, 239.0, 235.0, 231.0, 227.0, 223.0, 219.0, 215.0, 211.0, 207.0, 203.0, 199.0, 195.0, 191.0, 187.0, 183.0, 179.0, 175.0, 171.0, 167.0, 163.0, 159.0, 155.0, 151.0, 147.0, 143.0, 139.0, 135.0, 131.0, 128.0, 124.0, 120.0, 116.0, 112.0, 108.0, 104.0, 100.0, 96.0, 92.0, 88.0, 84.0, 80.0, 76.0, 72.0, 68.0, 64.0, 60.0, 56.0, 52.0, 48.0, 44.0, 40.0, 36.0, 32.0, 28.0, 24.0, 20.0, 16.0, 12.0, 8.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
const opjetLutG = array(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 28.0, 32.0, 36.0, 40.0, 44.0, 48.0, 52.0, 56.0, 60.0, 64.0, 68.0, 72.0, 76.0, 80.0, 84.0, 88.0, 92.0, 96.0, 100.0, 104.0, 108.0, 112.0, 116.0, 120.0, 124.0, 128.0, 131.0, 135.0, 139.0, 143.0, 147.0, 151.0, 155.0, 159.0, 163.0, 167.0, 171.0, 175.0, 179.0, 183.0, 187.0, 191.0, 195.0, 199.0, 203.0, 207.0, 211.0, 215.0, 219.0, 223.0, 227.0, 231.0, 235.0, 239.0, 243.0, 247.0, 251.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 251.0, 247.0, 243.0, 239.0, 235.0, 231.0, 227.0, 223.0, 219.0, 215.0, 211.0, 207.0, 203.0, 199.0, 195.0, 191.0, 187.0, 183.0, 179.0, 175.0, 171.0, 167.0, 163.0, 159.0, 155.0, 151.0, 147.0, 143.0, 139.0, 135.0, 131.0, 128.0, 124.0, 120.0, 116.0, 112.0, 108.0, 104.0, 100.0, 96.0, 92.0, 88.0, 84.0, 80.0, 76.0, 72.0, 68.0, 64.0, 60.0, 56.0, 52.0, 48.0, 44.0, 40.0, 36.0, 32.0, 28.0, 24.0, 20.0, 16.0, 12.0, 8.0, 4.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);    
const opjetLutR = array(0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 4.0, 8.0, 12.0, 16.0, 20.0, 24.0, 28.0, 32.0, 36.0, 40.0, 44.0, 48.0, 52.0, 56.0, 60.0, 64.0, 68.0, 72.0, 76.0, 80.0, 84.0, 88.0, 92.0, 96.0, 100.0, 104.0, 108.0, 112.0, 116.0, 120.0, 124.0, 128.0, 131.0, 135.0, 139.0, 143.0, 147.0, 151.0, 155.0, 159.0, 163.0, 167.0, 171.0, 175.0, 179.0, 183.0, 187.0, 191.0, 195.0, 199.0, 203.0, 207.0, 211.0, 215.0, 219.0, 223.0, 227.0, 231.0, 235.0, 239.0, 243.0, 247.0, 251.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 255.0, 251.0, 247.0, 243.0, 239.0, 235.0, 231.0, 227.0, 223.0, 219.0, 215.0, 211.0, 207.0, 203.0, 199.0, 195.0, 191.0, 187.0, 183.0, 179.0, 175.0, 171.0, 167.0, 163.0, 159.0, 155.0, 151.0, 147.0, 143.0, 139.0, 135.0, 131.0, 128.0);

@fragment
fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
    // Map texture coordinates to the full viewport
    let x = u32(texCoord.x * uniforms.width);
    let y = u32(texCoord.y * uniforms.height);
    
    // Check bounds to avoid accessing out-of-bounds elements
    if (x >= u32(uniforms.width) || y >= u32(uniforms.height)) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color for out-of-bounds
    }
    
    let index = y * u32(uniforms.width) + x;
    if (index >= arrayLength(&dataArray)) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red for out-of-bounds
    }
    
    // Fetch the data value and convert to grayscale
    let rawVal = dataArray[index];
    var theVal = rawVal;
    if (rawVal < uniforms.minLuminance) {
        theVal = uniforms.minLuminance;
    }
    if (rawVal > uniforms.maxLuminance) {
        theVal = uniforms.maxLuminance;
    }
    let value = log10((theVal + 0.01) / (uniforms.minLuminance + 0.01));
    let scaledValue = (value / log10((uniforms.maxLuminance + 0.01) / (uniforms.minLuminance + 0.01)) * 255.0);
    let lutIndex = i32(scaledValue);

    // Variables to hold LUT values
    var r_lut_value: f32;
    var g_lut_value: f32;
    var b_lut_value: f32;

    // Use integer comparison for colormap selection
    let colormapIndex = u32(uniforms.colormap);

    if (colormapIndex == 0u) {
        r_lut_value = mendaciousLutR[lutIndex];
        g_lut_value = mendaciousLutG[lutIndex];
        b_lut_value = mendaciousLutB[lutIndex];
    } 
    if (colormapIndex == 1u) {
        r_lut_value = bwLutR[lutIndex];
        g_lut_value = bwLutG[lutIndex];
        b_lut_value = bwLutB[lutIndex];
    }
    if (colormapIndex == 2u) {
        r_lut_value = opjetLutR[lutIndex];
        g_lut_value = opjetLutG[lutIndex];
        b_lut_value = opjetLutB[lutIndex];
    }

    // Normalize LUT values
    let r_lut = r_lut_value / 255.0;
    let g_lut = g_lut_value / 255.0;
    let b_lut = b_lut_value / 255.0;

    return vec4<f32>(r_lut, g_lut,  b_lut, 1.0);
}
`;

// Shader code
const hdrRenderShaderCode: string = `
struct Uniforms {
    width: f32,
    height: f32,
    lowerBound: f32,
    higherBound: f32,
    gamma: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> dataArray: array<f32>;

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

fn log10(x: f32) -> f32 {
    return log(x) / log(10.0);
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
    
    let index = (y * u32(uniforms.width) + x) * 3u;
    if (index >= arrayLength(&dataArray)) {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red for out-of-bounds
    }

    let theHigherBound = uniforms.higherBound - uniforms.lowerBound;
    
    // Fetch the data value and convert to grayscale uniforms.lowerBound
    let rawVal1 = clamp((dataArray[index] - uniforms.lowerBound) / theHigherBound, 0.0, 1.0);
    var theVal1 = pow(rawVal1, 1.0 / uniforms.gamma);

    let rawVal2 = clamp((dataArray[index + 1u] - uniforms.lowerBound) / theHigherBound, 0.0, 1.0);
    var theVal2 = pow(rawVal2, 1.0 / uniforms.gamma);

    let rawVal3 = clamp((dataArray[index + 2u] - uniforms.lowerBound) / theHigherBound, 0.0, 1.0);
    var theVal3 = pow(rawVal3, 1.0 / uniforms.gamma);

    return vec4<f32>(theVal1, theVal2,  theVal3, 1.0);
}
`;

const tonemapUnchartedTwoRenderShaderCode: string = `
struct Uniforms {
    width: f32,
    height: f32,
    exposureBias: f32,
    gamma: f32,
};

@group(0) @binding(0) var<uniform> uniforms: Uniforms;
@group(0) @binding(1) var<storage> dataArray: array<f32>;

//-----------------------------------------------------------------------------
// Simple passthrough vertex stage (unchanged)
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
//-----------------------------------------------------------------------------

fn uncharted2_tonemap_partial(x: vec3<f32>) -> vec3<f32> {
    let A: f32 = 0.15;
    let B: f32 = 0.50;
    let C: f32 = 0.10;
    let D: f32 = 0.20;
    let E: f32 = 0.02;
    let F: f32 = 0.30;

    // Component-wise math in WGSL is the same as in GLSL
    // scalars automatically broadcast when added to or multiplied by a vector
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

fn uncharted2_filmic(v: vec3<f32>) -> vec3<f32> {
    let exposure_bias: f32 = uniforms.exposureBias; // 0.011;
    let curr = uncharted2_tonemap_partial(v * exposure_bias);

    let W = vec3<f32>(11.2, 11.2, 11.2);
    let white_scale = vec3<f32>(1.0, 1.0, 1.0) / uncharted2_tonemap_partial(W);

    return curr * white_scale;
}

@fragment
fn fragmentMain(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
    // Map texture coordinates to pixel coordinates
    let x = u32(texCoord.x * uniforms.width);
    let y = u32(texCoord.y * uniforms.height);
    
    // Bounds check
    if (x >= u32(uniforms.width) || y >= u32(uniforms.height)) {
        // Return red if out-of-bounds
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
    }
    
    // Compute index into dataArray (3 floats per pixel)
    let index = (y * u32(uniforms.width) + x) * 3u;
    if (index + 2u) >= arrayLength(&dataArray) {
        // Return red if out-of-bounds
        return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red for out-of-bounds
    }

    // Read HDR color in RGB order
    let R_hdr = dataArray[index + 0u];
    let G_hdr = dataArray[index + 1u];
    let B_hdr = dataArray[index + 2u];

    let RGB = uncharted2_filmic( vec3<f32>(R_hdr, G_hdr, B_hdr) );

    // Return final LDR
    return vec4<f32>(RGB, 1.0);
}
`;

// Shader code
const tonemapHableFilmicShaderCodeHdr: string = `
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
    rgb = eval_color(rgb, uniforms);

    return vec4<f32>(rgb, 1.0);
}
`;

// Shader code
const tonemapHableFilmicShaderCodeRaw: string = `
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
    rgb = eval_color(rgb, uniforms);

    return vec4<f32>(rgb, 1.0);
}
`;

export class WebGPUImageProcessor {
    private device: GPUDevice | null = null;
    private luminanceMapCanvasContext: GPUCanvasContext | null = null;
    private hdrViewCanvasContext: GPUCanvasContext | null = null;
    private tonemapCanvasContext: GPUCanvasContext | null = null;
    private width: number = 0;
    private height: number = 0;
    private luminanceMapRenderPipeline: GPURenderPipeline | null = null;
    private hdrRenderPipeline: GPURenderPipeline | null = null;
    private tonemapUnchartedTwoRenderPipeline: GPURenderPipeline | null = null;
    private tonemapReinhardRenderPipeline: GPURenderPipeline | null = null;
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

    setLuminanceMapCanvasContext() { } // TODO

    setHdrViewCanvasContext(canvas: HTMLCanvasElement) {
        if (!this.hdrViewCanvasContext) {
            canvas.width = this.width;
            canvas.height = this.height;
            this.hdrViewCanvasContext = canvas.getContext('webgpu') as GPUCanvasContext;
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            if (this.device) {
                this.hdrViewCanvasContext.configure({
                    device: this.device,
                    format: canvasFormat,
                    alphaMode: 'premultiplied',
                });
            }
        }
    }

    setTonemapCanvasContext(canvas: HTMLCanvasElement, width:number, height:number) {
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

    async generateTonemapUnchartedTwoInTiles(
        inputArray: Float32Array,
        exposureBias: number,
        gamma: number,
    ) {
        if (!this.device) { throw new Error('Device not initialized'); }

        // const numberOfTiles = this.getNumberOfTiles();

        // --- 1) Split the array into 3 chunks ---
        const chunkSize = Math.round(inputArray.length / this.numberOfTiles);
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
                size: 4 * 4, // 5 floats * 4 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(uniformBuffer.getMappedRange()).set([
                this.width,
                this.height / this.numberOfTiles,
                exposureBias,
                gamma,
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

            // Create the bind group (reuse the same pipeline but different data each time)
            const renderBindGroup = this.device.createBindGroup({
                layout: this.tonemapUnchartedTwoRenderPipeline!.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: { buffer: inputBuffer } },
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

            renderPass.setPipeline(this.tonemapUnchartedTwoRenderPipeline!);
            renderPass.setBindGroup(0, renderBindGroup);
            renderPass.setVertexBuffer(0, this.vertexBuffer!);

            // --- 3) Position each tile in one-third of the canvas width ---
            // This sets the viewport so each sub-draw goes into its own horizontal slice.          
            // For chunk i = 0, 1, 2
            renderPass.setViewport(
                0,                 // x offset
                tileHeight * i,    // y offset changes so each chunk is a horizontal band
                this.width,        // entire width
                this.height / this.numberOfTiles, // just 1/3 of the height
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

    async generateTonemapHableFilmicInTiles(
        inputArray: Float32Array,
        hdrMin: number, hdrMax: number,
        params: HableFilmicParams
    ) {
        await this.hableFilmicTonemap.load();
        await this.hableFilmicTonemap.setUserParams(params);
        const rgbCurves = await this.hableFilmicTonemap.getRgbCurves();
        const shaderParams = await this.hableFilmicTonemap.getShaderParams();
        console.log(shaderParams);

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
        inputArrayU16: Uint16Array,
        params: HableFilmicParams
    ) {
        const hdrMin = 0.0;
        const hdrMax = 65536.0;
        if (this.numberOfTiles == 0) {
            this.numberOfTiles = this.getNumberOfTiles();
        }

        // const uint16Array = new Float16Array([1, 2, 3, 65535]);
        const inputArray = new Float32Array(inputArrayU16.length);
        for (let i = 0; i < inputArrayU16.length; i++) {
            inputArray[i] = inputArrayU16[i];
        }

        await this.hableFilmicTonemap.load();
        await this.hableFilmicTonemap.setUserParams(params);
        const rgbCurves = await this.hableFilmicTonemap.getRgbCurves();
        const shaderParams = await this.hableFilmicTonemap.getShaderParams();
        console.log(shaderParams);

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
            new Uint16Array(inputBuffer.getMappedRange()).set(chunk);
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


    async generateHdrViewInTiles(
        inputArray: Float32Array,
        lowerBound: number,
        upperBound: number,
        gamma: number = 2.2
    ) {
        if (!this.device) {
            throw new Error('Device not initialized');
        }

        // const numberOfTiles = this.getNumberOfTiles();

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
                size: 5 * 4, // 5 floats * 4 bytes
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true,
            });
            new Float32Array(uniformBuffer.getMappedRange()).set([
                this.width,
                this.height / this.numberOfTiles,
                lowerBound,
                upperBound,
                gamma,
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

            // Create the bind group (reuse the same pipeline but different data each time)
            const renderBindGroup = this.device.createBindGroup({
                layout: this.hdrRenderPipeline!.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: { buffer: uniformBuffer } },
                    { binding: 1, resource: { buffer: inputBuffer } },
                ],
            });

            // Begin the render pass
            const renderPass = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: this.hdrViewCanvasContext!.getCurrentTexture().createView(),
                        clearValue: { r: 0, g: 0, b: 0, a: 1 },
                        loadOp: currentLoadOp, // 'clear' first time, 'load' after
                        storeOp: 'store',
                    },
                ],
            });
            const tileHeight = this.height / this.numberOfTiles;

            renderPass.setPipeline(this.hdrRenderPipeline!);
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

    saveHdrViewCanvasAsPNG(): void {
        if (!this.hdrViewCanvasContext) {
            console.error('No GPUCanvasContext available.');
            return;
        }
        const canvas = this.hdrViewCanvasContext.canvas as HTMLCanvasElement;
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

    saveCanvasAsPNG(): void {
        if (!this.luminanceMapCanvasContext) {
            console.error('No GPUCanvasContext available.');
            return;
        }

        const canvas = this.luminanceMapCanvasContext.canvas as HTMLCanvasElement;
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

    getCanvasAsImage(): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            if (!this.luminanceMapCanvasContext) {
                console.error('No GPUCanvasContext available.');
                reject(new Error('No GPUCanvasContext available.'));
                return;
            }

            const canvas = this.luminanceMapCanvasContext.canvas as HTMLCanvasElement;

            canvas.toBlob((blob) => {
                if (!blob) {
                    console.error('Failed to create blob from canvas.');
                    reject(new Error('Failed to create blob from canvas.'));
                    return;
                }

                // Convert the blob into an object URL
                const url = URL.createObjectURL(blob);
                const image = new Image();

                // Once the image has loaded, we can clean up and resolve
                image.onload = () => {
                    URL.revokeObjectURL(url);
                    resolve(image);
                };

                // Handle load errors
                image.onerror = (error) => {
                    URL.revokeObjectURL(url);
                    reject(error);
                };

                // Start loading
                image.src = url;
            }, 'image/png');
        });
    }
}
