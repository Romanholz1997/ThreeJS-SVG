// src/App.tsx
import React from 'react';
import './App.css';
import SvgScene from './components/SvgScene';
import RoomScene from './components/RoomScene';

const App: React.FC = () => {
    return (
        <div className="App">
            <h1 style={{height:'50px'}}>Room with Three.js</h1>
            <RoomScene/>
        </div>
    );
};
export default App;
