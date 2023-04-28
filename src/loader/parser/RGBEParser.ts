import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { GPUTextureFormat } from '../../gfx/graphics/webGpu/WebGPUConst';
import { HDRTexture } from '../../textures/HDRTexture';
import { HDRTextureCube } from '../../textures/HDRTextureCube';
import { toHalfFloat } from '../../util/Convert';
import { ParserBase } from './ParserBase';

/**
 * @internal
 */
export enum RGBEErrorCode {
    RGBE_RETURN_FAILURE = -1,
    rgbe_read_error = 1,
    rgbe_write_error = 2,
    rgbe_format_error = 3,
    rgbe_memory_error = 4,
}

/**
 * @internal
 * @group Loader
 */
export class RGBEHeader {
    valid: number;
    string: string;
    comments: string;
    programtype: string;
    format: string;
    gamma: number;
    exposure: number;
    width: number;
    height: number;
}

/**
 * RGBE parser
 * @internal
 * @group Loader
 */
export class RGBEParser extends ParserBase {
    static format: string = 'bin';
    private _rgbeArray: Uint8Array;
    private _width: number;
    private _height: number;
    private _RGBE_RETURN_FAILURE: number = -1;
    // parserType: GPUTextureFormat = GPUTextureFormat.rgba16float;
    private _parserType: GPUTextureFormat = GPUTextureFormat.rgba8uint;

    public parseBuffer(buffer: ArrayBuffer) {
        let ret_texture: Texture;
        let byteArray = new Uint8Array(buffer);
        byteArray['pos'] = 0;

        const rgbe_header_info: RGBEHeader | number = this.paserHeader(byteArray);
        if (rgbe_header_info instanceof RGBEHeader) {
            const w = (this._width = rgbe_header_info.width);
            const h = (this._height = rgbe_header_info.height);
            let image_rgba_data = this.parserPixel(byteArray.subarray(byteArray['pos']), w, h);
            if (image_rgba_data instanceof Uint8Array) {
                this._rgbeArray = image_rgba_data;

                let data;
                let numElements;

                switch (
                this._parserType
                // case GPUTextureFormat.rgba8uint:
                //   data = image_rgba_data;
                //   ret_texture = new Uint8ArrayTexture();
                //   ret_texture.format = GPUTextureFormat.rgba8uint;
                //   if (ret_texture instanceof Uint8ArrayTexture) ret_texture.create(rgbe_header_info.width, rgbe_header_info.height, data, true);
                //   break;
                //
                // case GPUTextureFormat.rgba32float:
                //   numElements = (image_rgba_data.length / 4) * 4;
                //   const floatArray = new Float32Array(numElements);
                //
                //   for (let j = 0; j < numElements; j++) {
                //     this.rbgeToFloat(image_rgba_data, j * 4, floatArray, j * 4);
                //   }
                //
                //   data = floatArray;
                //
                //   ret_texture = new Float32ArrayTexture();
                //   ret_texture.format = GPUTextureFormat.rgba32float;
                //   if (ret_texture instanceof Float32ArrayTexture) ret_texture.create(rgbe_header_info.width, rgbe_header_info.height, data);
                //   break;
                //
                // case GPUTextureFormat.rgba16float:
                //   {
                //     numElements = (image_rgba_data.length / 4) * 4;
                //     const halfArray = new Uint16Array(numElements);
                //
                //     for (let j = 0; j < numElements; j++) {
                //       this.rbgeToHalfFloat(image_rgba_data, j * 4, halfArray, j * 4);
                //     }
                //
                //     data = halfArray;
                //
                //     let hdrTexture = (ret_texture = new HDRTexture());
                //     hdrTexture.create(rgbe_header_info.width, rgbe_header_info.height, data, true);
                //   }
                //   break;
                // default:
                //   throw new Error('unsupported type');
                ) {
                }

                this.data = ret_texture;
                return ret_texture;
            }
        }

        return null;
    }

    /**
     * Verify parsing validity
     * @param ret
     * @returns
     */
    public verification(): boolean {
        if (this.data && this.data instanceof Texture) {
            return true;
        } else if (this._rgbeArray) {
            return true;
        }
        throw new Error('Method not implemented.');
    }

    public getTexture(): Texture {
        return this.data as Texture;
    }

