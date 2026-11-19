import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ==========================================
// 1. SCENE SETUP
// ==========================================

const container = document.getElementById('scene-container');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030611);
scene.fog = new THREE.FogExp2(0x030611, 0.0012);

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
);

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 35, 95);
const DEFAULT_TARGET_POS = new THREE.Vector3(0, 0, 0);

camera.position.copy(DEFAULT_CAMERA_POS);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// ==========================================
// 2. CAMERA CONTROLS
// ==========================================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2; // Allow close-up zoom on small planets
controls.maxDistance = 220;
controls.maxPolarAngle = Math.PI * 0.88;

// ==========================================
// 3. LIGHTING
// ==========================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(
    0xffffff,
    2800,
    600,
    1.5
);

sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// ==========================================
// 4. PROCEDURAL TEXTURES
// ==========================================

function createPlanetTexture(type, baseColorHex) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const baseColor = new THREE.Color(baseColorHex);
    const r = Math.round(baseColor.r * 255);
    const g = Math.round(baseColor.g * 255);
    const b = Math.round(baseColor.b * 255);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (type === 'Earth') {
        // Ocean base + continents + clouds
        ctx.fillStyle = '#1b5fd6';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Continents
        ctx.fillStyle = '#2ea043';
        const landPatches = [
            [70, 65, 65, 45],
            [110, 120, 45, 75],
            [245, 55, 70, 45],
            [260, 105, 55, 75],
            [370, 75, 85, 55],
            [410, 155, 45, 35]
        ];
        landPatches.forEach(([x, y, w, h]) => {
            ctx.beginPath();
            ctx.ellipse(x, y, w, h, 0.25, 0, Math.PI * 2);
            ctx.fill();
        });

        // Polar ice caps
        ctx.fillStyle = 'rgba(240, 248, 255, 0.85)';
        ctx.fillRect(0, 0, canvas.width, 16);
        ctx.fillRect(0, canvas.height - 16, canvas.width, 16);

        // Cloud swirls
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        for (let i = 0; i < 38; i++) {
            const cx = (i * 73) % canvas.width;
            const cy = 20 + ((i * 41) % (canvas.height - 40));
            ctx.beginPath();
            ctx.ellipse(cx, cy, 24 + (i % 18), 6 + (i % 6), 0.1, 0, Math.PI * 2);
            ctx.fill();
        }
    } else if (type === 'Jupiter' || type === 'Saturn') {
        // Atmospheric bands
        const bandCount = type === 'Jupiter' ? 14 : 10;
        for (let i = 0; i < bandCount; i++) {
            const y = (i / bandCount) * canvas.height;
            const h = canvas.height / bandCount;
            const shift = (i % 2 === 0 ? 1 : -1) * 28;
            const cr = Math.min(255, Math.max(0, r + shift));
            const cg = Math.min(255, Math.max(0, g + shift * 0.8));
            const cb = Math.min(255, Math.max(0, b + shift * 0.5));
            ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.75)`;
            ctx.fillRect(0, y, canvas.width, h);
        }

        if (type === 'Jupiter') {
            // Great Red Spot
            ctx.fillStyle = 'rgba(205, 75, 45, 0.88)';
            ctx.beginPath();
            ctx.ellipse(310, 155, 28, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    } else {
        // Craters / surface variations for rocky & ice worlds
        for (let i = 0; i < 65; i++) {
            const cx = (i * 97) % canvas.width;
            const cy = 15 + ((i * 53) % (canvas.height - 30));
            const rad = 4 + (i % 14);
            ctx.fillStyle = i % 2 === 0
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.14)';
            ctx.beginPath();
            ctx.arc(cx, cy, rad, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
}

// ==========================================
// 5. STAR BACKGROUND
// ==========================================

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 6000;
    const positions = [];

    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 1200;
        const y = (Math.random() - 0.5) * 1200;
        const z = (Math.random() - 0.5) * 1200;
        positions.push(x, y, z);
    }

    starGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.85,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

createStars();

// ==========================================
// 6. SUN & CELESTIAL DATA
// ==========================================

const sunData = {
    name: 'Sun',
    size: 5,
    order: 'Center Star (G2V)',
    diameter: '1,392,700 km',
    moons: '8 Planets orbit it',
    water: 'No liquid water (Plasma)',
    air: '73% Hydrogen, 25% Helium, 2% heavier gases',
    temp: '~5,500°C (Surface) / 15M°C (Core)',
    orbit: '~230 million yrs (Galactic center)',
    description: 'The Sun is a massive hot plasma sphere at the center of our solar system that provides heat and light to all planets.'
};

const sunGeometry = new THREE.SphereGeometry(sunData.size, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    color: 0xffaa22
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.name = 'Sun';
sun.userData = sunData;
scene.add(sun);

// Sun glow
const glowGeometry = new THREE.SphereGeometry(6.5, 32, 32);
const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff8800,
    transparent: true,
    opacity: 0.14,
    side: THREE.BackSide
});
const sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
scene.add(sunGlow);

const planetsData = [
    {
        name: 'Mercury',
        color: 0x999999,
        size: 0.55,
        distance: 9,
        speed: 0.047,
        order: '1st Planet',
        diameter: '4,879 km',
        moons: '0',
        water: '0% liquid water (trace ice in shadowed craters)',
        air: 'Virtually no atmosphere (thin exosphere: O₂, Na, H₂, He)',
        temp: '167°C (-180°C night to 430°C day)',
        orbit: '88 Earth days',
        description: 'Mercury is the smallest planet and closest to the Sun, with extreme temperature swings and cratered terrain.'
    },
    {
        name: 'Venus',
        color: 0xe6b566,
        size: 0.95,
        distance: 13,
        speed: 0.035,
        order: '2nd Planet',
        diameter: '12,104 km',
        moons: '0',
        water: '0% liquid water (dried up long ago)',
        air: '96.5% Carbon Dioxide (CO₂), 3.5% Nitrogen, sulfuric acid clouds',
        temp: '464°C (Hottest planet due to runaway greenhouse effect)',
        orbit: '225 Earth days',
        description: 'Venus is wrapped in thick toxic clouds and extreme atmospheric pressure, making it the hottest planet in our solar system.'
    },
    {
        name: 'Earth',
        color: 0x2277ff,
        size: 1,
        distance: 18,
        speed: 0.029,
        order: '3rd Planet',
        diameter: '12,742 km',
        moons: '1 (Moon)',
        water: '~71% water covered (~96.5% oceans, ~3.5% freshwater/ice)',
        air: '78% Nitrogen, 21% Oxygen, ~0.9% Argon, ~0.04% CO₂ & trace gases',
        temp: '15°C average',
        orbit: '365.25 days (1 Year)',
        description: 'Earth is our home planet—the only known world with liquid oceans, a breathable oxygen-rich atmosphere, and life.'
    },
    {
        name: 'Mars',
        color: 0xdd5533,
        size: 0.75,
        distance: 23,
        speed: 0.024,
        order: '4th Planet',
        diameter: '6,779 km',
        moons: '2 (Phobos, Deimos)',
        water: 'No liquid surface oceans; water exists as polar ice & subsurface ice',
        air: '95.3% CO₂, 2.6% Nitrogen, 1.9% Argon (very thin)',
        temp: '-65°C average',
        orbit: '687 Earth days',
        description: 'Mars is the Red Planet, colored by iron oxide dust, home to huge volcanoes like Olympus Mons and ancient river valleys.'
    },
    {
        name: 'Jupiter',
        color: 0xd5a078,
        size: 3.1,
        distance: 33,
        speed: 0.013,
        order: '5th Planet (Gas Giant)',
        diameter: '139,820 km',
        moons: '95+',
        water: 'No surface ocean; water vapor deep in clouds & possible icy core',
        air: '~90% Hydrogen, ~10% Helium, traces of ammonia & methane',
        temp: '-110°C (cloud tops)',
        orbit: '11.86 Earth years',
        description: 'Jupiter is the largest planet in our solar system, famous for its swirling cloud bands and the giant storm called the Great Red Spot.'
    },
    {
        name: 'Saturn',
        color: 0xe5c58c,
        size: 2.6,
        distance: 44,
        speed: 0.009,
        order: '6th Planet (Gas Giant)',
        diameter: '116,460 km',
        moons: '140+ (Titan, Enceladus, etc.)',
        water: 'No surface ocean; rings are mostly water ice (~99%)',
        air: '~96% Hydrogen, ~3% Helium, traces of ammonia & methane',
        temp: '-140°C (cloud tops)',
        orbit: '29.45 Earth years',
        description: 'Saturn is renowned for its vast, bright ring system made of ice and rock particles along with dozens of intriguing moons.'
    },
    {
        name: 'Uranus',
        color: 0x73dce5,
        size: 1.8,
        distance: 55,
        speed: 0.006,
        order: '7th Planet (Ice Giant)',
        diameter: '50,724 km',
        moons: '28',
        water: 'No surface ocean; hot dense fluid of water, ammonia & methane ices inside',
        air: '~83% Hydrogen, ~15% Helium, ~2.3% Methane (gives cyan color)',
        temp: '-195°C',
        orbit: '84 Earth years',
        description: 'Uranus is an ice giant that rolls around the Sun on its side with an extreme axial tilt of about 98 degrees.'
    },
    {
        name: 'Neptune',
        color: 0x3155db,
        size: 1.7,
        distance: 66,
        speed: 0.004,
        order: '8th Planet (Ice Giant)',
        diameter: '49,244 km',
        moons: '16 (Triton, etc.)',
        water: 'No surface ocean; deep icy mantle of water, ammonia & methane',
        air: '~80% Hydrogen, ~19% Helium, ~1.5% Methane',
        temp: '-200°C',
        orbit: '164.8 Earth years',
        description: 'Neptune is the farthest major planet from the Sun, known for its deep blue hue and supersonic winds.'
    }
];

// ==========================================
// 7. CREATE ORBIT PATHS
// ==========================================

function createOrbit(distance) {
    const orbitGeometry = new THREE.RingGeometry(
        distance - 0.035,
        distance + 0.035,
        128
    );

    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x53627c,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.4
    });

    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = -Math.PI / 2;
    scene.add(orbit);
}

// ==========================================
// 8. CREATE PLANETS
// ==========================================

const planets = [];
const clickableObjects = [sun];

planetsData.forEach((data, index) => {
    createOrbit(data.distance);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const geometry = new THREE.SphereGeometry(data.size, 48, 48);
    const texture = createPlanetTexture(data.name, data.color);

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.8,
        metalness: 0.05
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.position.x = data.distance;
    planet.userData = data;
    planet.name = data.name;

    orbitGroup.add(planet);

    planets.push({
        mesh: planet,
        group: orbitGroup,
        data: data,
        rotationSpeed: 0.3 + index * 0.05
    });

    clickableObjects.push(planet);

    // Saturn's rings
    if (data.name === 'Saturn') {
        const ringGeometry = new THREE.RingGeometry(
            data.size * 1.35,
            data.size * 2.1,
            80
        );

        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xc6ad83,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.82,
            roughness: 1
        });

        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2.5;
        planet.add(rings);
    }

    // Uranus rings
    if (data.name === 'Uranus') {
        const ringGeometry = new THREE.RingGeometry(
            data.size * 1.4,
            data.size * 1.8,
            64
        );

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x91d9db,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.35
        });

        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2.2;
        planet.add(rings);
    }
});

// ==========================================
// 9. RAYCASTER & SMOOTH ZOOM FOCUS
// ==========================================

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const planetCard = document.getElementById('planetCard');
let focusedObject = null; // Currently zoomed-in mesh (Sun or Planet)
let isTransitioning = false;
let prevTargetPos = new THREE.Vector3();

function showCelestialInfo(data) {
    document.getElementById('planetName').textContent = data.name;
    document.getElementById('planetDescription').textContent = data.description;
    document.getElementById('planetOrder').textContent = data.order;
    document.getElementById('planetDiameter').textContent = data.diameter;
    document.getElementById('planetMoons').textContent = data.moons;
    document.getElementById('planetWater').textContent = data.water;
    document.getElementById('planetAir').textContent = data.air;
    document.getElementById('planetTemp').textContent = data.temp;
    document.getElementById('planetOrbit').textContent = data.orbit;

    planetCard.classList.add('active');
}

function focusOnObject(object) {
    focusedObject = object;
    isTransitioning = true;

    const worldPos = new THREE.Vector3();
    object.getWorldPosition(worldPos);
    prevTargetPos.copy(worldPos);

    showCelestialInfo(object.userData);
}

function resetCameraView() {
    focusedObject = null;
    isTransitioning = false;
    camera.position.copy(DEFAULT_CAMERA_POS);
    controls.target.copy(DEFAULT_TARGET_POS);
    controls.update();
    planetCard.classList.remove('active');
}

// Pointer down/up check so orbiting doesn't trigger click
let pointerDownPos = { x: 0, y: 0 };

renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerDownPos = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener('click', (event) => {
    const moveDistance = Math.hypot(
        event.clientX - pointerDownPos.x,
        event.clientY - pointerDownPos.y
    );
    if (moveDistance > 5) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(clickableObjects, false);

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        focusOnObject(selectedObject);
    }
});

// Change cursor on hover over clickable bodies
renderer.domElement.addEventListener('pointermove', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, false);
    renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'grab';
});

// Close information popup
document.getElementById('closeBtn').addEventListener('click', () => {
    planetCard.classList.remove('active');
    focusedObject = null;
    isTransitioning = false;
});

// ==========================================
// 10. PLAY / PAUSE CONTROLS
// ==========================================

let isPlaying = true;
let speedMultiplier = 1;

const playBtn = document.getElementById('playBtn');

playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'Ⅱ Pause' : '▶ Play';
});

// ==========================================
// 11. ORBIT SPEED CONTROL
// ==========================================

const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');

speedSlider.addEventListener('input', () => {
    speedMultiplier = parseFloat(speedSlider.value);
    speedValue.textContent = speedMultiplier.toFixed(1) + 'x';
});

// ==========================================
// 12. RESET CAMERA
// ==========================================

document.getElementById('resetBtn').addEventListener('click', resetCameraView);

// ==========================================
// 13. ANIMATION LOOP
// ==========================================

const clock = new THREE.Clock();
const currentWorldPos = new THREE.Vector3();
const desiredCamPos = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (isPlaying) {
        sun.rotation.y += delta * 0.15;

        planets.forEach((planet) => {
            planet.group.rotation.y +=
                planet.data.speed *
                speedMultiplier *
                delta * 10;

            planet.mesh.rotation.y +=
                planet.rotationSpeed * delta;
        });
    }

    // Follow & smoothly zoom into focused celestial body
    if (focusedObject) {
        focusedObject.getWorldPosition(currentWorldPos);

        // Move camera along with orbiting object
        const deltaMove = new THREE.Vector3().subVectors(currentWorldPos, prevTargetPos);
        camera.position.add(deltaMove);
        controls.target.copy(currentWorldPos);
        prevTargetPos.copy(currentWorldPos);

        const radius = focusedObject.userData.size || 2;
        const viewDistance = Math.max(radius * 4.2, 3.2);

        if (isTransitioning) {
            const dir = new THREE.Vector3()
                .subVectors(camera.position, currentWorldPos);
            if (dir.lengthSq() < 0.0001) {
                dir.set(0, 0.35, 1);
            }
            dir.normalize();
            desiredCamPos.copy(currentWorldPos).addScaledVector(dir, viewDistance);
            desiredCamPos.y += radius * 0.45;

            camera.position.lerp(desiredCamPos, 0.08);

            if (camera.position.distanceTo(desiredCamPos) < 0.15) {
                isTransitioning = false;
            }
        }
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

// ==========================================
// 14. RESPONSIVE WINDOW RESIZE
// ==========================================

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});