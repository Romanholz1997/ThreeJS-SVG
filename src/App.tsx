// src/App.tsx
import React from 'react';
import './App.css';
import SvgScene from './components/SvgScene';
import SvgToPngConverter from './SvgToPngConverter';
const App: React.FC = () => {
    return (
        <div className="App">
            <h1 style={{height:'50px'}}>3D Cube with Three.js</h1>
            <SvgScene/>
            {/* <SvgToPngConverter/> */}
        </div>
    );
};

export default App;