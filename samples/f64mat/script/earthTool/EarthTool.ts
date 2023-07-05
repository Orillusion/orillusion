
import { Vector2, Vector3 } from '@orillusion/core';
import { Tile } from './Tile'
export class EarthTool {
    static Size: number;
    static PIX2: number;
    static Levels: any;
    static RadiusOffset: any;
    static Phi: number;
    static Theta: number;
    static INV_POLE_BY_180: number;
    static RADB2: number;
    static MinLatitude: number;
    static MaxLatitude: number;
    static EarthRadius: number;
    static MinLongitude: number;
    static MaxLongitude: number;
    static EPSG3857_MAX_BOUND: number;
    static PI_BY_POLE: number;
    static PID2: number;
    static RAD: number;
    static PID360: number;
    static INV_PI_BY_180_HALF_PI: number;
    static ComputeVisibleTiles(tileXY_x: number, tileXY_y: number, level: number, rangeAera: any, o: any) {
        o && (tileXY_x -= 3,
            tileXY_y -= 3);
        const tileArr = []
            , nFaces = Math.pow(2, level)
            , c = EarthTool.Size / nFaces;
        let l = 0
            , u = 0
            , h = 180
            , d = 360;
        for (let e = 0; e < level; e++)
            h /= 2,
                d /= 2,
                l += h,
                u += d;
        const f = -l
            , p = l;
        for (let tileY = tileXY_y; tileY < tileXY_y + rangeAera; tileY++)
            for (let tileX = tileXY_x; tileX < tileXY_x + rangeAera; tileX++) {
                if (tileY < 0 || tileX < 0)
                    continue;
                const offsetX = -(u + f - tileX * c);
                const offsetY = p - tileY * c;
                if (tileY > nFaces - 1 || tileX > nFaces - 1)
                    continue;
                const quadKey = EarthTool.TileXYToQuadKey(tileX, tileY, level);
                tileArr.push(new Tile(offsetX, offsetY, level, tileX, tileY, nFaces, quadKey))
            }
        tileArr.forEach((res) => {
            if (res.nFaces != 8) {
            }
        })
        return tileArr
    }
    static CameraToLatlong(beta: number, alpha: number) {
        Math;
        let n = -alpha

        let r = (beta / 180 * Math.PI + (Math.PI / 2)) % EarthTool.PIX2

        return r < 0 && (r += EarthTool.PIX2),
            r *= 180 / Math.PI,
            r > 180 && (r -= 360),
            new Vector2(n, r)
    }
    static SetLevel() {
        for (let t = 0; t < 21; t++)
            EarthTool.Levels.push(512 * Math.pow(2, t))
    }
    static GetBestLevelResolution(t: number, i: number) {
        const n = window.devicePixelRatio * i
            , r = Math.tan(t / 50 * .5);
        let o = 0;
        for (o = 0; o < EarthTool.Levels.length; o++)
            if (r * EarthTool.Levels[o] >= n)
                return 0 === o ? 1 : o;
        console.log(this.Levels.length, window.devicePixelRatio)
        return o - 1
    }
    static LatLongToVec3(t: number, i: number, n: any) {
        EarthTool.RadiusOffset = n,
            EarthTool.Phi = (90 - t) * (Math.PI / 180),
            EarthTool.Theta = i * (Math.PI / 180);
        const r = EarthTool.RadiusOffset * Math.sin(EarthTool.Phi) * Math.cos(EarthTool.Theta)
            , o = EarthTool.RadiusOffset * Math.cos(EarthTool.Phi)
            , s = EarthTool.RadiusOffset * Math.sin(EarthTool.Phi) * Math.sin(EarthTool.Theta);
        return new Vector3(r, o, s)
    }
    static Vec3ToLatLong(e: { y: number; length: () => number; x: number; z: number; }, t: any) {
        const i = Vector2.ZERO;
        return i.x = 90 - 180 * Math.acos(e.y / e.length()) / Math.PI,
            i.y = -((270 + 180 * Math.atan2(-e.x, -e.z) / Math.PI) % 360 - 180),
            i
    }
    static InverseWebMercator(t: number, i: number, n: number | undefined) {
        return new Vector3(t * EarthTool.INV_POLE_BY_180, n, EarthTool.RADB2 * Math.atan(Math.exp(i * EarthTool.PI_BY_POLE)) - EarthTool.INV_PI_BY_180_HALF_PI)
    }
    static MapNumberToInterval(distance: number, t: number, i: number, n: number, r: number) {
        return (distance - t) * (r - n) / (i - t) + n
    }
    public static GroundResolution(latitude: number, levelOfDetail: number) {
        return latitude = this.Clip(latitude, this.MinLatitude, this.MaxLatitude),
            Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * this.EarthRadius / this.MapSize(levelOfDetail);
    }
    public static LatLongToPixelXY(latitude: number, longitude: number, levelOfDetail: number) {
        latitude = this.Clip(latitude, this.MinLatitude, this.MaxLatitude);
        longitude = this.Clip(longitude, this.MinLongitude, this.MaxLongitude);

        let x = (longitude + 180) / 360;
        let sinLatitude = Math.sin(latitude * Math.PI / 180);
        let y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);

