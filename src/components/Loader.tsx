import { useEffect } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';
import { ParentJSON, Details, JsonType, Mounted } from '../types/types';
import { cleanSvgFile } from '../utils/OptimizeSvg';

interface SvgLoaderProps {
  scene: THREE.Scene;
  jsonData: ParentJSON;
}
const Loader: React.FC<SvgLoaderProps> = ({ scene, jsonData }) => {
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

    const svgLoader = async (svgString: string): Promise<THREE.Group | null> => {
        const group = new THREE.Group();
        try
        {
            const cleanSvg = await cleanSvgFile(svgString);
            const loader = new SVGLoader();
            const svgParsedData = loader.parse(cleanSvg);
            const paths = svgParsedData.paths;
            let renderOrder = 0;
            for (const path of paths) {
                const fillColor = path.userData?.style?.fill ?? 0x000000;
                const opacity = path.userData?.style?.fillOpacity ?? 1;
                if (fillColor !== 'none') {
                    const material = new THREE.MeshBasicMaterial({
                        color: typeof fillColor === 'string' ? new THREE.Color().setStyle(fillColor) : new THREE.Color(fillColor),
                        opacity: opacity,
                        transparent: true,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });
            
                    // Generate shapes from the path
                    const shapes = SVGLoader.createShapes(path);
                    for (const shape of shapes) {
                        if (shape) { // Ensure the shape is valid
                            const geometry = new THREE.ShapeGeometry(shape);
                            const mesh = new THREE.Mesh(geometry, material);
                            mesh.renderOrder = renderOrder++;
                            group.add(mesh);
                        }
                    }
                }        
                const strokeColor = path.userData?.style?.stroke ?? 0xffffff;
                const strokeOpacity = path.userData?.style?.strokeOpacity ?? 1;
                const pathType = path.userData?.node?.nodeName?? "other";
                if (strokeColor !== 'none') {
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
            return group;
        }catch (error) {
            console.error(`Failed to parse SVG Loading....`, error);
            return null;
        }
    }
    const mountModel = async (Mounted: Mounted, type: string, boxWidth: number, boxHeight: number, boxDepth: number, boxScale: number): Promise<THREE.Group | null> => {
        const group = new THREE.Group();
        const svgString = jsonToSvg(Mounted.SVGFile);
        const width = Mounted.ModViewWidth / boxScale * Mounted.Scale;
        const height = Mounted.ModViewLength /boxScale * Mounted.Scale;
        const depth = Mounted.ModViewDepth?  Mounted.ModViewDepth /boxScale  * Mounted.Scale : 0 /boxScale  * Mounted.Scale;
        const planFront = await svgLoader(svgString);
        
        if(planFront)
        {
            const box = new THREE.Box3().setFromObject(planFront);
            const size = new THREE.Vector3();
            box.getSize(size);
            const scaleX = width / size.x;
            const scaleY = height / size.y;
            planFront.scale.set(scaleX, scaleY, 1);
            planFront.position.z =  depth / 2;
            planFront.position.x = -width / 2;
            planFront.position.y = height / 2;
            planFront.scale.y *= -1;
            group.add(planFront)
        }
        if(Mounted.OtherSideSVGFile !== null)
        {
            const svgString = jsonToSvg(Mounted.OtherSideSVGFile);
            const planRear = await svgLoader(svgString);
            if(planRear)
            {
                const box = new THREE.Box3().setFromObject(planRear);
                const size = new THREE.Vector3();
                box.getSize(size);
                const scaleX = width / size.x;
                const scaleY = height / size.y;
                planRear.scale.set(scaleX, scaleY, 1);
                group.add(planRear)
            }
        }
        const Top = createRectangle(width, depth, 0xaaaaaa, 1, new THREE.Vector3(0, height / 2, 0), 'x',  Math.PI / 2, `${Mounted.ToolTip}-Top`);
        const Bottom = createRectangle(width, depth, 0xaaaaaa, 1, new THREE.Vector3(0, -height / 2, 0), 'x',  Math.PI / 2, `${Mounted.ToolTip}-Bottom`);
        const Right = createRectangle(depth, height, 0xaaaaaa, 0.8, new THREE.Vector3( -width / 2, 0, 0), 'y',  Math.PI / 2, `${Mounted.ToolTip}-Right`);
        const Left = createRectangle(depth, height, 0xaaaaaa, 0.8, new THREE.Vector3(  width / 2, 0, 0), 'y',  Math.PI / 2, `${Mounted.ToolTip}-Left`);
        const Rear = createRectangle(width, height, 0xaaaaaa, 1, new THREE.Vector3(0, 0, -depth / 2), 'z',  Math.PI / 2, `${Mounted.ToolTip}-Rear`);
        group.add(Top)
        group.add(Bottom)
        group.add(Right)
        group.add(Left)
        if(Mounted.OtherSideSVGFile === null)
        {
            group.add(Rear);
        }
        if(Mounted.Details[0] && (Mounted.Details[0].Data1 || Mounted.Details[0].Data3 || Mounted.Details[0].Data2))
        {
            const detail = createDetailBoxes(Mounted.Details[0], "Mount", depth, width, height);
            group.add(detail);
        }
        if(Mounted.SlotMountType === "PM")
        {
            group.position.x = Mounted.SlotViewX - boxWidth/2  - width / 2;
            group.position.y = boxHeight/2 - Mounted.SlotViewY - 80;
            group.position.z = boxDepth/2 - depth / 2 + 2;
        }
        else if(Mounted.SlotMountType === "RU")
        {
            group.position.x = Mounted.SlotViewX - boxWidth/2  + width / 2;
            group.position.y = boxHeight/2 - Mounted.SlotViewY + height / 2  - Mounted.SlotViewLength * 2;
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
        const boxGroup = new THREE.Group();

        let viewWidth = 0;
        let viewHeight = 0;
        let viewDepth = 0;
        let countSvg = 0;

        const loadSVGFromJSON = async () => {
            const parentArray: JsonType[] = jsonData.Parent;
            for (const [parentIndex, item] of parentArray.entries()) {
                const svgString = jsonToSvg(item.SVGFile);                
                const group = await svgLoader(svgString);
                if(group)
                {
                    viewWidth = Math.max(viewWidth, item.ViewWidth);
                    viewHeight = Math.max(viewHeight, item.ViewLength);
                    viewDepth = Math.max(viewDepth, item.ViewDepth? item.ViewDepth : 0);

                    // const box = new THREE.Box3().setFromObject(group);
                    // const size = new THREE.Vector3();
                    // box.getSize(size);
                    // const scaleX = viewWidth / size.x;
                    // const scaleY = viewHeight / size.y;
        
                    // console.log(scaleX)
                    // console.log(scaleY)
                    // // Apply the scaling
                    // group.scale.set(scaleX, scaleY, 1);
                    // group.rotateZ(Math.PI)
                    
                    // group.rotation.x = -Math.PI / 2;


                    // Apply the scaling
                    // group.scale.set(scaleX, scaleY, 1);
                    // const newBox = new THREE.Box3().setFromObject(group);

                   
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
                            // console.log('Created detail mesh:', mesh.name);
                            // Add the mesh to the group
                            boxGroup.add(mesh);
                            group.scale.y *= -1;
                            group.position.x = -newBox.getSize(new THREE.Vector3()).x / 2;
                            group.position.y = newBox.getSize(new THREE.Vector3()).y / 2;
                        };
                        createDetailBoxes(item.Details[0], 0);
                        group.position.z = item.ViewDepth ? item.ViewDepth / 2 : 0;
                    } else {
                        group.position.z = item.ViewDepth ? -item.ViewDepth / 2 : 0;
                        group.rotateZ(Math.PI)
                        group.position.x = newBox.getSize(new THREE.Vector3()).x / 2;
                        group.position.y = newBox.getSize(new THREE.Vector3()).y / 2;
                    }
                    const rectangleTop = createRectangle(
                        viewWidth,
                        viewDepth,
                        0xaaaaaa,
                        1, // Full opacity
                        new THREE.Vector3(0, viewHeight / 2, 0),
                        'x',
                        Math.PI / 2,
                        "Top"
                    );
                    boxGroup.add(rectangleTop);
                    const rectangleBottom = createRectangle(
                        viewWidth,
                        viewDepth,
                        0xaaaaaa,
                        1, // Full opacity
                        new THREE.Vector3(0, -viewHeight / 2, 0),
                        'x',
                        Math.PI / 2,
                        "Bottom"
                    );
                    boxGroup.add(rectangleBottom);
                    const rectangleLeft = createRectangle(
                        viewDepth,
                        viewHeight,
                        0xeeeeee,
                        0.6, // 50% opacity
                        new THREE.Vector3(viewWidth / 2, 0, 0),
                        'y',
                        Math.PI / 2,
                        "Left"
                    );
                    boxGroup.add(rectangleLeft);
                    const rectangleRight = createRectangle(
                        viewDepth,
                        viewHeight,
                        0xeeeeee,
                        0.6, // 50% opacity
                        new THREE.Vector3(-viewWidth / 2,0, 0),
                        'y',
                        Math.PI / 2,
                        "Right"
                    );
                    boxGroup.add(rectangleRight);
                    if(countSvg === 1)
                    {
                        const rectangleRear = createRectangle(
                            viewWidth,
                            viewHeight,
                            0x808080,
                            1, // 50% opacity
                            new THREE.Vector3(0, 0, -viewDepth / 2),
                            'z',
                            Math.PI / 2,
                            "Rear"
                        );
                        boxGroup.add(rectangleRear);
                    }

                    if (item.Mounted) {
                        const mountPromises = item.Mounted.map(async (mount) => {
                            try {
                                const mountedModel = await mountModel(
                                    mount,
                                    item.View,
                                    item.ViewWidth,
                                    item.ViewLength,
                                    item.ViewDepth ? item.ViewDepth : 0,
                                    item.Scale
                                );
                    
                                if (mountedModel) {
                                    boxGroup.add(mountedModel);
                                }
                                // Do something with mountedModel if needed
                            } catch (error) {
                                console.error("Error mounting model:", error);
                            }
                        });
                    
                        await Promise.all(mountPromises); // Wait for all promises to resolve
                    }
                    // Add the scaled group to the boxGroup
                    boxGroup.add(group);
                }
            };
        };        
        loadSVGFromJSON();
        
        // Center the boxGroup
        // const box = new THREE.Box3().setFromObject(boxGroup);
        // const center = box.getCenter(new THREE.Vector3());
        // boxGroup.position.sub(center);

        scene.add(boxGroup);
        // Cleanup on Unmount
        // return () => {
        // scene.remove(boxGroup);
        // boxGroup.traverse((object) => {
        //     if (object instanceof THREE.Mesh) {
        //     const mesh = object as THREE.Mesh;
        //     mesh.geometry.dispose();
        //     if (Array.isArray(mesh.material)) {
        //         mesh.material.forEach((material) => material.dispose());
        //     } else {
        //         mesh.material.dispose();
        //     }
        //     }
        // });
        // };
    }, []);
    return null;
};
export default Loader;