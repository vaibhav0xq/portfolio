import { Canvas, useFrame, useThree, type RootState } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { hero, type HeroPrint } from '@/content/site';
import { PRINT_ANCHOR_ID } from '@/components/Hero';
import { gsap, reducedMotion } from '@/lib/motion';
import { FACE_RATIO, loadPrintFonts, paintCaption, paintFace } from './faces';

/*
 * The hero prints are real paper in WebGL: thin boxes with a page drawn on the front, tape on the
 * corners and a light that throws their shadows onto the page. The canvas covers the viewport and
 * one world unit is one CSS pixel at z = 0. The prints follow a DOM anchor so they scroll with the
 * sheet and reflow with it.
 */

type Layout = { x: number; y: number; w: number; rot: number; z: number; tape: 'corners' | 'top' };

const layouts: Layout[] = [
  { x: -0.06, y: 0.13, w: 0.6, rot: -3.5, z: 2, tape: 'corners' },
  { x: 0.52, y: 0, w: 0.5, rot: 4, z: 1, tape: 'top' },
  { x: 0.52, y: 0.6, w: 0.46, rot: -2, z: 3, tape: 'top' },
];

const PAD = 10;
const FOOT = 42;
const THICK = 3;
const LAYER = 14;

type PrintData = { texture: THREE.CanvasTexture; pw: number; ph: number };

/** Draws the whole print: white border, the page, a pen caption and a typed date. */
function paintPrint(item: HeroPrint, pw: number): PrintData {
  const iw = pw - PAD * 2;
  const ih = Math.round(iw * FACE_RATIO[item.kind]);
  const ph = ih + PAD + FOOT;
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = pw * scale;
  canvas.height = ph * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#fffdf8';
  ctx.fillRect(0, 0, pw, ph);
  ctx.save();
  ctx.translate(PAD, PAD);
  ctx.beginPath();
  ctx.rect(0, 0, iw, ih);
  ctx.clip();
  paintFace(ctx, item, iw, ih);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD + 0.5, PAD + 0.5, iw - 1, ih - 1);
  paintCaption(ctx, item.caption, item.date, PAD + 2, pw - PAD - 2, ph - 15);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return { texture, pw, ph };
}

