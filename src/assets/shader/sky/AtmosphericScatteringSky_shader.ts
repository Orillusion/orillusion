import source from "./AtmosphericScatteringSky.wgsl?raw";
import transmittance from "./RenderTransmittanceLutPS.wgsl?raw";
import integration from "./AtmosphericScatteringIntegration.wgsl?raw";
import multiscatter from "./NewMultiScattCS.wgsl?raw";
import earth from "./AtmosphereEarth.wgsl?raw";
import raymarch from "./RenderSkyRayMarching.wgsl?raw";
import skyview from "./SkyViewLutPS.wgsl?raw";
import cloud from "./CloudNoise.wgsl?raw";

/**
 * @internal
 */
export class AtmosphericScatteringSky_shader {
  public static cs: string = source;
  public static transmittance_cs: string = transmittance;
  public static multiscatter_cs: string = multiscatter;
  public static integration: string = integration;
  public static raymarch_cs: string = raymarch;
  public static skyview_cs: string = skyview;
  public static earth: string = earth;
  public static cloud_cs: string = cloud;
}
