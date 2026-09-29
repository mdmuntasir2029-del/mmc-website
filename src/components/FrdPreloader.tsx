import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useFrdMode } from "../context/FrdModeContext";
import {
  buildDampedSineWave,
  buildDescartesSketch,
  buildFibonacciSpiral,
  buildStarfield,
  type LineGeometry,
  type PointGeometry,
} from "../lib/frdPreloaderGeometry";

const SESSION_KEY = "mmc_frd_preloader_shown";

const FUN_FACTS = [
  "The golden ratio (phi ≈ 1.618) is the limit of the ratio of consecutive Fibonacci numbers.",
  "René Descartes invented the (x, y) coordinate system while watching a fly on his ceiling.",
  "There are infinitely many prime numbers — Euclid proved it over 2,000 years ago.",
  "A damped sine wave loses amplitude exponentially, the same shape a plucked string traces as it goes quiet.",
];

const QUOTE =
  "Each problem that I solved became a rule which served afterwards to solve other problems.";
const QUOTE_KEYWORDS = ["problem", "rule", "problems"];

function renderQuote(text: string) {
  const pattern = new RegExp(`(${QUOTE_KEYWORDS.join("|")})`, "gi");
  const parts = text.split(pattern);
  return parts.map((part, i) =>
    QUOTE_KEYWORDS.some((k) => k.toLowerCase() === part.toLowerCase()) ? (
      <span className="frd-preloader-quote-key" key={i}>
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

// Piecewise progress curve from the FRD spec: 0->60% in 1.2s, 60->90% in
// 1.5s, then a quick finish to 100% and a short hold before fading out.
function progressAt(elapsedMs: number): number {
  if (elapsedMs <= 1200) return (elapsedMs / 1200) * 0.6;
  if (elapsedMs <= 2700) return 0.6 + ((elapsedMs - 1200) / 1500) * 0.3;
  if (elapsedMs <= 3000) return 0.9 + ((elapsedMs - 2700) / 300) * 0.1;
  return 1;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const HOLD_AT_FULL_MS = 3000; // when progress hits 100%
const FADE_START_MS = 3200;
const UNMOUNT_MS = 3800;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${info}`);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${info}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

const POINT_VS = `#version 300 es
in vec2 aPos;
in float aDepth;
in float aPhase;
uniform float uTime;
uniform vec2 uPointer;
out float vDepth;
void main() {
  float drift = sin(uTime * 0.15 + aPhase) * 0.02 * (0.3 + aDepth);
  vec2 parallax = uPointer * 0.04 * aDepth;
  vec2 pos = aPos + vec2(drift, drift * 0.6) + parallax;
  gl_Position = vec4(pos, 0.0, 1.0);
  gl_PointSize = mix(1.0, 2.6, aDepth) * (1.0 + 0.3 * sin(uTime * 0.8 + aPhase));
  vDepth = aDepth;
}`;

const POINT_FS = `#version 300 es
precision mediump float;
in float vDepth;
out vec4 outColor;
void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float d = length(uv);
  float glow = smoothstep(1.0, 0.0, d);
  vec3 color = mix(vec3(0.55, 0.65, 0.78), vec3(1.0), vDepth);
  outColor = vec4(color * glow, glow * (0.35 + 0.55 * vDepth));
}`;

const LINE_VS = `#version 300 es
in vec3 aPosArc;
uniform float uTotalLength;
uniform float uProgress;
uniform float uSlideX;
uniform float uAspect;
uniform vec2 uJitter;
out float vReveal;
void main() {
  vec2 pos = aPosArc.xy;
  pos.x += uSlideX;
  pos += uJitter;
  pos.x /= uAspect;
  gl_Position = vec4(pos, 0.0, 1.0);
  float arcNorm = uTotalLength > 0.0 ? aPosArc.z / uTotalLength : 0.0;
  vReveal = step(arcNorm, uProgress);
}`;

const LINE_FS = `#version 300 es
precision mediump float;
in float vReveal;
uniform vec3 uColor;
uniform float uAlpha;
out vec4 outColor;
void main() {
  if (vReveal < 0.5) discard;
  outColor = vec4(uColor, uAlpha);
}`;

const POST_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const POST_FS = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uScene;
uniform float uTime;
out vec4 outColor;
void main() {
  float aberration = 0.0022 + 0.0013 * sin(uTime * 1.3);
  vec2 dir = vUv - 0.5;
  float r = texture(uScene, vUv - dir * aberration).r;
  float g = texture(uScene, vUv).g;
  float b = texture(uScene, vUv + dir * aberration).b;
  vec3 color = vec3(r, g, b);
  float scan = sin(vUv.y * 760.0 - uTime * 4.0) * 0.035;
  color -= scan;
  outColor = vec4(color, 1.0);
}`;

interface LineLayer {
  geometry: LineGeometry;
  buffer: WebGLBuffer;
  color: [number, number, number];
  slideFrom: number;
  passes: Array<{ jitter: [number, number]; alpha: number }>;
}

/**
 * Full WebGL2 immersive pre-loader for FRD mode — starfield, a Fibonacci
 * spiral, a damped sine wave, and a Descartes line-art sketch, all
 * revealed with a per-vertex progressive stroke (arc-length vs.
 * uProgress, the WebGL analogue of this codebase's existing SVG
 * stroke-dashoffset technique), composited through an offscreen
 * framebuffer for chromatic aberration + scanlines. Shown once per tab
 * session, only in FRD mode, only on public routes (never over /admin,
 * where the toggle itself lives).
 */
export default function FrdPreloader() {
  const { frdMode } = useFrdMode();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [webglOk, setWebglOk] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef<[number, number]>([0, 0]);

  useEffect(() => {
    if (!frdMode || isAdminRoute) return;
    let alreadyShown = false;
    try {
      alreadyShown = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      // Private browsing — just show it every load in that case.
    }
    if (alreadyShown) return;
    setVisible(true);
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Non-critical — worst case it shows again next load.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!visible) return;

    const start = performance.now();
    let fadeTimer: ReturnType<typeof setTimeout>;
    let unmountTimer: ReturnType<typeof setTimeout>;
    let factTimer: ReturnType<typeof setInterval>;
    let cancelled = false;

    fadeTimer = setTimeout(() => {
      if (!cancelled) setFading(true);
    }, FADE_START_MS);
    unmountTimer = setTimeout(() => {
      if (!cancelled) setVisible(false);
    }, UNMOUNT_MS);
    factTimer = setInterval(() => {
      if (!cancelled) setFactIndex((i) => (i + 1) % FUN_FACTS.length);
    }, 1100);

    function tickPct() {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      setProgressPct(Math.round(progressAt(Math.min(elapsed, HOLD_AT_FULL_MS)) * 100));
      if (elapsed < UNMOUNT_MS) requestAnimationFrame(tickPct);
    }
    const raf = requestAnimationFrame(tickPct);

    return () => {
      cancelled = true;
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
      clearInterval(factTimer);
      cancelAnimationFrame(raf);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) {
      setWebglOk(false);
      return;
    }

    let raf = 0;
    let disposed = false;
    const start = performance.now();

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointerRef.current = [
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      ];
    }
    window.addEventListener("pointermove", onPointerMove);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.floor(window.innerWidth * dpr);
      const h = Math.floor(window.innerHeight * dpr);
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }
    resize();
    window.addEventListener("resize", resize);

    try {
      const pointProgram = createProgram(gl, POINT_VS, POINT_FS);
      const lineProgram = createProgram(gl, LINE_VS, LINE_FS);
      const postProgram = createProgram(gl, POST_VS, POST_FS);

      // ---- Starfield ----
      const stars: PointGeometry = buildStarfield(420);
      const starBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, stars.vertices, gl.STATIC_DRAW);

      // ---- Line layers ----
      const spiral = buildFibonacciSpiral();
      const sine = buildDampedSineWave();
      const descartes = buildDescartesSketch();

      function makeLineBuffer(geo: LineGeometry): WebGLBuffer {
        const buf = gl!.createBuffer()!;
        gl!.bindBuffer(gl!.ARRAY_BUFFER, buf);
        gl!.bufferData(gl!.ARRAY_BUFFER, geo.vertices, gl!.STATIC_DRAW);
        return buf;
      }

      const layers: LineLayer[] = [
        {
          geometry: spiral,
          buffer: makeLineBuffer(spiral),
          color: [0.0, 1.0, 0.53],
          slideFrom: 0,
          passes: [{ jitter: [0, 0], alpha: 0.85 }],
        },
        {
          geometry: sine,
          buffer: makeLineBuffer(sine),
          color: [0.0, 0.9, 1.0],
          slideFrom: 0,
          passes: [
            { jitter: [0, 0], alpha: 0.9 },
            { jitter: [0.0016, 0.0016], alpha: 0.3 },
            { jitter: [-0.0016, -0.0016], alpha: 0.3 },
          ],
        },
        {
          geometry: descartes,
          buffer: makeLineBuffer(descartes),
          color: [0.96, 0.9, 0.83],
          slideFrom: -0.3,
          passes: [{ jitter: [0, 0], alpha: 0.55 }],
        },
      ];

      // ---- Fullscreen quad for post-process ----
      const quadBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        gl.STATIC_DRAW
      );

      // ---- Offscreen framebuffer ----
      let sceneTexture = gl.createTexture()!;
      let fbo = gl.createFramebuffer()!;
      let fboW = 0;
      let fboH = 0;

      function ensureFbo() {
        if (fboW === canvas!.width && fboH === canvas!.height) return;
        fboW = canvas!.width;
        fboH = canvas!.height;
        gl!.bindTexture(gl!.TEXTURE_2D, sceneTexture);
        gl!.texImage2D(
          gl!.TEXTURE_2D,
          0,
          gl!.RGBA,
          fboW,
          fboH,
          0,
          gl!.RGBA,
          gl!.UNSIGNED_BYTE,
          null
        );
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
        gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
        gl!.framebufferTexture2D(
          gl!.FRAMEBUFFER,
          gl!.COLOR_ATTACHMENT0,
          gl!.TEXTURE_2D,
          sceneTexture,
          0
        );
      }

      const posArcLoc = gl.getAttribLocation(lineProgram, "aPosArc");
      const linePos = {
        uTotalLength: gl.getUniformLocation(lineProgram, "uTotalLength"),
        uProgress: gl.getUniformLocation(lineProgram, "uProgress"),
        uSlideX: gl.getUniformLocation(lineProgram, "uSlideX"),
        uAspect: gl.getUniformLocation(lineProgram, "uAspect"),
        uJitter: gl.getUniformLocation(lineProgram, "uJitter"),
        uColor: gl.getUniformLocation(lineProgram, "uColor"),
        uAlpha: gl.getUniformLocation(lineProgram, "uAlpha"),
      };

      const starPosLoc = gl.getAttribLocation(pointProgram, "aPos");
      const starDepthLoc = gl.getAttribLocation(pointProgram, "aDepth");
      const starPhaseLoc = gl.getAttribLocation(pointProgram, "aPhase");
      const starUniforms = {
        uTime: gl.getUniformLocation(pointProgram, "uTime"),
        uPointer: gl.getUniformLocation(pointProgram, "uPointer"),
      };

      const postPosLoc = gl.getAttribLocation(postProgram, "aPos");
      const postUniforms = {
        uScene: gl.getUniformLocation(postProgram, "uScene"),
        uTime: gl.getUniformLocation(postProgram, "uTime"),
      };

      function render() {
        if (disposed) return;
        const now = performance.now();
        const elapsed = now - start;
        const t = elapsed / 1000;
        const progress = progressAt(Math.min(elapsed, HOLD_AT_FULL_MS));

        resize();
        ensureFbo();
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
        gl!.viewport(0, 0, canvas!.width, canvas!.height);
        gl!.clearColor(0.039, 0.043, 0.055, 1);
        gl!.clear(gl!.COLOR_BUFFER_BIT);
        gl!.enable(gl!.BLEND);
        gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);

        const aspect = canvas!.width / canvas!.height;

        // Starfield.
        gl!.useProgram(pointProgram);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, starBuffer);
        const stride = 4 * 4;
        gl!.enableVertexAttribArray(starPosLoc);
        gl!.vertexAttribPointer(starPosLoc, 2, gl!.FLOAT, false, stride, 0);
        gl!.enableVertexAttribArray(starDepthLoc);
        gl!.vertexAttribPointer(starDepthLoc, 1, gl!.FLOAT, false, stride, 8);
        gl!.enableVertexAttribArray(starPhaseLoc);
        gl!.vertexAttribPointer(starPhaseLoc, 1, gl!.FLOAT, false, stride, 12);
        gl!.uniform1f(starUniforms.uTime, t);
        gl!.uniform2f(starUniforms.uPointer, pointerRef.current[0], pointerRef.current[1]);
        gl!.drawArrays(gl!.POINTS, 0, stars.count);

        // Line layers.
        gl!.useProgram(lineProgram);
        gl!.enableVertexAttribArray(posArcLoc);
        for (const layer of layers) {
          gl!.bindBuffer(gl!.ARRAY_BUFFER, layer.buffer);
          gl!.vertexAttribPointer(posArcLoc, 3, gl!.FLOAT, false, 0, 0);
          gl!.uniform1f(linePos.uTotalLength, layer.geometry.totalLength);
          gl!.uniform1f(linePos.uProgress, progress);
          gl!.uniform1f(
            linePos.uSlideX,
            layer.slideFrom === 0 ? 0 : layer.slideFrom * (1 - easeOutCubic(progress))
          );
          gl!.uniform1f(linePos.uAspect, aspect);
          gl!.uniform3f(linePos.uColor, layer.color[0], layer.color[1], layer.color[2]);
          for (const pass of layer.passes) {
            gl!.uniform2f(linePos.uJitter, pass.jitter[0], pass.jitter[1]);
            gl!.uniform1f(linePos.uAlpha, pass.alpha);
            gl!.drawArrays(gl!.LINE_STRIP, 0, layer.geometry.vertexCount);
          }
        }

        // Post-process composite to the default framebuffer.
        gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
        gl!.viewport(0, 0, canvas!.width, canvas!.height);
        gl!.disable(gl!.BLEND);
        gl!.useProgram(postProgram);
        gl!.bindBuffer(gl!.ARRAY_BUFFER, quadBuffer);
        gl!.enableVertexAttribArray(postPosLoc);
        gl!.vertexAttribPointer(postPosLoc, 2, gl!.FLOAT, false, 0, 0);
        gl!.activeTexture(gl!.TEXTURE0);
        gl!.bindTexture(gl!.TEXTURE_2D, sceneTexture);
        gl!.uniform1i(postUniforms.uScene, 0);
        gl!.uniform1f(postUniforms.uTime, t);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

        raf = requestAnimationFrame(render);
      }
      raf = requestAnimationFrame(render);

      return () => {
        disposed = true;
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("resize", resize);
        gl.deleteProgram(pointProgram);
        gl.deleteProgram(lineProgram);
        gl.deleteProgram(postProgram);
        gl.deleteBuffer(starBuffer);
        gl.deleteBuffer(quadBuffer);
        for (const layer of layers) gl.deleteBuffer(layer.buffer);
        gl.deleteTexture(sceneTexture);
        gl.deleteFramebuffer(fbo);
      };
    } catch {
      // Shader compile/link failure on an unusual GL implementation —
      // fall back to the DOM-only chrome rather than a blank canvas.
      setWebglOk(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      return;
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="frd-preloader"
        initial={{ opacity: 1 }}
        animate={{ opacity: fading ? 0 : 1 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        aria-hidden="true"
      >
        {webglOk && <canvas ref={canvasRef} className="frd-preloader-canvas" />}

        <div className="frd-preloader-chrome">
          <motion.p
            className="frd-preloader-quote"
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
          >
            {renderQuote(QUOTE)}
            <span className="frd-preloader-quote-attr">{"— René Descartes"}</span>
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.p
              key={factIndex}
              className="frd-preloader-fact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              {FUN_FACTS[factIndex]}
            </motion.p>
          </AnimatePresence>

          <div className="frd-preloader-progress-track">
            <div
              className="frd-preloader-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="frd-preloader-progress-pct">{progressPct}%</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
