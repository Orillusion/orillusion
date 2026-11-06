import { WaterRenderer } from '../../../../components/renderer/WaterRenderer';
import { Time } from '../../../../util/Time';
import { ComponentCollect } from '../../collect/ComponentCollect';
import { RenderGraphBuilder, RenderGraphPass, RenderGraphPassContext } from '../RenderGraphPass';

/**
 * Advances the simulated water of every {@link WaterRenderer}: its FFT
 * waves ({@link WaterRenderer.spectrum}) and interactive ripples
 * ({@link WaterRenderer.addRipple}), before anything draws or samples them.
 *
 * {@link ForwardRendererJob} adds it before the passes that draw or sample
 * water when `setting.render.water` is true.
 *
 * @group Graph
 */
export class WaterSimulationPass extends RenderGraphPass {
    public readonly name: string = 'WaterSimulationPass';

    private _waters: WaterRenderer[] = [];

    public setup(_b: RenderGraphBuilder): void {
    }

    public destroy(): void {
        this._waters.length = 0;
    }

    public execute(ctx: RenderGraphPassContext): void {
        const view = ctx.view;
        const mask = (this.layerMask & (view.camera?.cullingMask ?? 0xFFFFFFFF)) >>> 0;
        ComponentCollect.collectByTypeLayered<WaterRenderer>(view, WaterRenderer, mask, this._waters);
        if (!this._waters.some((w) => w.hasSimulation)) return;
        const gpu = view.engine3D.context3D.gpuContext;
        const command = gpu.beginCommandEncoder();
        for (const water of this._waters) {
            if (water.hasSimulation && water.transform?.enable) water.stepSimulation(command, Time.delta * 0.001);
        }
        gpu.endCommandEncoder(command);
        for (const water of this._waters) water.afterSimulationSubmit();
    }
}
