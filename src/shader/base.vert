attribute vec3  position;
attribute vec3  normal;
attribute vec2  texCoord0;
attribute vec2  texCoord1;

uniform   mat4  mvMatrix;
uniform   mat4  mvpMatrix;
uniform   mat4  normalMatrix;
uniform   vec3  lightPosition;

varying   vec3  vNormal;
varying   vec3  vEye;
varying   vec3  vLight;
varying   vec3  vTangentEye;
varying   vec3  vTangentLight;
varying   vec2  vTexCoord0;
varying   vec2  vTexCoord1;
void main(){
    vec4 mvPosition = mvMatrix * vec4(position, 1.0);
    vNormal = (normalMatrix * vec4(normalize(normal), 0.0)).xyz;
    vec3 n = (mvMatrix * vec4(vNormal, 0.0)).xyz;
    vec3 t = cross(n, vec3(0.0, 1.0, 0.0));
    vec3 b = cross(n, t);
    vEye = -mvPosition.xyz;
    vTangentEye = vec3(
        dot(t, vEye),
        dot(b, vEye),
        dot(n, vEye)
    );
    vLight = normalize(lightPosition);
    vTangentLight = vec3(
        dot(t, vLight),
        dot(b, vLight),
        dot(n, vLight)
    );
    vTexCoord0 = texCoord0;
    vTexCoord1 = texCoord1;
    gl_Position = mvpMatrix * vec4(position, 1.0);
}
