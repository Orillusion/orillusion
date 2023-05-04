import { Stats } from "@orillusion/stats";
import { Engine3D, Scene3D, AtmosphericComponent, Object3D, Camera3D, webGPUContext, HoverCameraController, View3D, MorePassParser } from "@orillusion/core";

export class Sample_MorePassParserTest {
    async run() {
        Engine3D.setting.shadow.autoUpdate = true;
        await Engine3D.init({});

        let scene = new Scene3D();
        scene.addComponent(AtmosphericComponent);
        scene.addComponent(Stats);

        let cameraObj = new Object3D();
        let mainCamera = cameraObj.addComponent(Camera3D);
        scene.addChild(cameraObj);


        mainCamera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        let hoverCameraController = mainCamera.object3D.addComponent(HoverCameraController);
        hoverCameraController.setCamera(45, 45, 30);

        await this.initScene(scene);

        let view = new View3D();
        view.scene = scene;
        view.camera = mainCamera;
        Engine3D.startRenderView(view);
    }

    async initScene(scene: Scene3D) {
        let morePassShader = MorePassParser.parser(Sample_MorePassParserTest.sampleCode, {
            "TEST": true
        });
        console.warn(morePassShader.name);
    }

    public static sampleCode: string = /* wgsl */ `
        Shader "AAA" {//标记shader
            pass{//此shader 的第一个pass
                PassType:"shadow" //覆盖默认的 shadow pass 生成

                ShaderState{//这里是关键的 shader 状态，描述每一个pass需要的外部管线能力
                    blendMode:"Add",
                    doubleSide:true,
                    depthWriteEnabled:false
                }
                vs{//这个是把 顶点着色部分提出来
                    fn main(){
                        #if TEST
                            let vs: f32 = 0.1;
                        #endif
                    }
                }
                fs {//这个是把 片段着色部分提出来
                    fn main(){
                        let fs: f32 = 0.1;^
                    }
                }
            }
            pass{//此shader 的第一个pass
                PassType:"zDepth" //覆盖默认的 Zpass 生成

                ShaderState{//这里是关键的 shader 状态，描述每一个pass需要的外部管线能力
                    blendMode:"Add",
                    doubleSide:true,
                    depthWriteEnabled:false
                }

                vertex{//这个是把 顶点着色部分提出来
                    fn main(){

                    }
                }

                fragment{//这个是把 片段着色部分提出来
                    fn main(){

                    }
                }
            }
            pass{//此shader 的第一个pass
                PassType:"Color" //对pass 的描述

                ShaderState{//这里是关键的 shader 状态，描述每一个pass需要的外部管线能力
                    blendMode:"Add",
                    doubleSide:true,
                    depthWriteEnabled:false
                }
                vertex{//这个是把 顶点着色部分提出来
                    fn main(){

                    }
                }
                fragment{//这个是把 片段着色部分提出来
                    fn main(){

                    }
                }
            }
            pass{//此shader 的第二个pass ， 是连续第一个pass 直接使用的，在渲染流程中连续的
                PassType:"Color"

                ShaderState{
                    blendMode:"Add",
                    depthWriteEnabled:true
                }
                vertex{//这个是把 顶点着色部分提出来
                    fn main(){

                    }
                }
                fragment{//这个是把 片段着色部分提出来
                    fn main(){

                    }
                }
            }
        }
    `;
}
