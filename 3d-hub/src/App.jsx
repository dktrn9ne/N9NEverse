import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, OrbitControls } from '@react-three/drei'

function SpinningCube() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta;
    meshRef.current.rotation.y += delta;
  });

  return (
    <Box ref={meshRef}>
      <meshStandardMaterial color="royalblue" />
    </Box>
  );
}

function App() {
  return (
    <Canvas 
      camera={{ position: [0, 0, 3] }}
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: '#111' 
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <SpinningCube />
      <OrbitControls />
    </Canvas>
  )
}

export default App;
