import { useEffect } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import jsonData from './box.json';
import { JsonData, Details } from '../types/types';

interface SvgLoaderProps {
  scene: THREE.Scene;
  svgPath: string
}

const SvgLoaderComponent: React.FC<SvgLoaderProps> = ({ scene, svgPath }) => {
    function svgToPng(svgString: string, width: number, height: number): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(svgBlob);
    
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const pngUrl = canvas.toDataURL('image/png');

                      // Download the PNG file
                    // const a = document.createElement('a');
                    // a.href = pngUrl;
                    // a.download = 'image.png'; // Specify the name of the downloaded file
                    // document.body.appendChild(a);
                    // a.click(); // Trigger the download
                    // document.body.removeChild(a); // Clean up


                    resolve(pngUrl);
                } else {
                    reject(new Error("Failed to get canvas context"));
                }
                URL.revokeObjectURL(url);
            };    
            img.onerror = (error) => {
                reject(error);
            };
    
            img.src = url;
        });
    }
  useEffect(() => {
    if (!scene) return;
    const boxGroup = new THREE.Group();

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
    const loadSVGFromJSON = () => {
      const parentArray: JsonData[] = jsonData.Parent;
      parentArray.forEach((item, parentIndex) => {
        const svgString = item.SVGFile;
        let newStr = svgString.replace(/\\\//g, "/");
        newStr = newStr.replace(/\\"/g, '"');
        newStr = newStr.replace(/\r?\n/g, " ");
        console.log(newStr);
        const group = new THREE.Group();
        svgToPng(svgString, item.ViewWidth, item.ViewLength).then((pngUrl) => {
            const texture = new THREE.TextureLoader().load(pngUrl, () => {
                const geometry = new THREE.PlaneGeometry(item.ViewWidth, item.ViewLength);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    side: THREE.DoubleSide, // Changed from THREE.FrontSide to THREE.DoubleSide
                    transparent: false
                });
                if(item.View === "Rear")
                {
                    const plane = new THREE.Mesh(geometry, material);
                    plane.rotateY(Math.PI);
                    plane.name = `${item.Tooltip}-${item.View}`;
                    group.add(plane);
                }
                else{
                    const plane = new THREE.Mesh(geometry, material);
                    plane.name = `${item.Tooltip}-${item.View}`;
                    group.add(plane);
                }
            });
        });
       
        // Update view dimensions
        viewWidth = Math.max(viewWidth, item.ViewWidth);
        viewHeight = Math.max(viewHeight, item.ViewLength);
        viewDepth = Math.max(viewDepth, item.ViewDepth);

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
        // group.scale.set(scaleX, scaleY, 1);
        const newBox = new THREE.Box3().setFromObject(group);

        // Position based on view
        if (item.View === "Front") {
          const createDetailBoxes = (
            detail: Details,
            index: number,            
          ) => {
              const texture = createTextTexture(detail.Data1?.toString() || "");
              
              // Create an array of materials for the box faces
              const materials = Array<THREE.Material>(6).fill(
                new THREE.MeshStandardMaterial({ color: 0xffffff })
              );
              materials[4] = new THREE.MeshStandardMaterial({ map: texture });
              materials[5] = new THREE.MeshStandardMaterial({ map: texture });
      
              // Create box geometry based on detail dimensions
              const geometry = new THREE.BoxGeometry( detail.Width * 10, detail.Depth * 10,  detail.Height * 10);
              const mesh = new THREE.Mesh(geometry, materials);
              mesh.castShadow = true;
              mesh.receiveShadow = true;      
              // Position the mesh
              mesh.position.y = item.ViewLength/ 2 + detail.Depth * 10 / 2;      
              // Assign a unique name
              mesh.name = `Detail Data ${index === 0 ? "Top" : "Bottom"}`;
              console.log('Created detail mesh:', mesh.name);
              // Add the mesh to the group
              boxGroup.add(mesh);
          };
          createDetailBoxes(item.Details[0], 0);
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
      });
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
