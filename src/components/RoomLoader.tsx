
import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { createFacility } from "./Facility";
import { RoomType, Mounted, Details, horizontalShape, verticalShape, shape } from "../types/types";
interface LoadRoomProps {
    scene: THREE.Scene;
    jsonRoom: RoomType;
}

const RoomLoader: React.FC<LoadRoomProps> = ({scene, jsonRoom}) => {
    const createHorizontal = async (info: { [key: string]: horizontalShape }) => {
        const keys = Object.keys(info);
        const Box = new THREE.Group();
    
        for (const key of keys) {
            const floorInfo = info[key];
    
            // Check if floorInfo is defined and has required properties
            if (floorInfo) {
                const geometry = new THREE.PlaneGeometry(floorInfo.length, floorInfo.width);
                const material = new THREE.MeshStandardMaterial({
                    color: floorInfo.fill || 0xffffff, // Default color if fill is not provided
                    opacity: floorInfo.opacity || 1, // Default opacity if not provided
                    transparent: true,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                });
    
                const Floor = new THREE.Mesh(geometry, material);
                Floor.rotateX(Math.PI / 2);
                Floor.position.y = floorInfo.elevation || 0; // Default elevation if not provided
                scene.add(Floor);
    
                const facilityInfo = floorInfo.shapes;
                for (const [parentIndex, item] of facilityInfo.entries()) {
                    if (item.type !== "location") {
                        if (item.views) {
                            const facility: THREE.Group<THREE.Object3DEventMap> | null = await createFacility(item.views ? item.views : null);
                            if (facility !== null) {
                                const box = new THREE.Box3().setFromObject(facility);
                                const size = new THREE.Vector3();
                                box.getSize(size);
                                const scaleX = item.width/ size.x;
                                const height = item.height ? item.height : 100;
                                const scaleY = height / size.y;
                                const scaleZ = item.length / size.z;
                                facility.scale.set(scaleX, scaleY, scaleZ);
                                facility.position.y = floorInfo.elevation + height / 2;
                                facility.position.z = -floorInfo.width / 2 + item.y
                                facility.position.x = -floorInfo.length / 2 + item.x
                                facility.rotateY(item.rotation * (Math.PI / 180));
                                scene.add(facility);
                            }
                        }
                    }
                }
            }
        }
        // scene.add(Box);
    };
    
    const createVertical = (info: verticalShape[], roomSize:any) => { 
        const Box = new THREE.Group();
        info.forEach((item: verticalShape, index) => {
            const geometry = new THREE.PlaneGeometry(item.width, item.height);
            const material = new THREE.MeshStandardMaterial({
                color: item.fill || 0xffffff, // Default color if fill is not provided
                opacity: item.opacity || 1, // Default opacity if not provided
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false,
            });
            const Wall = new THREE.Mesh(geometry, material);
            // Define positions based on index
            const positions = [
                { x: roomSize.l / 2, y: roomSize.h / 2, z: 0, rotateY: Math.PI / 2 },   // Wall 1
                { x: 0, y: roomSize.h / 2, z: roomSize.w / 2, rotateY: 0 },            // Wall 2
                { x: -roomSize.l / 2, y: roomSize.h / 2, z: 0, rotateY: Math.PI / 2 }, // Wall 3
                { x: 0, y: roomSize.h / 2, z: -roomSize.w / 2, rotateY: 0 }            // Wall 4
            ];
            // Set the position and rotation based on the index
            const position = positions[index];
            Wall.position.set(position.x, position.y, position.z);
            Wall.rotateY(position.rotateY);
            // Add the wall to the group
            Box.add(Wall);
        });
    
        // Add the Box group to the scene
        scene.add(Box);
    };
    useEffect(() => {
        const RoomInfo: RoomType = jsonRoom;
        const roomSize = {
            h: RoomInfo.room.h,
            l: RoomInfo.room.l,
            w: RoomInfo.room.w,
        }
        const Wall = [];
        if ( RoomInfo.room.surfaces.wall1)
        {
            Wall.push( RoomInfo.room.surfaces.wall1);
        }
        if ( RoomInfo.room.surfaces.wall2)
        {
            Wall.push( RoomInfo.room.surfaces.wall2);
        }
        if ( RoomInfo.room.surfaces.wall3)
        {
            Wall.push( RoomInfo.room.surfaces.wall3);
        }
        if ( RoomInfo.room.surfaces.wall4)
        {
            Wall.push( RoomInfo.room.surfaces.wall4);
        }
        if(Wall.length < 4)
        {
            for(var i = Wall.length; i < 5; i++)
            {
                Wall.push(Wall[0]);
            }
        }
        createVertical(Wall, roomSize);
        const Horizontal = {
            floor: RoomInfo.room.surfaces.floor,
            subfloor: RoomInfo.room.surfaces.subfloor,
            ceiling: RoomInfo.room.surfaces.ceiling
        }
        createHorizontal(Horizontal)
    }, [])
    // useEffect(() => {
    //     if (!scene) return;
    //     // // const geometry = new THREE.BoxGeometry(roomSize.l, roomSize.h, roomSize.w );
    //     // // const material = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, opacity: 0.2 });
    //     // // const cube = new THREE.Mesh(geometry, material);
    //     // // scene.add(cube);
    //     // return () => {
    //     //     scene.remove(cube);
    //     //     cube.traverse((object) => {
    //     //         if (object instanceof THREE.Mesh) {
    //     //             const mesh = object as THREE.Mesh;
    //     //             mesh.geometry.dispose();
    //     //             if (Array.isArray(mesh.material)) {
    //     //                 mesh.material.forEach((material) => material.dispose());
    //     //             } else {
    //     //                 mesh.material.dispose();
    //     //             }
    //     //         }
    //     //     });
    //     // };
    // }, [scene])
    return (
        <>
        </>
    )
}

export default RoomLoader;