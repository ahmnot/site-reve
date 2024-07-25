varying vec3 FragmentPosition; 
varying vec3 NormalVector;
varying vec3 VertexStableColor;
varying vec3 LightPosition;

uniform vec3 lightPosition; 

void main()
{
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);

    FragmentPosition = vec3(viewMatrix * modelMatrix * vec4(position, 1.0));
    NormalVector = normalize(mat3(transpose(inverse(viewMatrix * modelMatrix))) * normal);  
    LightPosition = vec3(viewMatrix * vec4(lightPosition, 1.0));
    VertexStableColor = vec3(1.0); // Default color, replace with actual attribute if needed
}
