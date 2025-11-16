import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 1. Basic Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Adjust this position to be appropriate for your scene's scale
camera.position.set(10, 5, 15); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
// You can set the background color to match your baked sky
renderer.setClearColor(0x87CEEB); // Example: a light sky blue
document.body.appendChild(renderer.domElement);

// 2. Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Makes the controls feel smoother

// 3. Load Your Model
const loader = new GLTFLoader();
const clickableObjects = []; // We'll store our artworks here

loader.load(
    // --- This is the updated URL ---
    'https://github.com/zytanca/portfolio/releases/download/scene/portbuildings.glb',
    
    function (gltf) {
        scene.add(gltf.scene);

        // Find the "artwork" objects and store them
        gltf.scene.traverse((object) => {
            // Check if the object has our custom "link" property
            if (object.isMesh && object.userData.link) {
                clickableObjects.push(object);
                console.log('Found clickable artwork:', object.name, 'with link:', object.userData.link);
            }
        });
    },
    // onProgress callback (optional)
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // onError callback
    function (error) {
        console.error('An error happened while loading the model:', error);
    }
);

// 4. Interactivity (Raycasting)
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
    // Convert mouse click to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Get a list of objects that intersect with the ray
    // We only check against our stored clickable objects
    const intersects = raycaster.intersectObjects(clickableObjects);

    // Check if we clicked on one of our artworks
    if (intersects.length > 0) {
        const firstHit = intersects[0].object;
        
        // Access the custom property 'link' we set in Blender
        const url = firstHit.userData.link;

        if (url) {
            console.log('Opening link:', url);
            // Open the link in a new tab
            window.open(url, '_blank');
        }
    }
});

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    renderer.render(scene, camera);
}

animate();
