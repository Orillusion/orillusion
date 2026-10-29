import { Vector2 } from '../../math/Vector2';

/**
 * Wind-driven ocean waves for {@link WaterRenderer.spectrum}: a JONSWAP
 * spectrum, spread around the wind direction, simulated with FFTs in
 * three cascades from swells hundreds of metres long down to centimetre
 * ripples. Adds to the Gerstner waves.
 * @group Components
 */
export class WaterSpectrum {
    /** Wind speed 10 m above the water, in metres per second. */
    public windSpeed: number = 10;
    /** Direction the wind blows toward, in the xz plane. */
    public windDirection: Vector2 = new Vector2(1, 0.3);
    /**
     * Distance in metres the wind has blown over open water. A short fetch
     * gives young, short waves; a long one, a fully developed sea.
     */
    public fetch: number = 100000;
    /** Wave height scale. */
    public amplitude: number = 1;
    /**
     * How far the water moves sideways toward the crests: 0 gives rounded
     * waves, 1 sharp crests and troughs that whitecaps break from.
     */
    public choppiness: number = 1;
    /** Random seed of the wave phases. */
    public seed: number = 1;

    /** @internal Key of everything that changes the initial spectrum. */
    public get shapeKey(): string {
        const d = this.windDirection;
        return `${this.windSpeed}|${d.x}|${d.y}|${this.fetch}|${this.amplitude}|${this.seed}`;
    }
}