    public getCubeTexture() {
        let size = this._width / 4;
        let cubeTexture = new HDRTextureCube().createFromHDRData(size, {
            width: this._width,
            height: this._height,
            array: this._rgbeArray,
        });
        return cubeTexture;
    }

    public getHDRTexture() {
        let texture = new HDRTexture().create(this._width, this._height, this._rgbeArray);
        return texture;
    }

    protected parseError(rgbe_error_code, msg) {
        switch (rgbe_error_code) {
            case RGBEErrorCode.rgbe_read_error:
                console.error('Read Error: ' + (msg || ''));
                break;

            case RGBEErrorCode.rgbe_write_error:
                console.error('Write Error: ' + (msg || ''));
                break;

            case RGBEErrorCode.rgbe_format_error:
                console.error('Bad File Format: ' + (msg || ''));
                break;

            default:
            case RGBEErrorCode.rgbe_memory_error:
                console.error('Error: ' + (msg || ''));
        }
        return RGBEErrorCode.RGBE_RETURN_FAILURE;
    }

    protected parserBlock(buffer: Uint8Array, lineLimit?: number, consume?: boolean) {
        const chunkSize = 128;
        lineLimit = !lineLimit ? 1024 : lineLimit;
        let p = buffer['pos'],
            i = -1,
            len = 0,
            s = '',
            chunk = String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));

        const next = '\n';
        while (0 > (i = chunk.indexOf(next)) && len < lineLimit && p < buffer.byteLength) {
            s += chunk;
            len += chunk.length;
            p += chunkSize;
            chunk += String.fromCharCode.apply(null, new Uint16Array(buffer.subarray(p, p + chunkSize)));
        }

        if (-1 < i) {
            if (false !== consume) buffer['pos'] += len + i + 1;
            return s + chunk.slice(0, i);
        }

        return false;
    }

    protected paserHeader(buffer: Uint8Array): RGBEHeader | number {
        // regexes to parse header info fields
        const magic_token_re = /^#\?(\S+)/,
            gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,
            exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,
            format_re = /^\s*FORMAT=(\S+)\s*$/,
            dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,
            // RGBE format header struct
            header = new RGBEHeader();

        let line, match;

        if (buffer['pos'] >= buffer.byteLength || !(line = this.parserBlock(buffer))) {
            return this.parseError(RGBEErrorCode.rgbe_read_error, 'no header found');
        }
        /* if you want to require the magic token then uncomment the next line */

        if (!(match = line.match(magic_token_re))) {
            return this.parseError(RGBEErrorCode.rgbe_format_error, 'bad initial token');
        }

        const RGBE_VALID_PROGRAMTYPE = 1;
        const RGBE_VALID_FORMAT = 2;
        const RGBE_VALID_DIMENSIONS = 4;

        header.valid |= RGBE_VALID_PROGRAMTYPE;
        header.programtype = match[1];
        header.string += line + '\n';

        while (true) {
            line = this.parserBlock(buffer);
            if (false === line) break;
            header.string += line + '\n';

            if ('#' === line.charAt(0)) {
                header.comments += line + '\n';
                continue; // comment line
            }

            if ((match = line.match(gamma_re))) {
                header.gamma = Math.floor(parseFloat(match[1]) * 10) / 10;
            }

            if ((match = line.match(exposure_re))) {
                header.exposure = Math.floor(parseFloat(match[1]) * 10) / 10;
            }

            if ((match = line.match(format_re))) {
                header.valid |= RGBE_VALID_FORMAT;
                header.format = match[1]; //'32-bit_rle_rgbe';
            }

            if ((match = line.match(dimensions_re))) {
                header.valid |= RGBE_VALID_DIMENSIONS;
                header.height = parseInt(match[1], 10);
                header.width = parseInt(match[2], 10);
            }

            if (header.valid & RGBE_VALID_FORMAT && header.valid & RGBE_VALID_DIMENSIONS) break;
        }

        if (!(header.valid & RGBE_VALID_FORMAT)) {
            this.parseError(RGBEErrorCode.rgbe_format_error, 'missing format specifier');
            return null;
        }

        if (!(header.valid & RGBE_VALID_DIMENSIONS)) {
            this.parseError(RGBEErrorCode.rgbe_format_error, 'missing image size specifier');
            return null;
        }

        return header;
    }

    protected parserPixel(buffer, w, h) {
        const scanline_width = w;

        if (
            // run length encoding is not allowed so read flat
            scanline_width < 8 ||
            scanline_width > 0x7fff || // this file is not run length encoded
            2 !== buffer[0] ||
            2 !== buffer[1] ||
            buffer[2] & 0x80
        ) {
            // return the flat buffer
            return new Uint8Array(buffer);
        }

        if (scanline_width !== ((buffer[2] << 8) | buffer[3])) {
            return this.parseError(RGBEErrorCode.rgbe_format_error, 'wrong scanline width');
        }

        const data_rgba = new Uint8Array(4 * w * h);

        if (!data_rgba.length) {
            return this.parseError(RGBEErrorCode.rgbe_memory_error, 'unable to allocate buffer space');
        }

        let offset = 0,
            pos = 0;
        const ptr_end = 4 * scanline_width;
        const rgbeStart = new Uint8Array(4);
        const scanline_buffer = new Uint8Array(ptr_end);
        let num_scanlines = h; // read in each successive scanline

        while (num_scanlines > 0 && pos < buffer.byteLength) {
            if (pos + 4 > buffer.byteLength) {
                return this.parseError(RGBEErrorCode.rgbe_read_error, '');
            }

            rgbeStart[0] = buffer[pos++];
            rgbeStart[1] = buffer[pos++];
            rgbeStart[2] = buffer[pos++];
            rgbeStart[3] = buffer[pos++];

            if (2 != rgbeStart[0] || 2 != rgbeStart[1] || ((rgbeStart[2] << 8) | rgbeStart[3]) != scanline_width) {
                return this.parseError(RGBEErrorCode.rgbe_format_error, 'bad rgbe scanline format');
            } // read each of the four channels for the scanline into the buffer
            // first red, then green, then blue, then exponent

            let ptr = 0,
                count;

            while (ptr < ptr_end && pos < buffer.byteLength) {
                count = buffer[pos++];
                const isEncodedRun = count > 128;
                if (isEncodedRun) count -= 128;

                if (0 === count || ptr + count > ptr_end) {
                    return this.parseError(RGBEErrorCode.rgbe_format_error, 'bad scanline data');
                }

                if (isEncodedRun) {
                    // a (encoded) run of the same value
                    const byteValue = buffer[pos++];

                    for (let i = 0; i < count; i++) {
                        scanline_buffer[ptr++] = byteValue;
                    } //ptr += count;
                } else {
                    // a literal-run
                    scanline_buffer.set(buffer.subarray(pos, pos + count), ptr);
                    ptr += count;
                    pos += count;
                }
            } // now convert data from buffer into rgba
            // first red, then green, then blue, then exponent (alpha)

            const l = scanline_width; //scanline_buffer.byteLength;

            for (let i = 0; i < l; i++) {
                let off = 0;
                data_rgba[offset] = scanline_buffer[i + off];
                off += scanline_width; //1;

                data_rgba[offset + 1] = scanline_buffer[i + off];
                off += scanline_width; //1;

                data_rgba[offset + 2] = scanline_buffer[i + off];
                off += scanline_width; //1;

                data_rgba[offset + 3] = scanline_buffer[i + off];
                offset += 4;
            }

            num_scanlines--;
        }

        return data_rgba;
    }

    protected rbgeToFloat(sourceArray, sourceOffset, destArray, destOffset) {
        const e = sourceArray[sourceOffset + 3];
        const scale = Math.pow(2.0, e - 128.0) / 255.0;
        destArray[destOffset + 0] = sourceArray[sourceOffset + 0] * scale;
        destArray[destOffset + 1] = sourceArray[sourceOffset + 1] * scale;
        destArray[destOffset + 2] = sourceArray[sourceOffset + 2] * scale;
        destArray[destOffset + 3] = 1.0;
    }

    protected rbgeToHalfFloat(sourceArray, sourceOffset, destArray, destOffset) {
        const e = sourceArray[sourceOffset + 3];

        const scale = Math.pow(2.0, e - 128.0) / 255.0;

        destArray[destOffset + 0] = toHalfFloat(sourceArray[sourceOffset + 0] * scale);
        destArray[destOffset + 1] = toHalfFloat(sourceArray[sourceOffset + 1] * scale);
        destArray[destOffset + 2] = toHalfFloat(sourceArray[sourceOffset + 2] * scale);
        destArray[destOffset + 3] = toHalfFloat(1.0);
    }
}
