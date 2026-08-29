/* Balatro-style card burn for tribal spoilers.
   Adapted from https://codepen.io/plutocrat/pen/bNeXOgy (Pluto / plutocrat). */
(function () {
  "use strict";

  const VS = `
attribute vec2 a_pos;
attribute vec2 a_uv;
uniform float u_time;
varying vec2 v_uv;

void main() {
  v_uv = a_uv;
  vec2 pos = a_pos;
  pos.y += sin(u_time * 0.85) * 0.012;
  pos.x += cos(u_time * 0.52) * 0.005;
  gl_Position = vec4(pos, 0.0, 1.0);
}`;

  const FS = `
precision highp float;
uniform sampler2D u_tex;
uniform float u_time;
uniform float u_dissolve;
varying vec2 v_uv;

#define TAU 6.28318530718

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 19.31);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.0 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

float spiralField(vec2 uv, float progress) {
  vec2 c = uv - 0.5;
  float r = length(c);
  float theta = atan(c.y, c.x);
  float spiralPhase = fract(theta / TAU + 0.5 + r * 2.2);
  float n1 = fbm(uv * 3.5 + u_time * 0.25) * 0.3;
  float n2 = fbm(uv * 7.0 - u_time * 0.18 + vec2(4.3, 1.1)) * 0.12;
  float field = r + spiralPhase * 0.08 + n1 + n2;
  float thresh = 0.95 * (1.0 - progress);
  return field - thresh;
}

void main() {
  vec2 uv = v_uv;
  float wave = 0.0012 * sin(uv.y * 15.0 + u_time * 2.1) + 0.0008 * cos(uv.x * 11.0 + u_time * 1.9);
  vec4 card = texture2D(u_tex, clamp(uv + vec2(wave), 0.001, 0.999));
  vec3 col = card.rgb;
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc, vc) * 0.35;
  float alpha = card.a;

  if (u_dissolve > 0.001) {
    float d = spiralField(uv, u_dissolve);
    float ew = 0.055;
    float ew2 = 0.18;
    float fn = fbm(uv * 7.0 + vec2(u_time * 1.4, -u_time * 0.9));
    float fn2 = vnoise(uv * 20.0 + u_time * 3.0);
    vec3 hotWhite = vec3(1.0, 0.98, 0.9);
    vec3 orange = vec3(1.0, 0.55, 0.05);
    vec3 deepOrange = vec3(0.95, 0.22, 0.0);
    vec3 charcoal = vec3(0.3, 0.08, 0.0);
    vec3 fireCol = mix(deepOrange, orange, smoothstep(0.2, 0.7, fn));
    fireCol = mix(fireCol, hotWhite, smoothstep(0.6, 0.95, fn));
    float outerBloom = smoothstep(ew2, 0.0, d + ew2) * (1.0 - smoothstep(-ew * 0.5, 0.0, d));
    col += mix(charcoal, deepOrange, fn * 0.6) * outerBloom * 2.0;
    float edgeBand = smoothstep(-ew, 0.0, d) * (1.0 - smoothstep(0.0, ew, d));
    col = mix(col, fireCol * 1.6, edgeBand * 0.85);
    float coreBand = smoothstep(-ew * 0.35, 0.0, d) * (1.0 - smoothstep(0.0, ew * 0.5, d));
    col = mix(col, hotWhite * 2.2, coreBand * 0.75);
    float sparkMask = edgeBand * step(0.74, fn2) * step(0.6, fn);
    col += hotWhite * sparkMask * 4.0;
    float burned = smoothstep(-0.004, 0.018, d);
    alpha *= (1.0 - burned) * card.a;
  }

  gl_FragColor = vec4(col, alpha);
}`;

  const QUAD_POS = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  const QUAD_UV = new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]);
  const TEX_W = 520;
  const TEX_H = 360;
  const BURN_SECONDS = 3.5;

  function easeBurn(raw) {
    if (raw < 0.12) return raw * raw * 3.5;
    if (raw < 0.75) return 0.05 + (raw - 0.12) * 1.45;
    const tail = (raw - 0.75) / 0.25;
    return 0.964 + tail * tail * 0.036;
  }

  function buildCoverTexture() {
    const c = document.createElement("canvas");
    c.width = TEX_W;
    c.height = TEX_H;
    const ctx = c.getContext("2d");
    if (!ctx) return c;

    const grad = ctx.createRadialGradient(
      TEX_W * 0.5,
      TEX_H * 1.05,
      20,
      TEX_W * 0.5,
      TEX_H * 0.45,
      TEX_W * 0.75
    );
    grad.addColorStop(0, "rgba(232,93,4,0.16)");
    grad.addColorStop(0.35, "#140e0b");
    grad.addColorStop(1, "#0b0809");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 7000; i++) {
      const x = Math.random() * TEX_W;
      const y = Math.random() * TEX_H;
      const a = Math.random() * 0.4;
      ctx.fillStyle = Math.random() > 0.55 ? `rgba(0,0,0,${a})` : `rgba(232,200,140,${a * 0.45})`;
      ctx.fillRect(x, y, 1.1, 1.1);
    }
    ctx.globalAlpha = 1;

    const inset = ctx.createLinearGradient(0, 0, 0, TEX_H);
    inset.addColorStop(0, "rgba(240,193,75,0.06)");
    inset.addColorStop(0.55, "rgba(0,0,0,0)");
    inset.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = inset;
    ctx.fillRect(0, 0, TEX_W, TEX_H);

    const pad = 18;
    ctx.strokeStyle = "rgba(140,70,30,0.55)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 0.5, pad + 0.5, TEX_W - pad * 2, TEX_H - pad * 2);
    ctx.strokeStyle = "rgba(212,160,23,0.22)";
    ctx.lineWidth = 1;
    ctx.strokeRect(pad + 6.5, pad + 6.5, TEX_W - pad * 2 - 12, TEX_H - pad * 2 - 12);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#c4a574";
    ctx.font = '400 15px "Cinzel", "Times New Roman", Times, serif';
    ctx.letterSpacing = "0.32em";
    try {
      ctx.letterSpacing = "0.32em";
    } catch (_) {
      /* older canvas */
    }
    ctx.fillText("SPOILER", TEX_W / 2, TEX_H * 0.34);

    ctx.fillStyle = "#e8d5b0";
    ctx.font = '700 42px "Cinzel", "Times New Roman", Times, serif';
    ctx.fillText("THE VOTE", TEX_W / 2, TEX_H * 0.5);

    ctx.fillStyle = "#8a7355";
    ctx.font = 'italic 18px "IM Fell English", "Palatino Linotype", Palatino, serif';
    wrapText(ctx, "Burn to reveal who goes home.", TEX_W / 2, TEX_H * 0.66, TEX_W * 0.7, 26);

    return c;
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    const lines = [];
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((ln, i) => ctx.fillText(ln, x, startY + i * lineHeight));
  }

  class TribalSpoilerBurn {
    constructor(wrap) {
      this.wrap = wrap;
      this.btn = wrap.querySelector(".tribal-spoiler-cover");
      this.canvas = wrap.querySelector(".tribal-spoiler-canvas");
      this.result = wrap.querySelector(".tribal-spoiler-result");
      this.pCanvas = wrap.querySelector(".tribal-spoiler-particles");
      this.gl = null;
      this.U = null;
      this.dissolve = 0;
      this.burning = false;
      this.burnTimer = 0;
      this.embers = [];
      this.smoke = [];
      this.lastEmber = 0;
      this.lastNow = 0;
      this.t0 = performance.now();
      this.raf = 0;
      this.done = false;

      if (!this.btn || !this.canvas || !this.result) return;
      this.wrap.dataset.burnInit = "1";
      try {
        this.initGl();
      } catch (err) {
        console.error("Tribal spoiler burn init failed:", err);
        this.gl = null;
      }
      this.btn.addEventListener("click", () => this.onClick());
      this.onResize = () => this.resizeParticles();
      window.addEventListener("resize", this.onResize);
      this.resizeParticles();
      this.renderLoop = this.renderLoop.bind(this);
      this.raf = requestAnimationFrame(this.renderLoop);
    }

    initGl() {
      const gl = this.canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
      if (!gl) return;
      this.gl = gl;

      const mkShader = (src, type) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("Spoiler shader:", gl.getShaderInfoLog(s));
          return null;
        }
        return s;
      };

      const prog = gl.createProgram();
      const vs = mkShader(VS, gl.VERTEX_SHADER);
      const fs = mkShader(FS, gl.FRAGMENT_SHADER);
      if (!vs || !fs) {
        this.gl = null;
        return;
      }
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("Spoiler program:", gl.getProgramInfoLog(prog));
        this.gl = null;
        return;
      }
      gl.useProgram(prog);
      this.prog = prog;

      const bindBuf = (data, attr) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        const loc = gl.getAttribLocation(prog, attr);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      };
      bindBuf(QUAD_POS, "a_pos");
      bindBuf(QUAD_UV, "a_uv");

      this.U = {
        u_time: gl.getUniformLocation(prog, "u_time"),
        u_tex: gl.getUniformLocation(prog, "u_tex"),
        u_dissolve: gl.getUniformLocation(prog, "u_dissolve")
      };
      gl.uniform1i(this.U.u_tex, 0);
      gl.uniform1f(this.U.u_dissolve, 0);

      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      const cover = buildCoverTexture();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cover);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.tex = tex;

      this.resizeCanvas();
      if (this.canvas.width > 1 && this.canvas.height > 1) {
        this.wrap.classList.add("tribal-spoiler--ready");
      }
    }

    resizeCanvas() {
      const rect = this.btn.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
    }

    resizeParticles() {
      if (!this.pCanvas) return;
      const rect = this.wrap.getBoundingClientRect();
      this.pCanvas.width = Math.max(1, Math.round(rect.width));
      this.pCanvas.height = Math.max(1, Math.round(rect.height));
    }

    reveal() {
      if (this.done) return;
      this.done = true;
      this.burning = false;
      this.wrap.classList.add("is-revealed");
      this.wrap.classList.remove("is-burning");
      if (this.result) this.result.removeAttribute("aria-hidden");
      if (this.btn) this.btn.remove();
      cancelAnimationFrame(this.raf);
      window.removeEventListener("resize", this.onResize);
    }

    onClick() {
      if (this.done || this.burning || this.wrap.classList.contains("is-revealed")) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !this.gl) {
        this.reveal();
        return;
      }
      this.burning = true;
      this.burnTimer = 0;
      this.wrap.classList.add("is-burning");
      this.btn.setAttribute("aria-expanded", "true");
      if (this.result) this.result.removeAttribute("aria-hidden");
    }

    emitEmbers() {
      const r = this.canvas.getBoundingClientRect();
      const wrapR = this.wrap.getBoundingClientRect();
      const cx = r.left - wrapR.left + r.width * 0.5;
      const cy = r.top - wrapR.top + r.height * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const rad = (0.15 + Math.random() * 0.5) * r.width * 0.5;
      const ex = cx + Math.cos(angle) * rad;
      const ey = cy + Math.sin(angle) * rad * (r.height / Math.max(r.width, 1));
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
        const a2 = angle + (Math.random() - 0.5) * 1.5;
        const spd = 1.2 + Math.random() * 2.5;
        this.embers.push({
          x: ex,
          y: ey,
          vx: Math.cos(a2) * spd,
          vy: Math.sin(a2) * spd - 1.4,
          life: 1,
          decay: 0.02 + Math.random() * 0.025,
          size: 1.2 + Math.random() * 2,
          hue: 15 + Math.random() * 35
        });
      }
      if (Math.random() < 0.1) {
        this.smoke.push({
          x: ex + (Math.random() - 0.5) * 20,
          y: ey,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.35 + Math.random() * 0.7),
          life: 1,
          decay: 0.004 + Math.random() * 0.004,
          size: 10 + Math.random() * 24,
          op: 0.04 + Math.random() * 0.05
        });
      }
    }

    drawParticles() {
      if (!this.pCanvas) return;
      const pCtx = this.pCanvas.getContext("2d");
      if (!pCtx) return;
      pCtx.clearRect(0, 0, this.pCanvas.width, this.pCanvas.height);
      for (let i = this.smoke.length - 1; i >= 0; i--) {
        const s = this.smoke[i];
        s.x += s.vx;
        s.y += s.vy;
        s.size += 0.5;
        s.life -= s.decay;
        if (s.life <= 0) {
          this.smoke.splice(i, 1);
          continue;
        }
        const g = pCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
        const a = s.op * s.life;
        g.addColorStop(0, `rgba(100,40,0,${a})`);
        g.addColorStop(0.6, `rgba(40,15,0,${a * 0.3})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        pCtx.fillStyle = g;
        pCtx.beginPath();
        pCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        pCtx.fill();
      }
      for (let i = this.embers.length - 1; i >= 0; i--) {
        const e = this.embers[i];
        e.x += e.vx;
        e.y += e.vy;
        e.vy += 0.06;
        e.vx *= 0.98;
        e.life -= e.decay;
        if (e.life <= 0) {
          this.embers.splice(i, 1);
          continue;
        }
        pCtx.save();
        pCtx.globalAlpha = e.life * (0.65 + Math.random() * 0.35);
        const g = pCtx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 3);
        g.addColorStop(0, `hsl(${e.hue + 25},100%,92%)`);
        g.addColorStop(0.35, `hsl(${e.hue},100%,60%)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        pCtx.fillStyle = g;
        pCtx.beginPath();
        pCtx.arc(e.x, e.y, e.size * 3, 0, Math.PI * 2);
        pCtx.fill();
        pCtx.restore();
      }
    }

    renderLoop(now) {
      if (this.done) return;
      const dt = Math.min((now - this.lastNow) * 0.001, 0.05);
      this.lastNow = now;
      const t = (now - this.t0) * 0.001;

      if (this.burning) {
        this.burnTimer += dt;
        const raw = Math.min(this.burnTimer / BURN_SECONDS, 1);
        this.dissolve = easeBurn(raw);
        if (this.dissolve >= 1) {
          this.reveal();
          return;
        }
      }

      if ((this.burning || this.dissolve > 0.04) && this.dissolve < 0.97 && now - this.lastEmber > 55) {
        this.lastEmber = now;
        this.emitEmbers();
      }

      if (this.gl && this.U) {
        this.resizeCanvas();
        const gl = this.gl;
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform1f(this.U.u_time, t);
        gl.uniform1f(this.U.u_dissolve, this.dissolve);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      this.drawParticles();
      this.raf = requestAnimationFrame(this.renderLoop);
    }
  }

  window.initTribalSpoilerBurns = function initTribalSpoilerBurns(root) {
    if (!root) return;
    root.querySelectorAll(".tribal-spoiler:not([data-burn-bound])").forEach((wrap) => {
      wrap.dataset.burnBound = "1";
      new TribalSpoilerBurn(wrap);
    });
  };
})();
