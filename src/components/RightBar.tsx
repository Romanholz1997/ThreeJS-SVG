import React from 'react';
import * as THREE from 'three';
import { meshProeprty } from '../types/types';
interface CustomRightMenu {
    handleSave: (selected: THREE.Mesh) => void;
    selected: THREE.Mesh;
}

const RightBar: React.FC<CustomRightMenu> = ({
    handleSave,
    selected
}) => {
  return (
    <div
      style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: '300px',
          height: '100vh',
          background: '#f8f9fa',
          padding: 20,
          boxSizing: 'border-box',
          borderLeft: '1px solid #dee2e6',
          overflowY: 'auto',
          fontFamily: 'Arial, sans-serif',
          zIndex: 5000
      }}
    >
      <h2 style={{ borderBottom: '1px solid #dee2e6', paddingBottom: '10px' }}>
        Shape Properties
      </h2>
      <div style={{textAlign: 'left'}}>
        <h5 style={{ paddingBottom: '10px' }}>
          Posision: {`(${selected?.position.x.toString()},  ${selected?.position.y.toString()}, ${selected?.position.z.toString()})`}
        </h5>
        <h5 style={{paddingBottom: '10px' }}>
          Rotation: {`(${selected?.rotation.x.toFixed(2).toString()},  ${selected?.rotation.y.toFixed(2).toString()}, ${selected?.rotation.z.toFixed(2).toString()})`}
        </h5>
        <h5 style={{ paddingBottom: '10px' }}>
          Scale: {`(${selected?.scale.x.toFixed(2).toString()},  ${selected?.scale.y.toFixed(2).toString()}, ${selected?.scale.z.toFixed(2).toString()})`}
        </h5>    
      </div>
      
      <button
        onClick={() => handleSave(selected)}
        style={{
          marginTop: '20px',
          padding: '12px',
          width: '100%',
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        {selected?.visible ? 'Hide' : 'Show'} -{selected?.name}-
      </button>
    </div>
  );
};

export default RightBar;
