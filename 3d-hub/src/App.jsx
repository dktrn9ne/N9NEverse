import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Html,
  useTexture,
  useGLTF,
  Box,
  Torus,
  Cone,
  Cylinder,
  Octahedron,
  Sphere,
} from '@react-three/drei'
import * as THREE from 'three'
import './App.css'

// ---- Data ---------------------------------------------------------------
const episodes = [
  {
    number: 'EP01',
    short: 'Passport Girl',
    title: 'Passport Girl — Origin Files',
    description: 'Deep dive into Passport Girl and the early Tumblr era.',
    links: [
      {
        label: 'Passport Girl (FB)',
        href: 'https://www.facebook.com/share/v/1AZDAY8neg/?mibextid=wwXIfr',
      },
      { label: 'Tumblr Archive', href: 'https://dazednconfuzed.tumblr.com' },
    ],
    xpHook: 'Comment your wildest old internet alter ego.',
    cameo: false,
  },
  {
    number: 'EP02',
    short: 'No Gold Anything',
    title: 'No Gold Anything — Cameo Hunt',
    description: 'You appear, but it is not a DKTR N9NE piece. Fans hunt for the cameo.',
    links: [
      {
        label: 'No Gold Anything (YouTube)',
        href: 'https://youtu.be/cUFP2POUFG0?si=3FM4xRW8BRTYAX6Q',
      },
    ],
    xpHook: 'Find the DKTR N9NE cameo and submit the timestamp to earn XP.',
    cameo: true,
  },
  {
    number: 'EP03',
    short: 'Elbow TV',
    title: 'Elbow TV — Mayweather vs Tebow',
    description: 'Reacting to the Elbow TV clip and talking about comedy and media.',
    links: [
      {
        label: 'Elbow TV: Mayweather vs Tebow',
        href: 'https://youtu.be/yjp3253WjmQ?si=MiBFjQp8AoQtiDsW',
      },
    ],
    xpHook: 'Fans pitch absurd matchups in comments for XP.',
    cameo: false,
  },
  {
    number: 'EP04',
    short: 'Dream Girl',
    title: 'Dream Girl ft Mr Thomas',
    description: 'Breakdown of Dream Girl and the Maurice Thomas vs DKTR N9NE duality.',
    links: [
      {
        label: 'Dream Girl ft Mr Thomas',
        href: 'https://youtu.be/go-mLHuspuc?si=3u1fIPlztJaKSdbN',
      },
    ],
    xpHook: 'Fans drop “dream person” tropes; best ones become Haiku.',
    cameo: false,
  },
  {
    number: 'EP05',
    short: 'Chief Keef / 50 / Chop',
    title: 'Chief Keef / 50 / Chop — Cameo Hunt',
    description: 'Era document where you only cameo. Fans must spot and timestamp you.',
    links: [
      {
        label: 'Chief Keef / 50 / Young Chop clip',
        href: 'https://youtu.be/YMoSbh7AK8U?si=uNvxh1_L8QAAxZ0d',
      },
    ],
    xpHook: 'Submit exact timestamp + what you are doing for bonus XP.',
    cameo: true,
  },
  {
    number: 'EP06',
    short: 'Old Thing Back',
    title: 'Old Thing Back',
    description: 'Using Old Thing Back to talk about relationship nostalgia.',
    links: [
      {
        label: 'Old Thing Back',
        href: 'https://youtu.be/cZmULgDLi8g?si=YrTuVP590ZOi9DRf',
      },
    ],
    xpHook: 'Fans vote on which “old thing” should be restored for SZN 2.',
    cameo: false,
  },
  {
    number: 'EP07',
    short: 'Scared of The D',
    title: 'Scared of The D',
    description: 'Scared of The D as a lens on cities, fear, and respect.',
    links: [
      {
        label: 'Scared of The D',
        href: 'https://youtu.be/6ekFvpry5SY?si=Du64DOgUl49SeGq5',
      },
    ],
    xpHook: 'Fans share the city they are lowkey scared of and why.',
    cameo: false,
  },
  {
    number: 'EP08',
    short: 'Russell / Sound in Color',
    title: 'Russell & Sound in Color',
    description: 'The thesis statement for what DKTR N9NE actually sounds and looks like.',
    links: [
      {
        label: 'Russell',
        href: 'https://youtu.be/ljofa1n-Hf0?si=gpyVnKswzAUNvrYo',
      },
      {
        label: 'Sound in Color',
        href: 'https://youtu.be/SVjEUTiOvYs?si=6aBiyOBhXqA8GAu9',
      },
    ],
    xpHook: 'Fans describe your sound in one color + one object.',
    cameo: false,
  },
]

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function damp(current, target, lambda, delta) {
  // critically damped / exponential smoothing
  return THREE.MathUtils.damp(current, target, lambda, delta)
}

