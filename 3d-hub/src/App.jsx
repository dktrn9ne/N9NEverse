import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, Html, useTexture, Box, Torus, Cone, Cylinder, Octahedron } from '@react-three/drei'

// Data for the episodes, same as the journey map
const episodes = [
    { number: 'EP01', short: 'Passport Girl', title: 'Passport Girl — Origin Files', description: 'Deep dive into Passport Girl and the early Tumblr era.', links: [{ label: 'Passport Girl (FB)', href: 'https://www.facebook.com/share/v/1AZDAY8neg/?mibextid=wwXIfr' }, { label: 'Tumblr Archive', href: 'https://dazednconfuzed.tumblr.com' }], xpHook: 'Comment your wildest old internet alter ego.', cameo: false },
    { number: 'EP02', short: 'No Gold Anything', title: 'No Gold Anything — Cameo Hunt', description: 'You appear, but it is not a DKTR N9NE piece. Fans hunt for the cameo.', links: [{ label: 'No Gold Anything (YouTube)', href: 'https://youtu.be/cUFP2POUFG0?si=3FM4xRW8BRTYAX6Q' }], xpHook: 'Find the DKTR N9NE cameo and submit the timestamp to earn XP.', cameo: true },
    { number: 'EP03', short: 'Elbow TV', title: 'Elbow TV — Mayweather vs Tebow', description: 'Reacting to the Elbow TV clip and talking about comedy and media.', links: [{ label: 'Elbow TV: Mayweather vs Tebow', href: 'https://youtu.be/yjp3253WjmQ?si=MiBFjQp8AoQtiDsW' }], xpHook: 'Fans pitch absurd matchups in comments for XP.', cameo: false },
    { number: 'EP04', short: 'Dream Girl', title: 'Dream Girl ft Mr Thomas', description: 'Breakdown of Dream Girl and the Maurice Thomas vs DKTR N9NE duality.', links: [{ label: 'Dream Girl ft Mr Thomas', href: 'https://youtu.be/go-mLHuspuc?si=3u1fIPlztJaKSdbN' }], xpHook: 'Fans drop “dream person” tropes; best ones become Haiku.', cameo: false },
    { number: 'EP05', short: 'Chief Keef / 50 / Chop', title: 'Chief Keef / 50 / Chop — Cameo Hunt', description: 'Era document where you only cameo. Fans must spot and timestamp you.', links: [{ label: 'Chief Keef / 50 / Young Chop clip', href: 'https://youtu.be/YMoSbh7AK8U?si=uNvxh1_L8QAAxZ0d' }], xpHook: 'Submit exact timestamp + what you are doing for bonus XP.', cameo: true },
    { number: 'EP06', short: 'Old Thing Back', title: 'Old Thing Back', description: 'Using Old Thing Back to talk about relationship nostalgia.', links: [{ label: 'Old Thing Back', href: 'https://youtu.be/cZmULgDLi8g?si=YrTuVP590ZOi9DRf' }], xpHook: 'Fans vote on which “old thing” should be restored for SZN 2.', cameo: false },
    { number: 'EP07', short: 'Scared of The D', title: 'Scared of The D', description: 'Scared of The D as a lens on cities, fear, and respect.', links: [{ label: 'Scared of The D', href: 'https://youtu.be/6ekFvpry5SY?si=Du64DOgUl49SeGq5' }], xpHook: 'Fans share the city they are lowkey scared of and why.', cameo: false },
    { number: 'EP08', short: 'Russell / Sound in Color', title: 'Russell & Sound in Color', description: 'The thesis statement for what DKTR N9NE actually sounds and looks like.', links: [{ label: 'Russell', href: 'https://youtu.be/ljofa1n-Hf0?si=gpyVnKswzAUNvrYo' }, { label: 'Sound in Color', href: 'https://youtu.be/SVjEUTiOvYs?si=6aBiyOBhXqA8GAu9' }], xpHook: 'Fans describe your sound in one color + one object.', cameo: false },
];

const geometries = [
    <Box args={[0.2, 0.2, 0.2]} />,
    <Torus args={[0.1, 0.04, 16, 48]} />,
    <Cone args={[0.1, 0.2, 32]} />,
    <Cylinder args={[0.1, 0.1, 0.2, 32]} />,
    <Octahedron args={[0.12]} />,
    <Sphere args={[0.12, 32, 32]} />,
    <Torus args={[0.1, 0.04, 16, 4]} />,
    <Box args={[0.2, 0.2, 0.2]} />,
];


function LogoPlane() {
    const texture = useTexture('/n9ne-logo.jpg')
    return (
        <mesh>
            <planeGeometry args={[2, 2]} />
            <meshStandardMaterial map={texture} emissive="white" emissiveMap={texture} emissiveIntensity={0.2} toneMapped={false} transparent />
        </mesh>
    )
}

function Satellite({ episode, geometry, position, onClick }) {
  const meshRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  useFrame((state, delta) => {
    // Optional: make satellites bob up and down
    meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.2;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(episode); }}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      {geometry}
      <meshStandardMaterial
        color={episode.cameo ? '#ffb84d' : '#ffffff'}
        emissive={episode.cameo ? '#ffb84d' : '#ffffff'}
        emissiveIntensity={isHovered ? 2.5 : 0.8}
        toneMapped={false}
      />
      {isHovered && (
        <Html distanceFactor={5}>
          <div className="tooltip">{episode.short}</div>
        </Html>
      )}
    </mesh>
  );
}

function Scene({ onSelectEpisode }) {
  const groupRef = useRef();

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 0, 5]} intensity={50} color="#00e5ff" />
      <LogoPlane />
      <group ref={groupRef}>
        {episodes.map((ep, i) => {
          const angle = (i / episodes.length) * 2 * Math.PI;
          const radius = 2.5;
          const x = radius * Math.cos(angle);
          const z = radius * Math.sin(angle);
          return <Satellite key={ep.number} episode={ep} geometry={geometries[i % geometries.length]} position={[x, 0, z]} onClick={onSelectEpisode} />;
        })}
      </group>
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} minPolarAngle={Math.PI / 3} maxPolarAngle={Math.PI * 2 / 3} />
    </>
  );
}

function DetailPanel({ episode, onClose }) {
    if (!episode) return null;
    return (
        <div className="detail-panel">
            <button className="close-btn" onClick={onClose}>&times;</button>
            <div className="ep-tag">{episode.cameo ? 'Cameo Challenge' : 'Narrative'}</div>
            <h2>{episode.title}</h2>
            <p>{episode.description}</p>
            <div className="links">
                {episode.links.map(link => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a>)}
            </div>
            <div className="xp-hook">
                <strong>XP Hook:</strong> {episode.xpHook}
            </div>
        </div>
    )
}

function App() {
  const [selectedEpisode, setSelectedEpisode] = useState(null);

  return (
    <>
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }} style={{ width: '100vw', height: '100vh', background: 'radial-gradient(circle at top, #141b32 0%, #05060a 52%, #020308 100%)' }}>
            <Scene onSelectEpisode={setSelectedEpisode} />
        </Canvas>
        <DetailPanel episode={selectedEpisode} onClose={() => setSelectedEpisode(null)} />
    </>
  )
}

export default App;
