uniform float u_time;
uniform float u_height;

varying vec2 vUv;

void main() {
    vUv = uv;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y, position.z, 0.4) * 20.;
}
