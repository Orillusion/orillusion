/**
 * Motion Blur Setting — camera-motion blur applied by `MotionBlurPost`.
 * @group Setting
 */
export type MotionBlurSetting = {
    /** Master switch (set by attaching / detaching `MotionBlurPost`). */
    enable: boolean;
    /**
     * Shutter scale. 1 blurs each pixel along the full distance it travelled
     * since the previous frame (a 360° shutter at 60 Hz); 0.5 is the classic
     * 180° film shutter; 0 disables the blur.
     */
    intensity: number;
    /** Samples taken along the velocity vector, 2…32. More = smoother, slower. */
    samples: number;
    /** Upper bound on the blur length, in pixels, so a camera cut or teleport does not smear the whole frame. */
    maxBlurPixels: number;
    /**
     * Normalize the blur length to a 60 Hz frame so it looks the same at
     * any frame rate. Turn off to blur by the raw per-frame displacement.
     */
    frameRateIndependent: boolean;
};
