/**
 * @internal
 */
export let FastMath_shader = /* wgsl*/ `
fn sqrtFast(  x : f32  ) -> f32 
{
	var i = i32(x);
	i = 0x1FBD1DF5 + (i / 2 );
	return f32(i);
}

fn lengthFast(  v :vec3<f32> ) -> f32
{
	var LengthSqr = dot(v,v);
	return sqrtFast( LengthSqr );
}

fn asinFast( x:f32 )-> f32
{
    return (0.5 * PI) - acosFast(x);
}

fn acosFast( inX: f32 ) -> f32
{
    var x = abs(inX);
    var res = -0.156583 * x + (0.5 * PI);
    res *= sqrt(1.0 - x);

	if(inX >= 0.0){
		return res ;
	}else{
		return PI - res ;
	}
}

fn acosFast4( inX : f32 )
{
	var x1 = abs(inX);
	var x2 = x1 * x1;
	var x3 = x2 * x1;
	var s;

	s = -0.2121144 * x1 + 1.5707288;
	s = 0.0742610 * x2 + s;
	s = -0.0187293 * x3 + s;
	s = sqrt(1.0 - x1) * s;

	// acos function mirroring
	// check per platform if compiles to a selector - no branch neeeded
	if(inX >= 0.0){
		return s ;
	}else{
		return PI - s ;
	}
}

`;
