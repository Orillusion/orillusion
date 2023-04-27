export class RTDescriptor {
    public storeOp: string = 'store';
    public loadOp: GPULoadOp = `clear`;
    public clearValue: GPUColor = [0, 0, 0, 0];
}