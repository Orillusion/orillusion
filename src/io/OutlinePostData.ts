import { Engine3D } from "../Engine3D";
import { Color } from "../math/Color";

export class OutlinePostSlot {
    public indexList: Float32Array;
    public color: Color;
    public count: number;
}

export class OutlinePostData {
    //Supports up to 8 sets of colors
    public readonly SlotCount: number = 8;
    public readonly MaxEntities: number = 16;
    public readonly defaultColor: Color = new Color(0.2, 1, 1, 1);
    private readonly slots: OutlinePostSlot[] = [];

    private dataDirty: boolean = true;

    constructor() {
        let groupCount = Engine3D.setting.render.postProcessing.outline.groupCount;
        this.SlotCount = Math.max(1, Math.min(groupCount, this.SlotCount));
        for (let i = 0; i < this.SlotCount; i++) {
            let slot: OutlinePostSlot = (this.slots[i] = new OutlinePostSlot());
            slot.indexList = new Float32Array(this.MaxEntities);
            slot.color = this.defaultColor.clone();
            slot.count = 0;
        }
    }

    public clear(): void {
        for (let i = 0; i < this.SlotCount; i++) {
            this.clearAt(i);
        }
    }

    public clearAt(slotIndex: number): this {
        this.dataDirty = true;
        let slot: OutlinePostSlot = this.slots[slotIndex];
        slot.color.copyFrom(this.defaultColor);
        slot.indexList.fill(-1);
        slot.count = 0;
        return this;
    }

    public fillDataAt(slot: number, indexList: number[], color: Color): this {
        this.dataDirty = true;
        let data = this.slots[slot];
        if (data) {
            data.indexList.fill(-1);
            for (let i = 0, c = indexList.length; i < c; i++) {
                data.indexList[i] = indexList[i];
            }
            data.count = indexList.length;
            data.color.copyFrom(color);
        }
        return this;
    }

    public fetchData(target: { dirty: boolean; slots: OutlinePostSlot[] }): this {
        target.dirty = this.dataDirty;
        target.slots = this.slots;
        this.dataDirty = false;
        return this;
    }
}

export let outlinePostData: OutlinePostData = new OutlinePostData();