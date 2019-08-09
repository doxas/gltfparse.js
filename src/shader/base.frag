precision mediump float;
uniform sampler2D baseColorTexture;
uniform sampler2D metallicRoughnessTexture;
uniform sampler2D normalTexture;
uniform sampler2D occlusionTexture;
uniform sampler2D emissiveTexture;
uniform bool      baseColorTexCoordZero;
uniform bool      metallicRoughnessTexCoordZero;
uniform bool      normalTexCoordZero;
uniform bool      occlusionTexCoordZero;
uniform bool      emissiveTexCoordZero;
uniform bool      baseColorTextureExists;
uniform bool      metallicRoughnessTextureExists;
uniform bool      normalTextureExists;
uniform bool      occlusionTextureExists;
uniform bool      emissiveTextureExists;
uniform vec4      baseColorFactor;
uniform float     metallicFactor;
uniform float     roughnessFactor;
uniform float     normalScale;
uniform float     occlusionStrength;
uniform vec3      emissiveFactor;
uniform bvec4     flags; // (gamma, none, none, none)

varying vec3      vNormal;
varying vec3      vEye;
varying vec3      vLight;
varying vec3      vTangentEye;
varying vec3      vTangentLight;
varying vec2      vTexCoord0;
varying vec2      vTexCoord1;

// defines
#define PI 3.14159265359
#define PI2 6.28318530718
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

vec4 correctGamma(vec4 color){
    return vec4(pow(color.rgb, vec3(2.2)), color.a);
}
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
    vec2 texCoord = vec2(0.0);
    // base color -------------------------------------------------------------
    vec4 baseColor = baseColorFactor;
    if(baseColorTextureExists == true){
        texCoord = baseColorTexCoordZero == true ? vTexCoord0 : vTexCoord1;
        baseColor = texture2D(baseColorTexture, texCoord) * baseColorFactor;
    }
    if(flags.x == true){
        baseColor = correctGamma(baseColor);
    }
    // metallic roughness -----------------------------------------------------
    vec3 albedo = baseColor.rgb;
    float roughness = roughnessFactor;
    float metallic = metallicFactor;
    if(metallicRoughnessTextureExists == true){
        texCoord = metallicRoughnessTexCoordZero == true ? vTexCoord0 : vTexCoord1;
        vec4 metallicRoughnessColor = texture2D(metallicRoughnessTexture, texCoord);
        roughness *= metallicRoughnessColor.g;
        metallic *= metallicRoughnessColor.b;
    }
    // normal -----------------------------------------------------------------
    vec3 normal = normalize(vNormal);
    vec3 eye    = normalize(vEye);
    vec3 light  = normalize(vLight);
    if(normalTextureExists == true){
        texCoord = normalTexCoordZero == true ? vTexCoord0 : vTexCoord1;
        normal = normalize(texture2D(normalTexture, texCoord).rgb * 2.0 - 1.0) * normalScale;
        eye = normalize(vTangentEye);
        light = normalize(vTangentLight);
    }
    // normal -----------------------------------------------------------------
    float occlusion = occlusionStrength;
    if(occlusionTextureExists == true){
        texCoord = occlusionTexCoordZero == true ? vTexCoord0 : vTexCoord1;
        /* occlusion = texture2D(occlusionTexture, texCoord).r * occlusionStrength; */
    }
    // emissive ---------------------------------------------------------------
    vec3 emissive = emissiveFactor;
    if(emissiveTextureExists == true){
        texCoord = emissiveTexCoordZero == true ? vTexCoord0 : vTexCoord1;
        /* emissive = texture2D(emissiveTexture, texCoord).rgb; */
    }

    // geometry
    GeometricContext geometry;
    geometry.position = -vEye;
    geometry.normal   = normal;
    geometry.viewDir  = eye;
    // material
    Material material;
    material.diffuseColor      = mix(albedo, vec3(0.0), metallic);
    material.specularColor     = mix(vec3(0.04), albedo, metallic);
    material.specularRoughness = roughness;
    // Lighting
    DirectionalLight directionalLight = DirectionalLight(normalize(vLight), vec3(1.0));
    IncidentLight directLight;
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    getDirectionalDirectLightIrradiance(directionalLight, geometry, directLight);
    RE_Direct(directLight, geometry, material, reflectedLight);

    vec3 outgoingLight = emissive +
                         reflectedLight.directDiffuse +
                         reflectedLight.directSpecular +
                         reflectedLight.indirectDiffuse +
                         reflectedLight.indirectSpecular;

    gl_FragColor = vec4(outgoingLight * occlusion, baseColor.a);
}

