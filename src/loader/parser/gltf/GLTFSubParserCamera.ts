import { GLTF_Info } from "./GLTFInfo";

/**
 * @internal
 */
export class GLTFSubParserCamera {
    protected gltf: GLTF_Info;

    constructor(gltf: GLTF_Info) {
        this.gltf = gltf;
    }

    public parse(cameraId) {
        const camera = this.gltf.cameras[cameraId];

        if (!camera)
            return this.errorMiss('camera', cameraId);

        if (camera.isParsed)
            return camera.dcamera;

        camera.isParsed = true;
        camera.dcamera = false;

        const { name, type, perspective, orthographic } = camera;

        if (type === 'perspective' && perspective) {
            const { aspectRatio, yfov, zfar, znear } = perspective;
            camera.dcamera = Object.assign(
                {},
                {
                    name,
                    type,
                    yfov,
                    znear,
                    aspectRatio,
                    zfar,
                },
            );
        } else if (type === 'orthographic' && orthographic) {
            const { xmag, ymag, zfar, znear } = orthographic;
            camera.dcamera = Object.assign(
                {},
                {
                    name,
                    type,
                    xmag,
                    ymag,
                    zfar,
                    znear,
                },
            );
        }

        return camera.dcamera;
    }

    protected errorMiss(e, info?) {
        throw new Error(e + info);
    }
}
