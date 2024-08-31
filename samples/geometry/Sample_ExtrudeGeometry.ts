import { Engine3D, View3D, Scene3D, CameraUtil, AtmosphericComponent, webGPUContext, HoverCameraController, Object3D, DirectLight, KelvinUtil, LitMaterial, MeshRenderer, Color, GridObject, Vector2, Vector3 } from "@orillusion/core";
import { Shape2D, ExtrudeGeometry, Path2D } from "@orillusion/geometry";

class Sample_ExtrudeGeometry {
    scene: Scene3D
    async run() {
        await Engine3D.init();
        let view = new View3D();
        view.scene = this.scene = new Scene3D();
        let sky = view.scene.addComponent(AtmosphericComponent);

        view.camera = CameraUtil.createCamera3DObject(view.scene);
        view.camera.perspective(60, webGPUContext.aspect, 1, 5000.0);
        view.camera.object3D.z = -15;
        view.camera.object3D.addComponent(HoverCameraController).setCamera(0, -20, 500);

        let lightObj3D = new Object3D();
        let sunLight = lightObj3D.addComponent(DirectLight);
        sunLight.intensity = 3;
        sunLight.lightColor = KelvinUtil.color_temperature_to_rgb(6553);
        sunLight.castShadow = true;
        lightObj3D.rotationX = 53.2;
        lightObj3D.rotationY = 220;
        lightObj3D.rotationZ = 5.58;
        view.scene.addChild(lightObj3D);
        sky.relativeTransform = lightObj3D.transform;

        view.scene.addChild(new GridObject(1000, 100))

        Engine3D.startRenderView(view);

        this.createShapes();
    }

    async createShapes() {
        
        // california
        {
            let points:Vector2[] = []
            points.push( new Vector2( 610, 320 ) );
            points.push( new Vector2( 450, 300 ) );
            points.push( new Vector2( 392, 392 ) );
            points.push( new Vector2( 266, 438 ) );
            points.push( new Vector2( 190, 570 ) );
            points.push( new Vector2( 190, 600 ) );
            points.push( new Vector2( 160, 620 ) );
            points.push( new Vector2( 160, 650 ) );
            points.push( new Vector2( 180, 640 ) );
            points.push( new Vector2( 165, 680 ) );
            points.push( new Vector2( 150, 670 ) );
            points.push( new Vector2( 90, 737 ) );
            points.push( new Vector2( 80, 795 ) );
            points.push( new Vector2( 50, 835 ) );
            points.push( new Vector2( 64, 870 ) );
            points.push( new Vector2( 60, 945 ) );
            points.push( new Vector2( 300, 945 ) );
            points.push( new Vector2( 300, 743 ) );
            points.push( new Vector2( 600, 473 ) );
            points.push( new Vector2( 626, 425 ) );
            points.push( new Vector2( 600, 370 ) );
            points.push( new Vector2( 610, 320 ) );

            let shape = new Shape2D(points.map(p=>p.multiplyScaler(0.25)))
            this.addShape(shape, -300, -60, 0)
        }

        // triangle
        {
            let shape = new Shape2D();
            shape.moveTo(80, 20);
            shape.lineTo(40, 80);
            shape.lineTo(120, 80);
            shape.lineTo(80, 20);

            this.addShape(shape, -180, 0, 0)
        }

        // heart
        {
            const x = 0, y = 0;
            const shape = new Shape2D()
                .moveTo( x + 25, y + 25 )
                .bezierCurveTo( x + 25, y + 25, x + 20, y, x, y )
                .bezierCurveTo( x - 30, y, x - 30, y + 35, x - 30, y + 35 )
                .bezierCurveTo( x - 30, y + 55, x - 10, y + 77, x + 25, y + 95 )
                .bezierCurveTo( x + 60, y + 77, x + 80, y + 55, x + 80, y + 35 )
                .bezierCurveTo( x + 80, y + 35, x + 80, y, x + 50, y )
                .bezierCurveTo( x + 35, y, x + 25, y + 25, x + 25, y + 25 );


            this.addShape(shape, 0, 20, 0)
        }

        // square
        {
            const sqLength = 80;
            const squareShape = new Shape2D()
                .moveTo( 0, 0 )
                .lineTo( 0, sqLength )
                .lineTo( sqLength, sqLength )
                .lineTo( sqLength, 0 )
                .lineTo( 0, 0 );
            
            this.addShape(squareShape, 100, 20, 0)
        }

        // Circle
        {
            const circleRadius = 40;
            const circleShape = new Shape2D()
                .moveTo( 0, circleRadius )
                .quadraticCurveTo( circleRadius, circleRadius, circleRadius, 0 )
                .quadraticCurveTo( circleRadius, - circleRadius, 0, - circleRadius )
                .quadraticCurveTo( - circleRadius, - circleRadius, - circleRadius, 0 )
                .quadraticCurveTo( - circleRadius, circleRadius, 0, circleRadius );

            this.addShape(circleShape, 140, 150, 0)
        }

        // Fish
        {
            const x = 0, y =0;
            const fishShape = new Shape2D()
                .moveTo( x, y )
                .quadraticCurveTo( x + 50, y - 80, x + 90, y - 10 )
                .quadraticCurveTo( x + 100, y - 10, x + 115, y - 40 )
                .quadraticCurveTo( x + 115, y, x + 115, y + 40 )
                .quadraticCurveTo( x + 100, y + 10, x + 90, y + 10 )
                .quadraticCurveTo( x + 50, y + 80, x, y );

            this.addShape(fishShape, -40, 160, 0)
        }

        // holes
        {
            const sqLength = 80;
            const squareShape = new Shape2D()
                .moveTo( 0, 0 )
                .lineTo( 0, sqLength )
                .lineTo( sqLength, sqLength )
                .lineTo( sqLength, 0 )
                .lineTo( 0, 0 );

            let hole1 = new Path2D()
                .moveTo( 10, 10 )
                .lineTo( 10, 30 )
                .lineTo( 30, 30 )
                .lineTo( 30, 10 )
                .lineTo( 10, 10 );
            
            let hole2 = new Path2D()
                .moveTo( 40, 10 )
                .lineTo( 40, 30 )
                .lineTo( 60, 30 )
                .lineTo( 60, 10 )
                .lineTo( 40, 10 );
            
            squareShape.holes.push(hole1, hole2);

            this.addShape(squareShape, -150, 100, 0)
        }

    }

    matrial: LitMaterial;
    addShape(shape: Shape2D, x:number = 0, y:number = 0, z:number = 0){
        let obj = new Object3D();
        obj.localPosition = new Vector3(x, y, z)
        let mr = obj.addComponent(MeshRenderer);
        mr.geometry = new ExtrudeGeometry([shape], {
            depth: 10,
            bevelEnabled: false,
            steps: 1
        });
        if(!this.matrial){
            let mat =  this.matrial = new LitMaterial();
            mat.baseColor = new Color(0.2, 0.5, 1.0);
            mat.castShadow = false;
        }
        let mats = [];
        for (let i = 0; i < mr.geometry.subGeometries.length; i++) {
            mats.push(this.matrial);
        }
        mr.materials = mats;
        this.scene.addChild(obj);
    }
}

new Sample_ExtrudeGeometry().run();
