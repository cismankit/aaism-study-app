import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import MissionOrbFallback, { type OrbDomain } from './MissionOrbFallback';

export type { OrbDomain };

interface MissionOrbHeroProps {
  readiness: number;
  domains: OrbDomain[];
  className?: string;
}

const DOMAIN_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

export default function MissionOrbHero({ readiness, domains, className = '' }: MissionOrbHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !containerRef.current || domains.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = Math.min(280, Math.max(220, container.clientWidth * 0.55));

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0f14, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambient);
    const keyLight = new THREE.DirectionalLight(0x10b981, 1.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x06b6d4, 0.8, 20);
    rimLight.position.set(-3, 1, -2);
    scene.add(rimLight);

    const coreGeo = new THREE.IcosahedronGeometry(0.55, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x064e3b,
      emissiveIntensity: 0.6 + readiness / 200,
      metalness: 0.4,
      roughness: 0.25,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.08 }),
    );
    scene.add(coreGlow);

    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.06, wireframe: true });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.01, 8, 80), ringMat);
    ring1.rotation.x = Math.PI / 2.3;
    orbitGroup.add(ring1);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.01, 8, 64), ringMat.clone());
    (ring2.material as THREE.MeshBasicMaterial).opacity = 0.04;
    ring2.rotation.x = Math.PI / 1.8;
    ring2.rotation.z = 0.4;
    orbitGroup.add(ring2);

    interface DomainNode {
      mesh: THREE.Mesh;
      orbitRadius: number;
      orbitTilt: number;
      phase: number;
      speed: number;
      isFocus: boolean;
    }

    const nodes: DomainNode[] = domains.map((d, i) => {
      const color = new THREE.Color(DOMAIN_COLORS[i % DOMAIN_COLORS.length]);
      const size = d.isFocus ? 0.22 : 0.14;
      const geo = new THREE.SphereGeometry(size, 16, 16);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: d.isFocus ? 0.55 : 0.2,
        metalness: 0.3,
        roughness: 0.4,
      });
      const mesh = new THREE.Mesh(geo, mat);
      orbitGroup.add(mesh);

      if (d.isFocus) {
        const halo = new THREE.Mesh(
          new THREE.RingGeometry(size + 0.08, size + 0.14, 32),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
        );
        mesh.add(halo);
      }

      return {
        mesh,
        orbitRadius: d.isFocus ? 1.85 : 2.4,
        orbitTilt: (i / domains.length) * Math.PI * 0.5,
        phase: (i / domains.length) * Math.PI * 2,
        speed: d.isFocus ? 0.35 : 0.18 + (i % 3) * 0.06,
        isFocus: Boolean(d.isFocus),
      };
    });

    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    const particlePhases = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      particlePhases[i] = Math.random();
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x06b6d4,
      size: 0.04,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const focusNode = nodes.find(n => n.isFocus) ?? nodes[0];
    let frameId = 0;
    let elapsed = 0;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      elapsed += 0.016;

      core.rotation.y += 0.004;
      core.rotation.x = Math.sin(elapsed * 0.3) * 0.08;
      coreGlow.scale.setScalar(1 + Math.sin(elapsed * 1.2) * 0.06);
      orbitGroup.rotation.y += 0.002;

      nodes.forEach(n => {
        const t = elapsed * n.speed + n.phase;
        const x = Math.cos(t) * n.orbitRadius;
        const z = Math.sin(t) * n.orbitRadius * Math.cos(n.orbitTilt);
        const y = Math.sin(t) * n.orbitRadius * Math.sin(n.orbitTilt) * 0.45;
        n.mesh.position.set(x, y, z);
      });

      const posAttr = particleGeo.getAttribute('position') as THREE.BufferAttribute;
      const focusPos = focusNode.mesh.position;
      for (let i = 0; i < particleCount; i++) {
        const p = (particlePhases[i] + elapsed * 0.25) % 1;
        const angle = p * Math.PI * 2;
        const r = 1.85 + Math.sin(angle * 3) * 0.15;
        const px = Math.cos(angle) * r * (1 - p * 0.3) + focusPos.x * p * 0.5;
        const py = Math.sin(angle * 2) * 0.3 * (1 - p) + focusPos.y * p;
        const pz = Math.sin(angle) * r * (1 - p * 0.3) + focusPos.z * p * 0.5;
        posAttr.setXYZ(i, px, py, pz);
      }
      posAttr.needsUpdate = true;

      camera.position.x = Math.sin(elapsed * 0.12) * 0.4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = Math.min(280, Math.max(220, w * 0.55));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [reducedMotion, domains, readiness]);

  if (reducedMotion || domains.length === 0) {
    return <MissionOrbFallback readiness={readiness} domains={domains} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full min-h-[220px] max-h-[280px] rounded-2xl overflow-hidden border border-emerald-500/15 bg-gradient-to-br from-slate-950/80 via-emerald-950/20 to-slate-900/80 ${className}`}
      aria-hidden
    />
  );
}
