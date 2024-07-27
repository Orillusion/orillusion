/**
 * @internal
 */
export let BitUtil = /* wgsl */`

    const inv256:f32 = 1.0/256.0;
    const inv1024:f32 = 1.0/1024.0;

    const bit7_inv128:f32 = 1.0 / 128.0;
    const bit7_128:f32 = 128.0;
    
    const r10g10b10 = vec2i(0x3FFFFF,0xFF);
    fn floatToVec3f( v:f32 ) -> vec3f {
        var VPInt:i32 = bitcast<i32>(v);
        var VPInt1024:i32 = VPInt%1024;
        var VPInt10241024:i32 = ((VPInt-VPInt1024)/1024)%1024;
        return vec3f(f32(VPInt1024),f32(VPInt10241024),f32(((VPInt-VPInt1024-VPInt10241024)/1048576)))*vec3f(inv1024);
    }

    fn vec3fToFloat( v:vec3f) -> f32{
        let intv = min(vec3<i32>(floor(v*1024.)),vec3<i32>(1023));
        return bitcast<f32>(i32(intv.x+intv.y*1024+intv.z*1048576));
    }

    fn vec4fToFloat_7bits( v:vec4f) -> f32{
        //0~256
        let intv = min(vec4<i32>(floor(v*bit7_128)),vec4<i32>(127));
        return bitcast<f32>(i32(intv.x+intv.y*128+intv.z*16384+intv.w*2097152));
    }

    fn floatToVec4f_7bits( v:f32 ) -> vec4f {
        var VPInt:i32 = bitcast<i32>(v);
        var VPInt128:i32 = VPInt%128;
        var VPInt128128:i32 = ((VPInt-VPInt128)/128)%128;
        var VPInt128128128:i32 = ((VPInt-VPInt128-VPInt128128)/16384)%128;
        var VPInt128128128128:i32 = ((VPInt-VPInt128-VPInt128128-VPInt128128128)/2097152)%128;
        return vec4f(f32(VPInt128),f32(VPInt128128),f32(VPInt128128128),f32(VPInt128128128128))*vec4f(bit7_inv128);
    }






    const i_r11g11b11 = vec3i(0x7FF,0x7FF,0x7FF);
    const f_r11g11b11 = vec3f(f32(0x7FF),f32(0x7FF),f32(0x7FF));
    fn r11g11b11_to_float( v:vec3f) -> f32{
        let iR: i32 = i32(v.r * f_r11g11b11.r);
        let iG: i32 = i32(v.g * f_r11g11b11.g);
        let iB: i32 = i32(v.b * f_r11g11b11.b);
        return bitcast<f32>((iR << 22u) | (iG << 11u) | iB );
    }

    fn float_to_r11g11b11( v:f32 ) -> vec3f {
        let iV: i32 = bitcast<i32>(v);
        var r: f32 = f32((iV >> 22u) & i_r11g11b11.r) / f_r11g11b11.r;
        var g: f32 = f32((iV >> 11u) & i_r11g11b11.g) / f_r11g11b11.g;
        var b: f32 = f32(iV & i_r11g11b11.b) / f_r11g11b11.b ;
        return vec3f(r,g,b);
    }

    const i_r22g8 = vec2i(0x3FFFFF,0xFF);
    const f_r22g8 = vec2f(f32(0x3FFFFF),f32(0xFF));
    fn r22g8_to_float( v:vec2f) -> f32{
        let iR: i32 = i32(v.r * f_r22g8.r);
        let iG: i32 = i32(v.g * f_r22g8.g);
        return bitcast<f32>((iR << 8u) | iG);
    }

    fn float_to_r22g8( v:f32 ) -> vec2f {
        let iV: i32 = bitcast<i32>(v);
        var r: f32 = f32((iV >> 8u) & i_r22g8.r) / f_r22g8.r;
        var g: f32 = f32(iV & i_r22g8.g) / f_r22g8.g ;
        return vec2f(r,g);
    }

    const r11g11b9 = vec3i(0x7FF,0x7FF,0x1FF);
    fn r11g11b9_to_float( v:vec3f) -> f32{
        let iR: i32 = i32(v.r * f32(r11g11b9.r));
        let iG: i32 = i32(v.g * f32(r11g11b9.g));
        let iB: i32 = i32(v.b * f32(r11g11b9.b));
        return bitcast<f32>((iR << 20u) | (iG << 9u) | iB );
    }

    fn float_to_r11g11b9( v:f32 ) -> vec3f {
        let iV: i32 = bitcast<i32>(v);
        var r: f32 = f32((iV >> 20u) & r11g11b9.r) / f32(r11g11b9.r);
        var g: f32 = f32((iV >> 9u) & r11g11b9.g) / f32(r11g11b9.g);
        var b: f32 = f32(iV & r11g11b9.b) / f32(r11g11b9.b) ;
        return vec3f(r,g,b);
    }




    fn floatToRGBA(v:f32) -> vec4f{
        var iv = bitcast<u32>(v);
        var color = vec4f(0.0);
        color.x = f32((iv&0x00FF0000u)>>16u)/255.0;
        color.y = f32((iv&0x000FF00u)>>8u)/255.0;
        color.z = f32(iv&0x000000FFu)/255.0;
        return color;
    }

    const bitShift:vec4f = vec4f(1.0, 1.0/256.0, 1.0/(256.0*256.0), 1.0/(256.0*256.0*256.0));
    fn RGBAToFloat(v:vec4f) -> f32 {
        var f = dot(v, bitShift);
        return f;
    }

`