function nearestIndex(values, x) {
  let idx = 0
  let best = Infinity
  for (let i = 0; i < values.length; i++) {
    const d = Math.abs(values[i] - x)
    if (d < best) {
      best = d
      idx = i
    }
  }
  return idx
}

// ---- Scene bits ---------------------------------------------------------

function LogoPlane({ billboard = true }) {
  const texture = useTexture('/n9ne-logo.jpg')
  const ref = useRef()

  useFrame(({ camera }) => {
    if (!billboard || !ref.current) return
    ref.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={ref}>
      <planeGeometry args={[2.2, 2.2]} />
      <meshStandardMaterial
        map={texture}
        emissive={'white'}
        emissiveMap={texture}
        emissiveIntensity={0.35}
        toneMapped={false}
        transparent
      />
    </mesh>
  )
}

function LogoGLB() {
  const { scene } = useGLTF('/9-logo.glb')
  const ref = useRef()

  // Your GLB appears to import laying "flat". We apply a fixed orientation offset
  // so it sits upright like a pendant, then we billboard around Y to face the user.
  const BASE_X = -Math.PI / 2
  const BASE_Y = 0
  const BASE_Z = 0

  useFrame(({ camera }) => {
    if (!ref.current) return

    // Face the camera, but only by rotating around Y (keeps it upright).
    const dx = camera.position.x - ref.current.position.x
    const dz = camera.position.z - ref.current.position.z
    const targetY = Math.atan2(dx, dz)

    ref.current.rotation.set(BASE_X, targetY + BASE_Y, BASE_Z)
  })

  // Make it pop a bit regardless of lighting
  useEffect(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      const mat = obj.material
      if (!mat) return
      mat.toneMapped = false
      if ('emissive' in mat) {
        mat.emissive = new THREE.Color('#7be7ff')
        mat.emissiveIntensity = 0.45
      }
      mat.needsUpdate = true
    })
  }, [scene])

  return <primitive ref={ref} object={scene} position={[0, 0, 0]} scale={1.05} />
}

useGLTF.preload('/9-logo.glb')

const geometries = [
  // EP01
  (props) => (
    <mesh {...props}>
      <Box args={[0.22, 0.14, 0.02]} />
    </mesh>
  ),
  // EP02
  (props) => (
    <mesh {...props}>
      <Box args={[0.2, 0.2, 0.2]} />
    </mesh>
  ),
  // EP03
  (props) => (
    <mesh {...props}>
      <Cylinder args={[0.08, 0.08, 0.24, 12]} />
    </mesh>
  ),
  // EP04
  (props) => (
    <mesh {...props}>
      <Sphere args={[0.12, 16, 16]} />
    </mesh>
  ),
  // EP05
  (props) => (
    <mesh {...props}>
      <Octahedron args={[0.14]} />
    </mesh>
  ),
  // EP06
  (props) => (
    <mesh {...props}>
      <Torus args={[0.12, 0.04, 12, 24]} />
    </mesh>
  ),
  // EP07
  (props) => (
    <mesh {...props}>
      <Cone args={[0.12, 0.24, 12]} />
    </mesh>
  ),
  // EP08
  (props) => (
    <mesh {...props}>
      <Torus args={[0.11, 0.035, 10, 6]} />
    </mesh>
  ),
]

