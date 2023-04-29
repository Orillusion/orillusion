import { Texture } from '../../gfx/graphics/webGpu/core/texture/Texture';
import { LoaderFunctions } from '../LoaderFunctions';

/**
 * @internal
 * @group Loader
 */
export class ParserBase {
    static format: string = 'bin';
    public baseUrl: string;
    public initUrl: string;
    public loaderFunctions?: LoaderFunctions;
    public userData?: any;
    public data: any;

    public parserString(str: string) { }

    public parserJson(obj: object) { }

    public parseBuffer(buffer: ArrayBuffer) { }

    public parserTexture(buffer: ArrayBuffer): Texture {
        throw this.parserError('Method not implemented.', -1);
    }

    public parse(data: any) { }

    public verification(ret: void): boolean {
        throw this.parserError('Method not implemented.', -1);
    }

    protected parserError(info: string, id: number) {
        console.error(`error id:${id} ${info}`);
    }

    // public static getTypedArrayTypeFromGLType(componentType:number){
    //   switch (componentType) {
    //     case 5126:
    //       return Float32Array;
    //       break;
    //       case 5125:
    //         return Uint8Array;
    //         break;
    //     default:
    //       break;
    //   }

    // }
}
