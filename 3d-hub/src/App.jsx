import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Html,
  useTexture,
  useGLTF,
  useProgress,
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
  const ref = useRef()

  useFrame(({ camera }) => {
    if (!billboard || !ref.current) return
    ref.current.quaternion.copy(camera.quaternion)
  })

  // Fallback that does NOT depend on external texture loads (important for iOS Safari reliability)
  return (
    <mesh ref={ref}>
      <circleGeometry args={[1.05, 48]} />
      <meshStandardMaterial
        color={'#0b1a22'}
        emissive={'#7be7ff'}
        emissiveIntensity={0.25}
        toneMapped={false}
      />
    </mesh>
  )
}

function LogoGLB() {
  const { scene } = useGLTF('/9-logo.glb')
  const ref = useRef()

  // Back to center of the system (world space), like the original hub concept.
  // Keep it upright and facing the camera (Y-only) so it reads from any orbit.
  const BASE_X = -Math.PI / 2
  const BASE_Y = Math.PI
  const BASE_Z = 0.02

  useFrame(({ camera }) => {
    if (!ref.current) return

    // Face the camera, but only rotate around Y (upright)
    const dx = camera.position.x - ref.current.position.x
    const dz = camera.position.z - ref.current.position.z
    const targetY = Math.atan2(dx, dz)

    ref.current.rotation.set(BASE_X, targetY + BASE_Y, BASE_Z)
  })

  useEffect(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return
      obj.frustumCulled = false
      obj.castShadow = false
      obj.receiveShadow = false

      // Restore normal depth behavior (so it belongs to the 3D world)
      if (obj.material) {
        const apply = (m) => {
          if (!m) return
          m.toneMapped = false
          m.depthTest = true
          m.depthWrite = true
          m.needsUpdate = true
        }
        if (Array.isArray(obj.material)) obj.material.forEach(apply)
        else apply(obj.material)
      }
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

  // EP02 handled by <BullionBars /> so we can apply per-bar materials/textures reliably.
  null,

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
  map,
  passportMats,
  passportEmbossTex,
  hasOwnMaterials,
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

  const baseColor = episode.cameo ? '#d9dde3' : '#e8f7ff'
  const emissive = episode.cameo ? '#cfd6df' : '#7be7ff'
  const emissiveIntensity = episode.cameo
    ? 0.55 + 0.9 * activeWeight
    : 0.6 + 1.4 * activeWeight

  const isPassport = episode.number === 'EP01'

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      // For the passport we use multi-materials so only the front face gets the cover.
      material={isPassport && passportMats ? passportMats : undefined}
    >
      {isPassport ? <boxGeometry args={[0.26, 0.18, 0.06]} /> : geometry}

      {!isPassport && !hasOwnMaterials && (
        <meshStandardMaterial
          map={map || null}
          color={map ? '#ffffff' : baseColor}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          toneMapped={false}
          roughness={map ? 0.55 : episode.cameo ? 0.12 : 0.4}
          metalness={map ? 0.05 : episode.cameo ? 0.9 : 0.05}
        />
      )}

      {isPassport && passportEmbossTex && (
        <mesh position={[0, 0.07, 0.031]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.22, 0.06]} />
          <meshBasicMaterial
            map={passportEmbossTex}
            transparent
            opacity={0.95}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

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

  const passportTex = useTexture('/passport-cover.jpg')

  const bullionTex = useMemo(() => {
    // Procedural brushed metal texture (no external file; reliable everywhere)
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    // base metal
    ctx.fillStyle = '#cfd6df'
    ctx.fillRect(0, 0, 256, 256)

    // brushed streaks
    for (let i = 0; i < 900; i++) {
      const y = Math.random() * 256
      const a = 0.06 + Math.random() * 0.08
      ctx.fillStyle = `rgba(255,255,255,${a})`
      ctx.fillRect(0, y, 256, 1)
    }

    // subtle noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 256
      const y = Math.random() * 256
      const g = 200 + Math.random() * 35
      ctx.fillStyle = `rgba(${g},${g},${g},0.06)`
      ctx.fillRect(x, y, 1, 1)
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    tex.needsUpdate = true
    return tex
  }, [])

  const BullionBars = useMemo(() => {
    return function BullionBarsInner() {
      const matProps = {
        map: bullionTex,
        color: '#ffffff',
        metalness: 0.95,
        roughness: 0.15,
        emissive: '#cfd6df',
        emissiveIntensity: 0.12,
        toneMapped: false,
      }

      return (
        <group>
          <mesh position={[0, 0.03, 0]} rotation={[0.08, 0.18, 0.02]}>
            <Box args={[0.26, 0.08, 0.14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[0.01, -0.02, 0.01]} rotation={[0.02, -0.12, -0.01]}>
            <Box args={[0.26, 0.08, 0.14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
          <mesh position={[-0.015, -0.07, -0.01]} rotation={[-0.03, 0.09, 0.01]}>
            <Box args={[0.26, 0.08, 0.14]} />
            <meshStandardMaterial {...matProps} />
          </mesh>
        </group>
      )
    }
  }, [bullionTex])

  const passportEmbossTex = useMemo(() => {
    // lightweight gold emboss overlay texture (iOS-safe)
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // subtle gradient gold
    const grd = ctx.createLinearGradient(0, 0, canvas.width, 0)
    grd.addColorStop(0, 'rgba(255, 214, 120, 0.15)')
    grd.addColorStop(0.5, 'rgba(255, 214, 120, 0.95)')
    grd.addColorStop(1, 'rgba(255, 214, 120, 0.15)')

    ctx.fillStyle = grd
    ctx.font = '700 72px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = 'rgba(255, 214, 120, 0.55)'
    ctx.shadowBlur = 18
    ctx.fillText('PASSPORT', canvas.width / 2, canvas.height / 2 + 2)

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.needsUpdate = true
    return tex
  }, [])

  const passportMats = useMemo(() => {
    passportTex.wrapS = passportTex.wrapT = THREE.ClampToEdgeWrapping
    passportTex.colorSpace = THREE.SRGBColorSpace
    passportTex.needsUpdate = true

    // BoxGeometry material order: [right, left, top, bottom, front, back]
    const leather = new THREE.MeshStandardMaterial({
      color: '#0b2a55',
      roughness: 0.85,
      metalness: 0.02,
      toneMapped: false,
    })
    const front = new THREE.MeshStandardMaterial({
      map: passportTex,
      color: '#ffffff',
      roughness: 0.75,
      metalness: 0.02,
      toneMapped: false,
    })
    const back = new THREE.MeshStandardMaterial({
      color: '#071a33',
      roughness: 0.9,
      metalness: 0.02,
      toneMapped: false,
    })

    return [leather, leather, leather, leather, front, back]
  }, [passportTex])

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
        const isBullion = i === 1

        const stopIdx = nearestIndex(stops, tRef.current)
        const activeEpisodeIndex = stopIdx - 1
        const isActive = activeEpisodeIndex === i

        // NOTE: keep this simple (no per-frame React state churn). We'll refine later.
        const activeWeight = isActive ? 1 : 0

        return (
          <EpisodeObject
            key={ep.number}
            episode={ep}
            geometry={isBullion ? <BullionBars /> : <Geometry />}
            hasOwnMaterials={isBullion}
            position={[pos.x, pos.y, pos.z]}
            isActive={isActive}
            activeWeight={activeWeight}
            map={null}
            passportMats={i === 0 ? passportMats : null}
            passportEmbossTex={i === 0 ? passportEmbossTex : null}
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

function LoadingScreen({ ready }) {
  const { progress, active } = useProgress()
  const pct = Math.min(100, Math.max(0, Math.round(progress)))
  const show = !ready || active || pct < 100

  return (
    <div className={'loading' + (show ? '' : ' loading--hide')}>
      <div className="loading__inner">
        <div className="loading__kicker">N9NEVERSE</div>
        <div className="loading__title">Loading 3D Hub…</div>
        <div className="loading__bar" aria-hidden>
          <div className="loading__barFill" style={{ width: pct + '%' }} />
        </div>
        <div className="loading__pct">{pct}%</div>
      </div>
    </div>
  )
}

function DesktopChrome({ activeIndex, isHub }) {
  const ep = activeIndex >= 0 ? episodes[activeIndex] : null
  return (
    <div className="chrome">
      <div className="chrome__left">N9NEVERSE</div>
      <div className="chrome__center">{isHub ? '3D Hub' : `${ep?.number} — ${ep?.short}`}</div>
      <div className="chrome__right">Scroll</div>
    </div>
  )
}

function Overlay({ activeIndex, isHub, hintVisible, isDesktop }) {
  const ep = activeIndex >= 0 ? episodes[activeIndex] : null

  return (
    <div className="overlay">
      {isDesktop ? (
        <DesktopChrome activeIndex={activeIndex} isHub={isHub} />
      ) : (
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
      )}

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
  const [isDesktop, setIsDesktop] = useState(false)
  const [ready, setReady] = useState(false)

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

  useEffect(() => {
    const mql = window.matchMedia?.('(min-width: 1024px)')
    const update = () => setIsDesktop(Boolean(mql?.matches))
    update()
    mql?.addEventListener?.('change', update)
    return () => mql?.removeEventListener?.('change', update)
  }, [])

  return (
    <div className={"app" + (isDesktop ? ' app--desktop' : '')}>
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
        onCreated={() => setReady(true)}
      >
        <JourneyTicker tRef={tRef} targetRef={targetRef} onMotion={(moving) => setIsMoving(moving)} />

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

      <LoadingScreen ready={ready} />
      <Overlay activeIndex={activeIndex} isHub={isHub} hintVisible={hintVisible} isDesktop={isDesktop} />

      <DetailPanel episode={selectedEpisode} isMoving={isMoving} onClose={() => setSelectedIndex(null)} />
    </div>
  )
}

function JourneyTicker({ tRef, targetRef }) {
  useFrame((_, delta) => {
    tRef.current = damp(tRef.current, targetRef.current, 10, delta)
  })
  return null
}
