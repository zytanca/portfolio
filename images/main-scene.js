// This is the updated content for 'main-scene.js'
// All KTX2Loader code has been removed.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

// --- 1. Global State Variables ---
let scene, camera, renderer, cssRenderer, controls, raycaster, mouse, textObject;
// let ktx2Loader; // REMOVED
let videoElements = []; 
let hoveredObject = null;
let currentAnimationFrameId = null;
let hasInteracted = false;
let eventHandlers = { 
    onWindowResize: null, 
    onMouseMove: null,
    onMouseDown: null,
    onMouseUp: null
};
let isLandingPage = false; 
let isDragging = false; 

let clickableObjects = [];
let loadedModel = null; 
let tempPosition = new THREE.Vector3();

// --- 3. Element References ---
const infoEl = document.getElementById('project-info');
const titleEl = document.getElementById('project-title');
const descEl = document.getElementById('project-description');
const canvasEl = document.getElementById('webgl-canvas');
const cssContainerEl = document.getElementById('css-container');

// --- 4. Helper Functions ---

function updateActiveNavPill() {
    const allLinks = document.querySelectorAll('.category-nav a');
    if (!allLinks || allLinks.length === 0) return; 
    const currentPath = window.location.pathname.toLowerCase();
    let activeLink = null;
    allLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname.toLowerCase();
        if (currentPath === linkPath) {
            activeLink = link;
        }
    });
    allLinks.forEach(link => link.classList.remove('active'));
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function playAllVideos() {
    videoElements.forEach(video => {
        video.play().catch(e => { /* console.warn("Video autoplay prevented.") */ });
    });
}

function checkIntersection() {
    if (!isLandingPage || !raycaster || !mouse || !camera || clickableObjects.length === 0) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true); 

    if (intersects.length > 0) {
        let intersectedObject = intersects[0].object;
        let newHover = intersectedObject;
        while (newHover.parent && !newHover.userData.url) {
            newHover = newHover.parent;
        }
        if (newHover !== hoveredObject) {
            if (newHover.userData && newHover.userData.title) {
                hoveredObject = newHover;
                titleEl.innerText = hoveredObject.userData.title;
                descEl.innerText = hoveredObject.userData.description;
                infoEl.style.opacity = 1;
                infoEl.style.visibility = 'visible';
            }
        }
    } else {
        if (hoveredObject) {
            infoEl.style.opacity = 0;
            infoEl.style.visibility = 'hidden';
            hoveredObject = null;
        }
    }
}

// --- 5. Main Functions (Init, Build, Animate) ---

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15); // Tweak this based on your model's scale

    renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --- KTX2 LOADER SETUP REMOVED ---

    cssRenderer = new CSS3DRenderer();
    cssContainerEl.appendChild(cssRenderer.domElement);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
    
    textObject = new CSS3DObject(infoEl);
    textObject.scale.set(0.02, 0.02, 0.02);
    infoEl.style.textAlign = 'center';
    scene.add(textObject);
    
    eventHandlers.onWindowResize(); 
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5); 
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 10, 7);
    scene.add(directionalLight);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = true;
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.target.set(0, 2, 0);
    controls.addEventListener('start', () => { isDragging = true; }); 

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function loadBlenderScene() {
    clickableObjects = [];
    const textureLoader = new THREE.TextureLoader();
    
    // --- Setup Draco loader ---
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.164.1/examples/jsm/libs/draco/gltf/');
    
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader); // Tell GLTFLoader to use Draco
    // loader.setKTX2Loader(ktx2Loader); // REMOVED
    
    // The correct GitHub Pages link to your file in the 'images' folder
    const modelUrl = 'https://zytanca.github.io/portfolio/images/portfolio-building.glb';

    loader.load(modelUrl, (gltf) => {
        loadedModel = gltf.scene;
        scene.add(loadedModel);

        loadedModel.traverse((child) => {
            if (child.isMesh) {
                if (child.userData.url) {
                    console.log("Found clickable object:", child.name, child.userData);
                    clickableObjects.push(child);
                }
            }
        });
        
        controls.update();
        
    }, undefined, (error) => {
        console.error('An error happened while loading the model:', error);
    });
}


function animate() {
    if (!isLandingPage || !renderer || !cssRenderer) { return; } 
    currentAnimationFrameId = requestAnimationFrame(animate); 
    
    checkIntersection();
    controls.update();

    if (hoveredObject) {
        hoveredObject.getWorldPosition(tempPosition); 
        const verticalOffset = 1;
        textObject.position.set(
            tempPosition.x, 
            tempPosition.y + verticalOffset, 
            tempPosition.z 
        );
    }
    
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
}

