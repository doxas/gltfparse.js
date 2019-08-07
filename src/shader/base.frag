precision highp float;
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
varying vec3      vEye;

// defines
#define PI 3.14159265359
#define PI2 6.28318530718
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6

struct IncidentLight {
    vec3 color;
    vec3 direction;
    bool visible;
};
struct ReflectedLight {
    vec3 directDiffuse;
    vec3 directSpecular;
    vec3 indirectDiffuse;
    vec3 indirectSpecular;
};
struct GeometricContext {
    vec3 position;
    vec3 normal;
    vec3 viewDir;
};
struct Material {
    vec3  diffuseColor;
    float specularRoughness;
    vec3  specularColor;
};
struct DirectionalLight {
    vec3 direction;
    vec3 color;
};

float saturate(float v){
    return clamp(v, 0.0, 1.0);
}
bool testLightInRange(
    const in float lightDistance,
    const in float cutoffDistance
){
    return any(bvec2(cutoffDistance == 0.0, lightDistance < cutoffDistance));
}
float punctualLightIntensityToIrradianceFactor(
    const in float lightDistance,
    const in float cutoffDistance,
    const in float decayExponent
){
    if(decayExponent > 0.0){
        return pow(saturate(-lightDistance / cutoffDistance + 1.0), decayExponent);
    }
    return 1.0;
}
void getDirectionalDirectLightIrradiance(
    const in DirectionalLight directionalLight,
    const in GeometricContext geometry,
    out      IncidentLight    directLight
){
    directLight.color     = directionalLight.color;
    directLight.direction = directionalLight.direction;
    directLight.visible   = true;
}

// BRDF =======================================================================
vec3 DiffuseBRDF(vec3 diffuseColor){
    return diffuseColor / PI;
}
vec3 F_Schlick(vec3 specularColor, vec3 H, vec3 V){
    return (specularColor + (1.0 - specularColor) * pow(1.0 - saturate(dot(V, H)), 5.0));
}
float D_GGX(float alpha, float dotNH){
    float alpha2 = alpha * alpha;
    float dotNH2 = dotNH * dotNH;
    float d = dotNH2 * (alpha2 - 1.0) + 1.0;
    return alpha2 / (PI * d * d);
}
float G_Smith_Schlick_GGX(float alpha, float dotNV, float dotNL){
    float k = alpha * alpha * 0.5 + EPSILON;
    float gl = dotNL / (dotNL * (1.0 - k) + k);
    float gv = dotNV / (dotNV * (1.0 - k) + k);
    return gl * gv;
}
vec3 SpecularBRDF(
    const in IncidentLight directLight,
    const in GeometricContext geometry,
    vec3 specularColor,
    float roughness
){
    vec3 N = geometry.normal;
    vec3 V = geometry.viewDir;
    vec3 L = directLight.direction;

    float dotNL = saturate(dot(N, L));
    float dotNV = saturate(dot(N, V));
    vec3 H = normalize(L + V);
    float dotNH = saturate(dot(N, H));
    float dotVH = saturate(dot(V, H));
    float dotLV = saturate(dot(L, V));
    float alpha = roughness * roughness;

    float D = D_GGX(alpha, dotNH);
    float G = G_Smith_Schlick_GGX(alpha, dotNV, dotNL);
    vec3 F = F_Schlick(specularColor, V, H);
    return (F * (G * D)) / (4.0 * dotNL * dotNV + EPSILON);
}
void RE_Direct(
    const in IncidentLight directLight,
    const in GeometricContext geometry,
    const in Material material,
    inout ReflectedLight reflectedLight
){
    float dotNL = saturate(dot(geometry.normal, directLight.direction));
    vec3 irradiance = dotNL * directLight.color;

    // punctual light
    irradiance *= PI;
    reflectedLight.directDiffuse  += irradiance * DiffuseBRDF(material.diffuseColor);
    reflectedLight.directSpecular += irradiance * SpecularBRDF(
        directLight,
        geometry,
        material.specularColor,
        material.specularRoughness
    );
}
// ============================================================================

void main(){
    // base
    /* vec4 baseColor = correctGamma(texture2D(baseColorTexture, vTexCoord)) * vColor; */
    vec4 baseColor = texture2D(baseColorTexture, vTexCoord) * vColor;
    vec3 albedo = baseColor.rgb;
    // metallic roughness
    vec4 mrColor = texture2D(metallicRoughnessTexture, vTexCoord);
    float roughness = mrColor.g * roughnessFactor;
    float metallic = mrColor.b * metallicFactor;
    // TODO: MR のテクスチャ無い場合あり得ること考慮してない
    roughness = roughnessFactor;
    metallic = metallicFactor;

    // geometry
    GeometricContext geometry;
    geometry.position = -vEye;
    geometry.normal   = normalize(vNormal);
    geometry.viewDir  = normalize(vEye);
    // material
    Material material;
    material.diffuseColor      = mix(albedo, vec3(0.0), metallic);
    material.specularColor     = mix(vec3(0.04), albedo, metallic);
    material.specularRoughness = roughness;
    // Lighting
    DirectionalLight directionalLight = DirectionalLight(normalize(lightPosition), vec3(1.0));
    IncidentLight directLight;
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    vec3 emissive = vec3(0.0);
    getDirectionalDirectLightIrradiance(directionalLight, geometry, directLight);
    RE_Direct(directLight, geometry, material, reflectedLight);

    vec3 outgoingLight = emissive +
                         reflectedLight.directDiffuse +
                         reflectedLight.directSpecular +
                         reflectedLight.indirectDiffuse +
                         reflectedLight.indirectSpecular;

    gl_FragColor = vec4(outgoingLight, baseColor.a);

    // normal
    vec4 normalColor = texture2D(normalTexture, vTexCoord);
    vec3 normal = normalize((normalColor.rgb - 0.5) * 2.0) * normalScale;
    vec3 light = lightPosition - vPosition;
    vec3 eye   = vPosition - eyePosition;
    // TODO: とりあえず法線マップいったん無効化
    /* tangent(vNormal, light, eye); */
}

