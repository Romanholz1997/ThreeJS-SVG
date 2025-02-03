// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SvgScene from './components/SvgScene';
import RoomScene from './components/RoomScene';
import Scene from './components/Scene';

const App: React.FC = () => {
    return (
      
        <div className="App">            
            <Router>
                <Routes>
                    <Route path="/" element={<RoomScene />} />
                    <Route path="/mt2" element={<SvgScene />} />
                    <Route path="/test" element={<Scene />} />
                </Routes>
            </Router>
        </div>
    );
};
export default App;


// // src/App.tsx
// import React from 'react';
// import Box from './Box';

// const App: React.FC = () => {
//   return (
//     <div>
//       <h1>Three.js Box with Toggleable Faces</h1>
//       <Box />
//     </div>
//   );
// };

// export default App;


// import React, { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

// interface SvgModelProps {
//   url: string;
// }

// const SvgModel: React.FC<SvgModelProps> = ({ url }) => {
//   const mountRef = useRef<HTMLDivElement | null>(null);

  
//   useEffect(() => {
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color( 0xb0b0b0 );
//     const helper = new THREE.GridHelper( 160, 10, 0x8d8d8d, 0xc1c1c1 );
//     helper.rotation.x = Math.PI / 2;
//     scene.add( helper );
//     const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
//     camera.position.set( 0, 0, 100 );
//     // const renderer = new THREE.WebGLRenderer();
//     const renderer = new THREE.WebGLRenderer( { antialias: true } );
//     renderer.setPixelRatio( window.devicePixelRatio );
//     renderer.setSize( window.innerWidth, window.innerHeight );
    
//     if (mountRef.current) {
//       renderer.setSize(window.innerWidth, window.innerHeight);
//       mountRef.current.appendChild(renderer.domElement);
//     }

//     const controls = new OrbitControls( camera, renderer.domElement );
//     controls.addEventListener( 'change', render );
//     controls.screenSpacePanning = true;

//     //

//     window.addEventListener( 'resize', onWindowResize );

//     function onWindowResize() {

//         camera.aspect = window.innerWidth / window.innerHeight;
//         camera.updateProjectionMatrix();

//         renderer.setSize( window.innerWidth, window.innerHeight );
//         render();

//     }

//     function render() {

//         renderer.render( scene, camera );

//     }
//     const loader = new SVGLoader();
//     fetch(url)
//       .then(response => response.text())
//       .then(data => {
//         const svgData = loader.parse(data);
//         console.log(svgData);
//         const group = new THREE.Group();
//         let renderOrder = 0;
//         svgData.paths.forEach((path) => {            
//             const fillColor = path.userData?.style?.fill ?? 0x000000;
//             const opacity = path.userData?.style?.fillOpacity ?? 1;
//             if (fillColor !== undefined && fillColor !== 'none' ) {

//                 const material = new THREE.MeshBasicMaterial( {
//                     color: new THREE.Color().setStyle( fillColor ),
//                     opacity: opacity,
//                     transparent: true,
//                     side: THREE.DoubleSide,
//                     depthWrite: false,                   
//                 } );

//                 const shapes = SVGLoader.createShapes( path );

//                 for ( const shape of shapes ) {

//                     const geometry = new THREE.ShapeGeometry( shape );
//                     const mesh = new THREE.Mesh( geometry, material );
//                     mesh.renderOrder = renderOrder ++;

//                     group.add( mesh );

//                 }

//             }

//             const strokeColor = path.userData?.style?.stroke ?? 0xffffff;
//             const strokeOpacity = path.userData?.style?.strokeOpacity ?? 1;

//             if (strokeColor !== undefined && strokeColor !== 'none' ) {

//                 const material = new THREE.MeshBasicMaterial( {
//                     color: new THREE.Color().setStyle( strokeColor ),
//                     opacity:strokeOpacity,
//                     transparent: true,
//                     side: THREE.DoubleSide,
//                     depthWrite: false
//                 } );

//                 for ( const subPath of path.subPaths ) {