        let mapSize = this.MapSize(levelOfDetail);
        let pixelX = this.Clip(x * mapSize + 0.5, 0, mapSize - 1);
        let pixelY = this.Clip(y * mapSize + 0.5, 0, mapSize - 1);
        return new Vector2(pixelX, pixelY);
    }
    static Clip(n: number, minValue: number, maxValue: number) {
        return Math.min(Math.max(n, minValue), maxValue);
    }
    static PixelXYToTileXY(pixelX: number, pixelY: number) {
        let tileX = parseInt((pixelX / 256).toString());
        let tileY = parseInt((pixelY / 256).toString());
        return new Vector2(tileX, tileY)
    }
    public static PixelXYToLatLong(pixelX: number, pixelY: number, levelOfDetail: number) {
        let mapSize = this.MapSize(levelOfDetail);
        let x = (this.Clip(pixelX, 0, mapSize - 1) / mapSize) - 0.5;
        let y = 0.5 - (this.Clip(pixelY, 0, mapSize - 1) / mapSize);

        let latitude = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;
        let longitude = 360 * x;
        return new Vector2(latitude, longitude)
    }

    static MapSize(levelOfDetail: number) {
        return 256 << levelOfDetail;
    }
    static TileXYToPixelXY(tileX: number, tileY: number) {
        let pixelX = tileX * 256;
        let pixelY = tileY * 256;
        return new Vector2(pixelX, pixelY)
    }
    // static GetDistanceFromLatLonInKm(t: number, i: number, n: number, r: number) {
    //     const o = EarthTool.EarthRadius / 1e3
    //         , s = EarthTool.Deg2rad(n - t)
    //         , a = EarthTool.Deg2rad(r - i)
    //         , c = Math.sin(s / 2) * Math.sin(s / 2) + Math.cos(EarthTool.Deg2rad(t)) * Math.cos(EarthTool.Deg2rad(n)) * Math.sin(a / 2) * Math.sin(a / 2);
    //     return o * (2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c))) * 1e3
    // }
    // static Deg2rad(e: number) {
    //     return e * (Math.PI / 180)
    // }
    static TileXYToQuadKey(tileX: number, tileY: number, levelOfDetail: number) {
        let quadKey = '';
        for (let i = levelOfDetail; i > 0; i--) {
            let digit = 0;
            let mask = 1 << (i - 1);
            if ((tileX & mask) != 0) {
                digit++;
            }
            if ((tileY & mask) != 0) {
                digit++;
                digit++;
            }
            quadKey += digit;
        }
        return quadKey;
    }
    public static MapScale(latitude: number, levelOfDetail: number, screenDpi: number) {
        return this.GroundResolution(latitude, levelOfDetail) * screenDpi / 0.0254;
    }
}
EarthTool.EPSG3857_MAX_BOUND = 20037508.34;
    EarthTool.INV_POLE_BY_180 = 180 / EarthTool.EPSG3857_MAX_BOUND;
    EarthTool.PI_BY_POLE = Math.PI / EarthTool.EPSG3857_MAX_BOUND;
    EarthTool.PID2 = .5 * Math.PI;
    EarthTool.PIX2 = 2 * Math.PI;
    EarthTool.RAD = 180 / Math.PI;
    EarthTool.RADB2 = 2 * EarthTool.RAD;
    EarthTool.PID360 = Math.PI / 360;
    EarthTool.INV_PI_BY_180_HALF_PI = EarthTool.RAD * EarthTool.PID2;
    EarthTool.EarthRadius = 6378137;
    EarthTool.MinLatitude = -85.05112878;
    EarthTool.MaxLatitude = 85.05112878;
    EarthTool.MinLongitude = -180;
    EarthTool.MaxLongitude = 180;
    EarthTool.Size = 360;
    EarthTool.Levels = [];