function EpisodeObject({
  episode,
  geometry,
  position,
  isActive,
  activeWeight,
  onSelect,
  showTooltip,
}) {
  const ref = useRef()

  useFrame((state, delta) => {
    if (!ref.current) return
    // soft bob + idle rotation
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8 + position[0]) * 0.12
    ref.current.rotation.y += delta * 0.35

    const s = 1 + 0.18 * activeWeight
    ref.current.scale.setScalar(damp(ref.current.scale.x, s, 14, delta))
  })

  const baseColor = episode.cameo ? '#ffb84d' : '#e8f7ff'
  const emissive = episode.cameo ? '#ffb84d' : '#7be7ff'
  const emissiveIntensity = episode.cameo
    ? 1.2 + 1.8 * activeWeight
    : 0.6 + 1.4 * activeWeight

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {geometry}
      <meshStandardMaterial
        color={baseColor}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        toneMapped={false}
        roughness={episode.cameo ? 0.25 : 0.4}
        metalness={episode.cameo ? 0.2 : 0.05}
      />
      {showTooltip && (
        <Html distanceFactor={6}>
          <div className={'tooltip' + (isActive ? ' tooltip--active' : '')}>{episode.short}</div>
        </Html>
      )}
    </mesh>
  )
}

function JourneyScene({ tRef, onActiveEpisodeChange }) {
  const controlsRef = useRef()
  const manualOverrideUntilRef = useRef(0)

  const stopConfig = useMemo(() => {
    const EP_COUNT = episodes.length
    const EP_START_T = 0.1
    const stops = [0]
    for (let i = 0; i < EP_COUNT; i++) {
      stops.push(EP_START_T + (1 - EP_START_T) * (i / (EP_COUNT - 1)))
    }

    const radius = 2.5
    const episodePositions = episodes.map((_, i) => {
      const angle = (i / episodes.length) * Math.PI * 2
      return new THREE.Vector3(radius * Math.cos(angle), 0, radius * Math.sin(angle))
    })

    const hubCameraPos = new THREE.Vector3(0, 1.2, 6.5)
    const hubTarget = new THREE.Vector3(0, 0, 0)

    const episodeCameraPos = episodePositions.map((p) => {
      // offset camera outward from the episode so it's framed nicely
      const dir = p.clone().normalize()
      return p.clone().add(dir.multiplyScalar(2.1)).add(new THREE.Vector3(0, 0.65, 0))
    })

    return { stops, episodePositions, hubCameraPos, hubTarget, episodeCameraPos }
  }, [])

  const { stops, episodePositions, hubCameraPos, hubTarget, episodeCameraPos } = stopConfig

  const hoveredRef = useRef(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia?.('(pointer: coarse)')
    const update = () => setIsTouch(Boolean(mql?.matches))
    update()
    mql?.addEventListener?.('change', update)
    return () => mql?.removeEventListener?.('change', update)
  }, [])

  const lastActiveRef = useRef(-999)

  useFrame(({ camera, clock }, delta) => {
    const currentT = tRef.current
    const stopIdx = nearestIndex(stops, currentT)
    const activeEpisodeIndex = stopIdx - 1

    if (onActiveEpisodeChange && lastActiveRef.current !== activeEpisodeIndex) {
      lastActiveRef.current = activeEpisodeIndex
      onActiveEpisodeChange(activeEpisodeIndex)
    }

    // Determine segment (between stops) to interpolate camera
    let aIdx = 0
    let bIdx = 0
    for (let i = 0; i < stops.length - 1; i++) {
      if (currentT >= stops[i] && currentT <= stops[i + 1]) {
        aIdx = i
        bIdx = i + 1
        break
      }
    }

    const ta = stops[aIdx]
    const tb = stops[bIdx]
    const segT = tb === ta ? 0 : (currentT - ta) / (tb - ta)

    const camA = aIdx === 0 ? hubCameraPos : episodeCameraPos[aIdx - 1]
    const camB = bIdx === 0 ? hubCameraPos : episodeCameraPos[bIdx - 1]
    const tgtA = aIdx === 0 ? hubTarget : episodePositions[aIdx - 1]
    const tgtB = bIdx === 0 ? hubTarget : episodePositions[bIdx - 1]

    const desiredCam = camA.clone().lerp(camB, THREE.MathUtils.smoothstep(segT, 0, 1))
    const desiredTgt = tgtA.clone().lerp(tgtB, THREE.MathUtils.smoothstep(segT, 0, 1))

    const now = clock.elapsedTime * 1000
    const controls = controlsRef.current
    const canAutopilot = now > manualOverrideUntilRef.current

    if (canAutopilot) {
      camera.position.lerp(desiredCam, 1 - Math.exp(-8 * delta))
      if (controls) {
        controls.target.lerp(desiredTgt, 1 - Math.exp(-10 * delta))
        controls.update()
      }
    }
  })

  const setManualOverride = () => {
    manualOverrideUntilRef.current = performance.now() + 900
  }

  return (
    <>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, 0, 5]} intensity={55} color={'#7be7ff'} />

      <Suspense fallback={<LogoPlane billboard />}>
        <LogoGLB />
      </Suspense>

      {episodes.map((ep, i) => {
        const pos = episodePositions[i]
        const Geometry = geometries[i % geometries.length]

        const stopIdx = nearestIndex(stops, tRef.current)
        const activeEpisodeIndex = stopIdx - 1
        const isActive = activeEpisodeIndex === i

        // NOTE: keep this simple (no per-frame React state churn). We'll refine later.
        const activeWeight = isActive ? 1 : 0

        return (
          <EpisodeObject
            key={ep.number}
            episode={ep}
            geometry={<Geometry />}
            position={[pos.x, pos.y, pos.z]}
            isActive={isActive}
            activeWeight={activeWeight}
            onSelect={() => {
              // jump/snap to this stop
              tRef.target = stops[i + 1]
            }}
            showTooltip={!isTouch && (isActive || hoveredRef.current === i)}
          />
        )
      })}

      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={(Math.PI * 2) / 3}
        rotateSpeed={0.6}
        onStart={setManualOverride}
      />
    </>
  )
}