/** Perspective camera placed so one world unit equals one CSS pixel on the z = 0 plane. */
function PixelCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = 26;
    cam.near = 10;
    cam.far = 10000;
    cam.aspect = size.width / size.height;
    cam.position.set(0, 0, size.height / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

type SceneProps = { anchor: HTMLElement; revealed: boolean; onReady: () => void };

function PrintsScene({ anchor, revealed, onReady }: SceneProps) {
  const { size, camera } = useThree();
  const [fontsReady, setFontsReady] = useState(false);
  const [data, setData] = useState<PrintData[] | null>(null);
  const current = useRef<PrintData[] | null>(null);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const groups = useRef<(THREE.Group | null)[]>([]);
  const enter = useRef(layouts.map(() => 0));
  const pointer = useRef(new THREE.Vector2(0, 0));
  const hasPointer = useRef(false);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const hitList = useRef<THREE.Mesh[]>([]);
  const hovered = useRef<number>(-1);
  const smooth = useRef(layouts.map(() => ({ lift: 0, rx: 0, ry: 0, s: 1 })));
  const anchorWidth = useRef(0);
  const announced = useRef(false);

  // The pages are text, so the pen and typewriter fonts must be in before the first paint.
  useEffect(() => {
    let alive = true;
    loadPrintFonts().then(() => {
      if (alive) setFontsReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Textures are painted at the size the anchor gives them and repainted when the layout changes.
  // The previous set is disposed outside React state so the GPU never keeps orphans.
  useEffect(() => {
    if (!fontsReady) return;
    let frame = 0;
    const paint = () => {
      const width = anchor.getBoundingClientRect().width;
      if (!width || Math.abs(width - anchorWidth.current) < 2) return;
      anchorWidth.current = width;
      const next = hero.prints.map((item, i) => paintPrint(item, Math.round(layouts[i].w * width)));
      current.current?.forEach((d) => d.texture.dispose());
      current.current = next;
      setData(next);
    };
    paint();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    });
    ro.observe(anchor);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [fontsReady, anchor]);

  useEffect(
    () => () => {
      current.current?.forEach((d) => d.texture.dispose());
      current.current = null;
    },
    [],
  );

  // Tell the page the 3D prints can take over from the DOM ones.
  useEffect(() => {
    if (!data || announced.current) return;
    announced.current = true;
    onReady();
  }, [data, onReady]);

  // Hover only means something with a real pointer. Touch screens skip the raycast entirely.
  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const move = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      hasPointer.current = true;
    };
    const leave = () => {
      hasPointer.current = false;
    };
    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerleave', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerleave', leave);
    };
  }, []);

  // Drop in from above the page once the preloader has lifted.
  useEffect(() => {
    if (!revealed || !data) return;
    if (reducedMotion()) {
      enter.current.fill(1);
      return;
    }
    const tween = gsap.to(enter.current, { endArray: layouts.map(() => 1), duration: 1.5, ease: 'power3.out', stagger: 0.16, delay: 0.25 });
    return () => {
      tween.kill();
    };
  }, [revealed, data]);

  useFrame((_, dt) => {
    if (!data) return;
    const rect = anchor.getBoundingClientRect();

    // Hover test against the print faces.
    let hit = -1;
    let lx = 0;
    let ly = 0;
    if (hasPointer.current) {
      raycaster.setFromCamera(pointer.current, camera);
      const list = hitList.current;
      list.length = 0;
      meshes.current.forEach((m) => {
        if (m) list.push(m);
      });
      const inter = raycaster.intersectObjects(list, false);
      if (inter.length) {
        hit = meshes.current.indexOf(inter[0].object as THREE.Mesh);
        const p = inter[0].object.worldToLocal(hitPoint.copy(inter[0].point));
        lx = THREE.MathUtils.clamp(p.x * 2, -1, 1);
        ly = THREE.MathUtils.clamp(p.y * 2, -1, 1);
      }
    }
    hovered.current = hit;

    const scroll = window.scrollY;
    const px = hasPointer.current ? pointer.current.x : 0;
    const py = hasPointer.current ? pointer.current.y : 0;

    layouts.forEach((l, i) => {
      const g = groups.current[i];
      const m = meshes.current[i];
      const d = data[i];
      if (!g || !m) return;
      const e = enter.current[i];
      const ease = 1 - e;

      const cx = rect.left + (l.x + l.w / 2) * rect.width - size.width / 2;
      const cy = size.height / 2 - (rect.top + l.y * rect.height + d.ph / 2) + scroll * 0.045 * (i - 1);

      const s = smooth.current[i];
      const isHot = hit === i;
      const k = 1 - Math.exp(-dt * 7);
      s.lift += ((isHot ? 34 : 0) - s.lift) * k;
      s.s += ((isHot ? 1.03 : 1) - s.s) * k;
      s.rx += ((isHot ? -ly * 0.16 : -py * 0.035) - s.rx) * k;
      s.ry += ((isHot ? lx * 0.16 : px * 0.035) - s.ry) * k;

      g.position.set(cx, cy + ease * 90, l.z * LAYER + s.lift + ease * 620);
      g.rotation.set(s.rx + ease * -0.35, s.ry + ease * 0.2, THREE.MathUtils.degToRad(l.rot) + ease * 0.3);
      m.scale.set(d.pw * s.s, d.ph * s.s, THICK);
    });
  });

  const paperWhite = '#fffdf8';

  return (
    <>
      <PixelCamera />
      <ambientLight intensity={1.25} />
      <directionalLight
        position={[-520, 760, 1150]}
        intensity={2.35}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-1700}
        shadow-camera-right={1700}
        shadow-camera-top={1300}
        shadow-camera-bottom={-1300}
        shadow-camera-near={10}
        shadow-camera-far={5000}
        shadow-normalBias={3}
        shadow-radius={6}
      />
      <mesh receiveShadow position-z={-4}>
        <planeGeometry args={[9000, 9000]} />
        <shadowMaterial transparent opacity={0.17} color="#4a3416" />
      </mesh>

      {data?.map((d, i) => (
        <group key={hero.prints[i].key} ref={(el) => {
            groups.current[i] = el;
          }} position={[0, 0, -3000]}>
          <mesh ref={(el) => {
              meshes.current[i] = el;
            }} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial attach="material-0" color={paperWhite} roughness={1} />
            <meshStandardMaterial attach="material-1" color={paperWhite} roughness={1} />
            <meshStandardMaterial attach="material-2" color={paperWhite} roughness={1} />
            <meshStandardMaterial attach="material-3" color={paperWhite} roughness={1} />
            <meshStandardMaterial attach="material-4" map={d.texture} roughness={0.95} />
            <meshStandardMaterial attach="material-5" color="#efe9dc" roughness={1} />
          </mesh>
          {layouts[i].tape === 'corners' ? (
            <>
              <Tape x={-d.pw / 2 + 18} y={d.ph / 2 + 3} rot={-40} />
              <Tape x={d.pw / 2 - 18} y={d.ph / 2 + 3} rot={40} />
            </>
          ) : (
            <Tape x={0} y={d.ph / 2 + 1} rot={-2} />
          )}
        </group>
      ))}
    </>
  );
}

function Tape({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <mesh position={[x, y, THICK / 2 + 1.2]} rotation-z={THREE.MathUtils.degToRad(rot)} renderOrder={2}>
      <planeGeometry args={[96, 26]} />
      <meshBasicMaterial color="#ffe28c" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  );
}

type LayerProps = { revealed: boolean; onReady: () => void; onFail: () => void };

export function PrintsLayer({ revealed, onReady, onFail }: LayerProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  // Off screen the canvas stops rendering altogether. CSS visibility alone would keep the GPU busy.
  const [live, setLive] = useState(true);
  const r3f = useRef<RootState | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => {
      setEnabled(mq.matches);
      setAnchor(mq.matches ? document.getElementById(PRINT_ANCHOR_ID) : null);
    };
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!anchor) return;
    const io = new IntersectionObserver(([entry]) => setLive(entry.isIntersecting), { rootMargin: '150px 0px' });
    io.observe(anchor);
    return () => io.disconnect();
  }, [anchor]);

  // Switching the frameloop back on does not start a frame by itself.
  useEffect(() => {
    if (live) r3f.current?.invalidate();
  }, [live]);

  if (!enabled || !anchor) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[5]" style={{ visibility: live ? 'visible' : 'hidden' }} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={live ? 'always' : 'never'}
        shadows={{ type: THREE.PCFShadowMap }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping, powerPreference: 'high-performance' }}
        camera={{ fov: 26, near: 10, far: 10000 }}
        // R3F sets pointer-events: auto on its wrapper, which would let this full screen layer
        // swallow every click on the hero. Hover is tracked on window, so the canvas needs none.
        style={{ background: 'transparent', pointerEvents: 'none' }}
        onCreated={(state) => {
          r3f.current = state;
          state.gl.domElement.addEventListener('webglcontextlost', () => onFail(), { once: true });
        }}
      >
        <PrintsScene anchor={anchor} revealed={revealed} onReady={onReady} />
      </Canvas>
    </div>
  );
}
