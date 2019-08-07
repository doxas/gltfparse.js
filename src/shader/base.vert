attribute vec3 position;
attribute vec3 normal;
attribute vec2 texCoord0;
/* attribute vec2 texCoord1; */
uniform   mat4 mMatrix;
uniform   mat4 mvMatrix;
uniform   mat4 mvpMatrix;
uniform   mat4 normalMatrix;

uniform   vec4 baseColorFactor;

varying   vec3 vPosition;
varying   vec3 vNormal;
varying   vec4 vColor;
varying   vec2 vTexCoord;
varying   vec3 vEye;
void main(){
    vec4 mvPosition = mvMatrix * vec4(position, 1.0);
    vPosition = (mMatrix * vec4(position, 1.0)).xyz;
    vNormal = (normalMatrix * vec4(normalize(normal), 0.0)).xyz;
    vColor = baseColorFactor;
    vTexCoord = texCoord0;
    vEye = -mvPosition.xyz;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
