import { useEffect } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import jsonData from './box2.json';
import { ParentJSON, Details, JsonType, Mounted } from '../types/types';

interface SvgLoaderProps {
  scene: THREE.Scene;
  jsonData: ParentJSON;
}

const SvgLoaderComponent: React.FC<SvgLoaderProps> = ({ scene, jsonData }) => {
    const unit_RU = 0;
    const unit_Bottom = 70;
    const unit_Side = 50;
    const svgToPng = (svgString: string, width: number, height: number): Promise<string> => {
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
              resolve(pngUrl);
            } else {
              reject(new Error("Failed to get canvas context"));
            }
            URL.revokeObjectURL(url);
          };
    
          img.onerror = (error) => {
            console.error("Image loading error:", error);
            reject(new Error("Image failed to load"));
          };
    
          img.src = url;
        });
      };
    const jsonToSvg = (json: string) => {
        const svgString = json.replace(/\\\//g, '/')
        .replace(/\\"/g, '"')
        .replace(/\\r\\n/g, ' ');
        return svgString;
    }
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
        rectangle.name = tooltip;
        return rectangle;
      };
    const createTextTexture = (text: string): THREE.Texture => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');

    if (context) {
        context.fillStyle = '#00ff00';
        context.fillRect(0, 0, size, size);
        context.font = 'bold 200px Arial';
        context.fillStyle = '#000000';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, size / 2, size / 2);
    }

    return new THREE.CanvasTexture(canvas);
    };
    const createDetailBoxes = (
    detail: Details,
    type: "Box" | "Mount",      
    depth: number,      
    width: number,
    length: number
    ) => {
        const texture = createTextTexture(detail.Data1?.toString() || detail.Data2?.toString() || detail.Data3?.toString() || "");
        
        // Create an array of materials for the box faces
        const materials = Array<THREE.Material>(6).fill(
        new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        );
        materials[4] = new THREE.MeshStandardMaterial({ map: texture });
        if (type === "Box") {
        materials[5] = new THREE.MeshStandardMaterial({ map: texture });
        }

        const DetailWidth = 50;
        const DetailHeight = 50;
        const DetailDepth = 1;
        // Create box geometry based on detail dimensions
        const geometry = new THREE.BoxGeometry(DetailWidth, DetailHeight, DetailDepth);
        const mesh = new THREE.Mesh(geometry, materials);
        mesh.castShadow = true;
        mesh.receiveShadow = true;      
        if(type === "Mount")
        {
        mesh.position.z = depth / 2 + DetailDepth / 2; 
        mesh.position.x = -width / 2 + DetailWidth / 2; 
        mesh.position.y = -length / 2 + DetailHeight / 2;
        }    
        mesh.name = `Detail Data}`;
        return mesh;
    };
    const mountModel = (Mounted: Mounted, type: string, boxWidth: number, boxHeight: number, boxDepth: number, boxScale: number) => {
        const group = new THREE.Group();
        const svgString = jsonToSvg(Mounted.SVGFile);
        const width = Mounted.ModViewWidth / boxScale * Mounted.Scale;
        const height = Mounted.ModViewLength /boxScale * Mounted.Scale;
        const depth = Mounted.ModViewDepth /boxScale  * Mounted.Scale;
        svgToPng(svgString,  Mounted.ModViewWidth, Mounted.ModViewLength).then((pngUrl) => {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(pngUrl, (texture) => {
                const geometry = new THREE.PlaneGeometry( width + 5, height);
                const material = new THREE.MeshBasicMaterial({
                    transparent: true, // Enable transparency
                    map: texture, // Use the texture if needed; otherwise, remove this line
                    side: THREE.DoubleSide,
                });
                const plane = new THREE.Mesh(geometry, material);
                plane.position.z = Mounted.View === "Front" ? depth / 2 : 0;
                plane.name = `${Mounted.ToolTip}-${Mounted.View}`;
                group.add(plane);
            }, undefined, (error) => {
              console.error("Texture loading error:", error);
            });
        }).catch((error) => {
            console.error("Error generating PNG:", error);
        });
        const Top = createRectangle(width, depth, 0xaaaaaa, 1, new THREE.Vector3(0, height / 2, 0), 'x',  Math.PI / 2, `${Mounted.ToolTip}-Top`);
        const Bottom = createRectangle(width, depth, 0xaaaaaa, 1, new THREE.Vector3(0, -height / 2, 0), 'x',  Math.PI / 2, `${Mounted.ToolTip}-Bottom`);
        const Right = createRectangle(depth, height, 0xaaaaaa, 0.8, new THREE.Vector3( -width / 2, 0, 0), 'y',  Math.PI / 2, `${Mounted.ToolTip}-Right`);
        const Left = createRectangle(depth, height, 0xaaaaaa, 0.8, new THREE.Vector3(  width / 2, 0, 0), 'y',  Math.PI / 2, `${Mounted.ToolTip}-Left`);
        const Rear = createRectangle(width, height, 0xaaaaaa, 1, new THREE.Vector3(0, 0, -depth / 2), 'z',  Math.PI / 2, `${Mounted.ToolTip}-Rear`);
        group.add(Top)
        group.add(Bottom)
        group.add(Right)
        group.add(Left)
        group.add(Rear)

        if(Mounted.Details[0] && (Mounted.Details[0].Data1 || Mounted.Details[0].Data3 || Mounted.Details[0].Data2))
        {
            const detail = createDetailBoxes(Mounted.Details[0], "Mount", depth, width, height);
            group.add(detail);
        }
        if(Mounted.SlotMountType === "PM")
        {
            group.position.x = Mounted.SlotViewX - boxWidth/2  - width / 2;
            group.position.y = boxHeight/2 - Mounted.SlotViewY - unit_RU;
            group.position.z = boxDepth/2 - depth / 2 + 2;
        }
        else if(Mounted.SlotMountType === "RU")
        {
            group.position.x = Mounted.SlotViewX - boxWidth/2  + width / 2;
            group.position.y = boxHeight/2 - Mounted.SlotViewY + height / 2  - Mounted.SlotViewLength * 2 - unit_RU;
            group.position.z = boxDepth/2 - depth / 2 + 1;
        }
        else if(Mounted.SlotMountType === "Plug")
        {
            group.position.x = Mounted.SlotViewX > boxWidth - 10 ? Mounted.SlotViewX - boxWidth/2  + width / 2: Mounted.SlotViewX - boxWidth/2  - width / 2 + 1;
            group.position.y = 0  ;
            group.position.z = boxDepth/2 - depth / 2 + 1;
        }
        else
        {
            group.position.x = Mounted.SlotViewX - boxWidth/2  + width / 2;
            group.position.y = boxHeight/2 - Mounted.SlotViewY + height / 2;
            group.position.z = boxDepth/2 - depth / 2 + 1;
        }
        if(type === "Rear")
        {
            group.position.z = -(boxDepth/2 - depth / 2 + 1)
            group.rotateY(Math.PI);
        }
        return group;
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
        const parentArray: JsonType[] = jsonData.Parent;
        parentArray.forEach((item, parentIndex) => {
            const svgString = item.SVGFile.replace(/\\\//g, '/')
            .replace(/\\"/g, '"')
            .replace(/\\r\\n/g, ' ');
            console.log(svgString);
            const group = new THREE.Group();
            svgToPng(svgString, item.ViewWidth, item.ViewLength).then((pngUrl) => {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.load(pngUrl, (texture) => {
                    const geometry = new THREE.PlaneGeometry(item.ViewWidth + 10, item.ViewLength);
                    const material = new THREE.MeshBasicMaterial({
                        transparent: true, // Enable transparency
                        map: texture, // Use the texture if needed; otherwise, remove this line
                        side: THREE.DoubleSide,
                    });
    
                const plane = new THREE.Mesh(geometry, material);
                if (item.View === "Rear") {
                    plane.rotateY(Math.PI);
                }
                plane.name = `${item.Tooltip}-${item.View}`;
                group.add(plane);
                }, undefined, (error) => {
                console.error("Texture loading error:", error);
                });
            }).catch((error) => {
                console.error("Error generating PNG:", error);
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
                const geometry = new THREE.BoxGeometry(150, 150, 10);
                const mesh = new THREE.Mesh(geometry, materials);
                mesh.castShadow = true;
                mesh.receiveShadow = true;      
                // Position the mesh
                mesh.position.y = item.ViewLength/ 2 + 75;
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
            item.Mounted?.forEach((mount, index) => {
                try {

                    const mountedModel = mountModel(mount, item.View, item.ViewWidth, item.ViewLength, item.ViewDepth, item.Scale);
                    scene.add(mountedModel);
                    
                    // Do something with mountedModel if needed
                } catch (error) {
                    console.error("Error mounting model:", error);
                }
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
        new THREE.Vector3(-viewWidth / 2,0, 0),
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
