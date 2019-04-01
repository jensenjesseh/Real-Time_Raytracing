//
// Geometry
attribute vec4 aPosition;
varying vec3 vPos;

void main()
{
    vPos = aPosition.xyz;
    gl_Position = aPosition;
}