eventHandlers.onWindowResize = () => {
    if (!isLandingPage || !camera || !renderer || !cssRenderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
};

eventHandlers.onMouseMove = (event) => {
    if (!isLandingPage || !mouse) return;
    if (!hasInteracted) {
        playAllVideos(); 
        hasInteracted = true;
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

eventHandlers.onMouseDown = () => {
    isDragging = false; 
};

eventHandlers.onMouseUp = (event) => {
    if (isDragging || !isLandingPage) return;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects, true); 

    if (intersects.length > 0) {
        let clickedObject = intersects[0].object;
        let projectData = clickedObject;
        
        // Look for the parent object with the URL property
        while (projectData.parent && !projectData.userData.url) {
            projectData = projectData.parent; 
        }

        const url = projectData.userData.url;
        if (url && url !== '#') {
            window.location.href = url;
        }
    }
    isDragging = false; 
};

/**
 * ====================================================================
 * DESTROY 3D VIEWPORT
 * ====================================================================
 */
function destroy3DViewport() {
    if (!scene) { return; } 
    isLandingPage = false; 
    if (currentAnimationFrameId) {
        cancelAnimationFrame(currentAnimationFrameId);
        currentAnimationFrameId = null;
    }

    window.removeEventListener('resize', eventHandlers.onWindowResize);
    window.removeEventListener('mousemove', eventHandlers.onMouseMove);
    window.removeEventListener('mousedown', eventHandlers.onMouseDown);
    window.removeEventListener('mouseup', eventHandlers.onMouseUp);

    if (loadedModel) { scene.remove(loadedModel); }
    clickableObjects = []; 

    if (scene) { 
        scene.traverse(object => { 
            if (object.geometry) object.geometry.dispose(); 
            if (object.material) {
                if (object.material.map) object.material.map.dispose();
                object.material.dispose();
            }
        }); 
        if(textObject) scene.remove(textObject); 
        textObject = null; 
    }
    if (controls) { controls.dispose(); controls = null; }

    // --- Dispose loaders ---
    // if (ktx2Loader) { ktx2Loader.dispose(); ktx2Loader = null; } // REMOVED
    
    if (renderer) { renderer.dispose(); renderer = null; }
    if (cssRenderer && cssRenderer.domElement.parentNode) { 
        cssRenderer.domElement.parentNode.removeChild(cssRenderer.domElement); 
        cssRenderer = null; 
    }

    document.body.classList.remove('viewport-active');
    scene = null;
    camera = null;
    loadedModel = null;
}

/**
 * ====================================================================
 * CORE ACTIVATION LOGIC
 * ====================================================================
 */
 function checkAndInit() {
    updateActiveNavPill();
    if (!canvasEl || !cssContainerEl) return; 
    const homeLink = document.querySelector('a[data-filter="selected"]');
    if (!homeLink) {
        console.error("3D Scene Error: Could not find homepage link with data-filter='selected'.");
        return;
    }
    const homePath = new URL(homeLink.href).pathname.toLowerCase();
    const currentPath = window.location.pathname.toLowerCase();
    const is3DPage = (currentPath === homePath);
    
    if (is3DPage) {
        isLandingPage = true;
        if (!scene) { 
            init3DViewport();
        }
    } else {
        isLandingPage = false;
        destroy3DViewport();
        document.body.classList.remove('viewport-active');
    }
}

function init3DViewport() {
    if (!isLandingPage || scene) { return; }
    if (!infoEl || !titleEl || !descEl || !canvasEl || !cssContainerEl) {
        console.error('Missing required HTML elements for 3D scene. Aborting init.');
        return;
    }

    console.log("Readymag: Initializing 3D Viewport...");
    document.body.classList.add('viewport-active');
    
    initScene();
    
    window.addEventListener('resize', eventHandlers.onWindowResize);
    window.addEventListener('mousemove', eventHandlers.onMouseMove);
    window.addEventListener('mousedown', eventHandlers.onMouseDown);
    window.addEventListener('mouseup', eventHandlers.onMouseUp);
    
    loadBlenderScene();
    animate();
}


// 1. Initial run
window.addEventListener('load', () => {
    checkAndInit();
});

// 2. Listen for Readymag's internal page-change event
if (window.Readymag && window.Readymag.events) {
    window.Readymag.events.on('page', checkAndInit);
}