//                     const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData?.style || null);

//                     if ( geometry ) {
//                         const mesh = new THREE.Mesh( geometry, material );
//                         mesh.renderOrder = renderOrder ++;
//                         group.add( mesh );
//                     }

//                 }

//             }
//         });

//         scene.add(group);

//         // const animate = () => {
//         //   requestAnimationFrame(animate);
//         //   renderer.render(scene, camera);
//         // };
//         renderer.render(scene, camera);
//         // animate();
//       });

//     return () => {
//       if (mountRef.current) {
//         mountRef.current.removeChild(renderer.domElement);
//       }
//     };
//   }, [url]);

//   return <div ref={mountRef} />;
// };

// const App: React.FC = () => {
//   return (
//     <div>
//       <SvgModel url="./2.svg" />
//     </div>
//   );
// };

// export default App;


// import React, { useEffect, useRef } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader';

// interface SvgModelProps {
//   url: string;
// }

// const SvgModel: React.FC<SvgModelProps> = ({ url }) => {
//   const mountRef = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     const scene = new THREE.Scene();
//     scene.background = new THREE.Color(0xb0b0b0);
//     const helper = new THREE.GridHelper(160, 10, 0x8d8d8d, 0xc1c1c1);
//     helper.rotation.x = Math.PI / 2;
//     scene.add(helper);

//     const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
//     camera.position.set(0, 0, 100);

//     const renderer = new THREE.WebGLRenderer({ antialias: true });
//     renderer.setPixelRatio(window.devicePixelRatio);
//     renderer.setSize(window.innerWidth, window.innerHeight);
//     if (mountRef.current) {
//       mountRef.current.appendChild(renderer.domElement);
//     }
//     const render = () => {
//     renderer.render(scene, camera);
//     };

//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.screenSpacePanning = true;
//     controls.addEventListener( 'change', render );

//     const onWindowResize = () => {
//       camera.aspect = window.innerWidth / window.innerHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(window.innerWidth, window.innerHeight);
//       render();
//     };

//     window.addEventListener('resize', onWindowResize);

//     const loader = new SVGLoader();
//     fetch(url)
//       .then(response => response.text())
//       .then(data => {
//         const svgData = loader.parse(data);
//         const group = new THREE.Group();
//         let renderOrder = 0;

//         svgData.paths.forEach(path => {
//           const fillColor = path.userData?.style?.fill ?? 0x000000;
//           const opacity = path.userData?.style?.fillOpacity ?? 1;

//           if (fillColor !== undefined && fillColor !== 'none') {
//             const material = new THREE.MeshBasicMaterial({
//               color: new THREE.Color().setStyle(fillColor),
//               opacity: opacity,
//               transparent: true,
//               side: THREE.DoubleSide,
//               depthWrite: false,
//             });

//             const shapes = SVGLoader.createShapes(path);
//             const geometry = new THREE.BufferGeometry();

//             const vertices: number[] = [];
//             const indices: number[] = [];

//             shapes.forEach(shape => {
//               const shapeGeometry = new THREE.ShapeGeometry(shape);
//               vertices.push(...shapeGeometry.attributes.position.array);
//               if (shapeGeometry.index) {
//                 const startIndex = vertices.length / 3 - shapeGeometry.index.count;
//                 indices.push(...shapeGeometry.index.array.map(index => index + startIndex));
//               }
//             });

//             geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
//             geometry.setIndex(indices);
//             const mesh = new THREE.Mesh(geometry, material);
//             mesh.renderOrder = renderOrder++;
//             group.add(mesh);
//           }
//         });

//         scene.add(group);
//         render();
//       });

    

//     return () => {
//       window.removeEventListener('resize', onWindowResize);
//       if (mountRef.current) {
//         mountRef.current.removeChild(renderer.domElement);
//       }
//     };
//   }, [url]);

//   return <div ref={mountRef} />;
// };

// const App: React.FC = () => {
//   return (
//     <div>
//       <SvgModel url="./2.svg" />
//     </div>
//   );
// };

// export default App;
