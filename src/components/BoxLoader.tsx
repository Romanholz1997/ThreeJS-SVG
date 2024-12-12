import { useEffect } from 'react';
import * as THREE from 'three';
import {BoxType} from "../types/types";
import jsonData from "./boxJson.json"
import { time } from 'console';

interface BoxLoaderProps {
    scene: THREE.Scene;
    jsonPath: string
  }

const BoxLoader: React.FC<BoxLoaderProps> = ({scene, jsonPath}) => {
    useEffect(() => {
        const loadBoxFromJSON = () => {
            const Boxs: BoxType[] = jsonData;
            console.log('Loading Boxs:', Boxs.length); // Debugging
            Boxs.forEach((item, parentIndex) => {
                const geometry = new THREE.BoxGeometry(Number(item.Width), Number(item.Height), Number(item.Length));
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.x = Number(item.Weight);
                scene.add(cube);
            });
          };
        loadBoxFromJSON();
    }, [scene])
    return null;
}

export default BoxLoader;