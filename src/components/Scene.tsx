import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import LoadDevice from './LoadDevice';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsonData from './box2.json';
interface Tooltip {
  visible: boolean;
  content: string;
  position: { x: number; y: number };
}

const Scene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip>({
    visible: false,
    content: '',
    position: { x: 0, y: 0 },
  });

  // 1. Use useRef for clickTimeout to persist across renders
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const DOUBLE_CLICK_DELAY = 250; // ms

  // 2. Track dragging state using useRef
  const isMouseDown = useRef(false);
  const isDragging = useRef(false);
  const initialMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const DRAG_THRESHOLD = 5; // pixels

  useEffect(() => {
    if (!mountRef.current) return;

    // Capture the current mountRef.current for consistent cleanup
    const currentMount = mountRef.current;

    // Initialize Scene
    const newScene = new THREE.Scene();
    setScene(newScene);

    // Initialize Camera
    const height = window.innerHeight - 70;
    const width = window.innerWidth;
    const camera = new THREE.PerspectiveCamera(75, width / height, 10, 8000);
    camera.position.set(0, 0, 3000);

    // Initialize Renderer
    const renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setSize( width, height );
    currentMount.appendChild(renderer.domElement);

    // Initialize Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Enables smooth controls
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 2; // Maximum vertical angle
    controls.minPolarAngle = Math.PI / 2; // Minimum vertical angle

    // Add Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    newScene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 0, 1).normalize();
    newScene.add(directionalLight);

    // Initialize Raycaster and Mouse Vector
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2(); // Renamed to avoid shadowing 'mouse'

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(newScene, camera);
    };
    animate();

    // Handle Window Resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight - 70;
      renderer.setSize(newWidth, newHeight);
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Mouse Down Handler
    const handleMouseDown = (event: MouseEvent) => {
      isMouseDown.current = true;
      isDragging.current = false;
      initialMousePos.current = {
        x: event.clientX,
        y: event.clientY,
      };
    };

    // Mouse Move Handler
    const handleMouseMove = (event: MouseEvent) => {
      if (!currentMount) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert mouse position to normalized device coordinates (-1 to +1)
      mouseVec.x = (x / renderer.domElement.clientWidth) * 2 - 1;
      mouseVec.y = -(y / renderer.domElement.clientHeight) * 2 + 1;

      // Update the raycaster
      raycaster.setFromCamera(mouseVec, camera);

      // Calculate objects intersecting the ray
      const intersects = raycaster.intersectObjects(newScene.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        const tooltipContent = intersected.name || 'Unnamed Mesh';

        setTooltip({
          visible: true,
          content: tooltipContent,
          position: { x: event.clientX, y: event.clientY },
        });
      } else {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }

      // Drag Detection
      if (isMouseDown.current && !isDragging.current) {
        const dx = event.clientX - initialMousePos.current.x;
        const dy = event.clientY - initialMousePos.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > DRAG_THRESHOLD) {
          isDragging.current = true;
        }
      }
    };

    // Mouse Up Handler
    const handleMouseUp = (event: MouseEvent) => {
      isMouseDown.current = false;
    };

    // Click Handler
    const handleClick = (event: MouseEvent) => {
      if (!currentMount) return;

      // If dragging occurred, do not process the click
      if (isDragging.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert mouse position to normalized device coordinates (-1 to +1)
      mouseVec.x = (x / renderer.domElement.clientWidth) * 2 - 1;
      mouseVec.y = -(y / renderer.domElement.clientHeight) * 2 + 1;

      // Update the raycaster
      raycaster.setFromCamera(mouseVec, camera);

      // Calculate objects intersecting the ray
      const intersects = raycaster.intersectObjects(newScene.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        const meshName = intersected.name || 'Unnamed Mesh';

        // Delay the single click action to differentiate from double-click
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

        clickTimeoutRef.current = setTimeout(() => {
          toast.info(`Clicked on: ${meshName}`);
          clickTimeoutRef.current = null;
        }, DOUBLE_CLICK_DELAY);
      }
    };

    // Double-Click Handler
    const handleDoubleClick = (event: MouseEvent) => {
      if (!currentMount) return;

      // If dragging occurred, do not process the double-click
      if (isDragging.current) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert mouse position to normalized device coordinates (-1 to +1)
      mouseVec.x = (x / renderer.domElement.clientWidth) * 2 - 1;
      mouseVec.y = -(y / renderer.domElement.clientHeight) * 2 + 1;

      // Update the raycaster
      raycaster.setFromCamera(mouseVec, camera);

      // Calculate objects intersecting the ray
      const intersects = raycaster.intersectObjects(newScene.children, true);

      if (intersects.length > 0) {
        const intersected = intersects[0].object as THREE.Mesh;
        const meshName = intersected.name || 'Unnamed Mesh';

        // If a single click timeout is pending, cancel it
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        // Show toast for double-click
        toast.success(`Double-clicked on: ${meshName}`);
      }
    };

    // Add Event Listeners
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp); // Fixed: Changed from removeEventListener to addEventListener
    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.addEventListener('dblclick', handleDoubleClick);

    // Cleanup on Unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('dblclick', handleDoubleClick);
      currentMount.removeChild(renderer.domElement);
      controls.dispose();
      renderer.dispose();
      newScene.clear();
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <div
      ref={mountRef}
      style={{
        width: '100vw',
        height: 'calc(100vh - 70px)',
        position: 'relative',
      }}
    >
      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={1000} // 1 second; adjust as needed
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {scene && <LoadDevice scene={scene} jsonData={jsonData}/>}
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.position.x + 15, // Increased offset
            top: tooltip.position.y + 15, // Increased offset
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            pointerEvents: 'none', // Allows mouse events to pass through
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0px 0px 10px rgba(0, 0, 0, 0.5)',
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            transform: 'translate(-50%, -100%)',
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export default Scene;