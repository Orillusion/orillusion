import { CircleShape3DCode_cs } from "./CircleShape3DCode_cs";
import { EllipseShape3DCode_cs } from "./EllipseShape3DCode_cs";
import { LineShape3DCode_cs } from "./LineShape3DCode_cs";
import { RoundRectShape3DCode_cs } from "./RoundRectShape3DCode_cs";

export let Shape3DCommonCode_cs = /*wgsl*/`

${CircleShape3DCode_cs}
${RoundRectShape3DCode_cs}
${EllipseShape3DCode_cs}
${LineShape3DCode_cs}

const CircleShapeType : u32 = 1u;
const RoundRectShapeType : u32 = 2u;
const EllipseShapeType : u32 = 3u;
const LineShapeType : u32 = 4u;

struct ShapeDataBase{
   shapeType: f32,
   shapeOrder:f32,
   destPointStart:f32,
   destPointCount:f32,

   srcPointStart:f32,
   srcPointCount:f32,
   srcIndexStart:f32,
   srcIndexCount:f32,

   empty0:f32,
   empty1:f32,
   uScale:f32,
   vScale:f32,
   
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
   up:vec3<f32>,
   shapeIndex:f32,
   pointIndex:f32,//localIndex
   distance:f32,
}

struct RenderData{
   maxNodeCount:f32,
   usedDestPointCount:f32,
   maxFaceCount:f32,
   zFightingScale:f32,
 }

 fn drawShapeFace(shapeData:ShapeData, keyPoint:Path3DKeyPoint, lineWidth:f32, uvScale:vec2<f32>){
   var p0:vec3f;
   var p1:vec3f;
   var p2:vec3f;
   var p3:vec3f;
   
   var u0:vec2f;
   var u1:vec2f;
   var u2:vec2f;

   let shapeBase = shapeData.base;

   var nextPointIndex:u32 = globalIndex + 1u;
   let destStart = u32(round(shapeBase.destPointStart));
   let destCount = u32(round(shapeBase.destPointCount));
   if(nextPointIndex >= destStart + destCount){
      nextPointIndex = destStart;
   }
   let nextKeyPoint:Path3DKeyPoint = destPathBuffer[nextPointIndex];
   if(shapeBase.fill > 0.5){
       p0 = zero_pos;
       p1 = keyPoint.pos;
       p2 = nextKeyPoint.pos;

       u0 = vec2f(p0.x, p0.z) * uvScale;
       u1 = vec2f(p1.x, p1.z) * uvScale;
       u2 = vec2f(p2.x, p2.z) * uvScale;

       p0.y = fillOffsetY;
       p1.y = fillOffsetY;
       p2.y = fillOffsetY;

       drawFace(shapeIndex,p1,p0,p2,u1,u0,u2);
   }
   
   if(shapeBase.line > 0.5) {
       p0 = keyPoint.pos;
       p1 = keyPoint.pos + keyPoint.right * lineWidth;
       p2 = nextKeyPoint.pos;
       p3 = nextKeyPoint.pos + nextKeyPoint.right * lineWidth;
      
       p0.y = lineOffsetY;
       p1.y = lineOffsetY;
       p2.y = lineOffsetY;
       p3.y = lineOffsetY;

       u0 = vec2f(0.5, 0.5);

       drawFace(shapeIndex,p1,p0,p2,u0,u0,u0);
       drawFace(shapeIndex,p1,p2,p3,u0,u0,u0);
   }

}

@group(0) @binding(3) var<storage, read> nodeBuffer : array<ShapeData>;
@group(0) @binding(4) var<storage, read_write> srcIndexBuffer : array<vec4<u32>>;
@group(0) @binding(5) var<storage, read_write> srcPathBuffer : array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> destPathBuffer : array<Path3DKeyPoint>;
@group(0) @binding(7) var<uniform> rendererData: RenderData;

var<private> globalIndex : u32;
var<private> zero_pos : vec3f = vec3f(0.0,0.0,0.0);
var<private> zero_uv : vec2f = vec2f(0.0,0.0);
var<private> pi_2 : f32 = 6.2831853071795864;
var<private> shapeIndex : u32 = 0;
var<private> shapeType : u32 = 0;
var<private> lineOffsetY : f32 = 0.0;
var<private> fillOffsetY : f32 = 0.0;

`