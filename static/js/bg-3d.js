// Three.js Background Animation
// Concept: Liquid Fluid Abstract (GLSL Shader)

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
    }
`;

const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_mouse;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    // Simplex Noise (simplified for brevity)
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

    float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v - i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
    }

    void main() {
        vec2 st = gl_FragCoord.xy/u_resolution.xy;
        st.x *= u_resolution.x/u_resolution.y;
        
        vec3 color = vec3(0.0);
        
        float time = u_time * 0.5;
        
        // Fluid noise movement
        float noise1 = snoise(vec2(st.x * 3.0 + time * 0.1, st.y * 3.0 - time * 0.2));
        float noise2 = snoise(vec2(st.x * 2.0 - time * 0.2 + u_mouse.x * 0.5, st.y * 2.0 + time * 0.1 + u_mouse.y * 0.5));
        
        // Mixing blobs
        float mixVal = smoothstep(-0.5, 0.5, noise1 + noise2);
        
        // Palette: Deep Purple, Neon Cyan, Vibrant Pink, Dark Blue
        vec3 col1 = vec3(0.1, 0.05, 0.2); // Dark Purple base
        vec3 col2 = vec3(0.0, 0.8, 0.9); // Cyan
        vec3 col3 = vec3(0.9, 0.0, 0.5); // Pink
        vec3 col4 = vec3(0.1, 0.1, 0.4); // Blue
        
        vec3 finalColor = mix(col1, col2, mixVal + sin(time) * 0.2);
        finalColor = mix(finalColor, col3, noise2 * 0.5 + 0.5);
        
        // Add subtle grain
        float grain = fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453);
        finalColor += grain * 0.05;

        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.createElement('div');
    container.id = 'canvas-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.zIndex = '-1';
    document.body.prepend(container);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
        u_time: { value: 0.0 },
        u_mouse: { value: new THREE.Vector2() },
        u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader
    });

    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        // Normalize mouse input
        mouseX = e.clientX / window.innerWidth;
        mouseY = 1.0 - e.clientY / window.innerHeight;
    });

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        uniforms.u_time.value = clock.getElapsedTime();

        // Smooth mouse lerp
        uniforms.u_mouse.value.x += (mouseX - uniforms.u_mouse.value.x) * 0.05;
        uniforms.u_mouse.value.y += (mouseY - uniforms.u_mouse.value.y) * 0.05;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    });
});
