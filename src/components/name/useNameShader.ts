import { onCleanup } from "solid-js";
import { magnetGradient } from "~/lib/magnetGradient";
import { glyphHalfExtent } from "./glyphHalfExtent";
import { PROXIMITY_RADIUS, proximityFill } from "./proximityFill";

// useNameShader — the imperative WebGL paint-reveal name, ported faithfully from
// prototype/index.html (the locked spec). White until the cursor nears it, then
// the rainbow sweeps in along the cursor's movement vector as a bristly paint
// front; it recedes back out when the cursor leaves. A fill always completes
// before emptying, so quick flicks don't reverse mid-sweep. A permanent rainbow
// glow sits behind the name, revealed locally by a radial mask at the cursor.
//
// The pure mappings are extracted + unit-tested (proximityFill, glyphHalfExtent,
// magnetGradient); the look here is a fidelity port verified by eye. Mirrors the
// links' useMagnetFill convention: set up in onMount (browser-only, after the
// elements exist), every listener + the rAF loop + the GL resources torn down in
// onCleanup so nothing leaks on client-side navigation away from "/".
//
// `onUnsupported` is called when WebGL is unavailable so the caller can reveal a
// plain-text fallback. `glowOpacity` is the resting opacity of the rainbow bloom
// when the cursor is near (default 0.12 — the "/" look); callers can pass a
// slightly higher value for a touch more glow (the /prototype route does).
export function useNameShader(
  canvas: HTMLCanvasElement,
  glow: HTMLElement,
  onUnsupported: () => void,
  glowOpacity = 0.12,
): void {
  const NAME = "Alex Lapwood";
  const SPEED = 0.03; // constant fill/empty step per frame (prototype:713)

  const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
  if (!gl) {
    onUnsupported();
    return;
  }

  const VS = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }`;

  // Unused-in-final uniforms (u_time/u_mouse/u_anim/u_mode) and the reveal-style
  // modes were dropped from the prototype's shader — they don't affect the look.
  const FS = `
    precision mediump float;
    varying vec2 v_uv;
    uniform sampler2D u_tex;
    uniform float u_reveal;
    uniform vec2 u_dir;
    uniform float u_fill;
    uniform vec2 u_half;

    float seg(float a, float b, float x) {
      return clamp((x - a) / max(b - a, 1e-4), 0.0, 1.0);
    }
    // magnet rainbow — red pinned at both ends, green middle sits at p (cursor x)
    vec3 magnet(float x, float p) {
      float q = 1.0 - p;
      vec3 red    = vec3(1.0, 0.0, 0.302);
      vec3 orange = vec3(1.0, 0.416, 0.0);
      vec3 yellow = vec3(1.0, 0.835, 0.0);
      vec3 green  = vec3(0.0, 0.878, 0.541);
      vec3 blue   = vec3(0.0, 0.722, 1.0);
      vec3 purple = vec3(0.478, 0.361, 1.0);
      vec3 pink   = vec3(1.0, 0.0, 0.784);
      vec3 c = red;
      c = mix(c, orange, seg(0.0,          0.33 * p,     x));
      c = mix(c, yellow, seg(0.33 * p,     0.66 * p,     x));
      c = mix(c, green,  seg(0.66 * p,     p,            x));
      c = mix(c, blue,   seg(p,            p + 0.33 * q, x));
      c = mix(c, purple, seg(p + 0.33 * q, p + 0.66 * q, x));
      c = mix(c, pink,   seg(p + 0.66 * q, p + 0.9 * q,  x));
      c = mix(c, red,    seg(p + 0.9 * q,  1.0,          x));
      return c;
    }
    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
    }

    void main() {
      float mask = texture2D(u_tex, vec2(v_uv.x, 1.0 - v_uv.y)).a;
      if (mask < 0.02) discard;

      // normalise x across the text so the full rainbow always fits the glyphs
      float gx = clamp((v_uv.x - (0.5 - u_half.x)) / (2.0 * u_half.x), 0.0, 1.0);
      vec3 rainbow = magnet(gx, u_fill);

      float r = u_reveal;
      // paint brush — bristly leading edge along the stroke
      float proj = dot(v_uv - 0.5, u_dir) + 0.5;
      vec2 perp = vec2(-u_dir.y, u_dir.x);
      float along = dot(v_uv - 0.5, perp);
      float bristle = (noise(vec2(along * 90.0, 2.0)) - 0.5) * 0.16
                    + (noise(vec2(along * 23.0, 7.0)) - 0.5) * 0.08;
      // sweep only across the text's real extent (not the empty canvas margins),
      // so the paint reaches the glyphs the instant it starts
      float ext = u_half.x * abs(u_dir.x) + u_half.y * abs(u_dir.y);
      float pad = 0.17; // covers the bristly edge + smoothstep width
      float T = mix(0.5 - ext - pad, 0.5 + ext + pad, r);
      float reveal = 1.0 - smoothstep(T - 0.015, T + 0.03, proj - bristle);

      vec3 col = mix(vec3(1.0), rainbow, clamp(reveal, 0.0, 1.0));
      gl_FragColor = vec4(col, mask);
    }`;

  const compile = (type: number, src: string): WebGLShader => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
    }
    return shader;
  };

  const prog = gl.createProgram()!;
  const vs = compile(gl.VERTEX_SHADER, VS);
  const fs = compile(gl.FRAGMENT_SHADER, FS);
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);
  // the shaders are linked into the program now; they can be released
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const U = {
    tex: gl.getUniformLocation(prog, "u_tex"),
    reveal: gl.getUniformLocation(prog, "u_reveal"),
    dir: gl.getUniformLocation(prog, "u_dir"),
    fill: gl.getUniformLocation(prog, "u_fill"),
    half: gl.getUniformLocation(prog, "u_half"),
  };

  // text → alpha mask texture (drawn on an offscreen 2D canvas)
  const tex = gl.createTexture();
  const mask = document.createElement("canvas");
  const mctx = mask.getContext("2d")!;

  // text half-extent in uv, measured in drawMask (seeded with the prototype's
  // pre-measure defaults)
  let halfW = 0.4;
  let halfH = 0.3;

  const drawMask = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return; // not laid out yet — nothing to measure

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    mask.width = w * dpr;
    mask.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    mctx.clearRect(0, 0, mask.width, mask.height);
    mctx.fillStyle = "#fff";
    mctx.textAlign = "center";
    mctx.textBaseline = "middle";
    let size = h * 0.82 * dpr;
    mctx.font = `800 ${size}px Raleway, sans-serif`;
    const maxW = w * dpr * 0.96;
    while (mctx.measureText(NAME).width > maxW && size > 8) {
      size -= 2;
      mctx.font = `800 ${size}px Raleway, sans-serif`;
    }
    mctx.fillText(NAME, mask.width / 2, mask.height / 2);

    // measure the glyphs so the sweep + rainbow span exactly their extent
    const tm = mctx.measureText(NAME);
    const half = glyphHalfExtent(
      tm.width,
      tm.actualBoundingBoxAscent,
      tm.actualBoundingBoxDescent,
      mask.width,
      mask.height,
      size,
    );
    halfW = half.halfW;
    halfH = half.halfH;

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };

  // ── cursor-driven state ───────────────────────────────────────────────────
  let mx = -9999;
  let my = -9999; // cursor viewport position; -9999 = away
  let reveal = 0;
  let phase = 0; // 0 settled · 1 filling · -1 emptying
  let ldx = 0;
  let ldy = -1; // latched movement direction for the whole fill/empty cycle
  let fillF = 0.5; // magnet point (cursor x), shared look with the links
  // movement direction (uv, y-up), seeded pointing up
  let mvx = 0;
  let mvy = 1;
  let pmx = -9999;
  let pmy = -9999;

  const onMove = (e: MouseEvent) => {
    if (pmx > -9999) {
      const dx = e.clientX - pmx;
      const dy = e.clientY - pmy;
      const len = Math.hypot(dx, dy);
      if (len > 0.5) {
        mvx = dx / len;
        mvy = -dy / len; // flip to uv y-up
      }
    }
    pmx = e.clientX;
    pmy = e.clientY;
    mx = e.clientX;
    my = e.clientY;
  };
  // cursor leaving the window (or the tab losing focus) reads as far away
  const sendAway = () => {
    mx = -9999;
    my = -9999;
  };

  window.addEventListener("mousemove", onMove);
  document.addEventListener("mouseleave", sendAway);
  window.addEventListener("blur", sendAway);
  window.addEventListener("resize", drawMask);

  let raf = 0;
  let disposed = false;

  const frame = () => {
    if (disposed) return;

    const r = canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = Math.max(Math.abs(mx - cx) - r.width / 2, 0);
    const dy = Math.max(Math.abs(my - cy) - r.height / 2, 0);
    const near = Math.hypot(dx, dy) < PROXIMITY_RADIUS;

    if (mx > -9999) {
      // the magnet x tracks the cursor across the whole proximity zone so it
      // keeps moving until the cursor crosses the edge and the paint empties
      fillF = proximityFill(mx, r.left, r.width);
    }

    // state machine: a fill always completes before emptying (anti-jank when the
    // cursor darts in and out quickly)
    if (phase === 0) {
      if (near && reveal < 1) {
        phase = 1; // latch the entry movement direction
        ldx = mvx;
        ldy = mvy;
      } else if (!near && reveal > 0) {
        phase = -1; // latch the exit direction so the paint follows the cursor out
        ldx = -mvx;
        ldy = -mvy;
      }
    }
    if (phase === 1) {
      reveal += SPEED;
      if (reveal >= 1) {
        reveal = 1;
        phase = 0;
      }
    } else if (phase === -1) {
      reveal -= SPEED;
      if (reveal <= 0) {
        reveal = 0;
        phase = 0;
      }
    }

    // permanent glow, revealed locally by a radial mask at the cursor
    glow.style.backgroundImage = magnetGradient(fillF); // stays aligned with text
    if (mx > -9999) {
      glow.style.opacity = String(glowOpacity);
      const gr = glow.getBoundingClientRect();
      const m = `radial-gradient(circle 760px at ${(mx - gr.left).toFixed(0)}px ${(my - gr.top).toFixed(0)}px, #000, transparent)`;
      glow.style.setProperty("-webkit-mask-image", m);
      glow.style.setProperty("mask-image", m);
    } else {
      // cursor off-screen: nothing to reveal, so fade the glow out
      glow.style.opacity = "0";
    }

    gl.useProgram(prog);
    gl.uniform1i(U.tex, 0);
    gl.uniform1f(U.reveal, reveal);
    gl.uniform2f(U.dir, ldx, ldy);
    gl.uniform1f(U.fill, fillF);
    gl.uniform2f(U.half, halfW, halfH);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (disposed) return; // unmounted before the font was ready
    drawMask();
    raf = requestAnimationFrame(frame);
  };
  // wait for Raleway so the mask is drawn in the right face, then run
  if (document.fonts?.ready) {
    document.fonts.ready.then(start);
  } else {
    start();
  }

  onCleanup(() => {
    disposed = true;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseleave", sendAway);
    window.removeEventListener("blur", sendAway);
    window.removeEventListener("resize", drawMask);
    // release GPU resources and drop the context so nothing lingers after nav
    gl.deleteTexture(tex);
    gl.deleteBuffer(buf);
    gl.deleteProgram(prog);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  });
}
