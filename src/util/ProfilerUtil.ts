import { View3D } from "../core/View3D"
import { PassType } from "../gfx/renderJob/passRenderer/state/PassType"

export type ProfilerLabel2 = {
    lable: string,
    start: number,
    end: number,
    total: number,
    count: number,
}


export type ProfilerLabel = {
    lable: string,
    start: number,
    end: number,
    total: number,
    count: number,
    child: Map<string, ProfilerLabel2>
}

export type ProfilerDraw = {
    [key: string]: {
        vertexCount: number,
        indicesCount: number,
        triCount: number,
        instanceCount: number,
        drawCount: number,
        pipelineCount: number,
    }
}

export class ProfilerUtil {

    private static profilerLabelMap: Map<string, ProfilerLabel> = new Map<string, ProfilerLabel>();

    public static viewMap: Map<View3D, ProfilerDraw> = new Map<View3D, ProfilerDraw>();

    public static testObj = {
        testValue1: 0,
        testValue2: 0,
        testValue3: 0,
        testValue4: 0,
    }

    public static startView(view: View3D) {
        let countInfo = this.viewMap.get(view);
        if (!countInfo) {
            countInfo = {}
            for (const key in PassType) {
                let i = parseInt(key);
                if (i >= 0) {
                } else {
                    countInfo[key] = {
                        vertexCount: 0,
                        indicesCount: 0,
                        instanceCount: 0,
                        triCount: 0,
                        drawCount: 0,
                        pipelineCount: 0
                    }
                }
            }
            this.viewMap.set(view, countInfo)
        }

        for (const key in PassType) {
            let i = parseInt(key);
            if (i >= 0) {
            } else {
                countInfo[key].vertexCount = 0;
                countInfo[key].indicesCount = 0;
                countInfo[key].triCount = 0;
                countInfo[key].instanceCount = 0;
                countInfo[key].drawCount = 0;
                countInfo[key].pipelineCount = 0;
            }
        }
    }

    public static viewCount(view: View3D): ProfilerDraw {
        this.startView(view);
        return this.viewMap.get(view);
    }

    public static viewCount_vertex(view: View3D, pass: string, v: number) {
        this.viewMap.get(view)[pass].vertexCount += v;
    }

    public static viewCount_indices(view: View3D, pass: string, v: number) {
        this.viewMap.get(view)[pass].indicesCount += v;
    }

    public static viewCount_tri(view: View3D, pass: string, v: number) {
        this.viewMap.get(view)[pass].triCount += v;
    }

    public static viewCount_instance(view: View3D, pass: string, v: number) {
        this.viewMap.get(view)[pass].instanceCount += v;
    }

    public static viewCount_draw(view: View3D, pass: string) {
        this.viewMap.get(view)[pass].drawCount++;
    }

    public static viewCount_pipeline(view: View3D, pass: string) {
        this.viewMap.get(view)[pass].pipelineCount++;
    }

    public static start(id: string) {
        let profilerLabel = this.profilerLabelMap.get(id);
        if (!profilerLabel) {
            profilerLabel = {
                lable: id,
                start: 0,
                end: 0,
                total: 0,
                count: 0,
                child: new Map<string, ProfilerLabel2>()
            }
            this.profilerLabelMap.set(id, profilerLabel);
        }
        profilerLabel.start = performance.now();
        profilerLabel.end = performance.now();
        profilerLabel.count = 0;
        profilerLabel.child.clear();
    }

    public static end(id: string) {
        let profilerLabel = this.profilerLabelMap.get(id);
        if (profilerLabel) {
            profilerLabel.end = performance.now();
            profilerLabel.total = profilerLabel.end - profilerLabel.start;
        }
    }

    public static countStart(id: string, id2: string = "") {
        let profilerLabel = this.profilerLabelMap.get(id);
        if (profilerLabel) {
            profilerLabel.count++;
            if (id2 != "") {
                let node = profilerLabel.child.get(id2);
                if (!node) {
                    node = {
                        lable: id2,
                        start: 0,
                        end: 0,
                        total: 0,
                        count: 0,
                    }
                }
                node.start = performance.now();
                node.end = performance.now();
                node.count = 0;
                profilerLabel.child.set(id2, node);
            }
        }
    }

    public static countEnd(id: string, id2: string) {
        let profilerLabel = this.profilerLabelMap.get(id);
        if (profilerLabel) {
            if (id2 != "") {
                let node = profilerLabel.child.get(id2);
                if (!node) {
                    node = {
                        lable: id2,
                        start: 0,
                        end: 0,
                        total: 0,
                        count: 0,
                    }
                }
                node.end = performance.now();
                node.total = node.end - node.start;
                node.count++;
            }
        }
    }

    public static print(id: string) {
        let profilerLabel = this.profilerLabelMap.get(id);
        if (profilerLabel) {
            console.log("performance", id, profilerLabel.total + " ms");
        }
    }
}
