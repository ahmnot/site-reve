precision highp float;

uniform vec3 cubeColor;

void main()
{
    gl_FragColor = vec4(cubeColor, 1.0);
}
