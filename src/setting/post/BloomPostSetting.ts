
/**
 * Bloom
 * @group Setting
 */
export type BloomPostSetting = {
    enable?: boolean,
    downSampleStep: number;
    downSampleBlurSize: number;
    downSampleBlurSigma: number;
    upSampleBlurSize: number;
    upSampleBlurSigma: number;
    luminanceThreshole: number;
    bloomIntensity: number;
};