/* =========================================================
   PARTICULATE → SOLID · M5 CS  —  engine v4
   Renders the REAL textured GLB (assets/m5.glb) as a solid car
   in a dark studio with aggressive M-accent rim light + bloom.
   Scroll drives a true mechanical EXPLODED VIEW: every mesh
   separates outward along its own centroid vector, holds as an
   anatomy, then reassembles. Drag / auto-orbit. Bold & dark.
   ========================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const mq = q => window.matchMedia(q).matches;
const reduce      = mq('(prefers-reduced-motion: reduce)');
const coarse      = mq('(pointer: coarse)');
const smallScreen = mq('(max-width: 760px)');
const lowCores    = (navigator.hardwareConcurrency || 8) <= 4;
const LOW = smallScreen || coarse || lowCores;

const $ = s => document.querySelector(s);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

const SRC_GLB = 'assets/m5.glb';
const WORLD = 100;
const canvas = $('#gl');
const loadBar = $('#loadBar'), loadPct = $('#loadPct'), loadMsg = $('#loadMsg'), loaderEl = $('#loader');
const setMsg = m => loadMsg && (loadMsg.textContent = m);

function webglOK(){ try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch(e){ return false; } }

let renderer, scene, camera, composer, rig, fitZ = 220, baseR = 80;
let parts = [];                 // {mesh, dir} for the exploded view

function fitCamera(R){
  const aspect = innerWidth / innerHeight;
  const fov = 36, vFov = THREE.MathUtils.degToRad(fov);
  const distV = R / Math.tan(vFov/2);
  const distH = R / (Math.tan(vFov/2) * aspect);
  camera.fov = fov; camera.aspect = aspect;
  fitZ = Math.max(distV, distH) / 1.32;          // closer = bigger car in frame
  camera.updateProjectionMatrix();
}

function buildScene(gltf){
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !LOW, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(LOW ? 1.5 : 2, window.devicePixelRatio || 1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x0a0c11, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.4;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0c11, 0.0010);
  camera = new THREE.PerspectiveCamera(36, innerWidth/innerHeight, 0.5, 8000);

  // studio reflections (procedural — no asset)
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  // aggressive M-accent lighting — brighter so the car + parts read clearly
  scene.add(new THREE.HemisphereLight(0xaecbff, 0x101216, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 3.6); key.position.set(60, 90, 70); scene.add(key);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 1.6); fill.position.set(-30, 30, 150); scene.add(fill);   // front fill reveals dark body
  const rimRed = new THREE.SpotLight(0xff2a1c, 1500, 0, Math.PI/4, 0.6, 1.4); rimRed.position.set(-110, 40, -60); scene.add(rimRed);
  const rimBlue = new THREE.SpotLight(0x2a6cff, 1200, 0, Math.PI/4, 0.6, 1.4); rimBlue.position.set(120, 20, -80); scene.add(rimBlue);
  const under = new THREE.PointLight(0xffffff, 200, 700); under.position.set(0, -40, 60); scene.add(under);

  // ---- flatten meshes into an explode rig, bake world transforms ----
  gltf.scene.updateWorldMatrix(true, true);
  const meshes = []; gltf.scene.traverse(o => { if (o.isMesh && o.geometry) meshes.push(o); });
  const explode = new THREE.Group();
  const tmpBox = new THREE.Box3(), tmpC = new THREE.Vector3();
  const raw = [];
  meshes.forEach(mesh => {
    const geo = mesh.geometry.clone(); geo.applyMatrix4(mesh.matrixWorld);
    (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(mm => { if (mm) mm.envMapIntensity = 1.6; });   // brighter reflections
    const m = new THREE.Mesh(geo, mesh.material);
    m.castShadow = m.receiveShadow = false;
    explode.add(m);
    geo.computeBoundingBox(); geo.boundingBox.getCenter(tmpC);
    raw.push({ mesh: m, centroid: tmpC.clone() });
  });

  // center + scale the whole assembly to WORLD
  tmpBox.setFromObject(explode); const center = tmpBox.getCenter(new THREE.Vector3()); const size = tmpBox.getSize(new THREE.Vector3());
  const scale = WORLD / Math.max(size.x, size.y, size.z);
  explode.position.copy(center).multiplyScalar(-1);            // center geometry around origin
  rig = new THREE.Group(); rig.add(explode); rig.scale.setScalar(scale); scene.add(rig);

  // explode dirs (in centered space): outward from model centre, exaggerated on Y for a "lift"
  raw.forEach(r => {
    const d = r.centroid.clone().sub(center);
    d.y *= 1.6; d.multiplyScalar(1.7);          // bolder, more aggressive spread
    parts.push({ mesh: r.mesh, base: r.mesh.position.clone(), dir: d });
  });
  baseR = (Math.max(size.x, size.y, size.z) * scale) * 0.62;

  fitCamera(baseR);
  camera.position.set(baseR*0.18, baseR*0.36, fitZ);          // low, dramatic 3/4
  camera.lookAt(0, 0, 0);

  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  if (!LOW) composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.6, 0.85));
  composer.addPass(new OutputPass());

  ptag && (ptag.textContent = meshes.length + ' PARTS');
  addEventListener('resize', onResize, { passive: true });
  setupPointer();
  pmrem.dispose();
}

function onResize(){
  if (!renderer) return;
  renderer.setSize(innerWidth, innerHeight);
  composer && composer.setSize(innerWidth, innerHeight);
  fitCamera(baseR);
  measure();
}

/* ---------- orbit (drag + auto + inertia) ---------- */
let yaw = -0.6, pitch = 0.12, velY = 0, dragging = false, lastX = 0, lastY = 0;
function setupPointer(){
  if (coarse){
    addEventListener('touchstart', e => { dragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }, { passive: true });
    addEventListener('touchmove', e => { if (!dragging) return; const t = e.touches[0]; yaw += (t.clientX-lastX)*0.006; pitch = clamp(pitch + (t.clientY-lastY)*0.004, -0.5, 0.8); lastX=t.clientX; lastY=t.clientY; }, { passive: true });
    addEventListener('touchend', () => dragging = false, { passive: true });
    return;
  }
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture?.(e.pointerId); });
  addEventListener('pointermove', e => { if (!dragging) return; velY = (e.clientX-lastX)*0.006; yaw += velY; pitch = clamp(pitch + (e.clientY-lastY)*0.004, -0.5, 0.85); lastX=e.clientX; lastY=e.clientY; });
  addEventListener('pointerup', () => dragging = false);
}

