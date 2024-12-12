// src/App.tsx
import React from 'react';
import './App.css';
import SvgScene from './components/SvgScene';
const App: React.FC = () => {
    return (
        <div className="App">
            <h1 style={{height:'50px'}}>3D Cube with Three.js</h1>
            <SvgScene/>
        </div>
    );
};

export default App;


// import React from 'react';
// import SvgPolygonRenderer from './SvgPolygonRenderer';

// const App: React.FC = () => {
//   const svgString = `
//     <svg width="100" height="100">
//       <g>
//         <polygon points="10,10 50,10 50,50 10,50" />
//         <polygon points="60,10 90,10 90,50 60,50" />
//       </g>
//     </svg>
//   `;

//   return (
//     <div>
//       <h1>SVG Polygon Renderer</h1>
//       <SvgPolygonRenderer svgString={svgString} />
//     </div>
//   );
// };

// export default App;
