import * as THREE from './js/src/Three.js';
import { rgb, loader, randomInteger } from './util.js';

const config = {
    individualItem: '.button', // class of individual item
    carouselId: '#album-rotator', // carousel selector
    carouselHolderId: '#album-rotator-holder', // carousel should be <div id="carouselId"><div id="carouselHolderId">{items}</div></div>
    colors: [
        // Define colors for each item. If more items than colors, then first color will be used as default
        // Format { low: rgb(), high: rgb() for each color }
        { low: rgb(0, 114, 255), high: rgb(77, 0, 255) },
        { low: rgb(0, 12, 156), high: rgb(252, 22, 18) },
        { low: rgb(240, 32, 54) , high: rgb(12, 35, 255) },
        { low: rgb(10,80,40), high: rgb(22,220,12) },
    ]
}

// Async function for generating webGL waves
const createWave = async function(selector, colors) {      
    if(document.querySelectorAll(selector) !== null && document.querySelectorAll(selector).length > 0) {
        // Import all the fragment and vertex shaders
        const noise = await loader('/shaders/noise.glsl');
        const fragment = await loader('/shaders/fragment.glsl');
        const vertex = await loader('/shaders/vertex.glsl');
        
        let i = 0;
        // For each of the selector elements
        document.querySelectorAll(selector).forEach(function(item) {
            // Create a renderer
            const renderer = new THREE.WebGLRenderer({
                powerPreference: "high-performance",
                antialias: true, 
                alpha: true
            });

            // Get el width and height
            const elWidth = (parseFloat(window.getComputedStyle(item).width) + parseFloat(window.getComputedStyle(item).paddingLeft) * 2) + 200;
            const elHeight = (parseFloat(window.getComputedStyle(item).height) + parseFloat(window.getComputedStyle(item).paddingTop) * 2) + 200;

            // Set sizes and set scene/camera
            renderer.setSize( elWidth, elHeight );
            document.body.appendChild( renderer.domElement )
            renderer.setPixelRatio( elWidth/elHeight );

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera( 75, elWidth / elHeight, 0.1, 1000 );

            // Check on colors to use
            let high = colors[0].high; 
            let low = colors[0].low;
            if(typeof colors[i] !== "undefined") {
                high = colors[i].high;
                low = colors[i].low;
                ++i;
            }

            // Create a plane, and pass that through to our shaders
            let geometry = new THREE.PlaneGeometry(600, 600, 100, 100);
            let material = new THREE.ShaderMaterial({
                // Adjusting these variables will adjust the effect
                uniforms: {
                    u_lowColor: {type: 'v3', value: low },
                    u_highColor: {type: 'v3', value: high },
                    u_time: {type: 'f', value: 0},
                    u_resolution: {type: 'v2', value: new THREE.Vector2(elWidth, elHeight) },
                    u_mouse: {type: 'v2', value: new THREE.Vector2(0, 0) },
                    u_height: {type: 'f', value: 1},
                    u_veinDefinition: {type: 'f', value: 0.25 },
                    u_scale: {type: 'f', value: 2.3 },
                    u_clickLength: { type: 'f', value: 1},
                    u_rand: { type: 'f', value: randomInteger(0, 10) },
                    u_rand: {type: 'f', value: new THREE.Vector2(randomInteger(6, 10), randomInteger(8, 10)) }
                },
                fragmentShader: noise + fragment,
                vertexShader: noise + vertex,
            });

            // Create the mesh and position appropriately
            let mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, 0, -300);
            scene.add(mesh);

            let reduceVector;
            let increasePressure;
            let reducePressure;
            let prevX = 0;
            let prevY = 0;
            let curValueX = 0;
            let curValueY = 0;
            let mouseEnterX = 0;
            let mouseEnterY = 0;
            let mousePressure = 0;
            item.addEventListener('pointerenter', function(e) {
                prevX = curValueX;
                prevY = curValueY;
                mouseEnterX = e.pageX;
                mouseEnterY = e.pageY;
                clearInterval(reduceVector);
            })
            item.addEventListener('pointermove', function(e) {
                if(typeof reduceVector !== "undefined") {
                    clearInterval(reduceVector);
                    curValueX = 0;
                    curValueY = 0;
                }
                let mouseMoveX = mouseEnterX - e.pageX;
                let mouseMoveY = mouseEnterY - e.pageY;
                mesh.material.uniforms.u_mouse.value = new THREE.Vector2(prevX + (mouseMoveX / elWidth), prevY + (mouseMoveY / elHeight));
            });

            item.addEventListener('pointerdown', function(e) {
                if(typeof reducePressure !== "undefined") clearInterval(reducePressure);
                increasePressure = setInterval(function() {
                    if(mesh.material.uniforms.u_clickLength.value < 3) {
                        mesh.material.uniforms.u_clickLength.value += 0.03;
                    }
                },1000/60);
            });

            item.addEventListener('pointerup', function(e) {
                if(typeof increasePressure !== "undefined") clearInterval(increasePressure);
                reducePressure = setInterval(function() {
                    if(mesh.material.uniforms.u_clickLength.value > 1) {
                        mesh.material.uniforms.u_clickLength.value -= 0.03;
                    }
                },1000/60);
            });

            item.addEventListener('pointerleave', function(e) {
                reduceVector = setInterval(function() {
                    let startXNeg, startXPos, startYNeg, startYPos;
                    let finishX, finishY;
                    if(curValueX == 0 && curValueY == 0) {
                        curValueX = mesh.material.uniforms.u_mouse.value.x;
                        curValueY = mesh.material.uniforms.u_mouse.value.y;
                    }
                    if(typeof reduceVector == "function") {
                        requestAnimationFrame(reduceVector);
                    }
                    if(curValueX > 0) {
                        if(startXPos !== true) {
                            mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                        } else { finishX = true; }
                        curValueX -= 0.005;
                        startXNeg = true;
                    }
                    else if(curValueX < 0) {
                        if(startXNeg !== true) {
                            mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                        } else { finishX = true; }
                        curValueX += 0.005;
                        startXPos = true;
                    }
                    if(curValueY > 0) {
                        if(startYNeg !== true) {
                            mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                        } else { finishY = true; }
                        curValueY -= 0.005;
                        startYPos = true;
                    }
                    else if(curValueY < 0) {
                        if(startYNeg !== true) {
                            mesh.material.uniforms.u_mouse.value = new THREE.Vector2(curValueX, curValueY);
                        } else { finishY = true; }
                        curValueY += 0.005;
                        startYNeg = true;
                    }
                    if(finishX == true && finishY == true) {
                        clearInterval(reduceVector);
                    }
                }, 1000/60);
            });

            // On hover effects for each item
            let enterTimer, exitTimer;
            item.addEventListener('mouseenter', function(e) {
                if(typeof exitTimer !== "undefined") {
                    clearTimeout(exitTimer);
                }
                enterTimer = setInterval(function() {
                    if(mesh.material.uniforms.u_height.value >= 0.5) {
                        mesh.material.uniforms.u_height.value -= 0.05;
                    } else {
                        clearTimeout(enterTimer);
                    }
                }, 1000/60);
            });
            item.addEventListener('mouseleave', function(e) {
                if(typeof enterTimer !== "undefined") {
                    clearTimeout(enterTimer);
                }
                exitTimer = setInterval(function() {
                    if(mesh.material.uniforms.u_height.value < 1) {
                        mesh.material.uniforms.u_height.value += 0.05;
                    } else {
                        clearTimeout(exitTimer);
                    }
                }, 1000/60);
            });

            // Render
            renderer.render( scene, camera );
            let t = 0;

            // Animate
            let backtrack = false;
            const animate = function () {
                requestAnimationFrame( animate );
                renderer.render( scene, camera );
                item.appendChild(renderer.domElement);
                mesh.material.uniforms.u_time.value = t;
                if(t < 10 && backtrack == false) {
                    t = t + 0.005;
                } else {
                    backtrack = true;
                    t = t - 0.005;
                    if(t < 0) {
                        backtrack = false;
                    }
                }
                
            };
            animate();
        });
    }
}

document.addEventListener("DOMContentLoaded", function(e) {
    createWave(config.individualItem, config.colors);
});