/* ---------- scroll ---------- */
let progress = 0, lenis = null;
const scrollEl = $('#scroll');
function measure(){ fieldRange = Math.max(1, (scrollEl ? scrollEl.offsetHeight : innerHeight*7) - innerHeight); }
let fieldRange = 1;
function onScroll(){ progress = clamp((window.scrollY || document.documentElement.scrollTop) / fieldRange); }

/* ---------- chapters / HUD ---------- */
const chaps = [...document.querySelectorAll('.chap')];
const phaseTag = $('#phaseTag'), railFill = $('#railFill'), hint = $('#hint'), ptag = $('#ptag');
const PHASES = [[0,'THE CAR'],[0.15,'SUBTRACTION'],[0.30,'EXPLODE'],[0.46,'ANATOMY'],[0.66,'REASSEMBLY'],[0.84,'M5 · CS']];
function updateChapters(p){
  chaps.forEach(c => {
    const a = parseFloat(c.dataset.in), b = parseFloat(c.dataset.out);
    const o = clamp(Math.min(a<=0?1:(p-a)/0.05, b>=1?1:(b-p)/0.05));
    c.style.opacity = o; c.style.transform = 'translateY(' + ((1-o)*22) + 'px)';
  });
  if (railFill) railFill.style.width = (p*100).toFixed(1) + '%';
  if (hint) hint.classList.toggle('gone', p > 0.03);
  let ph = PHASES[0][1]; for (const [t,n] of PHASES) if (p >= t) ph = n;
  if (phaseTag) phaseTag.textContent = ph;
}

let counted = false;
function runCounters(){
  if (counted) return; counted = true;
  document.querySelectorAll('.sp b[data-count]').forEach(el => {
    const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), t0 = performance.now(), D = 1400;
    const step = () => { const k = clamp((performance.now()-t0)/D); const v = end*(1-Math.pow(1-k,3));
      el.textContent = dec ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US'); if (k<1) requestAnimationFrame(step); };
    if (reduce) el.textContent = dec ? end.toFixed(dec) : end.toLocaleString('en-US'); else step();
  });
}

/* ---------- state ---------- */
let tExplode = 0;
function drive(p){
  tExplode = smooth(0.28, 0.46, p) * (1 - smooth(0.66, 0.84, p));
  if (p >= 0.46) runCounters();
}

/* ---------- render ---------- */
const clock = new THREE.Clock(); let started = false, explodeCur = 0;
function frame(){
  const dt = Math.min(0.05, clock.getDelta());
  drive(progress);
  explodeCur = lerp(explodeCur, tExplode, 0.06);
  const k = explodeCur * 60;                          // explosion distance in centered units
  for (const pt of parts){ pt.mesh.position.set(pt.base.x + pt.dir.x*explodeCur, pt.base.y + pt.dir.y*explodeCur, pt.base.z + pt.dir.z*explodeCur); pt.mesh.rotation.y = pt.dir.x*0.0009*k; }
  // orbit
  if (!dragging){ yaw += dt * 0.16 + velY; velY *= 0.92; }
  rig.rotation.y = yaw; rig.rotation.x = pitch;
  // camera dolly back as it explodes
  camera.position.z = lerp(camera.position.z, fitZ * (1 + explodeCur * 1.05), 0.05);
  camera.lookAt(0, 0, 0);
  updateChapters(progress);
  composer.render();
  requestAnimationFrame(frame);
}