// ---- UI -----------------------------------------------------------------
function DetailPanel({ episode, isMoving, onClose }) {
  if (!episode) return null
  return (
    <div className={'detail-panel' + (isMoving ? ' detail-panel--compact' : '')}>
      <div className="detail-panel__top">
        <div className="ep-tag">{episode.cameo ? 'Cameo Challenge' : 'Narrative'}</div>
        <button className="close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      <h2>{episode.title}</h2>
      <p>{episode.description}</p>

      <div className="links">
        {episode.links.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
      </div>

      <div className="xp-hook">
        <strong>XP Hook:</strong> {episode.xpHook}
      </div>
    </div>
  )
}

function Overlay({ activeIndex, isHub, hintVisible }) {
  const ep = activeIndex >= 0 ? episodes[activeIndex] : null

  return (
    <div className="overlay">
      <div className="overlay__header">
        <div className="overlay__kicker">N9NEVERSE</div>
        {isHub ? (
          <div className="overlay__title">3D Hub</div>
        ) : (
          <div className="overlay__title">
            {ep?.number}/08 — {ep?.short}
          </div>
        )}
      </div>

      {hintVisible && (
        <div className="overlay__hint">
          <div className="hint">Scroll to begin</div>
        </div>
      )}
    </div>
  )
}

// ---- App ----------------------------------------------------------------
export default function App() {
  // progress state kept in refs for smoothness
  const tRef = useRef(0)
  const targetRef = useRef(0)
  // hack: attach target onto same object so child can jump
  tRef.target = targetRef.current

  const [activeIndex, setActiveIndex] = useState(-1) // -1 hub
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isMoving, setIsMoving] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)

  const stops = useMemo(() => {
    const EP_COUNT = episodes.length
    const EP_START_T = 0.1
    const arr = [0]
    for (let i = 0; i < EP_COUNT; i++) arr.push(EP_START_T + (1 - EP_START_T) * (i / (EP_COUNT - 1)))
    return arr
  }, [])

  useEffect(() => {
    let scrollEndTimer = null
    const snapToNearest = () => {
      const idx = nearestIndex(stops, targetRef.current)
      targetRef.current = stops[idx]
      setIsMoving(false)
    }

    const onWheel = (e) => {
      // once they scroll once, hide the hint
      if (hintVisible) setHintVisible(false)

      setIsMoving(true)
      const speed = 0.00065
      targetRef.current = clamp(targetRef.current + e.deltaY * speed, 0, 1)

      clearTimeout(scrollEndTimer)
      scrollEndTimer = setTimeout(snapToNearest, 220)
    }

    let touchStartY = null
    const onTouchStart = (e) => {
      if (e.touches?.length !== 1) return
      touchStartY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (touchStartY == null || e.touches?.length !== 1) return
      if (hintVisible) setHintVisible(false)

      setIsMoving(true)
      const y = e.touches[0].clientY
      const dy = touchStartY - y
      touchStartY = y

      const speed = 0.0012
      targetRef.current = clamp(targetRef.current + dy * speed, 0, 1)

      clearTimeout(scrollEndTimer)
      scrollEndTimer = setTimeout(snapToNearest, 250)
    }
    const onTouchEnd = () => {
      touchStartY = null
      clearTimeout(scrollEndTimer)
      scrollEndTimer = setTimeout(snapToNearest, 120)
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [stops, hintVisible])

  const selectedEpisode = selectedIndex != null ? episodes[selectedIndex] : null
  const isHub = activeIndex < 0

  return (
    <div className="app">
      <Canvas
        camera={{ position: [0, 1.2, 6.5], fov: 65 }}
        style={{
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at top, #141b32 0%, #05060a 52%, #020308 100%)',
        }}
        // iOS Safari optimization: cap DPR and disable AA (saves GPU + battery)
        dpr={[1, 1.25]}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
      >
        <JourneyTicker
          tRef={tRef}
          targetRef={targetRef}
          onMotion={(moving) => setIsMoving(moving)}
        />

        <JourneyScene
          tRef={{
            get current() {
              return tRef.current
            },
            set current(v) {
              tRef.current = v
            },
            get target() {
              return targetRef.current
            },
            set target(v) {
              targetRef.current = clamp(v, 0, 1)
              setHintVisible(false)
              // also auto-select the episode when jumping
              const idx = nearestIndex(stops, targetRef.current)
              const epIdx = idx - 1
              if (epIdx >= 0) setSelectedIndex(epIdx)
            },
          }}
          onActiveEpisodeChange={(idx) => {
            setActiveIndex(idx)
            if (idx >= 0) setSelectedIndex(idx)
          }}
        />
      </Canvas>

      <Overlay activeIndex={activeIndex} isHub={isHub} hintVisible={hintVisible} />

      <DetailPanel
        episode={selectedEpisode}
        isMoving={isMoving}
        onClose={() => setSelectedIndex(null)}
      />
    </div>
  )
}

function JourneyTicker({ tRef, targetRef }) {
  useFrame((_, delta) => {
    tRef.current = damp(tRef.current, targetRef.current, 10, delta)
  })
  return null
}
