import { CircleShape3DCode_cs } from "./CircleShape3DCode_cs";
import { EllipseShape3DCode_cs } from "./EllipseShape3DCode_cs";
import { Path2DShape3DCode_cs } from "./Path2DShape3DCode_cs";
import { Path3DShape3DCode_cs } from "./Path3DShape3DCode_cs";
import { RoundRectShape3DCode_cs } from "./RoundRectShape3DCode_cs";

/**
 * @internal
 */
export let Shape3DCommonCode_cs = /*wgsl*/`

${CircleShape3DCode_cs}
${RoundRectShape3DCode_cs}
${EllipseShape3DCode_cs}
${Path2DShape3DCode_cs}
${Path3DShape3DCode_cs}

const NoneShape:u32 = 0u;
const CircleShapeType : u32 = 1u;
const RoundRectShapeType : u32 = 2u;
const EllipseShapeType : u32 = 3u;
const Path2DShapeType : u32 = 4u;
const Path3DShapeType : u32 = 5u;

struct ShapeDataBase{
   shapeType: f32,
   shapeOrder:f32,
   destPointStart:f32,
   destPointCount:f32,

   srcPointStart:f32,
   srcPointCount:f32,
   srcIndexStart:f32,
   srcIndexCount:f32,
   
   isClosed:f32,
   fill: f32,
   line: f32,
   lineWidth: f32,
}

struct ShapeData {
    base:ShapeDataBase,
    xa:f32,    xb:f32,    xc:f32,    xd:f32,
    xe:f32,    xf:f32,    xg:f32,    xh:f32,
}

struct Path3DKeyPoint{
   pos:vec3<f32>,
   right:vec3<f32>,
   shapeIndex:f32,
   pointIndex:f32,//localIndex
   overallLength:f32,
   invalidPoint:f32,
   a:f32,
   b:f32,
}

struct RenderData{
   cameraUp:vec4<f32>,
   cameraPos:vec4<f32>,
   maxNodeCount:f32,
   usedDestPointCount:f32,
   maxFaceCount:f32,
   zFightingRange:f32,
 }

 fn drawShapeFace(shapeData:ShapeData, keyPoint:Path3DKeyPoint, lineWidth:f32, cPoint:vec3<f32>){
   var p0:vec3<f32>;
   var p1:vec3<f32>;
   var p2:vec3<f32>;
   var p3:vec3<f32>;
   
   var u0:vec2<f32>;
   var u1:vec2<f32>;
   var u2:vec2<f32>;
   var u3:vec2<f32>;

   let shapeBase = shapeData.base;

   var nextPointIndex:u32 = globalIndex + 1u;
   let destStart = u32(round(shapeBase.destPointStart));
   let destCount = u32(round(shapeBase.destPointCount));
   if(nextPointIndex >= destStart + destCount){
      nextPointIndex = destStart;
   }
   let nextKeyPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];
   if(shapeBase.fill > 0.5){
       p0 = cPoint;
       p1 = keyPoint.pos + keyPoint.right * lineWidth * 0.5;
       p2 = nextKeyPoint.pos + nextKeyPoint.right * lineWidth * 0.5;

       u0 = vec2<f32>(p0.x, p0.z);
       u1 = vec2<f32>(p1.x, p1.z);
       u2 = vec2<f32>(p2.x, p2.z);

       p0.y = fillOffsetY;
       p1.y = fillOffsetY;
       p2.y = fillOffsetY;

       drawFace(shapeIndex,p1,p0,p2,u1,u0,u2);
   }
   
   if(shapeBase.line > 0.5) {
       let commonRight = normalize(keyPoint.right + nextKeyPoint.right) * lineWidth;
       p0 = keyPoint.pos;
       p1 = keyPoint.pos + keyPoint.right * lineWidth;
       p2 = nextKeyPoint.pos;
       p3 = nextKeyPoint.pos + nextKeyPoint.right * lineWidth;
      
       var p0b = p0 + commonRight;
       var p2b = p2 + commonRight;

       p0.y = lineOffsetY;
       p1.y = lineOffsetY;
       p2.y = lineOffsetY;
       p3.y = lineOffsetY;
       p0b.y = lineOffsetY;
       p2b.y = lineOffsetY;
      
       let overrallLength_start = keyPoint.overallLength;
       let length_p0_p2 = length(p0 - p2);
       let length_corner = length(p1 - p0b) * 0.5;
       let ratioLength = length_p0_p2 / (length_corner * 2.0 + length_p0_p2);

       var overallLength_p0b = overrallLength_start + length_corner * ratioLength;
       var overallLength_p2b = overallLength_p0b + length_p0_p2 * ratioLength;
       var overallLength_p3 = overrallLength_start + length_p0_p2;

       var u0b:vec2<f32>;
       var u0a:vec2<f32>;
       var u2b:vec2<f32>;
       var u2a:vec2<f32>;

       u0.x = 0.0;
       u0.y = overrallLength_start;
       u0a.x = 0.0;
       u0a.y = overallLength_p0b;
       u2.x = 0.0;
       u2.y = overallLength_p3;
       u2a.x = 0.0;
       u2a.y = overallLength_p2b;

       u1.x = 1.0;
       u1.y = overrallLength_start;
       u0b.x = 1.0;
       u0b.y = overallLength_p0b;
       u2b.x = 1.0;
       u2b.y = overallLength_p2b;
       u3.x = 1.0;
       u3.y = overallLength_p3;

       drawLine(shapeIndex,p1,p0,p0b,u1,u0a,u0b);
       drawLine(shapeIndex,p0b,p0,p2b,u0b,u0a,u2b);
       drawLine(shapeIndex,p2b,p0,p2,u2b,u0a,u2a);
       drawLine(shapeIndex,p2b,p2,p3,u2b,u2a,u3);
  
   }

}

@group(0) @binding(3) var<storage, read> nodeBuffer : array<ShapeData>;
@group(0) @binding(4) var<storage, read_write> srcIndexBuffer : array<vec4<u32>>;
@group(0) @binding(5) var<storage, read_write> srcPathBuffer : array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> destPathBuffer : array<Path3DKeyPoint>;
@group(0) @binding(7) var<uniform> rendererData: RenderData;

var<private> globalIndex : u32;
var<private> zero_pos : vec3<f32> = vec3<f32>(0.0,0.0,0.0);
var<private> zero_uv : vec2f = vec2f(0.0,0.0);
var<private> pi_2 : f32 = 6.2831853071795864;
var<private> pi: f32 = 3.14159265359;
var<private> shapeIndex : u32 = 0;
var<private> shapeType : u32 = 0;
var<private> lineOffsetY : f32 = 0.0;
var<private> fillOffsetY : f32 = 0.0;
var<private> cameraUp : vec4f;
var<private> cameraPos : vec4f;

`