/* ---------- loader ---------- */
let glbFrac = 0, glbDone = false, fontsDone = false;
function loaderRun(){
  document.body.style.overflow = 'hidden';
  const t0 = Date.now(); let shown = 0;
  const safety = setTimeout(() => { glbDone = true; fontsDone = true; }, 40000);
  (function a(){
    const target = Math.round((glbFrac*0.8 + (glbDone?0.12:0) + (fontsDone?0.08:0)) * 100);
    shown = lerp(shown, target, 0.1);
    const fin = glbDone && fontsDone && shown > 98.5;
    loadBar && (loadBar.style.width = (fin?100:Math.min(99,shown)).toFixed(1)+'%');
    loadPct && (loadPct.textContent = Math.floor(fin?100:Math.min(99,shown)));
    if (fin && Date.now()-t0 > 500){ clearTimeout(safety); loaderEl && loaderEl.classList.add('done'); document.body.style.overflow=''; return; }
    requestAnimationFrame(a);
  })();
}

/* ---------- ambient WebAudio ---------- */
let uExplodeRef = () => explodeCur;
(() => {
  const btn = $('#sound'); if (!btn) return;
  let ctx=null, master=null, filt=null, on=false, rev=0;
  const build2 = () => {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    filt = ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=240; filt.Q.value=.7; filt.connect(master);
    [[55,'sine',.6],[82.5,'sawtooth',.12]].forEach(([f,t,g])=>{ const o=ctx.createOscillator(); o.type=t; o.frequency.value=f;
      const ga=ctx.createGain(); ga.gain.value=g; o.connect(ga); ga.connect(filt); o.start(); });
    const buf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.5;
    const n=ctx.createBufferSource(); n.buffer=buf; n.loop=true; const nf=ctx.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=620;
    const ng=ctx.createGain(); ng.gain.value=.05; n.connect(nf); nf.connect(ng); ng.connect(master); n.start();
    (function loop(){ if(!ctx) return; rev = rev*0.94 + uExplodeRef()*0.6;
      filt.frequency.value = 220 + clamp(rev)*560; if(on) master.gain.value = lerp(master.gain.value, .09 + clamp(rev)*.07, .1);
      requestAnimationFrame(loop); })();
    return true;
  };
  btn.addEventListener('click', () => {
    if (on){ on=false; btn.setAttribute('aria-pressed','false'); btn.classList.remove('on');
      if(master){ try{ master.gain.linearRampToValueAtTime(0, ctx.currentTime+.4);}catch(e){ master.gain.value=0; } } setTimeout(()=>{ if(!on&&ctx) ctx.suspend(); },450); }
    else { if(!ctx && !build2()) return; if(ctx.state==='suspended') ctx.resume(); on=true; btn.setAttribute('aria-pressed','true'); btn.classList.add('on'); }
  });
})();

/* ---------- boot ---------- */
function fallbackStatic(){
  document.documentElement.classList.add('no-webgl');
  canvas.style.display = 'none';
  const bg = document.createElement('div');
  bg.style.cssText = `position:fixed;inset:0;z-index:1;background:#050608 url(assets/frames/01.jpeg) center/cover no-repeat`;
  document.body.insertBefore(bg, canvas);
  runCounters(); loaderEl && loaderEl.classList.add('done'); document.body.style.overflow='';
}

function boot(){
  if (!webglOK()){ fallbackStatic(); return; }
  setMsg('LOADING THE M5');
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(()=>{ fontsDone = true; });
  loaderRun();

  new GLTFLoader().load(SRC_GLB,
    gltf => {
      glbFrac = 1; setMsg('BUILDING THE STUDIO');
      requestAnimationFrame(() => {
        buildScene(gltf); measure(); glbDone = true;
        if (reduce){ updateChapters(0); composer.render(); runCounters(); return; }
        if (window.Lenis){
          lenis = new Lenis({ duration: 1.3, smoothWheel: true, easing: t => Math.min(1, 1.001 - Math.pow(2, -10*t)) });
          document.documentElement.classList.add('lenis');
          lenis.on('scroll', onScroll);
          const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf);
        } else addEventListener('scroll', onScroll, { passive: true });
        document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
          const href = a.getAttribute('href'); e.preventDefault();
          if (href === '#top'){ lenis ? lenis.scrollTo(0) : window.scrollTo({top:0,behavior:'smooth'}); return; }
          const el = document.querySelector(href); if (el) (lenis ? lenis.scrollTo(el) : el.scrollIntoView({behavior:'smooth'}));
        }));
        onScroll(); if (!started){ started = true; frame(); }
      });
    },
    ev => { if (ev && ev.total) glbFrac = clamp(ev.loaded / ev.total); setMsg('LOADING THE M5 · ' + Math.round(glbFrac*100) + '%'); },
    err => { console.warn('GLB load failed', err); fallbackStatic(); }
  );
}

boot();
