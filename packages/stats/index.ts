import { ComponentBase } from "@orillusion/core"

/**
 * Performance info stats
 * @group Plugin
 */
export class Stats extends ComponentBase {
    /**
     * Stats DOM container
     * with default class="stats"  
     * could custom container style with css
     */
    container: HTMLElement
    private beginTime: number = performance.now()
    private prevTime: number = this.beginTime
    private frames: number = 0
    private fpsPanel: Panel
    private memPanel: Panel
    // private drawcallPanel:Panel

    /**
     * @internal
     */
    init() {
        const container = this.container = document.createElement('div')
        container.className = 'stats'
        container.setAttribute('style', 'display:flex;flex-direction:column;gap:1px;position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000')
        this.fpsPanel = new Panel(container, 'FPS', '#0ff', '#002')
        this.memPanel = new Panel(container, 'MB', '#f08', '#201')
        // this.drawcallPanel = new Panel( container, 'DC', '#0f0', '#020' )


        this.beginTime = (performance || Date).now()
        document.body.appendChild(this.container)
    }
    /**
     * @internal
     */
    onDisable() {
        this.container.style.display = 'none'
    }
    /**
     * @internal
     */
    onEnable() {
        this.container.style.display = 'flex'
    }
    /**
     * @internal
     */
    stop() {
        this.fpsPanel.destroy()
        this.memPanel.destroy()
        document.body.removeChild(this.container)
    }
    /**
     * @internal
     */
    onUpdate() {
        this.frames++
        const time = this.beginTime = performance.now()
        if (time >= this.prevTime + 1000) {
            this.fpsPanel.update((this.frames * 1000) / (time - this.prevTime), 100)
            this.memPanel.update((performance as any).memory.totalJSHeapSize / 1048576, 256)
            // this.drawcallPanel.update( Engine3D.engineSetting.performance.drawCall, 512)
            this.prevTime = time
            this.frames = 0
        }
    }
}

/**
 * @internal
 */
class Panel {
    canvas: HTMLCanvasElement
    private worker: Worker
    private width = 80
    private height = 48
    constructor(parent: HTMLElement, name: string, fg: string, bg: string) {
        const canvas = this.canvas = document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height
        parent.appendChild(canvas)
        const offscreen = (canvas as any).transferControlToOffscreen()
        const blob = new Blob([`(${worker})()`], { type: 'application/javascript' })
        this.worker = new Worker(URL.createObjectURL(blob))
        this.worker.postMessage({ type: 'init', offscreen, name, fg, bg }, [offscreen])
    }

    update(value: number, maxValue: number) {
        this.worker.postMessage({ type: 'update', value, maxValue })
    }
    destroy() {
        this.worker.terminate()
    }
}

 /**
 * @internal
 */
function worker() {
    let canvas: HTMLCanvasElement
    let context: CanvasRenderingContext2D
    let name: string
    let bg: string
    let fg: string
    let WIDTH: number
    let HEIGHT: number
    let min: number = Infinity
    let max: number = 0
    const PR = 1
    const TEXT_X = 3
    const TEXT_Y = 2
    const GRAPH_X = 3
    const GRAPH_Y = 15
    const GRAPH_WIDTH = 74
    const GRAPH_HEIGHT = 30

    onmessage = e => {
        if (e.data.type == 'update') {
            min = Math.min(min, e.data.value)
            max = Math.max(max, e.data.value)
            context.fillStyle = bg
            context.globalAlpha = 1
            context.fillRect(0, 0, WIDTH, GRAPH_Y)
            context.fillStyle = fg
            context.fillText(Math.round(e.data.value) + ' ' + name + ' (' + Math.round(min) + '-' + Math.round(max) + ')', TEXT_X, TEXT_Y)
            context.drawImage(canvas, GRAPH_X + PR, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - PR, GRAPH_HEIGHT)
            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, GRAPH_HEIGHT)
            context.fillStyle = bg
            context.globalAlpha = 0.9
            context.fillRect(GRAPH_X + GRAPH_WIDTH - PR, GRAPH_Y, PR, Math.round((1 - (e.data.value / e.data.maxValue)) * GRAPH_HEIGHT))
        } else if (e.data.type == 'init') {
            canvas = e.data.offscreen
            name = e.data.name
            bg = e.data.bg
            fg = e.data.fg
            WIDTH = canvas.width
            HEIGHT = canvas.height
            context = canvas.getContext('2d') as CanvasRenderingContext2D
            context.font = 'bold 9px Helvetica,Arial,sans-serif'
            context.textBaseline = 'top'
            context.fillStyle = bg
            context.fillRect(0, 0, WIDTH, HEIGHT)
            context.fillStyle = fg
            context.fillText(name, TEXT_X, TEXT_Y)
            context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)
            context.fillStyle = bg
            context.globalAlpha = 0.9
            context.fillRect(GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT)
        }
    }
}