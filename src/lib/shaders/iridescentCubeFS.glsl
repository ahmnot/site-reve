precision highp float;

varying vec3 FragmentPosition;  
varying vec3 NormalVector;  
varying vec3 VertexStableColor;
varying vec3 LightPosition;

struct Material {
    float shininess;
}; 
  
uniform Material material;

struct LightProperties {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float attenuationConstantTerm;
    float attenuationLinearTerm;
    float attenuationQuadraticTerm;
};

uniform LightProperties lightProperties;  
uniform vec3 varyingColor;

void main()
{
    vec3 baseColor = vec3(
        2.0 * VertexStableColor * varyingColor / (VertexStableColor + varyingColor) + 0.45
    );

    vec3 ambientColor = lightProperties.ambient * baseColor;
    vec3 lightToFragment = LightPosition - FragmentPosition;
    vec3 lightDirection = normalize(lightToFragment); 
    vec3 diffuseColor = 
        lightProperties.diffuse 
        * max(dot(NormalVector, lightDirection), 0.0)
        * baseColor;

    vec3 specularColor = lightProperties.specular 
        * pow(
            max(
                dot(
                    normalize(-FragmentPosition),
                    reflect(-lightDirection, NormalVector)
                ), 0.0
            ), 
            material.shininess
        ) 
        * baseColor;

    float lightFragmentDistance = length(lightToFragment);
    float attenuation = 1.0 / 
        (lightProperties.attenuationConstantTerm 
        + lightProperties.attenuationLinearTerm * lightFragmentDistance 
        + lightProperties.attenuationQuadraticTerm * lightFragmentDistance * lightFragmentDistance);

    diffuseColor *= attenuation;
    specularColor *= attenuation;
   
    gl_FragColor = vec4(ambientColor * (1.0 - diffuseColor) - diffuseColor * (1.0 - specularColor) - specularColor * (1.0 - ambientColor), 1.0);
}
