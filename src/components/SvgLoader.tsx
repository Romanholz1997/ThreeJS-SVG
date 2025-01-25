import { useEffect } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import jsonData from './box.json';
import { JsonData, Details } from '../types/types';
import { cleanSvgFile } from '../utils/OptimizeSvg';

interface SvgLoaderProps {
  scene: THREE.Scene;
  svgPath: string
}

const SvgLoaderComponent: React.FC<SvgLoaderProps> = ({ scene, svgPath }) => {
  useEffect(() => {
    if (!scene) return;

    const boxGroup = new THREE.Group();

    // Parse JSON and Load SVG
    let viewWidth = 0;
    let viewHeight = 0;
    let viewDepth = 0;
    let countSvg = 0;

    const createTextTexture = (text: string): THREE.Texture => {
      const size = 512;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, size, size);
        context.font = 'bold 200px Arial';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, size / 2, size / 2);
      }

      return new THREE.CanvasTexture(canvas);
    };
    const loadSVGFromJSON = async () => {
      const parentArray = jsonData.Parent; // Ensure jsonData is defined in your scope
      console.log('Loading SVGs:', parentArray.length); // Debugging
      countSvg = parentArray.length;
  
      for (const [parentIndex, item] of parentArray.entries()) {
          const svgString = item.SVGFile;
          let newStr = svgString.replace(/\\\//g, "/")
                                .replace(/\\"/g, '"')
                                .replace(/\\r\\n/g, ' ');
  
          try {
              const cleanSvg = await cleanSvgFile(newStr);
              const loader = new SVGLoader();
              let svgParsedData;
  
              try {
                  svgParsedData = loader.parse(cleanSvg);
              } catch (error) {
                  console.error(`Failed to parse SVG at index ${parentIndex}:`, error);
                  continue; // Skip this SVG
              }
  
              let renderOrder = 0;
              const paths = svgParsedData.paths;
              const group = new THREE.Group();
  
              // Update view dimensions
              viewWidth = Math.max(viewWidth, item.ViewWidth);
              viewHeight = Math.max(viewHeight, item.ViewLength);
              viewDepth = Math.max(viewDepth, item.ViewDepth);
  
              for (const path of paths) {
                  const color = path.color ? new THREE.Color(path.color) : new THREE.Color(0x00ff00);
                  const fillColor = (path.userData?.style?.fill !== undefined) ? path.userData.style.fill : 0x000000;
                  const opacity = (path.userData?.style?.fillOpacity !== undefined) ? path.userData.style.fillOpacity : 1;
  
                  if (fillColor !== undefined && fillColor !== 'none') {
                      const material = new THREE.MeshBasicMaterial({
                          color: new THREE.Color().setStyle(fillColor),
                          opacity: opacity,
                          transparent: true,
                          side: THREE.DoubleSide,
                          depthWrite: false,
                      });
  
                      const shapes = SVGLoader.createShapes(path);
                      for (const shape of shapes) {
                          const geometry = new THREE.ShapeGeometry(shape);
                          const mesh = new THREE.Mesh(geometry, material);
                          mesh.renderOrder = renderOrder++;
                          group.add(mesh);
                      }
                  }
  
                  const strokeColor = (path.userData?.style?.stroke !== undefined) ? path.userData.style.stroke : 0x000000;
                  const strokeOpacity = (path.userData?.style?.strokeOpacity !== undefined) ? path.userData.style.strokeOpacity : 1;
  
                  if (strokeColor !== undefined && strokeColor !== 'none') {
                      const material = new THREE.MeshBasicMaterial({
                          color: new THREE.Color().setStyle(strokeColor),
                          opacity: strokeOpacity,
                          transparent: true,
                          side: THREE.DoubleSide,
                          depthWrite: false,
                      });
  
                      for (const subPath of path.subPaths) {
                          const geometry = SVGLoader.pointsToStroke(subPath.getPoints(), path.userData?.style || null);
                          if (geometry) {
                              const mesh = new THREE.Mesh(geometry, material);
                              mesh.renderOrder = renderOrder++;
                              group.add(mesh);
                          }
                      }
                  }
              }
  
              const box = new THREE.Box3().setFromObject(group);
              const size = new THREE.Vector3();
              box.getSize(size);
  
              // Retrieve the desired dimensions
              const desiredWidth = item.ViewWidth;
              const desiredHeight = item.ViewLength;
  
              // Calculate scaling factors
              const scaleX = desiredWidth / size.x;
              const scaleY = desiredHeight / size.y;
  
              // Apply the scaling
              group.scale.set(scaleX, scaleY, 1);
              const newBox = new THREE.Box3().setFromObject(group);
  
              // Position based on view
              if (item.View === "Front") {
                  const createDetailBoxes = (detail :Details, index: number) => {
                      const texture = createTextTexture(detail.Data1?.toString() || "");
                      const materials = Array(6).fill(new THREE.MeshStandardMaterial({ color: 0xffffff }));
                      materials[4] = new THREE.MeshStandardMaterial({ map: texture });
                      materials[5] = new THREE.MeshStandardMaterial({ map: texture });
  
                      const geometry = new THREE.BoxGeometry(detail.Depth * 5, detail.Width * 5, detail.Height * 5);
                      const mesh = new THREE.Mesh(geometry, materials);
                      mesh.castShadow = true;
                      mesh.receiveShadow = true;
  
                      mesh.position.y = index === 0 
                          ? newBox.getSize(new THREE.Vector3()).y / 2 + detail.Width * 5 / 2
                          : newBox.getSize(new THREE.Vector3()).y / 2 - detail.Width * 5 / 2;
  
                      mesh.name = `Detail Data ${index === 0 ? "Top" : "Bottom"}`;
                      console.log('Created detail mesh:', mesh.name);
                      boxGroup.add(mesh);
                  };
                  createDetailBoxes(item.Details[0], 0);
                  createDetailBoxes(item.Details[0], 1);
                  group.position.z = item.ViewDepth / 2;
              } else {
                  group.position.z = -item.ViewDepth / 2;
              }
              group.position.x = -newBox.getSize(new THREE.Vector3()).x / 2;
              group.position.y = -newBox.getSize(new THREE.Vector3()).y / 2;
  
              group.children.forEach(child => {
                  child.renderOrder = 1; // Adjust as needed
              });
  
              // Add the scaled group to the boxGroup
              boxGroup.add(group);
          } catch (error) {
              console.error(`Error cleaning SVG for item at index ${parentIndex}:`, error);
          }
      }
  };
  
  loadSVGFromJSON();
  

    // Add surrounding rectangles
    const createRectangle = (
      width: number,
      height: number,
      color: number,
      opacity: number,
      position: THREE.Vector3,
      rotationAxis: 'x' | 'y' | 'z', // Changed 'o' to 'z'
      rotationAngle: number,
      tooltip: string
    ) => {
      const geometry = new THREE.PlaneGeometry(width, height);
      const material = new THREE.MeshStandardMaterial({ 
        color, 
        opacity, 
        transparent: true, // Enables transparency
        side: THREE.DoubleSide 
      });
      const rectangle = new THREE.Mesh(geometry, material);
      rectangle.position.copy(position);

      // Handle rotation
      if (rotationAxis === 'x') {
        rectangle.rotateX(rotationAngle);
      } else if (rotationAxis === 'y') {
        rectangle.rotateY(rotationAngle);
      }

      rectangle.castShadow = true;
      rectangle.receiveShadow = true;
      rectangle.name = `Blank Box Tooltip - ${tooltip}`;
      boxGroup.add(rectangle);
    };

    // Create surrounding rectangles based on view dimensions
    createRectangle(
      viewWidth,
      viewDepth,
      0xaaaaaa,
      1, // Full opacity
      new THREE.Vector3(0, viewHeight / 2, 0),
      'x',
      Math.PI / 2,
      "Top"
    );
    createRectangle(
      viewWidth,
      viewDepth,
      0xaaaaaa,
      1, // Full opacity
      new THREE.Vector3(0, -viewHeight / 2, 0),
      'x',
      Math.PI / 2,
      "Bottom"
    );
    createRectangle(
      viewDepth,
      viewHeight,
      0xeeeeee,
      0.8, // 50% opacity
      new THREE.Vector3(viewWidth / 2, 0, 0),
      'y',
      Math.PI / 2,
      "Left"
    );
    createRectangle(
      viewDepth,
      viewHeight,
      0xeeeeee,
      0.8, // 50% opacity
      new THREE.Vector3(-viewWidth / 2, 0, 0),
      'y',
      Math.PI / 2,
      "Right"
    );

    if(countSvg === 1)
    {
      createRectangle(
        viewWidth,
        viewHeight,
        0x808080,
        1, // 50% opacity
        new THREE.Vector3(0, 0, -viewDepth / 2),
        'z',
        Math.PI / 2,
        "Rear"
      );
    }
    // Center the boxGroup
    const box = new THREE.Box3().setFromObject(boxGroup);
    const center = box.getCenter(new THREE.Vector3());
    boxGroup.position.sub(center);

    scene.add(boxGroup);

    // Cleanup on Unmount
    return () => {
      scene.remove(boxGroup);
      boxGroup.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          const mesh = object as THREE.Mesh;
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((material) => material.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
    };
  }, [scene]);

  return null;
};

export default SvgLoaderComponent;
