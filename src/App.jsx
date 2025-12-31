import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

const CONSTANTS = {
  'Golden Ratio φ': (1 + Math.sqrt(5)) / 2,
  'Pi π': Math.PI,
  'Euler e': Math.E,
  'Tau τ': 2 * Math.PI,
  'Silver Ratio √2': Math.sqrt(2),
  'Root 3 √3': Math.sqrt(3),
  'Root 5 √5': Math.sqrt(5),
  'Feigenbaum δ': 4.669201609,
  'Plastic ρ': 1.32471795724,
  'Catalan G': 0.915965594,
  'π/φ': Math.PI / ((1 + Math.sqrt(5)) / 2),
  'e^(π/4)': Math.exp(Math.PI / 4)
}

const ChromaticVortex = ({ count = 45000 }) => {
  const mountRef = useRef(null)
  const animationRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const geometryRef = useRef(null)
  const materialRef = useRef(null)
  const pointsRef = useRef(null)
  const resizeObserverRef = useRef(null)
  const timeoutsRef = useRef([])

  const [selectedConstant, setSelectedConstant] = useState('Golden Ratio φ')
  const [rotationSpeed, setRotationSpeed] = useState(1.0)
  const [breatheSpeed, setBreatheSpeed] = useState(1.0)
  const [spiralTightness, setSpiralTightness] = useState(1.0)
  const [colorShift, setColorShift] = useState(1.0)
  const [particleOpacity, setParticleOpacity] = useState(0.65)
  const [activeControl, setActiveControl] = useState(null)

  useEffect(() => {
    console.log('🎨 Vortex useEffect starting...');
    if (!mountRef.current) {
      console.error('❌ mountRef.current is null!');
      return;
    }

    const container = mountRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    console.log('📐 Container dimensions:', width, 'x', height);

    const scene = new THREE.Scene()
    sceneRef.current = scene
    console.log('✅ Scene created');

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: true
    })
    console.log('✅ WebGL Renderer created:', renderer);
    rendererRef.current = renderer
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    console.log('✅ Renderer configured with size:', width, 'x', height);
    container.appendChild(renderer.domElement)
    console.log('✅ Canvas appended to DOM');

    camera.position.z = 5
    camera.lookAt(0, 0, 0)
    console.log('✅ Camera positioned at z=5, looking at origin');
    scene.background = new THREE.Color('#0A0A12')

    const PHI = CONSTANTS[selectedConstant]
    const PHI_INV = 1.0 / PHI
    const PHI_SQUARED = PHI * PHI

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: particleOpacity },
        phi: { value: PHI },
        phiInv: { value: PHI_INV },
        phiSquared: { value: PHI_SQUARED },
        rotationSpeed: { value: rotationSpeed },
        breatheSpeed: { value: breatheSpeed },
        spiralTightness: { value: spiralTightness },
        colorShift: { value: colorShift }
      },
      vertexShader: `
        uniform float time;
        uniform float phi;
        uniform float phiInv;
        uniform float phiSquared;
        uniform float rotationSpeed;
        uniform float breatheSpeed;
        uniform float spiralTightness;
        attribute float size;
        attribute vec3 customColor;
        attribute float goldenIndex;
        attribute float chromaticPhase;
        varying vec3 vColor;
        varying float vIntensity;

        void main() {
          vColor = customColor;
          vec3 pos = position;
          
          float radius = length(pos.xz);
          float angle = atan(pos.z, pos.x);
          float height = pos.y;
          
          float primaryRotation = time * 0.15 * phi * rotationSpeed;
          float secondaryRotation = time * 0.12 * phiInv * rotationSpeed;
          float chromaticRotation = time * 0.08 * (phi - 1.0) * rotationSpeed;
          
          float vortexDepth = sin(chromaticPhase * phi + time * 0.3 * breatheSpeed) * 0.2;
          float goldenRadius = radius * (1.0 + vortexDepth + sin(goldenIndex * phiSquared) * 0.15);
          
          float innerBound = 0.25 * phiInv * (1.0 + sin(time * 0.2 * breatheSpeed) * 0.1);
          float outerBound = 0.85 * phi * 0.6 * (1.0 + cos(time * 0.15 * breatheSpeed) * 0.08);
          float vessel = smoothstep(innerBound, outerBound, radius) * 
                        smoothstep(1.2, outerBound, radius);
          
          float mainSpiral = angle + primaryRotation + goldenIndex * phiInv * 8.0 * spiralTightness;
          float chromaSpiral = angle + secondaryRotation + chromaticPhase * phi * 12.0 * spiralTightness;
          float counterSpiral = angle - chromaticRotation + goldenIndex * phi * 4.0 * spiralTightness;
          
          float chromaticWave1 = sin(time * 0.4 * phiInv * breatheSpeed + radius * phi * 4.0) * 0.12;
          float chromaticWave2 = cos(time * 0.25 * phi * breatheSpeed + chromaticPhase * 8.0) * 0.08;
          float newRadius = (goldenRadius + chromaticWave1 + chromaticWave2) * vessel;
          
          float spiralBlend = sin(chromaticPhase * phi + time * 0.2 * rotationSpeed) * 0.5 + 0.5;
          float finalAngle = mix(mainSpiral, chromaSpiral, spiralBlend) + 
                            sin(counterSpiral) * 0.1;
          
          vec3 newPos;
          newPos.x = cos(finalAngle) * newRadius * phi;
          newPos.z = sin(finalAngle) * newRadius * phi;
          
          float goldenHeight = height * vessel * phi - 1.0;
          goldenHeight += sin(goldenIndex * phiSquared + primaryRotation) * 0.2;
          goldenHeight += cos(chromaticPhase * phi + secondaryRotation) * 0.15;
          goldenHeight += sin(finalAngle * 0.5 + time * 0.1 * breatheSpeed) * 0.1;
          
          newPos.y = goldenHeight;
          
          float chromaticScale = 2.5 / phiInv * (1.0 + sin(time * 0.18 * breatheSpeed + chromaticPhase) * 0.06);
          newPos *= chromaticScale;
          
          float globalBreathe = 1.0 + sin(time * 0.12 * phiInv * breatheSpeed) * 0.08 + 
                               cos(time * 0.08 * phi * breatheSpeed) * 0.05;
          newPos *= globalBreathe;
          
          vIntensity = vessel * (1.0 + sin(chromaticPhase * phi) * 0.3);
          
          vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
          gl_PointSize = size * (140.0 / -mvPosition.z) * (1.0 + vIntensity * 0.2);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying vec3 vColor;
        varying float vIntensity;

        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = dot(center, center);
          if (dist > 0.25) discard;
          
          float glow = 1.0 - smoothstep(0.0, 0.25, dist);
          float coreGlow = 1.0 - smoothstep(0.0, 0.1, dist);
          
          vec3 enhancedColor = vColor * (1.0 + vIntensity * 0.4);
          enhancedColor += vColor * coreGlow * 0.3;
          
          float alpha = glow * opacity * (0.7 + vIntensity * 0.5);
          gl_FragColor = vec4(enhancedColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexColors: true
    })
    materialRef.current = particleMaterial
    console.log('✅ Shader material created');
    
    // Check for shader errors
    if (particleMaterial.error) {
      console.error('❌ Shader compilation error:', particleMaterial.error);
    }

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const goldenIndices = new Float32Array(count)
    const chromaticPhases = new Float32Array(count)

    const hsvToRgb = (h, s, v) => {
      const c = v * s
      const x = c * (1 - Math.abs(((h * 6) % 2) - 1))
      const m = v - c
      let r, g, b
      
      if (h < 1/6) { r = c; g = x; b = 0 }
      else if (h < 2/6) { r = x; g = c; b = 0 }
      else if (h < 3/6) { r = 0; g = c; b = x }
      else if (h < 4/6) { r = 0; g = x; b = c }
      else if (h < 5/6) { r = x; g = 0; b = c }
      else { r = c; g = 0; b = x }
      
      return [(r + m), (g + m), (b + m)]
    }

    let i3 = 0
    for (let i = 0; i < count; i++) {
      const t = i / count
      
      const goldenT = (t * PHI * 1.5) % 1.0
      const chromaticT = (t * PHI_SQUARED * 0.8) % 1.0
      const radius = Math.pow(goldenT, 0.6) * PHI_INV * 1.1
      
      const goldenAngle = i * 2.0 * Math.PI * PHI_INV
      const chromaticOffset = chromaticT * Math.PI * 0.3
      
      const baseHeight = Math.sin(goldenT * Math.PI) * 2.0
      const chromaticHeight = Math.cos(chromaticT * Math.PI * 2) * 0.3
      const vesselHeight = baseHeight + chromaticHeight
      
      const randRadius = radius + (Math.random() - 0.5) * 0.04 * PHI_INV
      const randAngle = goldenAngle + chromaticOffset + (Math.random() - 0.5) * 0.08 * PHI_INV

      positions[i3] = Math.cos(randAngle) * randRadius
      positions[i3 + 1] = vesselHeight
      positions[i3 + 2] = Math.sin(randAngle) * randRadius

      const primaryHue = (goldenT * PHI * 3.2 * colorShift) % 1.0
      const radiusHue = (radius * PHI * 2.8 * colorShift) % 1.0
      const heightHue = ((vesselHeight + 2.0) / 4.0 * PHI_INV * 1.5 * colorShift) % 1.0
      const chromaticHue = (chromaticT * PHI_SQUARED * 2.0 * colorShift) % 1.0
      
      const finalHue = (primaryHue * PHI_INV + 
                       radiusHue * PHI_INV * 0.7 + 
                       heightHue * 0.4 + 
                       chromaticHue * 0.3) % 1.0
      
      const saturation = 0.8 + Math.sin(goldenT * PHI * Math.PI * 3) * 0.15 + 
                        Math.cos(chromaticT * PHI_SQUARED * Math.PI * 2) * 0.1
      const value = 0.6 + Math.sqrt(radius) * 0.35 + goldenT * 0.25 + 
                   chromaticT * 0.15 + Math.random() * 0.08
      
      const [r, g, b] = hsvToRgb(finalHue, Math.min(saturation, 1.0), Math.min(value, 1.0))
      
      colors[i3] = r
      colors[i3 + 1] = g
      colors[i3 + 2] = b

      sizes[i] = (1.0 - Math.abs(vesselHeight * 0.4)) * 0.25 * PHI_INV + 0.12 + 
                 goldenT * 0.06 + chromaticT * 0.04

      goldenIndices[i] = goldenT
      chromaticPhases[i] = chromaticT

      i3 += 3
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('goldenIndex', new THREE.BufferAttribute(goldenIndices, 1))
    geometry.setAttribute('chromaticPhase', new THREE.BufferAttribute(chromaticPhases, 1))
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    geometryRef.current = geometry
    console.log('✅ Geometry created with', count, 'particles');

    const points = new THREE.Points(geometry, particleMaterial)
    pointsRef.current = points
    scene.add(points)
    console.log('✅ Points added to scene');

    const clock = new THREE.Clock()
    let lastTime = 0
    const targetFPS = 60
    const targetInterval = 1000 / targetFPS
    let frameCount = 0;

    const animate = (currentTime) => {
      animationRef.current = requestAnimationFrame(animate)

      const deltaTime = currentTime - lastTime
      if (deltaTime < targetInterval) return
      lastTime = currentTime - (deltaTime % targetInterval)

      const time = clock.getElapsedTime()
      particleMaterial.uniforms.time.value = time

      renderer.render(scene, camera)
      
      // Log first 3 frames to confirm animation is running
      frameCount++;
      if (frameCount <= 3) {
        console.log(`🎬 Frame ${frameCount} rendered at time ${time.toFixed(2)}s`);
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    console.log('✅ Animation loop started');

    let resizeTimeout = null
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!mountRef.current) return
        const container = mountRef.current
        const width = container.clientWidth
        const height = container.clientHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }, 100)
    }

    window.addEventListener('resize', handleResize, { passive: true })

    let observerTimeout = null
    const resizeObserverCallback = () => {
      if (observerTimeout) clearTimeout(observerTimeout)
      observerTimeout = setTimeout(handleResize, 100)
    }

    const resizeObserver = new ResizeObserver(resizeObserverCallback)
    resizeObserverRef.current = resizeObserver
    if (mountRef.current) {
      resizeObserver.observe(mountRef.current)
    }

    timeoutsRef.current.push(() => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      if (observerTimeout) clearTimeout(observerTimeout)
    })

    return () => {
      timeoutsRef.current.forEach(clearFn => clearFn())
      timeoutsRef.current = []

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }

      window.removeEventListener('resize', handleResize)

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }

      if (sceneRef.current && pointsRef.current) {
        sceneRef.current.remove(pointsRef.current)
      }

      if (geometryRef.current) {
        geometryRef.current.dispose()
        geometryRef.current = null
      }

      if (materialRef.current) {
        materialRef.current.dispose()
        materialRef.current = null
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (mountRef.current && rendererRef.current.domElement) {
          mountRef.current.removeChild(rendererRef.current.domElement)
        }
        rendererRef.current.forceContextLoss()
        rendererRef.current = null
      }

      sceneRef.current = null
      cameraRef.current = null
      pointsRef.current = null
    }
  }, [count, selectedConstant]) // Only rebuild when count or math constant changes

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.rotationSpeed.value = rotationSpeed
      materialRef.current.uniforms.breatheSpeed.value = breatheSpeed
      materialRef.current.uniforms.spiralTightness.value = spiralTightness
      materialRef.current.uniforms.colorShift.value = colorShift
      materialRef.current.uniforms.opacity.value = particleOpacity
    }
  }, [rotationSpeed, breatheSpeed, spiralTightness, colorShift, particleOpacity])

  const iconBarStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '15px',
    background: 'rgba(10, 10, 18, 0.9)',
    padding: '15px 25px',
    borderRadius: '50px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.2)',
    zIndex: 1000
  }

  const iconStyle = {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'rgba(255, 215, 0, 0.1)',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    color: '#FFD700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '20px',
    transition: 'all 0.3s ease'
  }

  const popupStyle = {
    position: 'absolute',
    bottom: '90px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(10, 10, 18, 0.95)',
    padding: '20px',
    borderRadius: '12px',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    minWidth: '300px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 215, 0, 0.3)',
    zIndex: 999,
    display: activeControl ? 'block' : 'none'
  }

  const sliderStyle = {
    width: '100%',
    marginTop: '10px',
    accentColor: '#FFD700'
  }

  const selectStyle = {
    width: '100%',
    padding: '8px',
    marginTop: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    fontSize: '14px'
  }

  const renderControl = () => {
    switch(activeControl) {
      case 'constant':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700', marginBottom: '10px'}}>
              Mathematical Constant
            </div>
            <select 
              style={selectStyle}
              value={selectedConstant}
              onChange={(e) => setSelectedConstant(e.target.value)}
            >
              {Object.keys(CONSTANTS).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </>
        )
      case 'rotation':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700'}}>
              Rotation Speed: {rotationSpeed.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </>
        )
      case 'breathe':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700'}}>
              Breathe Speed: {breatheSpeed.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={breatheSpeed}
              onChange={(e) => setBreatheSpeed(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </>
        )
      case 'spiral':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700'}}>
              Spiral Tightness: {spiralTightness.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={spiralTightness}
              onChange={(e) => setSpiralTightness(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </>
        )
      case 'color':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700'}}>
              Color Shift: {colorShift.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={colorShift}
              onChange={(e) => setColorShift(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </>
        )
      case 'opacity':
        return (
          <>
            <div style={{fontWeight: '600', color: '#FFD700'}}>
              Particle Opacity: {(particleOpacity * 100).toFixed(0)}%
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={particleOpacity}
              onChange={(e) => setParticleOpacity(parseFloat(e.target.value))}
              style={sliderStyle}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0A0A12' }}>
      <div 
        ref={mountRef} 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%', 
          height: '100%',
          zIndex: 1
        }} 
      />
      
      <div style={popupStyle}>
        {renderControl()}
      </div>

      <div style={iconBarStyle}>
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'constant' ? null : 'constant')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Mathematical Constant"
        >
          φ
        </button>
        
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'rotation' ? null : 'rotation')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Rotation Speed"
        >
          ↻
        </button>
        
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'breathe' ? null : 'breathe')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Breathe Speed"
        >
          ∿
        </button>
        
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'spiral' ? null : 'spiral')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Spiral Tightness"
        >
          🌀
        </button>
        
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'color' ? null : 'color')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Color Shift"
        >
          🎨
        </button>
        
        <button
          style={iconStyle}
          onClick={() => setActiveControl(activeControl === 'opacity' ? null : 'opacity')}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="Particle Opacity"
        >
          ◐
        </button>
      </div>
    </div>
  )
}

export default ChromaticVortex
