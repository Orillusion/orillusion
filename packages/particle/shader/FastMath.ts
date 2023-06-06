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
`;
