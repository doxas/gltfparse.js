attribute vec3  position;
attribute vec3  normal;
attribute vec2  texCoord0;
attribute vec2  texCoord1;

uniform   mat4  mvMatrix;
uniform   mat4  mvpMatrix;
uniform   mat4  normalMatrix;

varying   vec3  vNormal;
varying   vec2  vTexCoord0;
varying   vec2  vTexCoord1;
varying   vec3  vEye;
void main(){
    vec4 mvPosition = mvMatrix * vec4(position, 1.0);
    vNormal = (normalMatrix * vec4(normalize(normal), 0.0)).xyz;
    vTexCoord0 = texCoord0;
    vTexCoord1 = texCoord1;
    vEye = -mvPosition.xyz;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
