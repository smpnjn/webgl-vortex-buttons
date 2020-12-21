vec3 rgb(float r, float g, float b) {
    return vec3(r / 255., g / 255., b / 255.);
}
vec3 rgb(float c) {
    return vec3(c / 255., c / 255., c / 255.);
}

uniform vec3 u_lowColor;
uniform vec3 u_highColor;
uniform float u_time;
uniform float u_rand;
uniform float u_veinDefinition;
uniform float u_clickLength;
uniform vec2 u_resolution;
uniform float u_scale;
uniform vec2 u_mouse;
uniform sampler2D u_inputTexture;

varying vec2 vUv;
varying float vDistortion;
varying float xDistortion;


void main() {
    vec2 res = (gl_FragCoord.xy + 100.) / (u_resolution.xy * u_scale);
    vec3 highColor = rgb(u_highColor.r, u_highColor.g, u_highColor.b);
    vec3 lowColor = rgb(u_lowColor.r, u_lowColor.g, u_lowColor.b);
    vec3 color = vec3(0.0);

    vec2 fbm1 = vec2(0.);
    fbm1.x = fbm( res ) * snoise(res);
    fbm1.y = fbm( res + vec2(1.0)) / snoise(res) / u_veinDefinition * u_clickLength;

    vec2 r = vec2(0.);
    r.x = fbm( res + fbm1 * u_time * 0.1 ) + -sin(u_mouse.x) * 2.;
    r.y = fbm( res + fbm1 * u_time * 0.5 ) * -u_mouse.y;

    float f = fbm(res+r) * 1.2;

    color = mix(highColor, lowColor, f*12.);
    color = mix(color, lowColor, clamp(length(fbm1),0.0,12.0)); // * snoise(res) * 1.3
    color = mix(color, highColor, clamp(length(r.y), 0., 8.));


    gl_FragColor = vec4((f*f*f*0.6*f*f+.5*f)*color,1.);
}
