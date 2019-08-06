/* ----------------------------------------------------------------------------
 * base texture shader
 * ---------------------------------------------------------------------------- */
precision mediump float;
uniform vec3      lightPosition;
uniform vec3      eyePosition;

uniform sampler2D baseColorTexture;
uniform sampler2D metallicRoughnessTexture;
uniform sampler2D normalTexture;
uniform float     metallicFactor;
uniform float     roughnessFactor;
uniform float     normalScale;
/* uniform float     occlusionStrength; */
/* uniform float     emissiveFactor;    */

varying vec3      vPosition;
varying vec3      vNormal;
varying vec4      vColor; // acctual base color factor
varying vec2      vTexCoord;

const float PI = 3.1415926;

vec4 correctGamma(vec4 color){
    return vec4(pow(color.rgb, vec3(2.2)), color.a);
}
float GGXDistribution(vec3 normal, vec3 halfLight, float roughness){
    float r = pow(roughness, 4.0);
    float hl = pow(dot(normal, halfLight), 2.0);
    return r / (PI * pow(hl * (r - 1.0) + 1.0, 2.0));
}
float GGXGeometryTerm(vec3 light, vec3 eye, vec3 normal, float roughness){
    float k = pow(roughness + 1.0, 2.0) / 8.0;
    float nl = dot(normal, light);
    float ne = dot(normal, eye);
    return (nl / (nl * (1.0 - k) + k)) * (ne / (ne * (1.0 - k) + k));
}
float schlick(vec3 eye, vec3 halfLight){
    float f0 = 0.04;
    float he = dot(halfLight, eye);
    return f0 + pow(1.0 - he, 5.0) * (1.0 - f0);
}
float cookTorrance(vec3 light, vec3 eye, vec3 normal, float roughness){
    vec3 halfLight = normalize(light + eye);
    float le = 4.0 * dot(normal, light) * dot(normal, eye);
    return GGXDistribution(normal, halfLight, roughness) *
           GGXGeometryTerm(light, eye, normal, roughness) *
           schlick(eye, halfLight) / le;
}
float specular(vec3 light, vec3 eye, vec3 normal, float roughness){
    return cookTorrance(light, eye, normal, roughness);
}
vec3 diffuse(vec3 color){
    /* return color.rgb / PI; */
    return color.rgb;
}
vec3 BRDF(vec3 color, vec3 light, vec3 eye, vec3 normal, float roughness, float metallic){
    return diffuse(color) * metallic + specular(light, eye, normal, roughness) * (1.0 - metallic);
}
void tangent(vec3 normal, inout vec3 light, inout vec3 eye){
    vec3 n = normalize(normal);
    vec3 t = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    vec3 b = cross(n, t);
    vec3 l = normalize(light);
    vec3 e = normalize(eye);
    light = vec3(dot(t, l), dot(b, l), dot(n, l));
    eye   = vec3(dot(t, e), dot(b, e), dot(n, e));
}

void main(){
    // base
    /* vec4 baseColor = correctGamma(texture2D(baseColorTexture, vTexCoord)) * vColor; */
    vec4 baseColor = texture2D(baseColorTexture, vTexCoord) * vColor;
    // metallic roughness
    vec4 mrColor = texture2D(metallicRoughnessTexture, vTexCoord);
    float roughness = mrColor.g * roughnessFactor;
    float metallic = mrColor.b * metallicFactor;
    // TODO: MR のテクスチャ無い場合あり得ること考慮してない
    roughness = roughnessFactor;
    metallic = metallicFactor;

    // normal
    vec4 normalColor = texture2D(normalTexture, vTexCoord);
    vec3 normal = normalize((normalColor.rgb - 0.5) * 2.0) * normalScale;
    vec3 light = lightPosition - vPosition;
    vec3 eye   = vPosition - eyePosition;
    // TODO: とりあえず法線マップいったん無効化
    /* tangent(vNormal, light, eye); */

    // TODO: 暗い色になりすぎるのでなにかおかしい

    vec3 destRGB = BRDF(baseColor.rgb, light, eye, normalize(vNormal), roughness, metallic);
    gl_FragColor = vec4(destRGB, baseColor.a);

    gl_FragColor = vec4(baseColor.rgb, baseColor.a);
}

