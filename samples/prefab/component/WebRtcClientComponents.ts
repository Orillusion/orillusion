import { AnimatorComponent, ComponentBase, MorphTargetFrame, MorphTargetTransformKey } from "../../../src";

export class WebRtcClientComponents extends ComponentBase {
    public init(param?: any): void {

    }

    public async start(): Promise<void> {
        this.runWebRTC();
    }

    private runWebRTC() {
        let id = Math.random().toString(10).slice(2, 6)
        let peer = new Peer(id, {
            config: {
                iceServers: [
                    { url: 'stun:stun.qq.com:3478' },
                    { url: 'stun:stun.miwifi.com:3478' },
                    { url: 'stun:stun.l.google.com:19302' }
                ]
            },
            host: 'peer.dolphinbi.com', port: 443, path: '/peerSync', secure: true
        })
        peer.on('open', (id) => {
            console.log(id)
            document.body.children[0].innerHTML = 'Server Ready<br>' + id
        })
        peer.on('connection', c => {
            let animatorComponent = this.object3D.getComponentsInChild(AnimatorComponent);
            if (animatorComponent) {
                console.log('new client', c.peer)
                let start = performance.now()
                c.on('data', async e => {
                    // send back to native
                    // TODO...

                    let end = performance.now()
                    let data = JSON.parse(e)
                    console.log(data, end - start)
                    start = end
                    document.body.children[1].innerHTML = e

                    if (data.texture) {
                        for (const pro in data.texture) {
                            let value = data.texture[pro];
                            let shapeName = MorphTargetTransformKey[pro];
                            animatorComponent[0].updateBlendShape(["blendShape", "blendShape", shapeName], "blendShape.blendShape." + shapeName, value);
                        }
                    }
                })
                c.on('close', () => {
                    console.log('closed', c.peer)
                })
            }

        })
    }
}