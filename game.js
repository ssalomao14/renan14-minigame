
    /**
     * PRA CIMA DELES, RENAN! — PROTÓTIPO PLATAFORMA
     * Loop Core: Corrida contínua, pulo variável, fast-fall e colocação de fraldas em púlpitos vazios.
     */

    // Versão SemVer do jogo (major.minor.patch) — bump via `node bump-version.js [major|minor|patch]`
    const GAME_VERSION = '0.1.9';

    // --- ÁUDIO (Web Audio API Synthesizer) ---
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.enabled = true;
      }

      init() {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      playJump(isHigh = false) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(isHigh ? 240 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(isHigh ? 620 : 440, now + 0.16);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      playDive() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.14);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      playDiaperPlaced() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Two-tone fanfare
        [440, 660, 880].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          const t = now + idx * 0.06;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.25, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      }

      playObstaclePass() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      }

      playHit() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }

      // Reveal elegante para o card de introdução de personagem
      playReveal() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        [0, 0.1, 0.2].forEach((offset, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const t = now + offset;
          osc.frequency.setValueAtTime(180 + i * 90, t);
          osc.frequency.exponentialRampToValueAtTime(380 + i * 120, t + 0.18);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.2);
        });
      }

      // Fanfarra de novo recorde
      playNewRecord() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        [523, 659, 784, 1046].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const t = now + i * 0.09;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.25);
        });
      }

      // Pop de coleta: sobe 1 semitom a cada 3 coletas seguidas (reinicia após 1.5 s sem coletar)
      playCollect(step = 0) {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const semis = Math.min(8, Math.floor(step / 3));
        const f = 620 * Math.pow(2, semis / 12);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now);
        osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 0.08);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }

      // Thud de aterrissagem no chão (surdo e curto)
      playLand() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);
        gain.gain.setValueAtTime(0.28, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }

      // Sting curta do clique em JOGAR (ataque imediato, transitions to game music)
      playStartSting() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        [440, 880].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const t = now + i * 0.07;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.2, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.12);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      }

      // Clique de UI (botões de tela: compartilhar, registrar, glossário, pause)
      playClick() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1000, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.03);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.03);
      }

      // Vinheta de promoção de patente: riser curto + arpejo de vitória
      playRankUp() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        // Riser (varredura ascendente)
        const sweep = this.ctx.createOscillator();
        const sweepGain = this.ctx.createGain();
        sweep.type = 'sawtooth';
        sweep.frequency.setValueAtTime(200, now);
        sweep.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
        sweepGain.gain.setValueAtTime(0.08, now);
        sweepGain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        sweep.connect(sweepGain);
        sweepGain.connect(this.ctx.destination);
        sweep.start(now);
        sweep.stop(now + 0.35);
        // Acorde de vitória
        [523, 659, 784, 1046].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const t = now + 0.18 + i * 0.07;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.35);
        });
      }

      // Sting de encerramento: descendente, fecha a partida
      playGameOverSting() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        // GRITO DE GUERRA: não denota derrota, é um grito de batalha.
        // Tambor -> "U-RÁAAA!" ascendente em 2 vozes -> chant "RA! RA! RA!"
        // -> acorde de batalha (quinta). Camadas simultâneas = som "gordo", nada monodimensional.
        [0, 0.78].forEach((off) => {
          const t = now + off;
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(95, t);
          osc.frequency.exponentialRampToValueAtTime(48, t + 0.12);
          g.gain.setValueAtTime(0.22, t);
          g.gain.linearRampToValueAtTime(0.01, t + 0.13);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.14);
        });

        // "U-RÁAAA!": glide ascendente com terça acima (2 vozes)
        const ura = this.ctx.createOscillator();
        const ura2 = this.ctx.createOscillator();
        const ug = this.ctx.createGain();
        ura.type = 'sawtooth';
        ura2.type = 'sawtooth';
        ura.frequency.setValueAtTime(240, now + 0.1);
        ura.frequency.exponentialRampToValueAtTime(620, now + 0.42);
        ura2.frequency.setValueAtTime(360, now + 0.1);
        ura2.frequency.exponentialRampToValueAtTime(930, now + 0.42);
        ug.gain.setValueAtTime(0.035, now + 0.08);
        ug.gain.linearRampToValueAtTime(0.15, now + 0.24);
        ug.gain.linearRampToValueAtTime(0.01, now + 0.44);
        ura.connect(ug);
        ura2.connect(ug);
        ug.connect(this.ctx.destination);
        ura.start(now);
        ura.stop(now + 0.45);
        ura2.start(now);
        ura2.stop(now + 0.45);

        // "RA! RA! RA!": chant curto e forte
        [392, 440, 523].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'square';
          const t = now + 0.46 + i * 0.11;
          osc.frequency.setValueAtTime(freq, t);
          g.gain.setValueAtTime(0.16, t);
          g.gain.linearRampToValueAtTime(0.005, t + 0.09);
          osc.connect(g);
          g.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.1);
        });

        // Acorde de batalha resolvido (C3+G3) fechando o grito
        const chord = this.ctx.createOscillator();
        const chord2 = this.ctx.createOscillator();
        const cg = this.ctx.createGain();
        chord.type = 'sawtooth';
        chord2.type = 'sawtooth';
        chord.frequency.setValueAtTime(196, now + 0.8);
        chord2.frequency.setValueAtTime(294, now + 0.8);
        cg.gain.setValueAtTime(0.15, now + 0.8);
        cg.gain.linearRampToValueAtTime(0.004, now + 1.05);
        chord.connect(cg);
        chord2.connect(cg);
        cg.connect(this.ctx.destination);
        chord.start(now + 0.8);
        chord.stop(now + 1.06);
        chord2.start(now + 0.8);
        chord2.stop(now + 1.06);
      }

      // Whoosh curto do Espectro ao ficar sólido (adverte o jogador)
      playGhostWarn() {
        if (!this.enabled || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.2);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    }

    // --- ÁUDIO REAL (arquivos mp3 em assets/audio/) ---
    // Música de fundo + trechos de voz por inimigo + voz do Renan na tela inicial.
    // Tudo opcional: se o arquivo não existir (404) o jogo segue só com os efeitos
    // sintéticos do SoundEngine. Formato padrão: .mp3 (universal, inclusive iOS).
    // Crossfade entre músicas via Web Audio (buffer loop) — nada de <audio> solto,
    // que no iOS exigiria gesto por elemento.
    class MusicEngine {
      constructor() {
        this.enabled = true;
        this.unlocked = false;
        this.ctx = null;
        this.bgmKind = null;
        this._bufs = {};      // buffers decodificados em cache (null = falhou/404)
        this._pending = {};   // chaves carregando (lista de callbacks)
        this._bgmNode = null;
        this._bgmGain = null;
        this._nodes = new Set(); // todos os buffer sources ativos, p/ nunca deixar música órfã
      }

      // Para TUDO que ainda esteja tocando (inclusive nós que escaparam do _bgmNode)
      _purgeBgmNodes() {
        this._nodes.forEach((n) => { try { n.stop(); } catch (err) {} });
        this._nodes.clear();
      }

      _ensureCtx() {
        if (this.ctx) return true;
        if (audio && audio.ctx) { this.ctx = audio.ctx; return true; } // compartilha o ctx do SoundEngine
        return false;
      }

      _loadBuf(key, cb) {
        if (key in this._bufs) { cb(this._bufs[key]); return; }
        if (this._pending[key]) { this._pending[key].push(cb); return; }
        this._pending[key] = [cb];
        const req = new XMLHttpRequest();
        req.open('GET', `assets/audio/${key}.mp3`, true);
        req.responseType = 'arraybuffer';
        req.onload = () => {
          if (req.status !== 200) { this._bufs[key] = null; this._flush(key, null); return; }
          try {
            // callback-form: funciona em todos os browsers (incl. iOS)
            this.ctx.decodeAudioData(req.response, (d) => {
              this._bufs[key] = d; this._flush(key, d);
            }, () => { this._bufs[key] = null; this._flush(key, null); });
          } catch (err) { this._bufs[key] = null; this._flush(key, null); }
        };
        req.onerror = () => { this._bufs[key] = null; this._flush(key, null); };
        req.send();
      }

      _flush(key, d) {
        const list = this._pending[key] || [];
        this._pending[key] = null;
        list.forEach((cb) => cb(d));
      }

      // Deve ser chamado DENTRO de um gesto do usuário (desbloqueia autoplay).
      // Re-tenta o resume em TODA chamada: o iOS pode rejeitar a 1ª tentativa
      // (feita no load, fora de gesto) e o unlock fica sem efeito se nunca re-tentar.
      unlock() {
        this.unlocked = true;
        let wasSuspended = false;
        if (this._ensureCtx() && this.ctx.state === 'suspended') {
          wasSuspended = true;
          try { this.ctx.resume().catch(() => {}); } catch (err) {}
        }
        if (wasSuspended && this._bgmNode) {
          // Nó criado com o ctx suspenso não reproduz de forma confiável no iOS
          // (a faixa "toca" em silêncio durante a suspensão). Remove, para o próximo
          // setBgm recriá-lo já com o áudio rodando.
          this._purgeBgmNodes();
          this.bgmKind = null;
        }
      }

      // kind: 'start' (toca UMA vez) | 'game' (loop) | null (para a música com fade)
      setBgm(kind) {
        const prevNode = this._bgmNode;
        const prevGain = this._bgmGain;
        // Nada a fazer: já está nesse kind COM nó ativo, ou já está todo parado
        const alreadyPlaying = (kind !== null && kind === this.bgmKind && prevNode !== null);
        const alreadyStopped = (kind === null && this.bgmKind === null && prevNode === null);
        if (alreadyPlaying || alreadyStopped) return;

        this.bgmKind = kind;
        this._bgmNode = null;
        this._bgmGain = null;

        if (!this.enabled || !this.unlocked || !kind || !this._ensureCtx()) {
          // Mutado, bloqueado ou parando: silencia TUDO. O purge garante que
          // nenhuma faixa órfã (ex.: falha ao carregar qualquer arquivo) continue
          // tocando depois da morte ou do mudo.
          this._purgeBgmNodes();
          return;
        }

        this._loadBuf(kind, (d) => {
          if (!d) {
            // Arquivo ausente/indecodificável (404): a faixa ANTERIOR não pode
            // continuar tocando sem ser dona do _bgmNode — ela ficaria eterna.
            this._purgeBgmNodes();
            return;
          }
          if (!this.ctx || this.bgmKind !== kind) return; // mudou de ideia no meio
          const now = this.ctx.currentTime;
          const src = this.ctx.createBufferSource();
          const g = this.ctx.createGain();
          src.buffer = d;
          src.loop = kind !== 'start'; // introdução da tela inicial toca uma única vez
          // Níveis por trilha: game fica em background, intro um pouco à frente
          const level = (kind === 'start') ? 0.38 : 0.26;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(level, now + 0.9);
          src.onended = () => {
            try { g.disconnect(); } catch (err) {}
            this._nodes.delete(src);
            if (this._bgmNode === src) { this._bgmNode = null; this._bgmGain = null; }
          };
          if (!src.loop) {
            // Fade-out no final da introdução (evita corte seco)
            const end = d.duration || 30;
            g.gain.setValueAtTime(level, now + Math.max(1.2, end - 1.0));
            g.gain.exponentialRampToValueAtTime(0.0001, now + end + 0.02);
          }
          src.connect(g);
          g.connect(this.ctx.destination);
          src.start();
          this._nodes.add(src);
          this._bgmNode = src;
          this._bgmGain = g;

          // Fade-out da música anterior em crossfade
          if (prevNode && prevGain) {
            try {
              prevGain.gain.cancelScheduledValues(now);
              prevGain.gain.setValueAtTime(Math.max(prevGain.gain.value, 0.0001), now);
              prevGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
              prevNode.stop(now + 1.0);
            } catch (err) {}
          }
        });
      }

      // Pré-carrega/decodifica o buffer ANTES do gesto, para o primeiro play ser imediato
      prewarm(kind) {
        try {
          if (!this.ctx) { if (audio && audio.init) audio.init(); this._ensureCtx(); }
          if (this.ctx) this._loadBuf(kind, () => {});
        } catch (err) { /* autoplay/decodificação falham silenciosamente */ }
      }

      // One-shot de voz/trecho real (buffer source, sem limite por elemento)
      playOne(key, vol) {
        if (!this.enabled || !this.unlocked || !this._ensureCtx()) return;
        this._loadBuf(key, (d) => {
          if (!d || !this.ctx) return;
          const now = this.ctx.currentTime;
          const dur = d.duration || 1;
          const src = this.ctx.createBufferSource();
          const g = this.ctx.createGain();
          src.buffer = d;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.linearRampToValueAtTime(vol || 0.9, now + 0.02);
          g.gain.setValueAtTime(vol || 0.9, now + Math.max(0.03, dur - 0.05));
          g.gain.exponentialRampToValueAtTime(0.0001, now + dur + 0.02);
          src.connect(g);
          g.connect(this.ctx.destination);
          src.start(now);
        });
      }
    }

    const audio = new SoundEngine();
    const realAudio = new MusicEngine();

    // Feedback tátil (mobile modernos). Falha silenciosamente em desktop/navegador sem suporte.
    function buzz(pattern) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(pattern); } catch (e) { /* noop */ }
      }
    }

    // PERSONAGEM 100% PROCEDURAL EM CANVAS:
    // Zero downloads de sprites externos, zero dependência de rede, zero bloqueio de CORS.
    // Performance nativa fluida a 60 FPS no mobile e transparência garantida por vetorização direta.

    // --- GAME ENGINE & CONFIG ---
    const canvas = document.getElementById('game-canvas');
    let ctx = canvas.getContext('2d');

    // ESTILO PADRÃO do jogo é o modo pixel (fonte Pixelify em todo o DOM + proxy de
    // ctx.font no canvas). ?pixel=0 desliga (comparação/fallback sem pixelização);
    // ?pixel=2..8 adiciona subamostragem do canvas inteiro além das fontes.
    const PIXEL_PARAM = (window.location.search.match(/[?&]pixel=(\d+)/) || [])[1];
    const PIXEL_MODE = !(PIXEL_PARAM === '0');
    // Fator de subamostragem do canvas: 1 (padrão) = resolução cheia, só fontes pixel;
    // 2/3 = pixelização do canvas inteiro. Padrão 1 (legibilidade máxima).
    const PIXEL_RATIO = Math.max(1, Math.min(8, parseInt(PIXEL_PARAM || '1', 10)));

    // Aparência pixelada dos elementos DOM (sempre ligada no estilo padrão)
    if (PIXEL_MODE) {
      document.body.classList.add('pixel');
      const st = document.createElement('style');
      st.textContent =
        "@import url('https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&family=Press+Start+2P&display=swap');" +
        // Pixeliza TODAS as fontes de texto da UI (DOM) — canvas já é pixelado pelo render de baixa resolução
        'body.pixel, body.pixel * { font-family: "Pixelify Sans", "Press Start 2P", "Courier New", monospace !important; letter-spacing: 0 !important; }' +
        'body.pixel img { image-rendering: pixelated; }' +
        'body.pixel .start-title { font-size: 1.4rem; line-height: 1.35; }' +
        'body.pixel .start-hashtag { font-size: 0.72rem; }' +
        'body.pixel .btn-play-large { font-size: 1.1rem; padding: 10px 18px; }';
      document.head.appendChild(st);
      // Disponibiliza as fontes pixel para o canvas (os textos do jogo usam elas por baixo)
      if (document.fonts && document.fonts.load) {
        document.fonts.load('12px "Pixelify Sans"');
        document.fonts.load('12px "Press Start 2P"');
      }
    }

    // No modo pixel, remapeia ctx.font das fontes vetorizadas ("Arial Black", sans-serif…)
    // para a fonte pixel — os glifos nascem alinhados à grade da baixa resolução e o
    // upscale nearest fica nítido (em vez de texto AA borrado).
    function makePixelFontProxy(target) {
      const remap = (f) => {
        if (typeof f !== 'string' || !f.trim()) return f;
        // Pixelify Sans é visualmente mais compacto que a Arial Black: +10% no corpo
        // para manter a legibilidade próxima da fonte original.
        return f.replace(/^(.*?\b)([\d.]+px)(.*)$/, (m, pre, size, rest) => {
          const n = parseFloat(size) * 1.1;
          return `${pre}${n.toFixed(1)}px "Pixelify Sans", "Press Start 2P", "Courier New", monospace${rest}`;
        });
      };
      return new Proxy(target, {
        set(obj, prop, value) {
          if (prop === 'font' && typeof value === 'string') value = remap(value);
          obj[prop] = value;
          return true;
        },
        get(obj, prop) {
          const v = Reflect.get(obj, prop);
          return typeof v === 'function' ? v.bind(obj) : v;
        }
      });
    }

    // Resolução lógica de jogo (coordenadas virtuais fixas para física consistente)
    const V_WIDTH = 420;
    const V_HEIGHT = 700;
    const GROUND_Y = 560;

    // Estado do jogo
    const STATE = {
      MENU: 0,
      PLAYING: 1,
      GAMEOVER: 2
    };

    let gameState = STATE.MENU;
    let highscore = parseInt(localStorage.getItem('renan_mission_best') || '0', 10);
    // Animação de entrada da tela inicial: quadro cresce + fade de texto/botão.
    let menuIntroDone = false; // libera toque/tecla para iniciar o jogo no menu
    let lastFinalScore = 0;
    let lastGameTime = 0;
    let lastVotes = 0;
    let lastRunWasNewRecord = false;
    let isPaused = false;

    // --- LEADERBOARD COMUNITÁRIO (backend plugável) ---
    // API (opcional): GET {url}?top=10 -> { entries: [{ nick, votes }] } | [ { nick, votes } ]
    //                  POST {url} (body {nick, votes}) -> 200/201. Sem URL, usa registro local.
    const LEADERBOARD_API_URL = '';
    const LB_STORAGE_KEY = 'renan_mission_lb';
    let lbSubmittedThisRun = false;
    let lastLbNick = '';

    // --- SISTEMA OFICIAL DE PATENTES (6 NÍVEIS, múltiplos de 14 — número do partido) ---
    const RANK_TIERS = [
      { min: 140000, title: "Alexandre, O Grande", isGold: true },
      { min: 114014, title: "General da Missão", isGold: true },
      { min: 70014, title: "Coronel da Missão", isGold: true },
      { min: 42014, title: "Capitão da Missão", isGold: false },
      { min: 14014, title: "Soldado da Missão", isGold: false },
      { min: 0, title: "Recruta da Missão", isGold: false }
    ];

    let currentRankTier = RANK_TIERS[RANK_TIERS.length - 1];

    function getRankByVotes(voteVal) {
      for (const tier of RANK_TIERS) {
        if (voteVal >= tier.min) {
          return tier;
        }
      }
      return RANK_TIERS[RANK_TIERS.length - 1];
    }

    // --- SISTEMA DE BANNER (eventos IMPORTANTES, sem ruído) ---
    // Pontuação agora "soma" no contador (ticker no HUD), então o banner central
    // só aparece em eventos core: promoção de patente, quadrilha, cadeia de reação,
    // assombração. Fila curta evita dois banners se pisando.
    let activeBanner = null;
    const bannerQueue = [];
    function promoteBanner() {
      if (activeBanner || !bannerQueue.length) return;
      activeBanner = bannerQueue.shift();
    }

    // --- NOVOS SISTEMAS (UX + ANIMAÇÃO + INTRO) ---
    // Sistema de 3 vidas: tropeço no púlpito = -1, na toga = -2, recupera via fraldas
    const MAX_LIVES = 3;
    let lives = MAX_LIVES;
    // Graça pós-(re)start: nenhum obstáculo mata nos primeiros instantes da corrida
    let spawnGraceTimer = 0;
    // Escala de tempo do mundo (slow-mo de introdução de personagem)
    let worldTimeScale = 1;
    let activeCard = null;            // Card "primeiro confronto"
    const pendingIntroQueue = [];     // Cards de intro esperando a vez (nunca sobrepõem)
    let lastIntroAt = 0;              // Último instante de nova intro (p/ espaçar spawns)
    const encounteredTypes = new Set(); // Tipos já apresentados nesta sessão
    // Fila de spawns dependentes de tempo (substitui setTimeout)
    let pendingSpawns = [];
    // Câmera com aspecto uniforme (evita distorção)
    const VIEW = { scale: 1, ox: 0, oy: 0 };
    // Cache de valores do HUD para só escrever no DOM quando mudar
    const hudCache = { votes: null, time: null, handcuffs: null, rank: null, rankPct: null, mult: null, perk: null, squad: null, lives: null, haunt: null };

    // —— TICKER DE SOMA NO CONTADOR ——
    // Toda pontuação "soma" no total: +XXXX aparece momentaneamente ao lado do
    // contador assim que ele muda (votos, algemas e vidas). Zero de ruído no canvas.
    let lastVisVotes = 0, lastVisHandcuffs = 0, lastVisLives = 0;
    function pulseHudDelta(targetId, rawDelta, color) {
      if (!rawDelta) return;
      if (gameState !== STATE.PLAYING) return;
      const el = document.getElementById(targetId);
      if (!el) return;
      const chip = el.closest('.hud-chip');
      const host = chip || el;
      const sign = rawDelta > 0 ? '+' : '−';
      const val = Math.abs(rawDelta);
      const span = document.createElement('span');
      span.className = 'hud-delta';
      span.textContent = `${sign}${val}`;
      span.style.color = color || '#ffe08a';
      host.appendChild(span);
      requestAnimationFrame(() => span.classList.add('on'));
      setTimeout(() => {
        span.classList.remove('on');
        const kill = () => span.remove();
        span.addEventListener('transitionend', kill, { once: true });
        setTimeout(kill, 500);
      }, 900);
    }

    function mostrarBanner(texto, tipo = "info", icone = "⚠️", mode = "action", level = "minor") {
      if (level !== "core") return; // pontuação/eventos menores somam no contador (sem banner central)
      bannerQueue.push({ texto, tipo, icone, mode, duration: 1.8, timer: 1.8 });
      promoteBanner();
    }

    // --- INTRODUÇÃO PAUSADA POR PERSONAGEM (CARD "PRIMEIRO CONFRONTO") ---
    // Uma vez por sessão, cada tipo de inimigo é apresentado com PAUSA TOTAL do mundo
    // (card + nome + piada; nada se move durante a apresentação; toque pula).
    // A opção "não mostrar novamente" fica persistida no navegador (por dispositivo).

    // O card é desenhado no canvas, então esconde o HUD (DOM no topo) durante a
    // exibição: o card precisa ter precedência visual sobre as pontuações.
    let hudHiddenByCard = false;
    function setHudHiddenByCard(on) {
      if (hudHiddenByCard === on) return;
      hudHiddenByCard = on;
      const hudEl = document.getElementById('hud');
      if (hudEl) hudEl.style.display = on ? 'none' : '';
    }

    function triggerEncounterIntro(typeKey, name, quip, emoji) {
      if (encounteredTypes.has(typeKey)) return;
      if (gameState !== STATE.PLAYING) return;
      if (getSkipIntrosFlag()) return;
      encounteredTypes.add(typeKey);
      lastIntroAt = performance.now();
      const card = {
        typeKey,
        name,
        quip,
        emoji: emoji || '🎭',
        duration: 2.6,
        timer: 2.6,
        hold: false
      };
      if (activeCard) {
        // Intro já em exibição: enfileira a próxima (nunca substitui a atual)
        pendingIntroQueue.push(card);
        return;
      }
      activeCard = card;
      setHudHiddenByCard(true);
      audio.playReveal();
      buzz(20);
      const fixtureKey = enemyFixtureKey(card.typeKey);
      if (fixtureKey) realAudio.playOne(fixtureKey, 0.9);
    }

    function endIntroCard() {
      if (!activeCard) return;
      if (pendingIntroQueue.length) {
        // Mostra o próximo card da fila em sequência (pausa continua até a fila esvaziar)
        activeCard = pendingIntroQueue.shift();
        activeCard.timer = activeCard.duration;
        audio.playReveal();
        buzz(20);
        const fixtureKey = enemyFixtureKey(activeCard.typeKey);
        if (fixtureKey) realAudio.playOne(fixtureKey, 0.9);
        return;
      }
      activeCard = null;
      setHudHiddenByCard(false);
      worldTimeScale = 1;
    }

    function skipIntroCard() {
      if (activeCard) endIntroCard();
    }

    // --- Opção "não mostrar apresentação novamente" (persistida por dispositivo) ---
    function getSkipIntrosFlag() {
      try { return localStorage.getItem('renan_mission_skip_intros') === '1'; } catch (err) { return false; }
    }
    function setSkipIntrosFlag(on) {
      try {
        if (on) localStorage.setItem('renan_mission_skip_intros', '1');
        else localStorage.removeItem('renan_mission_skip_intros');
      } catch (err) {}
    }
    function toggleSkipIntros() {
      const on = !getSkipIntrosFlag();
      setSkipIntrosFlag(on);
      if (activeCard) activeCard.skipChecked = on;
      const chk = document.getElementById('chk-skip-intros');
      if (chk) chk.checked = on;
      return on;
    }

    // Converte um evento pointer/touch p/ coordenadas VIRTUAIS do jogo (mesma tela do card)
    function getPointerPoint(e) {
      if (!e) return null;
      const src = (e.touches && e.touches[0]) ? e.touches[0] : e;
      if (typeof src.clientX !== 'number') return null;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const xBack = (src.clientX - rect.left) * (canvas.width / rect.width);
      const yBack = (src.clientY - rect.top) * (canvas.height / rect.height);
      return {
        x: (xBack - VIEW.ox) / VIEW.scale,
        y: (yBack - VIEW.oy) / VIEW.scale
      };
    }
    function pointInRect(pt, r) {
      return pt && r && pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
    }

    // Agenda uma função para rodar dentro do game loop (evita setTimeout fora de contexto)
    function scheduleSpawn(seconds, fn) {
      pendingSpawns.push({ t: seconds, fn });
    }

    // Card de apresentação desenhado no meio do canvas (fade in/out, ênfase editorial)
    // Layout: tag -> miniatura do sprite -> nome -> piada -> checkbox -> countdown.
    // A tag vermelha fica AFORA do alcance da miniatura (nada de sobreposição).
    const INTRO_BOX_RECT = { x: V_WIDTH / 2 - 190, y: 238, w: 380, h: 26 };
    const INTRO_SKIP_RECT = { x: V_WIDTH / 2 + 55, y: 264, w: 90, h: 22 };
    function drawIntroCard() {
      if (!activeCard) return;
      const card = activeCard;
      const alpha = Math.min(1, (card.duration - card.timer) / 0.18, card.timer / 0.25, 1);
      if (alpha <= 0) return;

      const cx = V_WIDTH / 2;
      const cw = 330;
      const ch = 196;
      const cy = 222;
      const tagText = 'NOVO INIMIGO';
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.015;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha * 0.62);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      ctx.globalAlpha = Math.max(0, alpha);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(pulse, pulse);
      ctx.translate(-cx, -cy);

      // Fundo do card
      ctx.fillStyle = 'rgba(11, 19, 36, 0.97)';
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 3;
      ctx.shadowColor = 'rgba(255,212,0,0.75)';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Tag superior: rotula o propósito do card (descrição/introdução do inimigo)
      ctx.font = '900 11px "Arial Black", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const tagW = Math.round(ctx.measureText(tagText).width + 22);
      ctx.fillStyle = '#ff5e5e';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx - tagW / 2, cy - ch / 2 + 8, tagW, 18, 9);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#081120';
      ctx.fillText(tagText, cx, cy - ch / 2 + 17);

      // Miniatura do sprite do inimigo (PNG real) no lugar do emoji
      const thumbKey = INTRO_THUMB_SPRITES[card.typeKey];
      const thumbSpr = thumbKey ? loadedSprites[thumbKey] : null;
      if (thumbSpr && thumbSpr.width && thumbSpr.height) {
        const TW = 82;
        const TH = 76;
        const sc = Math.min(TW / thumbSpr.width, TH / thumbSpr.height);
        const dw = thumbSpr.width * sc;
        const dh = thumbSpr.height * sc;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 14;
        ctx.drawImage(thumbSpr, cx - dw / 2, cy - 44 - dh / 2, dw, dh);
        ctx.shadowBlur = 0;
      } else {
        // Sem sprite (raro): mantém o emoji como fallback
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 12;
        ctx.font = '900 40px sans-serif';
        ctx.fillText(card.emoji, cx, cy - 46);
        ctx.shadowBlur = 0;
      }

      // Nome do personagem
      ctx.font = '800 22px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 2.5;
      ctx.strokeText(card.name, cx, cy - 18);
      ctx.fillStyle = '#ffd400';
      ctx.fillText(card.name, cx, cy - 18);

      // Piada/frase em 1 linha
      let quip = card.quip;
      let qSize = 13.5;
      ctx.font = `900 ${qSize}px "Arial Black", sans-serif`;
      while (ctx.measureText(quip).width > cw - 30 && qSize > 8.5) {
        qSize -= 0.5;
        ctx.font = `900 ${qSize}px "Arial Black", sans-serif`;
      }
      ctx.fillStyle = '#c6d3ea';
      ctx.fillText(quip, cx, cy + 6);

      // Checkbox "não mostrar apresentação novamente" (centralizado no card)
      const skipChecked = card.skipChecked != null ? card.skipChecked : getSkipIntrosFlag();
      const skipLabel = 'Não mostrar apresentação novamente';
      const boxS = 14;
      ctx.font = '900 10px "Arial Black", sans-serif';
      const rowW = Math.round(ctx.measureText(skipLabel).width + boxS + 8);
      const boxX = cx - rowW / 2;
      const boxY = cy + 20;
      ctx.fillStyle = '#081120';
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxS, boxS, 3);
      ctx.fill();
      ctx.stroke();
      if (skipChecked) {
        ctx.fillStyle = '#ffd400';
        ctx.font = '900 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', boxX + boxS / 2, boxY + boxS / 2 + 0.5);
      }
      ctx.textAlign = 'left';
      ctx.fillStyle = '#c6d3ea';
      ctx.fillText(skipLabel, boxX + boxS + 8, boxY + boxS / 2 + 0.5);

      // Assinatura de marca no rodapé do card
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd400';
      ctx.globalAlpha = Math.max(0, alpha * 0.9);
      ctx.font = '900 10px "Arial Black", sans-serif';
      ctx.fillText('— pra cima deles, renan! · nº 14 —', cx, cy + ch / 2 - 26);
      ctx.globalAlpha = Math.max(0, alpha);

      // Barra de countdown (tempo restante da introdução)
      const ratio = Math.max(0, Math.min(1, card.timer / card.duration));
      ctx.fillStyle = 'rgba(255, 212, 0, 0.18)';
      ctx.fillRect(cx - 138, cy + ch / 2 - 13, 276, 7);
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(cx - 138, cy + ch / 2 - 13, Math.round(276 * ratio), 7);

      // Botão PULAR (1 toque pula a introdução sem ler)
      const skipR = INTRO_SKIP_RECT;
      ctx.fillStyle = '#b01830';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(skipR.x, skipR.y, skipR.w, skipR.h, 11);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px "Arial Black", sans-serif';
      ctx.fillText('PULAR ⏭', skipR.x + skipR.w / 2, skipR.y + skipR.h / 2 + 0.5);

      // Dica contextual: pausado para leitura OU toque para pausar
      if (card.hold) {
        ctx.font = '900 10px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffd400';
        ctx.fillText('PAUSADO PARA LEITURA — TOQUE PARA CONTINUAR', cx, cy + ch / 2 + 10);
      } else if (Math.sin(performance.now() * 0.008) > -0.3) {
        ctx.font = '900 9.5px "Arial Black", sans-serif';
        ctx.fillStyle = '#6c84a8';
        ctx.fillText('TOQUE PARA PAUSAR · CLIQUE NO QUADRO PARA NÃO MOSTRAR', cx, cy + ch / 2 + 10);
      }

      ctx.restore();
      ctx.restore();
    }

    // Variáveis da Partida e Ritmo Balanceado
    // Velocidade em pixels virtuais por segundo: começa em 230 px/s e rampa até 600 px/s ao longo de ~90s
    const INITIAL_SPEED_PX = 230;
    const MAX_SPEED_PX = 600;
    let currentSpeedPx = INITIAL_SPEED_PX;
    let freezeTimer = 0;
    // Ampliação dramática do "MACHISTA!" destacado ao colidir com o drone
    let machistaFlashTimer = 0;
    // Se >0, o flash é de ABATE do drone (DRONE + votos); se 0, é o tropeço (MACHISTA -2.114)
    let machistaKillFlash = 0;
    // Streak de coleta: pop do SoundEngine sobe de tom a cada 3 coletas seguidas (expira em 1.5s)
    let collectStreak = 0;
    let collectStreakTimer = 0;
    // Assombrado pelo Espectro: 3s com pontos congelados (sem perder vida)
    let hauntedTimer = 0;
    // Overlay DOM que "cega" inclusive o HUD no pico do pulso (canvas não cobre o DOM)
    let hauntBlindShown = false;
    function setHauntBlind(show) {
      if (show === hauntBlindShown) return;
      hauntBlindShown = show;
      const el = document.getElementById('haunt-blind');
      if (el) el.style.display = show ? 'block' : 'none';
    }

    let votes = 0;
    let obstaclesCleared = 0;
    let handcuffs = 0;
    let gameTime = 0;
    let distanceCovered = 0;
    let cameraShake = 0;

    // Temporizador para controle fino de spawn
    let spawnCooldown = 3.8; // Primeiro obstáculo só após ~3.8s de jogo
    let perkCooldown = 8.0;  // Primeiro perk em ~8s

    // Multiplicadores e Perks Ativos
    let cardMultiplierTimer = 0;    // Carta Valete x2
    let flagComboCount = 0;         // Combo Bandeira Clássica
    let imperialModeTimer = 0;      // Bandeira Imperial x3 + invencibilidade
    let bookInvincibleTimer = 0;    // Livro Amarelo invencibilidade
    let oncaRidingTimer = 0;        // Onça Pintada invencível + atropelamento
    // --- EVENTO OVERDRIVE UNIFICADO (onça pintada + modo imperial) ---
    // Onça e Imperial compartilham o MESMO evento de apresentação para o futuro
    // (textos, efeitos de tela e outras variações entram aqui; a música é sempre game.mp3).
    let overdriveKind = null;             // 'onca' | 'imperial' | null
    let overdriveHashtagUsedThisRun = false; // hashtag só 1x por run
    let hasShield = false;          // Broche R14 absorve 1 colisão
    let hasSwordStrike = false;     // Espadim de Tiradentes (one-shot próximo obstáculo)

    // Minichefia Ladrão de Celular (sequência de 3 ladrões)
    let thiefSquadActive = false;
    let thiefSquadCount = 0;
    let thiefSquadCaught = 0;
    let squadHashtagUsedThisRun = false; // hashtag da quadrilha só 1x por run
    let espectroForcedThisRun = false;   // aparição FORÇADA do Espectro aos 30s (1x por run)

    // Prisioneiros capturados (MC e Ladrões) para dinâmica da Militante
    let prisonersHeld = 0;

    // O MC capturado ainda está na "cadeia"? (libertado pela Militante → fuga com balão)
    let mcInJail = false;

    // MC escapando em corrida após ser libertado pela Militante
    const escapingMCs = [];

    // Avisos de reação em cadeia (inimigo gerado após neutralizar outro)
    const chainSpawnWarnings = [];

    // Listas do Mundo
    let pulpits = [];
    let obstacles = [];
    let collectibles = [];
    let particles = [];
    let floatingTexts = [];
    let flagSweep = null; // Vassourada da Bandeira: pulso dourado que limpa a tela

    // Adversários exclusivos (apenas LULA e FLÁVIO alternados nos púlpitos)
    const CANDIDATE_INSULTS = {
      "LULA": "LULA LADRÃO",
      "FLÁVIO": "FLÁVIO CAGÃO"
    };
    const CANDIDATE_LIST = ["LULA", "FLÁVIO"];
    let nextCandidateIndex = 0;

    // --- SISTEMA DE CARREGAMENTO EM 3 CAMADAS + CHROMA-KEY (#00FF00) + FALLBACK PROCEDURAL ---
    const SPRITE_URLS = {
      // Sprites Oficiais do Renan
      run1: "./assets/renan-correndo1.png",
      run2: "./assets/renan-correndo2.png",
      run3: "./assets/renan-correndo3.png",
      jump: "./assets/renan-pulando.png",

      // Obstáculos Integrados
      jornalista: "./assets/jornalista.png",
      exmbl: "./assets/ex-MBL.png",
      mc: "./assets/MC-Latrocínio.png",
      ladrao: "./assets/Ladrao.png",
      militante: "./assets/Militante.png",
      drone: "./assets/Drone.png",
      toga: "./assets/Toga.png",
      espectro: "./assets/Espectro.png",

      // Perks & Coletáveis
      onca: "./assets/ONCA.png",
      espadim: "./assets/Espadim.png",
      valete: "./assets/Carta-Valete.png",
      livro: "./assets/LivroAmarelo.png",
      broche: "./assets/broche-r14.png",
      classica: "./assets/Bandeira-classica.png",
      imperial: "./assets/Bandeira-Imperial.png"
    };

    const loadedSprites = {};

    function applyChromaKeyToSource(sourceImg) {
      try {
        const w = sourceImg.width || sourceImg.naturalWidth;
        const h = sourceImg.height || sourceImg.naturalHeight;
        if (!w || !h) return null;

        const off = document.createElement('canvas');
        off.width = w;
        off.height = h;
        const oCtx = off.getContext('2d', { willReadFrequently: true });
        if (!oCtx) return null;

        oCtx.drawImage(sourceImg, 0, 0);
        const imgData = oCtx.getImageData(0, 0, w, h);
        const d = imgData.data;

        // Regra solicitada: pixel g>120 && g>r+60 && g>b+60 -> alpha=0; borda g>r+30 && g>b+30 -> alpha*=0.4
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          if (g > 120 && g > r + 60 && g > b + 60) {
            d[i + 3] = 0;
          } else if (g > r + 30 && g > b + 30) {
            d[i + 3] = Math.floor(d[i + 3] * 0.4);
          }
        }

        oCtx.putImageData(imgData, 0, 0);
        return off;
      } catch (err) {
        // NUNCA desenhar imagem crua com fundo verde; retorna null para ativar o fallback procedural bonito
        return null;
      }
    }

    // Carregamento resiliente em 3 camadas por sprite:
    // a) fetch(mode: 'cors') -> blob -> createImageBitmap (nunca suja canvas)
    // b) new Image com crossOrigin='anonymous' -> chroma-key
    // c) onerror / falha -> fallback procedural
    async function loadSingleSprite(key, url) {
      // Camada a: fetch -> blob -> createImageBitmap
      try {
        if (typeof window.fetch === 'function' && typeof window.createImageBitmap === 'function') {
          const resp = await fetch(url, { mode: 'cors' });
          if (resp.ok) {
            const blob = await resp.blob();
            const bitmap = await createImageBitmap(blob);
            const processed = applyChromaKeyToSource(bitmap);
            if (processed) {
              loadedSprites[key] = processed;
              return;
            }
          }
        }
      } catch (e) {
        // Ignora e segue para a camada b
      }

      // Camada b: new Image com crossOrigin
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const processed = applyChromaKeyToSource(img);
          loadedSprites[key] = processed || null;
        };
        img.onerror = () => {
          loadedSprites[key] = null; // Camada c: fallback procedural
        };
        img.src = url;
      } catch (err) {
        loadedSprites[key] = null;
      }
    }

    function loadSprites() {
      Object.keys(SPRITE_URLS).forEach(k => {
        loadSingleSprite(k, SPRITE_URLS[k]);
      });
    }

    loadSprites();

    // --- PERSONAGEM RENAN (POSICIONADO A 36% DA TELA PARA VISÃO LIVRE À FRENTE) ---
    const RENAN_X_RATIO = 0.36; // 36% da largura virtual do canvas (~151px de 420px)

    const renan = {
      x: Math.round(V_WIDTH * RENAN_X_RATIO),
      y: GROUND_Y - 84,
      w: 42,              // Hitbox balanceada
      h: 84,              // Altura proporcional (~84-90px)
      vy: 0,
      gravity: 0.65,
      jumpForce: -11.6,
      isGrounded: true,
      isFastFalling: false,
      animTimer: 0,
      currentPlatform: null,

      reset() {
        this.x = Math.round(V_WIDTH * RENAN_X_RATIO);
        this.y = GROUND_Y - this.h;
        this.vy = 0;
        this.isGrounded = true;
        this.isFastFalling = false;
        this.animTimer = 0;
        this.currentPlatform = null;
      },

      update(dt) {
        // Gravidade e Fast-Fall (2º toque no ar para descer rápido)
        const currentGrav = this.isFastFalling ? this.gravity * 2.8 : this.gravity;
        this.vy += currentGrav;

        // Limite terminal de velocidade
        if (this.vy > 18) this.vy = 18;

        this.y += this.vy;

        // Ciclo de corrida
        if (this.isGrounded) {
          const speedFactor = currentSpeedPx / INITIAL_SPEED_PX;
          this.animTimer += (dt || 0.016) * speedFactor * 1000;
        }

        // Verificação de pouso no chão
        if (this.y >= GROUND_Y - this.h) {
          this.y = GROUND_Y - this.h;
          if (!this.isGrounded) {
            audio.playLand();
            if (this.isFastFalling) {
              spawnDust(this.x + this.w / 2, GROUND_Y, 8);
            }
          }
          this.vy = 0;
          this.isGrounded = true;
          this.isFastFalling = false;
          this.currentPlatform = null;
        } else {
          this.isGrounded = false;
        }

        // Se estava sobre o púlpito e saiu da borda, desce
        if (this.currentPlatform) {
          const p = this.currentPlatform;
          if (this.x + this.w < p.x || this.x > p.x + p.w) {
            this.currentPlatform = null;
          }
        }
      },

      draw() {
        // Montaria na Onça Pintada
        if (oncaRidingTimer > 0) {
          this.drawOncaRiding();
          return;
        }

        // Auréola de Invencibilidade ou Escudo R14
        if (this.isInvincible()) {
          const ending = perkIsEnding();
          const blinkOff = ending && perkBlinkOff();
          if (!blinkOff) {
            ctx.save();
            ctx.strokeStyle = ending ? '#ff2d55' : '#ffd400';
            ctx.lineWidth = ending ? 4.5 : 3.5;
            ctx.shadowColor = ending ? '#ff2d55' : '#ffd400';
            ctx.shadowBlur = ending ? 22 : 14;
            ctx.beginPath();
            ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 46, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }
        } else if (hasShield) {
          ctx.save();
          ctx.strokeStyle = '#3498db';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 44, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (spawnGraceTimer > 0) {
          // Graça de respawn: anel azul pulsante para comunicar invulnerabilidade inicial
          ctx.save();
          ctx.globalAlpha = 0.5 + Math.sin(performance.now() * 0.02) * 0.35;
          ctx.strokeStyle = '#5dade2';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#5dade2';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 50, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Tenta usar o sprite com chroma-key tratado (camadas a/b)
        let currentSprite = null;
        if (this.isGrounded) {
          const step = Math.floor(this.animTimer / 100) % 3;
          if (step === 0) currentSprite = loadedSprites.run1;
          else if (step === 1) currentSprite = loadedSprites.run2;
          else currentSprite = loadedSprites.run3;
        } else {
          currentSprite = loadedSprites.jump;
        }

        if (currentSprite && currentSprite.width) {
          ctx.save();
          const aspect = currentSprite.width / currentSprite.height;
          const drawH = 90;
          const drawW = drawH * aspect;
          const drawX = this.x + (this.w - drawW) / 2;
          const drawY = this.y + this.h - drawH;
          ctx.drawImage(currentSprite, drawX, drawY, drawW, drawH);
          ctx.restore();
          return;
        }

        // REGRA ABSOLUTA: FALLBACK PROCEDURAL BONITO (sem imagem verde, sem quebra)
        this.drawProcedural();
      },

      isInvincible() {
        return oncaRidingTimer > 0 || imperialModeTimer > 0 || bookInvincibleTimer > 0;
      },

      drawOncaRiding() {
        const ending = perkIsEnding();
        const blinkOff = ending && perkBlinkOff();
        ctx.save();
        if (blinkOff) ctx.globalAlpha = 0.4;
        if (ending && !blinkOff) {
          ctx.save();
          ctx.strokeStyle = '#ff2d55';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ff2d55';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.ellipse(this.x - 20 + 43, this.y + 10 + 22, 55, 34, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        const oncaSprite = loadedSprites.onca;
        const rideBob = Math.sin(performance.now() * 0.018) * 2;
        const ox = this.x - 20;
        const oy = this.y + 10 + rideBob;
        const ow = 86;
        const oh = 66;

        if (oncaSprite && oncaSprite.width) {
          ctx.drawImage(oncaSprite, ox, oy, ow, oh);
        } else {
          // Fallback procedural para a Onça Pintada
          ctx.fillStyle = '#e67e22';
          ctx.beginPath();
          ctx.roundRect(ox, oy + 20, ow, 36, 12);
          ctx.fill();
          ctx.fillStyle = '#0b1528';
          ctx.beginPath();
          ctx.arc(ox + 20, oy + 32, 4, 0, Math.PI * 2);
          ctx.arc(ox + 45, oy + 28, 4, 0, Math.PI * 2);
          ctx.arc(ox + 65, oy + 34, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Renan montado: usa os SPRITES oficiais (run/jump), não o boneco de polígonos
        const riderSprite = this.isGrounded
          ? (loadedSprites['run' + ((Math.floor(this.animTimer / 100) % 3) + 1)] || loadedSprites.run1)
          : loadedSprites.jump;

        if (riderSprite && riderSprite.width) {
          const aspect = riderSprite.width / riderSprite.height;
          const drawH = 56;
          const drawW = drawH * aspect;
          const drawX = ox + (ow - drawW) / 2 + Math.sin(performance.now() * 0.022) * 1.5;
          const feetY = oy + 20;
          ctx.drawImage(riderSprite, drawX, feetY - drawH, drawW, drawH);
          ctx.restore();
          return;
        }

        // Sem sprite disponível: cai no fallback procedural bonito
        this.drawProcedural();
        ctx.restore();
      },

      // Desenho 100% vetorial no canvas: caricatura lateral correndo para a direita (Fallback resiliente)
      drawProcedural() {
        ctx.save();
        const cx = this.x + this.w / 2;
        const baseY = this.y + this.h;

        // Ciclo de corrida (3 poses alternadas a cada ~100ms: 0 -> 1 -> 2 -> 1) ou pose de pulo
        let pose = 0;
        let bobY = 0;
        if (this.isGrounded) {
          const frameDur = 100;
          const step = Math.floor(this.animTimer / frameDur) % 4;
          pose = (step === 3) ? 1 : step;
          bobY = (pose === 1) ? -1.8 : 0; // Balanço vertical sutil (bobbing 1-2px)
        } else {
          pose = 'jump';
          bobY = 0;
        }

        const torsoTop = baseY - 52 + bobY;
        const hipY = baseY - 26 + bobY;
        const shoeY = baseY - 2;

        // Função auxiliar interna para desenhar uma fralda branca com nome em vermelho
        const drawDiaper = (dx, dy, rot, name) => {
          ctx.save();
          ctx.translate(dx, dy);
          ctx.rotate(rot);

          // Corpo da fralda branca
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#cad5e2';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(-9, -6, 18, 13, [3, 3, 5, 5]);
          ctx.fill();
          ctx.stroke();

          // Abas adesivas amarelas
          ctx.fillStyle = '#ffd400';
          ctx.fillRect(-8, -5, 3, 2.2);
          ctx.fillRect(5, -5, 3, 2.2);

          // Texto manuscrito em vermelho irregular
          ctx.fillStyle = '#d32f2f';
          ctx.font = '900 6.5px -apple-system, BlinkMacSystemFont, "Arial Black", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(name, 0, 1.2);

          ctx.restore();
        };

        // 1. BRAÇO TRASEIRO E FRALDA "LULA" (desenhados atrás do tronco para profundidade)
        ctx.strokeStyle = '#1e3a6e';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';

        if (pose === 'jump') {
          // No pulo: braço traseiro erguido segurando a fralda "LULA" para o alto
          ctx.beginPath();
          ctx.moveTo(cx - 6, torsoTop + 8);
          ctx.lineTo(cx - 16, torsoTop - 8);
          ctx.stroke();
          drawDiaper(cx - 20, torsoTop - 12, -0.32, 'LULA');
        } else if (pose === 0) {
          // Passada 0: braço traseiro balança para trás
          ctx.beginPath();
          ctx.moveTo(cx - 6, torsoTop + 8);
          ctx.lineTo(cx - 16, torsoTop + 14);
          ctx.stroke();
          drawDiaper(cx - 19, torsoTop + 16, -0.28, 'LULA');
        } else if (pose === 1) {
          // Passada 1 (neutra/passagem): braço traseiro próximo ao quadril
          ctx.beginPath();
          ctx.moveTo(cx - 5, torsoTop + 8);
          ctx.lineTo(cx - 13, torsoTop + 12);
          ctx.stroke();
          drawDiaper(cx - 15, torsoTop + 14, -0.15, 'LULA');
        } else {
          // Passada 2: braço traseiro balança para frente
          ctx.beginPath();
          ctx.moveTo(cx - 5, torsoTop + 8);
          ctx.lineTo(cx + 12, torsoTop + 11);
          ctx.stroke();
          drawDiaper(cx + 15, torsoTop + 12, 0.22, 'LULA');
        }

        // 2. PERNAS E SAPATOS (Calça terno azul #1e3a6e e sapato preto)
        ctx.lineWidth = 4.6;
        ctx.strokeStyle = '#1e3a6e';
        ctx.lineCap = 'round';

        if (pose === 'jump') {
          // Pulo: pernas dobradas/recolhidas atleticamente
          ctx.beginPath();
          ctx.moveTo(cx - 4, hipY);
          ctx.lineTo(cx - 13, hipY + 11);
          ctx.lineTo(cx - 7, shoeY - 6);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 4, hipY);
          ctx.lineTo(cx + 11, hipY + 9);
          ctx.lineTo(cx + 6, shoeY - 4);
          ctx.stroke();

          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(cx - 12, shoeY - 8, 9, 4);
          ctx.fillRect(cx + 4, shoeY - 6, 9, 4);
        } else if (pose === 0) {
          // Perna dianteira avançando, traseira empurrando
          ctx.beginPath();
          ctx.moveTo(cx - 4, hipY);
          ctx.lineTo(cx + 8, shoeY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 4, hipY);
          ctx.lineTo(cx - 10, shoeY);
          ctx.stroke();

          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(cx + 5, shoeY - 2, 10, 4);
          ctx.fillRect(cx - 15, shoeY - 2, 9, 4);
        } else if (pose === 1) {
          // Pernas alinhadas no ponto de cruzamento
          ctx.beginPath();
          ctx.moveTo(cx - 3, hipY);
          ctx.lineTo(cx - 1, shoeY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 3, hipY);
          ctx.lineTo(cx + 4, shoeY);
          ctx.stroke();

          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(cx - 5, shoeY - 2, 9, 4);
          ctx.fillRect(cx + 2, shoeY - 2, 9, 4);
        } else {
          // Perna dianteira recuando, traseira avançando
          ctx.beginPath();
          ctx.moveTo(cx - 4, hipY);
          ctx.lineTo(cx - 11, shoeY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx + 4, hipY);
          ctx.lineTo(cx + 9, shoeY);
          ctx.stroke();

          ctx.fillStyle = '#0a0d14';
          ctx.fillRect(cx - 15, shoeY - 2, 9, 4);
          ctx.fillRect(cx + 6, shoeY - 2, 10, 4);
        }

        // 3. TRONCO E TERNO AZUL #1e3a6e COM CONTORNO ESCURO
        const torsoH = 28;
        ctx.fillStyle = '#1e3a6e';
        ctx.strokeStyle = '#0a162d';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(cx - 11, torsoTop, 22, torsoH, [4, 5, 2, 2]);
        ctx.fill();
        ctx.stroke();

        // Colarinho da camisa branca (triângulo)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(cx - 3, torsoTop);
        ctx.lineTo(cx + 7, torsoTop);
        ctx.lineTo(cx + 2, torsoTop + 10);
        ctx.closePath();
        ctx.fill();

        // Gravata amarela vibrante
        ctx.fillStyle = '#ffd400';
        ctx.strokeStyle = '#b89000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, torsoTop + 2);
        ctx.lineTo(cx + 4, torsoTop + 2);
        ctx.lineTo(cx + 4.5, torsoTop + 14);
        ctx.lineTo(cx + 2, torsoTop + 19);
        ctx.lineTo(cx - 0.5, torsoTop + 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Broche R14 na lapela
        ctx.fillStyle = '#ffd400';
        ctx.beginPath();
        ctx.arc(cx - 5.5, torsoTop + 11, 4.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#0b1528';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#0b1528';
        ctx.font = '900 4px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('R14', cx - 5.5, torsoTop + 11.2);

        // 4. CABEÇA E ROSTO (Círculo pêssego, cabelo marrom, cara virada para a direita)
        const headR = 11;
        const headCX = cx + 2;
        const headCY = torsoTop - 12;

        // Cabeça pêssego com contorno
        ctx.fillStyle = '#fcd0a1';
        ctx.strokeStyle = '#0b1528';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(headCX, headCY, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nariz caricato de perfil
        ctx.fillStyle = '#f5b880';
        ctx.beginPath();
        ctx.arc(headCX + 8, headCY, 2.5, -Math.PI * 0.4, Math.PI * 0.4);
        ctx.fill();

        // Barba desenhada
        ctx.fillStyle = '#5c3a22';
        ctx.beginPath();
        ctx.arc(headCX, headCY, headR - 0.5, Math.PI * 0.18, Math.PI * 0.65);
        ctx.lineTo(headCX + 8, headCY + 5);
        ctx.lineTo(headCX + 7, headCY + 8);
        ctx.closePath();
        ctx.fill();

        // Cabelo marrom desenhado
        ctx.fillStyle = '#3e2315';
        ctx.beginPath();
        ctx.arc(headCX - 1, headCY - 2, headR + 1.2, Math.PI * 0.72, Math.PI * 2.15);
        ctx.lineTo(headCX + 10, headCY - 7);
        ctx.lineTo(headCX + 7, headCY - 4);
        ctx.lineTo(headCX + 8, headCY - 1);
        ctx.lineTo(headCX + 4, headCY - 5);
        ctx.closePath();
        ctx.fill();

        // Olho focado para frente
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(headCX + 5, headCY - 1.5, 3.2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(headCX + 6, headCY - 1.5, 1.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(headCX + 6.6, headCY - 2.2, 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Sobrancelha determinada
        ctx.strokeStyle = '#22130b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(headCX + 2.5, headCY - 4.5);
        ctx.lineTo(headCX + 9, headCY - 3.2);
        ctx.stroke();

        // Boca séria
        ctx.strokeStyle = '#6d3b28';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(headCX + 4, headCY + 4.5);
        ctx.lineTo(headCX + 8, headCY + 4.2);
        ctx.stroke();

        // 5. BRAÇO DIANTEIRO E FRALDA "FLAVIO"
        ctx.strokeStyle = '#1e3a6e';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';

        if (pose === 'jump') {
          // No pulo: braço dianteiro erguido segurando a fralda "FLAVIO" no alto
          ctx.beginPath();
          ctx.moveTo(cx + 6, torsoTop + 8);
          ctx.lineTo(cx + 16, torsoTop - 8);
          ctx.stroke();
          drawDiaper(cx + 19, torsoTop - 11, 0.32, 'FLAVIO');
        } else if (pose === 0) {
          // Passada 0: braço dianteiro balança para frente
          ctx.beginPath();
          ctx.moveTo(cx + 6, torsoTop + 8);
          ctx.lineTo(cx + 17, torsoTop + 10);
          ctx.stroke();
          drawDiaper(cx + 20, torsoTop + 10, 0.26, 'FLAVIO');
        } else if (pose === 1) {
          // Passada 1 (neutra/passagem): braço dianteiro junto ao tronco
          ctx.beginPath();
          ctx.moveTo(cx + 6, torsoTop + 8);
          ctx.lineTo(cx + 14, torsoTop + 12);
          ctx.stroke();
          drawDiaper(cx + 16, torsoTop + 14, 0.16, 'FLAVIO');
        } else {
          // Passada 2: braço dianteiro balança para trás
          ctx.beginPath();
          ctx.moveTo(cx + 6, torsoTop + 8);
          ctx.lineTo(cx - 15, torsoTop + 12);
          ctx.stroke();
          drawDiaper(cx - 17, torsoTop + 14, -0.3, 'FLAVIO');
        }

        ctx.restore();
      }
    };

    // --- CONTROLES (Toque / Espaço / Clique) ---
    let inputHeld = false;
    let jumpHeldTime = 0;
    const MAX_HOLD_TIME = 16; // Quadros permitidos para segurar e ganhar altura extra

    function handleInputStart(e) {
      audio.init();

      // Pausado: ignora toque de pulo (retomar só pelo botão ou tecla P/Esc)
      if (isPaused) return;

      // Toque durante o card de introdução: marcar "não mostrar novamente", pular,
      // ou pausar/retomar a contagem para leitura com calma.
      if (activeCard) {
        const pt = getPointerPoint(e);
        if (pointInRect(pt, INTRO_BOX_RECT)) {
          toggleSkipIntros();
          return;
        }
        if (pointInRect(pt, INTRO_SKIP_RECT)) {
          skipIntroCard();
        } else {
          activeCard.hold = !activeCard.hold;
          return;
        }
      }

      if (gameState === STATE.MENU) {
        if (!menuIntroDone) return; // animação de entrada ainda em andamento
        requestStartGame();
        return;
      }
      if (gameState === STATE.GAMEOVER) {
        return;
      }

      inputHeld = true;

      if (renan.isGrounded) {
        // Primeiro toque no chão: INICIA PULO
        renan.vy = renan.jumpForce;
        renan.isGrounded = false;
        jumpHeldTime = 0;
        audio.playJump(false);
        spawnDust(renan.x + renan.w / 2, renan.y + renan.h, 6);
        buzz(12);
      } else if (!renan.isFastFalling) {
        // Segundo toque enquanto estiver no ar: FAST-FALL para pouso de precisão
        renan.isFastFalling = true;
        renan.vy = Math.max(renan.vy, 11);
        audio.playDive();
        buzz(10);
      }
    }

    function handleInputEnd() {
      inputHeld = false;
    }

    // Ouvintes de Eventos (Desktop + Touch Mobile)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (!e.repeat) {
          const gl = document.getElementById('glossary-modal');
          if (gl && !gl.classList.contains('hidden')) {
            closeGlossary();
          } else {
            togglePause();
          }
        }
        return;
      }
      // Replay instantâneo na tela final: Espaço / ↑ / R (sem passar por menu)
      if (gameState === STATE.GAMEOVER && (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyR')) {
        e.preventDefault();
        if (!e.repeat) startGame();
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!e.repeat) handleInputStart();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInputEnd();
      }
    });

    // Touch direto na tela do canvas
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleInputStart(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleInputEnd();
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleInputStart(e);
    });

    window.addEventListener('mouseup', () => {
      handleInputEnd();
    });

    // --- ENTIDADES DO MUNDO ---

    // Púlpito de Debate
    class Pulpit {
      constructor(x, candidateName) {
        this.x = x;
        this.w = 68;
        this.h = 68;
        this.y = GROUND_Y - this.h;
        this.candidateName = candidateName || CANDIDATE_LIST[0];
        this.hasDiaper = false;
        this.diaperScale = 0;
        this.cleared = false;
        this.stumbled = false;   // já "tropeçou" nesta passagem
        this.age = 0;            // relógio de animação
        this.bubbleTimer = 0;    // controla o balão de fala
      }

      update(dx, dt) {
        this.x -= dx;
        this.age += dt;
        if (this.diaperScale > 1) {
          this.diaperScale = Math.max(1, this.diaperScale - 0.1);
        }
        // Balão de fala persistente enquanto o púlpito estiver em tela
        this.bubbleTimer -= dt;
        if (this.bubbleTimer <= 0) {
          this.bubbleTimer = this.hasDiaper ? 0.5 : 2.2;
        }
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Bob sutil de "vida" do púlpito (eco de mídia)
        const bob = Math.sin(this.age * 4) * 1.2;
        ctx.translate(0, bob);

        // Balão de fala do candidato (somente enquanto o púlpito estiver por perto)
        if (this.bubbleTimer < 1.4 && !this.hasDiaper) {
          drawSpeechBubble(this.w / 2, -6, CANDIDATE_INSULTS[this.candidateName] || `${this.candidateName} FUJÃO!`, this.candidateName);
        }

        // Palanque / Corpo de madeira nobre do púlpito
        ctx.fillStyle = '#18243c';
        ctx.strokeStyle = '#2b3f66';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(3, 8, this.w - 6, this.h - 8, [0, 0, 6, 6]);
        ctx.fill();
        ctx.stroke();

        // Topo do púlpito
        ctx.fillStyle = '#22365a';
        ctx.fillRect(0, 4, this.w, 6);
        ctx.fillStyle = '#ffd400';
        ctx.fillRect(0, 3, this.w, 1.5);

        // Haste e microfone
        ctx.strokeStyle = '#a4bddc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 4);
        ctx.lineTo(20, -12);
        ctx.stroke();

        ctx.fillStyle = '#ffd400';
        ctx.beginPath();
        ctx.arc(21, -14, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // NOME DO CANDIDATO ESTAMPADO DIRETO NO PALANQUE (sem caixa que possa estourar)
        const nameX = this.w / 2;
        const nameY = 33;
        let nameFont = 13;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `900 ${nameFont}px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        let nameW = ctx.measureText(this.candidateName).width;
        while (nameW > this.w - 12 && nameFont > 8) {
          nameFont -= 1;
          ctx.font = `900 ${nameFont}px "Arial Black", sans-serif`;
          nameW = ctx.measureText(this.candidateName).width;
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText(this.candidateName, nameX, nameY);
        ctx.fillStyle = '#0a1426';
        ctx.fillText(this.candidateName, nameX, nameY);

        // Fralda colocada
        if (this.hasDiaper) {
          ctx.save();
          ctx.translate(this.w / 2, 4);
          ctx.scale(this.diaperScale, this.diaperScale);

          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#ffd400';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(18, 0);
          ctx.quadraticCurveTo(16, 20, 0, 24);
          ctx.quadraticCurveTo(-16, 20, -18, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Carimbo "LADRÃO" em vermelho manuscrito
          ctx.rotate(-0.1);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '900 7px "Arial Black", sans-serif';
          ctx.fillStyle = '#d32f2f';
          ctx.fillText('LADRÃO', 0, 9);
          ctx.restore();
        }

        ctx.restore();
      }
    }

    // --- CLASSES DE OBSTÁCULOS COM FALLBACK PROCEDURAL BONITO E RÓTULOS LEGÍVEIS ---
    // Fonte mínima 11px em negrito com contorno escuro e pequeno alerta piscante opcional

    function drawEntityLabel(x, y, text, color = '#ffd400') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 11.5px "Arial Black", sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3.5;
      ctx.strokeText(text, x, y);
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function drawWarningIcon(x, y) {
      // No-op: ⚠️ fixo acima de cada inimigo era ruído visual; reação agora é interpretada no corpo do inimigo
    }

    // --- HELPERS DE ANIMAÇÃO DE ENTIDADES ---
    // Quadro base de cada inimigo: bob de "vida" OU squash+fade ao ser neutralizado.
    function beginEntityFrame(e, bobFreq, bobAmp) {
      ctx.save();
      if (e.neutralized) {
        const t = Math.min(1, (e.deathT || 0));
        const sy = Math.max(0.12, 1 - t * 1.1);
        const alpha = Math.max(0, 1 - t * 1.5);
        const bx = e.x + e.w / 2;
        const by = e.y + e.h;
        ctx.translate(bx, by);
        ctx.scale(1, sy);
        ctx.translate(-bx, -by);
        ctx.globalAlpha = alpha;
        return;
      }
      const bob = Math.sin((e.age || 0) * bobFreq) * bobAmp;
      ctx.translate(0, bob);
    }

    function endEntityFrame() {
      ctx.restore();
    }

    // Avança os relógios de animação de um inimigo (age/bubble/death).
    function advanceEntityAnim(e, dt) {
      e.age = (e.age || 0) + dt;
      if (e.neutralized && (e.deathT || 0) < 1) {
        e.deathT = Math.min(1, (e.deathT || 0) + dt * 2.4);
      } else if (!e.neutralized) {
        if (typeof e.bubbleTimer !== 'number') e.bubbleTimer = 0;
        e.bubbleTimer -= dt;
        if (e.bubbleTimer <= 0) e.bubbleTimer = e.bubblePeriod || 2.4;
      }
    }

    // Balão de fala persistente (~55% do ciclo visível) e legível acima do inimigo.
    function entityBubble(e, name, quip, period, persist) {
      if (activeCard) return; // durante a introdução o card já apresenta o personagem
      if (e.neutralized || e.x > V_WIDTH + 60 || e.x + e.w < -40) return;
      const p = period || e.bubblePeriod || 2.4;
      if (!persist && e.bubbleTimer <= p * 0.45) return;
      drawSpeechBubble(e.x + e.w / 2, e.y - 8, quip, name);
    }

    // Balão de fala estilizado (quadro branco, borda escura, rabinho, legível).
    function drawSpeechBubble(x, y, text, name, maxWidth, urgent) {
      ctx.save();
      const maxW = maxWidth || (urgent ? 330 : 188);
      const fontFamily = '"Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const padX = 12;

      // Quebra em várias linhas mantendo fonte legível (mín. 11px; urgente 12px p/ bem visível) — balão cresce, texto não encolhe demais
      let fontSize = urgent ? 16 : 13;
      let lines;
      while (true) {
        ctx.font = `900 ${fontSize}px ${fontFamily}`;
        const words = text.split(/\s+/);
        lines = [];
        let cur = '';
        for (const w of words) {
          const candidate = cur ? cur + ' ' + w : w;
          if (cur && ctx.measureText(candidate).width > maxW - padX * 2) {
            lines.push(cur);
            cur = w;
          } else {
            cur = candidate;
          }
        }
        if (cur) lines.push(cur);
        const widest = Math.max.apply(null, lines.map(l => ctx.measureText(l).width));
        if (widest <= maxW - padX * 2 || fontSize <= (urgent ? 12 : 11)) break;
        fontSize -= 0.5;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineHeight = Math.ceil(fontSize * 1.25);
      const bw = Math.min(maxW, Math.ceil(Math.max.apply(null, lines.map(l => ctx.measureText(l).width)) + padX * 2));
      const bh = lines.length * lineHeight + 12;
      let bx = x - bw / 2;
      // Nunca deixa o balão escapar da tela (espectro fica no canto direito)
      bx = Math.max(6, Math.min(bx, V_WIDTH - bw - 6));
      const bxc = bx + bw / 2; // centro real da caixa (o rabinho segue o personagem em x)
      const by = y - bh;

      // Rabinho apontando para o personagem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 3);
      ctx.lineTo(x + 5, y - 3);
      ctx.lineTo(x, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = urgent ? '#c62828' : '#0b1528';
      ctx.lineWidth = urgent ? 3 : 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = urgent ? '#c62828' : '#0b1528';
      ctx.lineWidth = urgent ? 3 : 2;
      ctx.shadowColor = urgent ? 'rgba(198, 40, 40, 0.6)' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = urgent ? 12 : 8;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Texto centralizado na caixa real (que pode ter sido deslocada p/ ficar dentro da tela).
      // Traçado + preenchimento deixam as letras grossas p/ leitura em movimento; mas no modo
      // pixel (baixa resolução + upscale) o traçado vira uma borra que confunde as palavras —
      // ali só se usa o preenchimento da fonte Pixelify (que já nasce gorda).
      const textColor = urgent ? '#8b0000' : '#0b1528';
      ctx.fillStyle = textColor;
      const startY = by + (bh - lines.length * lineHeight) / 2 + lineHeight / 2;
      if (!PIXEL_MODE) {
        ctx.strokeStyle = urgent ? 'rgba(139, 0, 0, 0.9)' : 'rgba(11, 21, 40, 0.92)';
        ctx.lineWidth = urgent ? 3 : 2;
        ctx.lineJoin = 'round';
        lines.forEach((ln, i) => {
          ctx.strokeText(ln, bxc, startY + i * lineHeight);
          ctx.fillText(ln, bxc, startY + i * lineHeight);
        });
      } else {
        lines.forEach((ln, i) => {
          ctx.fillText(ln, bxc, startY + i * lineHeight);
        });
      }

      if (name) {
        ctx.font = `900 ${urgent ? 11 : 9.5}px "Arial Black", sans-serif`;
        const nameColor = urgent ? '#b71c1c' : '#6c84a8';
        ctx.fillStyle = nameColor;
        if (!PIXEL_MODE) {
          ctx.strokeStyle = 'rgba(255,255,255,0.9)';
          ctx.lineWidth = 2;
          ctx.strokeText(name, bxc, by - 7);
        }
        ctx.fillText(name, bxc, by - 7);
      }
      ctx.restore();
    }

    // 1. JORNALISTA
    class JornalistaObstacle {
      constructor(x) {
        this.x = x;
        this.w = 52;
        this.h = 80;
        this.y = GROUND_Y - this.h;
        this.neutralized = false;
        this.exitVx = 0;
        this.exitVy = 0;
        this.cleared = false;
        this.bubblePeriod = 2.1;
      }

      update(dx, dt) {
        if (!this.neutralized) {
          this.x -= dx;
        } else {
          this.x += this.exitVx * dt;
          this.y += this.exitVy * dt;
        }
      }

      neutralize() {
        if (this.neutralized) return;
        this.neutralized = true;
        this.exitVx = -140;
        this.exitVy = -90;
        spawnParticles(this.x + this.w / 2, this.y + 20, '#ffd400', 12);
      }

      draw() {
        beginEntityFrame(this, 8, 1.8);
        const spr = loadedSprites.jornalista;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural bonito: retângulo alto rosa #e57373, cabeça com cabelo preso, mini-microfone
          ctx.fillStyle = '#e57373';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 8, this.y + 26, this.w - 16, this.h - 26, [4, 4, 2, 2]);
          ctx.fill();
          ctx.stroke();

          // Cabeça
          ctx.fillStyle = '#fbd4b4';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + 14, 11, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cabelo preso
          ctx.fillStyle = '#3e2723';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2 - 3, this.y + 10, 11, Math.PI * 0.8, Math.PI * 2.1);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2 - 12, this.y + 9, 5, 0, Math.PI * 2);
          ctx.fill();

          // Mini microfone (linha + círculo cinza)
          ctx.strokeStyle = '#90a4ae';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(this.x + this.w - 12, this.y + 40);
          ctx.lineTo(this.x + this.w - 6, this.y + 26);
          ctx.stroke();
          ctx.fillStyle = '#37474f';
          ctx.beginPath();
          ctx.arc(this.x + this.w - 6, this.y + 24, 4, 0, Math.PI * 2);
          ctx.fill();

          drawEntityLabel(this.x + this.w / 2, this.y + 50, 'JORNALISTA', '#ffffff');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 10 + Math.sin((this.age || 0) * 10) * 2);
          entityBubble(this, 'JORNALISTA', 'E O FEMINICÍDIO?');
          
        }
        endEntityFrame();
      }
    }

    // 2. EX-MBL
    class ExMblObstacle {
      constructor(x) {
        this.x = x;
        this.w = 48;
        this.h = 72;
        this.y = GROUND_Y - this.h;
        this.vx = 48;
        this.neutralized = false;
        this.cleared = false;
        this.bubblePeriod = 2.3;
      }

      update(dx, dt) {
        if (this.neutralized) {
          this.x -= dx + 260 * dt;
        } else {
          this.x -= dx - (this.vx * dt);
        }
      }

      draw() {
        beginEntityFrame(this, 10, 2.0);
        const spr = loadedSprites.exmbl;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: quadrado alto azul-claro #4fc3f7 com cabeça e dedo apontando
          ctx.fillStyle = '#4fc3f7';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 6, this.y + 24, this.w - 12, this.h - 24, 6);
          ctx.fill();
          ctx.stroke();

          // Cabeça
          ctx.fillStyle = '#fbd4b4';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + 13, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Dedo apontando para a frente
          ctx.strokeStyle = '#fbd4b4';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(this.x + this.w / 2, this.y + 34);
          ctx.lineTo(this.x + this.w + 4, this.y + 30);
          ctx.stroke();

          drawEntityLabel(this.x + this.w / 2, this.y + 48, 'EX-MBL', '#ffd400');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 10 + Math.sin((this.age || 0) * 11) * 2);
          entityBubble(this, 'EX-MBL', 'DISCULPA, DISCULPA BOLSONARO!');
          
        }
        endEntityFrame();
      }
    }

    // 3. MC LATROCÍNIO
    class McLatrocinioObstacle {
      constructor(x) {
        this.x = x;
        this.w = 50;
        this.h = 74;
        this.y = GROUND_Y - this.h;
        this.extraSpeed = 65;
        this.neutralized = false;
        this.cleared = false;
        this.bubblePeriod = 2.2;
      }

      update(dx, dt) {
        if (this.neutralized) {
          this.x -= dx + 260 * dt;
        } else {
          this.x -= (dx + this.extraSpeed * dt);
        }
      }

      draw() {
        beginEntityFrame(this, 9, 2.2);
        const spr = loadedSprites.mc;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: losango/figura alta verde-limão #d4e157 com corrente dourada e boné
          ctx.fillStyle = '#d4e157';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 6, this.y + 24, this.w - 12, this.h - 24, 8);
          ctx.fill();
          ctx.stroke();

          // Boné
          ctx.fillStyle = '#c0392b';
          ctx.fillRect(this.x + 10, this.y + 4, 30, 8);
          ctx.fillRect(this.x + 2, this.y + 10, 20, 4);

          // Cabeça
          ctx.fillStyle = '#fbd4b4';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + 15, 9, 0, Math.PI * 2);
          ctx.fill();

          // Corrente dourada
          ctx.fillStyle = '#ffd400';
          for (let cx = this.x + 14; cx <= this.x + 36; cx += 5) {
            ctx.beginPath();
            ctx.arc(cx, this.y + 32, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          drawEntityLabel(this.x + this.w / 2, this.y + 50, 'MC', '#0b1528');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 10 + Math.sin((this.age || 0) * 9) * 2);
          entityBubble(this, 'MC', 'ÃHN!? ESSE É ARGILOSO!');
          
        }
        endEntityFrame();
      }
    }

    // 4. LADRÃO DE CELULAR
    class LadraoObstacle {
      constructor(x, indexInSquad) {
        this.x = x;
        this.w = 44;
        this.h = 68;
        this.y = GROUND_Y - this.h;
        this.index = indexInSquad;
        this.slowerSpeed = 12;
        this.neutralized = false;
        this.cleared = false;
        this.bubblePeriod = 2.3;
      }

      update(dx, dt) {
        if (this.neutralized) {
          this.x -= dx + 260 * dt;
        } else {
          this.x -= (dx - this.slowerSpeed * dt);
        }
      }

      draw() {
        beginEntityFrame(this, 10, 2.1);
        const spr = loadedSprites.ladrao;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: retângulo cinza-escuro #607d8b com capuz e celular na mão
          ctx.fillStyle = '#607d8b';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 6, this.y + 22, this.w - 12, this.h - 22, 6);
          ctx.fill();
          ctx.stroke();

          // Capuz triangular
          ctx.fillStyle = '#37474f';
          ctx.beginPath();
          ctx.moveTo(this.x + this.w / 2, this.y + 2);
          ctx.lineTo(this.x + 8, this.y + 22);
          ctx.lineTo(this.x + this.w - 8, this.y + 22);
          ctx.closePath();
          ctx.fill();

          // Celular na mão (retângulo brilhante)
          ctx.fillStyle = '#81d4fa';
          ctx.fillRect(this.x + this.w - 10, this.y + 32, 8, 14);
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 1;
          ctx.strokeRect(this.x + this.w - 10, this.y + 32, 8, 14);

          drawEntityLabel(this.x + this.w / 2, this.y + 46, 'LADRÃO', '#ffffff');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 10 + Math.sin((this.age || 0) * 11) * 2);
          entityBubble(this, 'LADRÃO', 'QUERO CERVEJINHA!!');
          
        }
        endEntityFrame();
      }
    }

    // 5. MILITANTE DE ESQUERDA
    class MilitanteChaser {
      constructor(x) {
        this.x = x;
        this.w = 46;
        this.h = 70;
        this.y = GROUND_Y - this.h;
        this.speed = 135;
        this.neutralized = false;
        this.bubblePeriod = 2.0;
        this.releaseHold = 0; // fica parada levemente após soltar um preso (fica legível)
      }

      update(dx, dt) {
        if (this.neutralized) {
          // Neutralizada: voa para fora da tela (esquerda)
          this.x -= dx + 260 * dt;
        } else if (this.releaseHold > 0) {
          // Acabou de soltar um preso: segura o framming por um instante (sem colidir)
          this.releaseHold -= dt;
        } else {
          // Perseguidora: corre da esquerda para a direita SEMPRE mais rápido que o scroll
          // (dx = corrente da pista). Net = +persecSpeed px/s no cursor da tela.
          const persecSpeed = 98;
          this.x += (currentSpeedPx + persecSpeed) * dt - dx;
        }
      }

      draw() {
        beginEntityFrame(this, 14, 2.6);
        const spr = loadedSprites.militante;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: retângulo vermelho #e53935 com estrela branca e cabelo azul
          ctx.fillStyle = '#e53935';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 6, this.y + 22, this.w - 12, this.h - 22, 6);
          ctx.fill();
          ctx.stroke();

          // Cabeça
          ctx.fillStyle = '#fbd4b4';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + 13, 10, 0, Math.PI * 2);
          ctx.fill();

          // Cabelo azul
          ctx.fillStyle = '#0288d1';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + 9, 11, Math.PI * 0.8, Math.PI * 2.2);
          ctx.fill();

          // Estrela branca no peito
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('★', this.x + this.w / 2, this.y + 34);

          drawEntityLabel(this.x + this.w / 2, this.y + 48, 'MILITANTE', '#ffffff');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 10 + Math.sin((this.age || 0) * 12) * 2);
          entityBubble(this, 'MILITANTE', this.releaseHold > 0 ? 'SOLTOU! FUGIU!' : 'SOLTA ELE!');
          
        }
        endEntityFrame();
      }
    }

    // 6. DRONE DO CURY
    class DroneObstacle {
      constructor(x, baseY = 410) {
        this.x = x;
        this.w = 56;
        this.h = 36;
        this.baseY = baseY;
        this.y = baseY;
        this.time = Math.random() * 5;
        this.speedX = 120;
        // Hitbox enxuta: corpo fino, permite desviar raspando com justiça
        this.hitInset = { x: 14, y: 9 };
        this.cleared = false;
        this.neutralized = false;
        this.propellerAngle = 0;
        this.bubblePeriod = 2.2;
        this.attackTriggered = false;
      }

      update(dx, dt) {
        this.time += dt * 3.8;
        this.propellerAngle += dt * 25;
        // Vem voando da direita (linha reta): aproxima-se a (scroll + speedX) px/s
        this.x -= (dx + this.speedX * dt);
        // Rasante em diagonal suave: inicia quando faltar ~1.15s para alcançar o Renan
        // (baseado em tempo, não em X, para funcionar em qualquer velocidade da pista)
        if (!this.attackTriggered) {
          const approach = currentSpeedPx + this.speedX;
          const timeToRenan = (this.x - V_WIDTH * RENAN_X_RATIO) / Math.max(1, approach);
          if (timeToRenan <= 1.15) this.attackTriggered = true;
        }
        if (this.attackTriggered) {
          // Desce devagar em diagonal reta até bem baixo, forçando o pulo com folga
          const targetY = GROUND_Y - 54;
          if (this.y < targetY) this.y = Math.min(targetY, this.y + 92 * dt);
          else this.y = Math.max(targetY, this.y - 80 * dt);
        } else {
          // Voo em linha reta estável na altitude base
          this.y += (this.baseY - this.y) * Math.min(1, dt * 4);
        }
      }

      draw() {
        ctx.save();
        // Fade ao ser neutralizado
        if (this.neutralized) {
          if ((this.deathT || 0) < 1) this.deathT = Math.min(1, (this.deathT || 0) + 0.016 * 2.8);
          ctx.globalAlpha = Math.max(0, 1 - (this.deathT || 0));
        }

        const spr = loadedSprites.drone;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Corpo cinza
          ctx.fillStyle = '#90a4ae';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.2;
          ctx.fillRect(this.x + 10, this.y + 12, this.w - 20, 16);
          ctx.strokeRect(this.x + 10, this.y + 12, this.w - 20, 16);

          // Hélices giratórias com blur/motion
          ctx.save();
          ctx.globalAlpha = (ctx.globalAlpha || 1) * 0.45;
          ctx.fillStyle = '#ffd400';
          const blitH = 3 + Math.abs(Math.sin(this.propellerAngle * 0.8)) * 3;
          ctx.fillRect(this.x + 2, this.y + 6 - blitH/2, 12, blitH);
          ctx.fillRect(this.x + this.w - 14, this.y + 6 - blitH/2, 12, blitH);
          ctx.fillRect(this.x + 2, this.y + 28 - blitH/2, 12, blitH);
          ctx.fillRect(this.x + this.w - 14, this.y + 28 - blitH/2, 12, blitH);
          ctx.restore();

          drawEntityLabel(this.x + this.w / 2, this.y + 21, 'DRONE', '#0b1528');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 12 + Math.sin((this.time || 0) * 2) * 3);
          if (!this.bubbleTimer) this.bubbleTimer = this.bubblePeriod;
          if (this.bubbleTimer > this.bubblePeriod * 0.45 && this.x > -10 && this.x < V_WIDTH + 60) {
            drawSpeechBubble(this.x + this.w / 2, this.y - 6, 'RIVOTRIL!', 'DRONE');
          }
        }
        ctx.restore();
      }
    }

    // 7. TOGA DO SUPREMO
    class TogaObstacle {
      constructor(x) {
        this.x = x;
        this.w = 50;
        this.h = 84; // Parede alta, porém transponível: pulo máximo ≈103px deixa ~19px de folga
        this.y = GROUND_Y - this.h;
        this.cleared = false;
        this.bubblePeriod = 2.4;
      }

      update(dx) {
        this.x -= dx;
      }

      draw() {
        beginEntityFrame(this, 3.4, 1.4);
        const spr = loadedSprites.toga;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: retângulo muito alto vinho #6d4c41 com martelo e carimbo INDEFERIDO
          ctx.fillStyle = '#6d4c41';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(this.x + 4, this.y + 4, this.w - 8, this.h - 4, 6);
          ctx.fill();
          ctx.stroke();

          // Martelo
          ctx.fillStyle = '#d7ccc8';
          ctx.fillRect(this.x + 20, this.y + 12, 10, 6);
          ctx.fillStyle = '#8d6e63';
          ctx.fillRect(this.x + 23, this.y + 18, 4, 14);

          // Carimbo fixo "INDEFERIDO"
          ctx.save();
          ctx.translate(this.x + this.w / 2, this.y + 54);
          ctx.rotate(-0.2);
          ctx.strokeStyle = '#d32f2f';
          ctx.lineWidth = 2.4;
          ctx.strokeRect(-23, -11, 46, 22);
          ctx.fillStyle = '#d32f2f';
          ctx.font = '900 8.5px "Arial Black", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('INDEFERIDO', 0, 0);
          ctx.restore();

          drawEntityLabel(this.x + this.w / 2, this.y + 86, 'TOGA', '#ffd400');
        }

        drawWarningIcon(this.x + this.w / 2, this.y - 12 + Math.sin((this.age || 0) * 4) * 2);
        entityBubble(this, 'TOGA DO SUPREMO', 'INDEFERIDO!');
        endEntityFrame();
      }
    }

    // 8. ESPECTRO — assombração que PERSEGUE: paira parada no canto direito da tela
    // (um pouco acima do chão), mira o Renan com a LINHA VERMELHA (telegrafe
    // translúcido saindo dos olhos dela até o Renan) e então VOAR em diagonal para
    // baixo, rápido, até onde ele estava. Colide só durante o mergulho; os estados
    // de pairar/mirar/voltar são etéreos (atravessáveis). Acertar = "ASSOMBRADO!" 3s;
    // stomp no mergulho = exorcismo (+ votos).
    class EspectroObstacle {
      constructor(x) {
        this.w = 76;
        this.h = 88;
        // Canto direito da tela, estático EM RELAÇÃO ao Renan (que corre no lugar)
        this.hoverX = V_WIDTH - 45;
        this.hoverY = GROUND_Y - this.h - 18; // "um pouco acima do chão"
        this.x = this.hoverX;
        this.y = this.hoverY;
        this.bobA = Math.random() * 5;
        this.speedX = 0; // presa ao canto (não deriva com o scroll)
        // Estados: hover (pairar) -> warn (linha vermelha) -> lunge (mergulho) -> retreat (volta)
        this.state = 'hover';
        this.stateT = 0;
        this.hoverWait = 0.6 + Math.random() * 0.3;
        this.lungesSinceRest = 0; // máx de 2 investidas por "onda", depois descanso longo
        this.attacksLeft = 4;     // após 4 investidas, parte em fuga para sempre
        this.fromX = 0; this.fromY = 0;   // início do mergulho
        this.toX = 0; this.toY = 0;       // alvo travado (Renan no fim do warn)
        this.lockX = 0; this.lockY = 0;   // mira ao vivo durante o warn
        this.fromRetreatX = 0; this.fromRetreatY = 0;
        this.hitInset = { x: 12, y: 10 };
        this.cleared = false;
        this.neutralized = false;
        this.bubblePeriod = 2.2;
        this.age = 0;
        this.deathT = 0;
      }

      // Sem colisão apenas quando parada (hover) / telegrafando (warn) / fugindo (flee);
      // sólida do início da investida até voltar parada no canto (lunge + retreat)
      isEthereal() {
        return this.state === 'hover' || this.state === 'warn' || this.state === 'flee';
      }

      update(dx, dt) {
        if (this.neutralized) {
          this.x -= dx + 120 * dt;
          return;
        }
        this.age += dt;
        this.stateT += dt;
        const T = this.stateT;

        if (this.state === 'hover') {
          // Paira parada no canto direito, balançando leve
          this.x = this.hoverX;
          this.y = this.hoverY + Math.sin(this.age * 2.4 + this.bobA) * 6;
          if (T >= this.hoverWait) {
            if (this.attacksLeft <= 0) {
              // 4 investidas cumpridas: foge da tela
              this.state = 'flee';
              this.stateT = 0;
            } else if (this.lungesSinceRest >= 2) {
              // Ondas limitadas a 2 investidas: descanso longo no canto, depois reinicia
              this.lungesSinceRest = 0;
              this.hoverWait = 11 + Math.random() * 2;
            } else {
              this.state = 'warn';
              this.stateT = 0;
              this.lungesSinceRest++;
              this.attacksLeft--;
              audio.playGhostWarn();
            }
          }
        } else if (this.state === 'warn') {
          // Telegrafe: mira o Renan AO VIVO com a linha (translúcida, sem colisão)
          this.x = this.hoverX;
          this.y = this.hoverY + Math.sin(this.age * 2.4 + this.bobA) * 4;
          const r = renan || {};
          this.lockX = (r.x || 0) + (r.w || 0) / 2 - this.w / 2;
          this.lockY = (r.y || 0) + (r.h || 0) / 2 - this.h / 2;
          if (T >= 0.6) this.beginLunge();
        } else if (this.state === 'lunge') {
          // VOAR diagonal rápida do canto até o ponto onde o Renan estava
          const t = Math.min(1, T / 0.38);
          const e = t * t; // ease-in: acelera na chegada
          this.x = this.fromX + (this.toX - this.fromX) * e;
          this.y = this.fromY + (this.toY - this.fromY) * e;
          if (t >= 1) this.beginRetreat();
        } else if (this.state === 'retreat') {
          // Volta a pairar no canto direito
          const t = Math.min(1, T / 0.5);
          const e = t <= 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          this.x = this.fromRetreatX + (this.hoverX - this.fromRetreatX) * e;
          this.y = this.fromRetreatY + (this.hoverY - this.fromRetreatY) * e;
          if (t >= 1) {
            if (this.attacksLeft <= 0) {
              // Última investida concluída: parte em fuga (esquerda + cima)
              this.state = 'flee';
              this.stateT = 0;
            } else {
              this.state = 'hover';
              this.stateT = 0;
              this.hoverWait = 0.7 + Math.random() * 0.5;
            }
          }
        } else { // 'flee' — sai voando p/ esquerda e para cima, como quem foge
          this.x -= dt * 140 + Math.sin(this.age * 5) * 26 * dt;
          this.y -= dt * 170;
        }
      }

      // Trava o alvo (onde o Renan estava no fim do warn) e mergulha
      beginLunge() {
        this.fromX = this.x;
        this.fromY = this.y;
        this.toX = this.lockX;
        this.toY = this.lockY;
        this.state = 'lunge';
        this.stateT = 0;
        buzz(18);
      }

      beginRetreat() {
        this.fromRetreatX = this.x;
        this.fromRetreatY = this.y;
        this.state = 'retreat';
        this.stateT = 0;
      }

      // Após assombrar: volta a pairar (sem reacertar em sequência)
      goEthereal() {
        if (this.state !== 'retreat' && this.state !== 'hover') this.beginRetreat();
      }

      draw() {
        ctx.save();
        if (this.neutralized) {
          if ((this.deathT || 0) < 1) this.deathT = Math.min(1, (this.deathT || 0) + 0.016 * 3);
          // Desfaz em névoa
          ctx.globalAlpha = Math.max(0, 1 - (this.deathT || 0) * 1.4);
        } else {
          // Pairar/mirar/voltar = translúcido (etéreo); mergulho = sólido;
          // warn respira (linha vermelha marca o risco)
          ctx.globalAlpha = (this.state === 'lunge' || this.state === 'retreat') ? 1 : (this.state === 'warn' || this.state === 'flee' ? 0.8 : 0.6);
        }

        const spr = loadedSprites.espectro;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: fantasma com rótulo "ESPECTRO" e olhos que acendem no mergulho/volta
          const solid = this.state === 'lunge' || this.state === 'retreat';
          const telegraph = this.state === 'warn';

          ctx.fillStyle = '#7e57c2';
          ctx.strokeStyle = '#0b1528';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(this.x + 8, this.y + 14, this.w - 16, this.h - 14, [10, 10, 18, 18]);
          ctx.fill();
          ctx.stroke();

          // Corpo traspassado (névoa) na parte baixa
          ctx.beginPath();
          ctx.moveTo(this.x + 8, this.y + 46);
          ctx.quadraticCurveTo(this.x + 12, this.y + 58, this.x + this.w / 2, this.y + 54);
          ctx.quadraticCurveTo(this.x + this.w - 12, this.y + 58, this.x + this.w - 8, this.y + 46);
          ctx.stroke();

          // Olhos: brancos ao pairar, vermelhos ao mirar/mergulhar
          ctx.fillStyle = (solid || telegraph) ? '#ff2d55' : '#eceff1';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2 - 8, this.y + 26, 3.4, 0, Math.PI * 2);
          ctx.arc(this.x + this.w / 2 + 8, this.y + 26, 3.4, 0, Math.PI * 2);
          ctx.fill();

          drawEntityLabel(this.x + this.w / 2, this.y + 50, 'ESPECTRO', '#ff8a80');
        }

        if (!this.neutralized) {
          // Telegrafe: linha vermelha translúcida dos OLHOS dela até o Renan (mira ao vivo)
          if (this.state === 'warn' && renan) {
            const ex = this.x + this.w / 2;
            const ey = this.y + 26;
            const rcx = renan.x + renan.w / 2;
            const rcy = renan.y + renan.h / 2;
            const pulse = 0.32 + 0.16 * Math.sin(this.age * 10);
            ctx.save();
            // Linha tracejada translúcida com leve pulso
            ctx.globalAlpha = pulse;
            ctx.strokeStyle = '#ff2d55';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([7, 9]);
            ctx.beginPath();
            ctx.moveTo(ex, ey);
            ctx.lineTo(rcx, rcy);
            ctx.stroke();
            ctx.setLineDash([]);
            // Ponta no Renan
            ctx.fillStyle = 'rgba(255, 45, 85, 0.85)';
            ctx.beginPath();
            ctx.arc(rcx, rcy, 4 + Math.sin(this.age * 10) * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          drawWarningIcon(this.x + this.w / 2, this.y - 12 + Math.sin(this.age * 6) * 2);
          if (this.state === 'flee') {
            // Fuga: balão GRANDE e vermelho avisando o risco (muito visível)
            drawSpeechBubble(this.x + this.w / 2, this.y - 8, 'SE NÃO ME COMER, VAI MORRER!', 'ESPECTRO', 340, true);
          } else {
            entityBubble(this, 'ESPECTRO', 'MORTE A ADOLF HITLER!!', 2.4, true);
          }
        }
        ctx.restore();
      }
    }

    // --- COLETÁVEIS (PERKS, BANDEIRAS E ALGEMAS COM FALLBACK PROCEDURAL PADRONIZADO ~48PX) ---
    class CollectibleItem {
      constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.w = 44;
        this.h = 44;
        this.type = type;
        this.bobTime = Math.random() * 4;
        this.baseY = y;
      }

      update(dx, dt) {
        this.x -= dx;
        this.bobTime += dt * 3.5;
        this.y = this.baseY + Math.sin(this.bobTime) * 6;
      }

      draw() {
        ctx.save();
        const spr = loadedSprites[this.type];
        if (spr && spr.width) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural de ~48px com círculo colorido + inicial grande + contorno escuro
          const cx = this.x + this.w / 2;
          const cy = this.y + this.h / 2;
          const r = 20;

          if (this.type === 'onca') {
            // Círculo amarelo com manchas escuras e "O"
            ctx.fillStyle = '#ffd400';
            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#8d6e63';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 7, 3, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy + 8, 3.5, 0, Math.PI * 2);
            ctx.fill();

            drawEntityLabel(cx, cy, 'O', '#0b1528');
          } else if (this.type === 'espadim') {
            // Círculo prata com "E"
            ctx.fillStyle = '#e0e0e0';
            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            drawEntityLabel(cx, cy, 'E', '#0b1528');
          } else if (this.type === 'valete') {
            // Círculo azul médio com símbolo ♦ e "V"
            ctx.fillStyle = '#29b6f6';
            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#d32f2f';
            ctx.font = '900 8px sans-serif';
            ctx.fillText('♦', cx, cy - 8);

            drawEntityLabel(cx, cy + 3, 'V', '#ffffff');
          } else if (this.type === 'livro') {
            // Círculo amarelo com "L"
            ctx.fillStyle = '#ffd400';
            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            drawEntityLabel(cx, cy, 'L', '#0b1528');
          } else if (this.type === 'broche') {
            // Círculo vermelho com "B"
            ctx.fillStyle = '#e53935';
            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            drawEntityLabel(cx, cy, 'B', '#ffffff');
          } else if (this.type === 'classica') {
            // Bandeira Clássica: haste vertical cinza + faixas preta/branca/amarela e "M"
            ctx.fillStyle = '#90a4ae';
            ctx.fillRect(this.x + 6, this.y + 4, 3, this.h - 8);

            ctx.fillStyle = '#111111';
            ctx.fillRect(this.x + 9, this.y + 6, 28, 8);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.x + 9, this.y + 14, 28, 8);
            ctx.fillStyle = '#ffd400';
            ctx.fillRect(this.x + 9, this.y + 22, 28, 8);

            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 9, this.y + 6, 28, 24);

            drawEntityLabel(this.x + 23, this.y + 18, 'M', '#0b1528');
          } else if (this.type === 'imperial') {
            // Bandeira Imperial: haste vertical cinza + retângulo preto/amarelo com coroa simples e "14"
            ctx.fillStyle = '#90a4ae';
            ctx.fillRect(this.x + 6, this.y + 4, 3, this.h - 8);

            ctx.fillStyle = '#ffd400';
            ctx.fillRect(this.x + 9, this.y + 6, 28, 24);
            ctx.fillStyle = '#0b1528';
            ctx.fillRect(this.x + 13, this.y + 10, 20, 16);

            ctx.strokeStyle = '#0b1528';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x + 9, this.y + 6, 28, 24);

            drawEntityLabel(this.x + 23, this.y + 18, '14', '#ffd400');
          }
        }
        ctx.restore();
      }
    }

    // Sistema de Efeitos e Partículas
    function spawnParticles(x, y, color = '#ffd400', count = 12) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 4 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 2,
          size: Math.random() * 4 + 2,
          life: 1,
          decay: Math.random() * 0.03 + 0.02,
          color
        });
      }
    }

    function spawnDust(x, y, count = 5) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x: x + (Math.random() * 16 - 8),
          y: y - 2,
          vx: (Math.random() - 0.5) * 2 - (currentSpeedPx * 0.2),
          vy: -Math.random() * 1.5,
          size: Math.random() * 3 + 2,
          life: 0.8,
          decay: 0.04,
          color: 'rgba(255, 255, 255, 0.4)'
        });
      }
    }

    function addFloatingText(x, y, text, color = '#ffd400') {
      floatingTexts.push({
        x,
        y,
        text,
        color,
        life: 1.35,
        vy: -1.4
      });
    }

    // --- GERADOR DE MUNDO BALANCEADO (MENOS CAOS / FASE INICIAL CALMA) ---
    function createNextPulpit(x) {
      const candidate = CANDIDATE_LIST[nextCandidateIndex % CANDIDATE_LIST.length];
      nextCandidateIndex++;
      return new Pulpit(x, candidate);
    }

    function resetWorld() {
      pulpits = [];
      obstacles = [];
      collectibles = [];
      particles = [];
      floatingTexts = [];
      activeBanner = null;
      activeCard = null;
      pendingSpawns = [];
      worldTimeScale = 1;
      spawnGraceTimer = 1.0;

      // Zera o cache de HUD para forçar a primeira escrita no DOM
      hudCache.votes = null; hudCache.time = null; hudCache.handcuffs = null;
      hudCache.rank = null; hudCache.mult = null; hudCache.perk = null; hudCache.squad = null;
      hudCache.lives = null;
      hudCache.haunt = null;
      hudCache.rankPct = null;
      lastVisVotes = 0; lastVisHandcuffs = 0; lastVisLives = 0;

      lives = MAX_LIVES;
      machistaFlashTimer = 0;

      // Cada corrida reintroduz os personagens: limpa estado de intro (cards do "primeiro confronto")
      encounteredTypes.clear();
      pendingIntroQueue.length = 0;
      lastIntroAt = 0;
      activeCard = null;
      setHudHiddenByCard(false);
      worldTimeScale = 1;

      currentSpeedPx = INITIAL_SPEED_PX;
freezeTimer = 0;
      collectStreak = 0;
      collectStreakTimer = 0;
      hauntedTimer = 0;
      if (hauntBlindShown) setHauntBlind(false);
      votes = 0;
      obstaclesCleared = 0;
      handcuffs = 0;
      gameTime = 0;
      distanceCovered = 0;
      cameraShake = 0;
      nextCandidateIndex = 0;
      currentRankTier = RANK_TIERS[RANK_TIERS.length - 1];

      // O primeiro obstáculo surge só após ~3.8s de corrida
      spawnCooldown = 3.8;
      perkCooldown = 8.0;
      scheduleSpawn(30, () => maybeForceEspectroSpawn());

      cardMultiplierTimer = 0;
      flagComboCount = 0;
      imperialModeTimer = 0;
      bookInvincibleTimer = 0;
      oncaRidingTimer = 0;
      overdriveKind = null;
      overdriveHashtagUsedThisRun = false;
      squadHashtagUsedThisRun = false;
      espectroForcedThisRun = false;
      hasShield = false;
      hasSwordStrike = false;

      thiefSquadActive = false;
      thiefSquadCount = 0;
      thiefSquadCaught = 0;
      prisonersHeld = 0;
      mcInJail = false;

      chainSpawnWarnings.length = 0;
      escapingMCs.length = 0;
      flagSweep = null;

      renan.reset();

      // Púlpito inicial bem à frente para começar com calma
      const firstPulpit = createNextPulpit(V_WIDTH + 180);
      pulpits.push(firstPulpit);
    }

    function getActiveMultiplier() {
      let mult = 1;
      if (cardMultiplierTimer > 0) mult *= 2;
      if (imperialModeTimer > 0) mult *= 3;
      return mult;
    }

    // Aplica o multiplicador (X2/X3 da Carta) em QUALQUER ganho de votos —
    // perdas (-votos de Toga/Ladrão/Drone) ficam SEM multiplicador.
    function grantVotes(base) {
      return Math.round(base * getActiveMultiplier());
    }

    // Neutraliza um obstáculo garantindo que ele SEMPRE saia da tela.
    // Um inimigo neutralizado sem velocidade de fuga congela em x e nunca é
    // removido (a remoção exige x < -120) — fica preso para sempre, engorda
    // obstacles.length e pode até bloquear a zona de spawn (~x 470), o que
    // SATURA o teto de entidades ativas e para os spawns (sobra só powerup).
    // A Jornalista é a única que anda via exitVx/exitVy quando neutralizada;
    // para o restante a velocidade extra é inerte (eles rolam para a esquerda
    // no próprio update).
    function neutralizeObstacle(obs) {
      if (obs.neutralized) return;
      if (typeof obs.neutralize === 'function') { obs.neutralize(); return; }
      obs.neutralized = true;
      obs.exitVx = -160;
      obs.exitVy = -120;
    }

    function updateWorld(dt) {
      // Card de apresentação de personagem: PAUSA TOTAL.
      // Enquanto o card está visível o mundo (entidades, renan, cronômetros e spawns)
      // permanece congelado; o countdown do card pode ser pausado com toque (card.hold).
      // Toque pula (PULAR) — ver handleInputStart.
      if (activeCard) {
        if (!activeCard.hold) activeCard.timer -= dt;
        if (activeCard.timer <= 0) {
          endIntroCard();
        }
        return;
      }
      worldTimeScale += (1 - worldTimeScale) * Math.min(1, dt * 8);

      // Temporizadores de perks e banner
      if (cardMultiplierTimer > 0) cardMultiplierTimer -= dt;
      if (imperialModeTimer > 0) imperialModeTimer -= dt;
      if (bookInvincibleTimer > 0) bookInvincibleTimer -= dt;
      if (oncaRidingTimer > 0) oncaRidingTimer -= dt;

      // OVERDRIVE unificado: atualiza o kind ativo conforme os timers (imperial/onça)
      let nextOv = overdriveKind;
      if (overdriveKind === 'onca' && oncaRidingTimer <= 0) {
        nextOv = imperialModeTimer > 0 ? 'imperial' : null;
      } else if (overdriveKind === 'imperial' && imperialModeTimer <= 0) {
        nextOv = oncaRidingTimer > 0 ? 'onca' : null;
      }
      if (nextOv !== overdriveKind) {
        overdriveKind = nextOv;
        syncOverdriveBgm();
      }

      if (activeBanner) {
        activeBanner.timer -= dt;
        if (activeBanner.timer <= 0) {
activeBanner = null;
      bannerQueue.length = 0;
          promoteBanner(); // Fila: próximo evento core entra na hora certa
        }
      }

      // Fila de spawns dependentes de tempo (substitui setTimeout)
      for (let i = pendingSpawns.length - 1; i >= 0; i--) {
        pendingSpawns[i].t -= dt;
        if (pendingSpawns[i].t <= 0) {
          const fn = pendingSpawns[i].fn;
          pendingSpawns.splice(i, 1);
          if (gameState === STATE.PLAYING) {
            try { fn(); } catch (e) { console.error("Erro em spawn agendado:", e); }
          }
        }
      }

      // Graça de respawn: decai e protege contra mortes injustas no início
      if (spawnGraceTimer > 0) spawnGraceTimer -= dt;

      let speedFactor = 1.0;
      if (freezeTimer > 0) {
        freezeTimer -= dt;
        speedFactor = 0.25;
      }
      if (machistaFlashTimer > 0) machistaFlashTimer -= dt;

      // Streak de coleta expira após 1.5s sem pegar item
      if (collectStreakTimer > 0) {
        collectStreakTimer -= dt;
        if (collectStreakTimer <= 0) collectStreak = 0;
      }

      // Assombrado pelo Espectro: pontos congelados por 3s
      if (hauntedTimer > 0) {
        hauntedTimer -= dt;
        if (hauntedTimer <= 0) setHauntBlind(false); // nunca deixa o blackout preso no fim
      }

      // Rampa suave de velocidade: 230 px/s até 600 px/s ao longo de ~90 segundos
      if (currentSpeedPx < MAX_SPEED_PX) {
        const rampRate = (MAX_SPEED_PX - INITIAL_SPEED_PX) / 90; // ~4.1 px/s por segundo
        currentSpeedPx = Math.min(MAX_SPEED_PX, currentSpeedPx + rampRate * dt);
      }

      const effectiveSpeed = currentSpeedPx * speedFactor * worldTimeScale * dt;
      gameTime += dt;
      distanceCovered += effectiveSpeed;

      const currentMult = getActiveMultiplier();

      // Verificação de promoção de patente com banner oficial
      const newRank = getRankByVotes(votes);
      if (newRank.title !== currentRankTier.title) {
        currentRankTier = newRank;
        audio.playRankUp();
        const promoHashtag = newRank.isGold ? ' #PraCimaDelesRenan' : '';
        mostrarBanner(`PROMOVIDO A ${newRank.title.toUpperCase()}!${promoHashtag}`, "rank", "🎖️", "global", "core");
      }

      // Pulo variável
      if (inputHeld && !renan.isGrounded && jumpHeldTime < MAX_HOLD_TIME && renan.vy < 0) {
        renan.vy -= 0.32;
        jumpHeldTime++;
      }

      renan.update(dt);

      // Controle de spawn por tempo (Começa em ~2.6s e diminui aos poucos até ~1.0s, nunca menos)
      spawnCooldown -= dt;
      perkCooldown -= dt;

      // TETO DE ENTIDADES ATIVAS: máx 2 nas primeiras fases (<40s), máx 4 após 40s; teto global 6.
      // `neutralized`/`cleared` saem da conta: eles não ameaçam mais o jogador e
      // devem apenas rolar para fora sem prender o spawn (um congelado na tela
      // saturava o teto para sempre e matava os spawns).
      const activeEntityCount = pulpits.length
        + obstacles.filter((o) => !o.neutralized && !o.cleared).length;
      const maxAllowedEntities = gameTime < 40 ? 2 : 4;

      if (spawnCooldown <= 0 && activeEntityCount < maxAllowedEntities && activeEntityCount < 6) {
        spawnNextFeature();

        // Intervalo entre spawns: rampa de 2.6s descendo até 1.0s aos 90s
        const tRatio = Math.min(1, gameTime / 90);
        const nextInterval = 2.6 - (tRatio * 1.6); // 2.6s -> 1.0s
        spawnCooldown = Math.max(1.0, nextInterval + (Math.random() * 0.4 - 0.2));
      }

      if (perkCooldown <= 0 && collectibles.length < 2) {
        spawnCollectible(V_WIDTH + 60);
        perkCooldown = 12.0 + Math.random() * 8.0; // Perks raros
      }

      // Atualiza Púlpitos
      for (let i = pulpits.length - 1; i >= 0; i--) {
        const p = pulpits[i];
        p.update(effectiveSpeed, dt);
        checkPulpitCollision(p);
        if (p.x + p.w < -100) {
          pulpits.splice(i, 1);
        }
      }

      // Atualiza Coletáveis
      for (let i = collectibles.length - 1; i >= 0; i--) {
        const c = collectibles[i];
        c.update(effectiveSpeed, dt);

        // Coleta pelo Renan
        if (checkAABB(renan.x, renan.y, renan.w, renan.h, c.x, c.y, c.w, c.h)) {
          collectStreak++;
          collectStreakTimer = 1.5;
          audio.playCollect(collectStreak);
          applyCollectible(c.type);
          collectibles.splice(i, 1);
          continue;
        }

        if (c.x + c.w < -60) {
          collectibles.splice(i, 1);
        }
      }

      // Atualiza Obstáculos e Inimigos
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.update(effectiveSpeed, dt);
        advanceEntityAnim(obs, dt);

        // Ultrapassou com sucesso
        if (!obs.cleared && obs.x + obs.w < renan.x && !obs.neutralized && !obs.chainPending
          && !(obs instanceof EspectroObstacle && obs.state === 'flee')) {
          obs.cleared = true;
          obstaclesCleared++;
          const pts = 200 * currentMult;
          votes += pts;
          audio.playObstaclePass();
        }

        // Colisão com Renan (ignorada durante a graça de respawn)
        // Inset padrão 2/4, mas cada obstáculo pode definir hitInset próprio (ex.: drone menor p/ desvio justo)
        const hx = (obs.hitInset && obs.hitInset.x != null) ? obs.hitInset.x : 2;
        const hy = (obs.hitInset && obs.hitInset.y != null) ? obs.hitInset.y : 4;
        if (spawnGraceTimer <= 0 && !obs.neutralized && !obs.releaseHold && !obs.chainPending
          && !(obs instanceof EspectroObstacle && obs.isEthereal())
          && checkAABB(renan.x + 2, renan.y + 4, renan.w - 4, renan.h - 4, obs.x + hx, obs.y + hy, obs.w - hx * 2, obs.h - hy * 2)) {
          handleObstacleCollision(obs, i);
          continue;
        }

        // Remove fora da tela — perseguidora sai pela direita, demais pela esquerda
        const offScreenRight = (obs instanceof MilitanteChaser) && obs.x > V_WIDTH + 90;
        const espectroEscaped = (obs instanceof EspectroObstacle && obs.state === 'flee'
          && (obs.x < -140 || obs.y < -160));
        if (obs.x < -120 || offScreenRight || espectroEscaped) {
          if (obs instanceof LadraoObstacle && thiefSquadActive && !obs.neutralized) {
            // Ladrão fugiu pela esquerda
            addFloatingText(60, GROUND_Y - 40, "FUGIU!", "#ff7676");
          }
          obstacles.splice(i, 1);
        }
      }

      // Vassourada da Bandeira: o anel dourado avança e limpa o que encosta
      advanceFlagSweep(dt);

      // Atualiza Partículas
      for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= pt.decay;
        if (pt.life <= 0) particles.splice(i, 1);
      }

      // Atualiza Textos Flutuantes
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.022;
        if (ft.life <= 0) floatingTexts.splice(i, 1);
      }

      // Atualiza avisos de reação em cadeia (somem após o tempo)
      for (let i = chainSpawnWarnings.length - 1; i >= 0; i--) {
        chainSpawnWarnings[i].timer -= dt;
        if (chainSpawnWarnings[i].timer <= 0) chainSpawnWarnings.splice(i, 1);
      }

      // MC fugindo de corrida (libertado pela militante)
      for (let i = escapingMCs.length - 1; i >= 0; i--) {
        const esc = escapingMCs[i];
        esc.x -= (effectiveSpeed + esc.speed * dt);
        esc.anim += dt;
        esc.life -= dt;
        if (esc.life <= 0) escapingMCs.splice(i, 1);
      }

      if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - 0.8);

      updateHudDisplay();
    }

    // --- EVENTO OVERDRIVE (onça + imperial) unificado ---
    // As duas "super-formas" da partida entram pelo MESMO canal de apresentação:
    // textos/banner/efeito de tela/música prendem a variação por kind ('onca'|'imperial').
    // Novos tipos que quiserem o mesmo tratamento só adicionam um objeto aqui.
    const OVERDRIVE_CONFIG = {
      onca: {
        bannerTitle: 'MODO ONÇA! ATROPELAMENTO',
        bannerType: 'perk',
        bannerEmoji: '🐆',
        floatText: 'ONÇA!',
        floatColor: '#e67e22',
        hudTag: 'ONÇA PINTADA',
        fx: '#e67e22'
      },
      imperial: {
        bannerTitle: 'MODO IMPERIAL! X3 VOTOS',
        bannerType: 'flag',
        bannerEmoji: '👑',
        floatText: 'X3 VOTOS!',
        floatColor: '#ffd400',
        hudTag: 'MODO IMPERIAL',
        fx: '#ffd400'
      }
    };

    function hexToRgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }

    // Música do overdrive: mantém game.mp3 rodando sempre (não existe trilha própria
    // para o overdrive; o purge do setBgm evita qualquer nó órfão após a morte).
    function syncOverdriveBgm() {
      if (gameState === STATE.PLAYING) realAudio.setBgm('game');
    }

    // Ativa o overdrive (onça ou imperial) com a apresentação unificada.
    function triggerOverdrive(kind) {
      const cfg = OVERDRIVE_CONFIG[kind];
      if (!cfg) return;
      overdriveKind = kind;
      syncOverdriveBgm();
      let title = cfg.bannerTitle;
      if (!overdriveHashtagUsedThisRun) {
        overdriveHashtagUsedThisRun = true;
        title += ' #PraCimaDelesRenan';
      }
      mostrarBanner(title, cfg.bannerType, cfg.bannerEmoji);
      addFloatingText(renan.x, renan.y - 24, cfg.floatText, cfg.floatColor);
    }

    // Bandeira Clássica: cria a VASSOURADA — pulso dourado saindo do Renan que expande até as
    // bordas e limpa (neutraliza) tudo o que o anel encosta, creditando os votos oficiais.
    // Espectro (evento roteirizado), presos em captura (chainPending/releaseHold) e o que já
    // passou pelo Renan ficam de fora; o anel só alcança o que está visível na tela.
    function startFlagSweep() {
      const cx = renan.x + renan.w / 2;
      const cy = renan.y + renan.h / 2;
      flagSweep = {
        t: 0,
        dur: 0.65,
        cx,
        cy,
        maxR: Math.hypot(Math.max(cx, V_WIDTH - cx), Math.max(cy, V_HEIGHT - cy)) + 30,
        cleared: 0,
        total: 0
      };
    }

    // Avança a vassourada por frame: quanto maior o anel, mais longe limpa.
    function advanceFlagSweep(dt) {
      if (!flagSweep) return;
      const fs = flagSweep;
      fs.t += dt;
      const grow = Math.min(1, fs.t / fs.dur);
      const r = Math.max(10, 24 + (fs.maxR - 24) * grow);

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (obs instanceof EspectroObstacle || obs.neutralized || obs.cleared
          || obs.chainPending || obs.releaseHold > 0) continue;
        const dist = Math.hypot((obs.x + obs.w / 2) - fs.cx, (obs.y + obs.h / 2) - fs.cy);
        if (dist > r) continue;
        const gain = grantVotes(getObstacleValue(obs));
        votes += gain;
        fs.total += gain;
        neutralizeObstacle(obs);
        fs.cleared++;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffffff', 9);
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 6);
      }
      for (let i = pulpits.length - 1; i >= 0; i--) {
        const p = pulpits[i];
        const dist = Math.hypot((p.x + p.w / 2) - fs.cx, (p.y + p.h / 2) - fs.cy);
        if (dist > r) continue;
        pulpits.splice(i, 1);
        fs.cleared++;
        spawnParticles(p.x + p.w / 2, p.y + p.h / 2, '#ffffff', 9);
        if (!p.hasDiaper) {
          // Púlpito intacto vale 1400; já "fraldado" não paga de novo (só limpa a tela)
          const gain = grantVotes(1400);
          votes += gain;
          fs.total += gain;
        }
      }

      if (grow >= 1) {
        if (fs.cleared > 0) {
          addFloatingText(fs.cx, fs.cy - 60, `VARRIDA! ${fs.cleared} LIMPO +${fs.total}`, '#ffd400');
          mostrarBanner(`VARRIDA! ${fs.cleared} LIMPO · +${fs.total} VOTOS`, "flag", "🚩");
          audio.playDiaperPlaced();
          buzz(40);
        }
        flagSweep = null;
      }
    }

    function applyCollectible(type) {
      const mult = getActiveMultiplier();
      audio.playDiaperPlaced();

      if (type === 'valete') {
        cardMultiplierTimer = 5;
        mostrarBanner("X2 VOTOS! VALETE ATIVO", "perk", "🃏");
        addFloatingText(renan.x, renan.y - 20, "X2!", "#ffd400");
      } else if (type === 'livro') {
        bookInvincibleTimer = 4;
        mostrarBanner("INVENCÍVEL! LIVRO AMARELO", "perk", "📖");
        addFloatingText(renan.x, renan.y - 20, "INVENCÍVEL!", "#ffd400");
      } else if (type === 'broche') {
        hasShield = true;
        mostrarBanner("ESCUDO ATIVO! BROCHE R14", "perk", "🛡️");
        addFloatingText(renan.x, renan.y - 20, "ESCUDO!", "#3498db");
      } else if (type === 'espadim') {
        hasSwordStrike = true;
        mostrarBanner("ESPADIM! ONE-SHOT PRONTO", "perk", "⚔️");
        addFloatingText(renan.x, renan.y - 20, "ESPADIM!", "#ffd400");
      } else if (type === 'onca') {
        oncaRidingTimer = 5.5;
        triggerOverdrive('onca');
      } else if (type === 'classica') {
        flagComboCount++;
        const pts = (flagComboCount === 1 ? 500 : (flagComboCount === 2 ? 1500 : 3000 + (flagComboCount - 3) * 1500)) * mult;
        votes += pts;
        startFlagSweep();
        mostrarBanner(`COMBO! +${pts} VOTOS`, "flag", "🚩");
      } else if (type === 'imperial') {
        imperialModeTimer = 6;
        triggerOverdrive('imperial');
      }
    }

    // Toda colisão com inimigo custa vida em vez de morte instantânea
    function loseLife(amount, reasonText) {
      lives -= amount;
      if (lives <= 0) {
        triggerGameOver(reasonText || `Levou ${MAX_LIVES} colisões e caiu do debate!`);
        return false;
      }
      return true;
    }

    // Valor de votos de cada tipo de inimigo (base de todas as eliminações)
    function getObstacleValue(obs) {
      // Economia oficial: valores múltiplos de 14 com "14" sempre à vista (nº do partido).
      if (obs instanceof JornalistaObstacle) return 5614;
      if (obs instanceof ExMblObstacle) return 2114;
      if (obs instanceof McLatrocinioObstacle) return 2114;
      if (obs instanceof LadraoObstacle) return 1400;
      if (obs instanceof MilitanteChaser) return 2114;
      if (obs instanceof TogaObstacle) return 4214;
      if (obs instanceof EspectroObstacle) return 560;
      return 196; // 14²
    }

    // Captura um ladrão (stomp): +votos, +1 algema, +1 prisioneiro.
    // Com a quadrilha ativa, ao chegar aos 3 capturados fecha a quadrilha + gera Militante.
    function captureThief(obs) {
      if (obs.neutralized) return;
      obs.neutralized = true;
      const gainD = grantVotes(1400);
      votes += gainD;
      handcuffs++;
      prisonersHeld++;
      thiefSquadCaught++;
      mostrarBanner(`+${formatVotes(gainD)} VOTOS +1 ALGEMA!`, "reward", "📱");
      spawnParticles(obs.x + obs.w / 2, obs.y + 10, '#607d8b', 10);
      buzz(25);
      audio.playHit();

      if (thiefSquadCaught >= 3) {
        thiefSquadActive = false;
        const gainQ = grantVotes(714); // 51×14
        votes += gainQ;
        let quadText = `QUADRILHA DESMANTELADA! +${formatVotes(gainQ)} VOTOS`;
        if (!squadHashtagUsedThisRun) {
          squadHashtagUsedThisRun = true;
          quadText += ' #PraCimaDelesRenan';
        }
        mostrarBanner(quadText, "reward", "🏆", "global", "core");

        scheduleSpawn(1.0, () => {
          if (obstacles.length < 4 && !obstacles.some((o) => o instanceof MilitanteChaser)) {
            const m = new MilitanteChaser(-40);
            obstacles.push(m);
            mostrarBanner("MILITANTE GERADA! SOLTA ELE!", "danger", "🚩", "global", "core");
            spawnChainWarning('left', '🚩', 'Militante');
          }
        });
      }
    }

    function handleObstacleCollision(obs, index) {
      // Espadim de Tiradentes: elimina o inimigo pagando o valor dele + bônus
      if (hasSwordStrike) {
        hasSwordStrike = false;
        neutralizeObstacle(obs);
        if (obs instanceof LadraoObstacle && thiefSquadActive && thiefSquadCaught < 3) thiefSquadCaught++;
        // Espectro: espadim vale 500 votos (sem bônus extra de +200)
        const swordBase = (obs instanceof EspectroObstacle) ? 560 : (getObstacleValue(obs) + 214); // espadim +214
        const swordTotal = grantVotes(swordBase);
        votes += swordTotal;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 16);
        mostrarBanner(`GOLPE DE ESPADIM! +${formatVotes(swordTotal)} VOTOS`, "perk", "⚔️");
        return;
      }

      // Livro Amarelo: atravessa o Espectro sem efeito (não neutraliza nem toma dano)
      if (obs instanceof EspectroObstacle && bookInvincibleTimer > 0 && oncaRidingTimer === 0 && imperialModeTimer === 0) {
        obs.goEthereal();
        return;
      }

      // Montado na Onça ou Invencível: neutraliza e conta o valor de votos do obstáculo (+ bônus por usar a onça)
      if (renan.isInvincible()) {
        const neutralizeVotes = getObstacleValue(obs);

        const oncaBonus = oncaRidingTimer > 0 ? 714 : 0; // 51×14
        const total = grantVotes(neutralizeVotes + oncaBonus);
        neutralizeObstacle(obs);
        if (obs instanceof LadraoObstacle && thiefSquadActive && thiefSquadCaught < 3) thiefSquadCaught++;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 14);
        votes += total;
        if (oncaRidingTimer > 0) {
          mostrarBanner(`ATROPELADO PELA ONÇA! +${formatVotes(total)} VOTOS`, "perk", "🐆");
        } else {
          mostrarBanner(`INVENCÍVEL! +${formatVotes(total)} VOTOS`, "perk", "💛");
        }
        return;
      }

      // Verificação de Stomp (pulo na cabeça)
      const isStomp = renan.vy > 0 && (renan.y + renan.h - renan.vy <= obs.y + 26);

      // Escudo R14 absorve QUALQUER colisão lateral (o pulo na cabeça continua valendo recompensa)
      if (hasShield && !isStomp) {
        hasShield = false;
        if (obs instanceof EspectroObstacle && !obs.neutralized) {
          // Espectro NÃO é exorcizada pelo escudo (senão ela some): só empurra a
          // assombração de volta para o canto e ela continua sua onda de investidas.
          obs.goEthereal();
        } else {
          neutralizeObstacle(obs);
        }
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#3498db', 12);
        mostrarBanner("ESCUDO ABSORVEU O IMPACTO!", "perk", "🛡️");
        return;
      }

      if (obs instanceof JornalistaObstacle) {
        if (isStomp) {
          renan.vy = -8.8;
          obs.neutralize();
          const gainA = grantVotes(5614);
          votes += gainA;
          mostrarBanner(`+${formatVotes(gainA)} VOTOS! LARGA O MICROFONE!`, "reward", "🎤");

          // Drone extra surge após atraso mínimo seguro de 0.9s (fila do game loop)
          // Nunca gera drone se já houver um no ar (evita drone empilhado atrás do outro)
          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof DroneObstacle)) {
              const d = new DroneObstacle(V_WIDTH + 60, 420);
              obstacles.push(d);
              mostrarBanner("AGRESSOR DE MULHER DETECTADO! DRONE DO CURY DESPACHADO!", "danger", "🚁", "global", "core");
              spawnChainWarning('right', '🚁', 'Drone');
            }
          });
          return;
        } else {
          if (!loseLife(1, "Caiu do debate depois de tantas perguntas incômodas!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          neutralizeObstacle(obs);
          cameraShake = 3;
          audio.playHit();
          buzz(35);
          mostrarBanner("E O FEMINICÍDIO, CANDIDATO? -1 VIDA", "danger", "📢");
        }
      } else if (obs instanceof ExMblObstacle) {
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainB = grantVotes(2114);
          votes += gainB;
          mostrarBanner(`EX-MBL NEUTRALIZADO! +${formatVotes(gainB)} VOTOS`, "reward", "👶");
          return;
        } else {
          // Lateral: perde 1 vida e 1 fralda
          if (!loseLife(1, "Caiu do debate atropelado pelo traidor!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          if (votes > 0) votes -= 1400;
          mostrarBanner("PERDEU 1.400 VOTOS E 1 VIDA! TRAIDOR!", "danger", "⚠️");
          obs.neutralized = true;
          cameraShake = 4;
          audio.playHit();
          buzz(35);
          return;
        }
      } else if (obs instanceof McLatrocinioObstacle) {
        if (isStomp) {
          renan.vy = -9;
          obs.neutralized = true;
          handcuffs++;
          prisonersHeld++;
          mcInJail = true;
          const gainC = grantVotes(2114);
          votes += gainC;
          mostrarBanner(`PRENDEU! +${formatVotes(gainC)} VOTOS +1 ALGEMA`, "reward", "⛓️");

          // Militante surge após atraso seguro de 1.1s (fila do game loop)
          // Nunca gera militante se já houver uma perseguindo (evita pilha de militantes)
          scheduleSpawn(1.1, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof MilitanteChaser)) {
              const m = new MilitanteChaser(-40);
              obstacles.push(m);
              mostrarBanner("MILITANTE GERADA! SOLTA ELE!", "danger", "🚩", "global", "core");
              spawnChainWarning('left', '🚩', 'Militante');
            }
          });
          return;
        } else {
          if (!loseLife(1, "Caiu do debate atropelado pelo MC!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          obs.neutralized = true;
          cameraShake = 4;
          audio.playHit();
          buzz(35);
          mostrarBanner("ÃHN! ATROPELADO PELO MC -1 VIDA", "danger", "💥");
        }
      } else if (obs instanceof LadraoObstacle) {
        if (isStomp) {
          renan.vy = -8.6;
          // CADEIA DA QUADRILHA: ao prender o 1º ladrão, Renan "pula em sequência"
          // (auto-stomps em combo) e a quadrilha cai inteira — resolve a falta de espaço.
          const startSquadChain = thiefSquadActive && thiefSquadCaught === 0;
          captureThief(obs);
          if (startSquadChain) {
            const remainingChain = obstacles.filter((o) => o instanceof LadraoObstacle && !o.neutralized);
            remainingChain.forEach((other, k) => {
              other.chainPending = true; // não colidir até cair no combo
              scheduleSpawn(0.18 + k * 0.15, () => {
                if (thiefSquadActive && !other.neutralized) {
                  renan.vy = Math.max(renan.vy, -10);
                  captureThief(other);
                }
              });
            });
          }
          return;
        }
      } else if (obs instanceof MilitanteChaser) {
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainE = grantVotes(2114);
          votes += gainE;
          mostrarBanner(`+${formatVotes(gainE)} VOTOS! MILITANTE NEUTRALIZADA`, "reward", "⭐");

          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof DroneObstacle)) {
              const d = new DroneObstacle(V_WIDTH + 60, 420);
              obstacles.push(d);
              mostrarBanner("AGRESSOR DE MULHER DETECTADO! DRONE DO CURY DESPACHADO!", "danger", "🚁", "global", "core");
              spawnChainWarning('right', '🚁', 'Drone');
            }
          });
          return;
        } else {
          if (!loseLife(1, "Caiu do debate nas mãos da militante!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          if (prisonersHeld > 0) {
            prisonersHeld--;
            if (handcuffs > 0) handcuffs--;
            freezeTimer = Math.max(freezeTimer, 0.5);
            mostrarBanner("PRESO LIBERTADO PELA MILITANTE! -1 VIDA", "danger", "🚩");
            if (mcInJail) {
              // Soltou o MC capturado: ele foge (devagar p/ ficar legível) com deboche
              mcInJail = false;
              spawnMcEscape();
              mostrarBanner("MILITANTE SOLTOU O MC! ELE FUGIU COM DEBOCHÉ!", "danger", "🎤");
            }
            // Militante fica em cena (~0.85s) mostrando a soltura, depois some
            obs.releaseHold = 0.85;
          } else {
            mostrarBanner("PETISTA! TRAIDOR! -1 VIDA", "danger", "🚩");
            obs.neutralized = true;
          }
          cameraShake = 4;
          audio.playHit();
          buzz(35);
          return;
        }
      } else if (obs instanceof DroneObstacle) {
        // ABATE no drone: Renan pisa em cima e o derruba — DRONE abatido (+1.500 votos)
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          audio.playHit();
          buzz(40);
machistaFlashTimer = 0.7;
          machistaKillFlash = grantVotes(1414); // mantém o impacto, mas o nome muda p/ DRONE
          votes += machistaKillFlash;
          spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 14);
          mostrarBanner(`DRONE ABATIDO! +${formatVotes(machistaKillFlash)} VOTOS`, "reward", "🚁");
          return;
        }
        // "Tropeço" no drone: pausa dramática + MACHISTA! destacado no centro
        machistaKillFlash = 0;
        if (!loseLife(1, "O drone acabou com o debate do Renan!")) return;
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        obs.neutralized = true;
        cameraShake = 4;
        audio.playHit();
        buzz(50);
        freezeTimer = 0.6;
        machistaFlashTimer = 0.7;
        if (votes > 0) votes = Math.max(0, votes - 2114);
        mostrarBanner("MACHISTA! -2.114 VOTOS · -1 VIDA", "danger", "🚁");
        return;
      } else if (obs instanceof TogaObstacle) {
        // Espadim/Onça já retornaram no topo; aqui: escudo > stomp > tropeço
        if (hasShield) {
          hasShield = false;
          mostrarBanner("ESCUDO ABSORVEU O IMPACTO!", "perk", "🛡️");
          cameraShake = 6;
          return;
        }

        if (isStomp) {
          // STOMP neutraliza: amassa a Toga com a fralda
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainF = grantVotes(4214);
          votes += gainF;
          buzz(30);
          spawnParticles(obs.x + obs.w / 2, obs.y + 10, '#ffd400', 12);
          mostrarBanner(`TOGA AMASSADA! +${formatVotes(gainF)} VOTOS`, "reward", "⚖️");
          return;
        }

        // Lateral não é morte injusta: Renan tropeça, perde 2 vidas e 1 fralda
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        if (votes > 0) votes -= 1400;
        obs.neutralized = true;
        cameraShake = 4;
        audio.playHit();
        buzz(45);

        if (!loseLife(2, "Levou muitos tropeços na Toga e caiu do debate!")) return;

        mostrarBanner(`TOGA INDEFERIU! -1.000 VOTOS · RESTAM ${lives} ${lives === 1 ? 'VIDA' : 'VIDAS'}`, "danger", "⚖️");
        return;
      }

      // Escudo absorve impacto lateral fatal
      if (hasShield) {
        hasShield = false;
        obs.neutralized = true;
        mostrarBanner("ESCUDO ABSORVEU O IMPACTO!", "perk", "🛡️");
        return;
      }

      // ESPECTRO (só colide na fase sólida — etéreo é ignorado no loop de colisão)
      if (obs instanceof EspectroObstacle) {
        if (isStomp) {
          // STOMP na fase sólida: EXORCISMO! +5.000 votos, desfaz em névoa
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainEs = grantVotes(5614);
          votes += gainEs;
          spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#9b59b6', 14);
          mostrarBanner(`ESPECTRO EXORCIZADO! +${formatVotes(gainEs)} VOTOS`, "reward", "👻");
          buzz(25);
          audio.playHit();
          return;
        }

        // Colisão sólida lateral: tira 1 vida + ASSOMBRADO 3s (rouba 15% dos votos)
        if (!loseLife(1, "O Espectro tocou no Renan!")) return;
        if (hauntedTimer > 0) {
          // Já assombrado: volta pra etérea sem reaplicar o efeito
          obs.goEthereal();
          return;
        }
        hauntedTimer = 3;
        obs.goEthereal();
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        cameraShake = 4;
        audio.playHit();
        buzz(30);
        const lost = Math.min(5000, Math.round(votes * 0.15));
        if (lost > 0) {
          votes = Math.max(0, votes - lost);
          mostrarBanner(`ASSOMBRADO! -${formatVotes(lost)} VOTOS ROUBADOS`, "danger", "👻", "action", "core");
        } else {
          mostrarBanner("ASSOMBRADO! NADA A ROUBAR…", "danger", "👻", "action", "core");
        }
        return;
      }

      // Qualquer outra colisão lateral vira perda de vida (nunca morte instantânea)
      if (!loseLife(1, "Debate encerrado por colisão!")) return;
      neutralizeObstacle(obs);
      renan.vy = -7;
      renan.isGrounded = false;
      renan.isFastFalling = false;
      renan.currentPlatform = null;
      cameraShake = 4;
      audio.playHit();
      buzz(35);
      mostrarBanner("-1 VIDA! COLISÃO!", "danger", "💥");
    }

    // Aviso de reação em cadeia: inimigo gerado na borda 'right' (Drone) ou 'left' (Militante)
    function spawnChainWarning(side, emoji, label) {
      chainSpawnWarnings.push({ side, emoji, label: label.toUpperCase(), timer: 1.8 });
    }

    function drawChainWarnings() {
      if (chainSpawnWarnings.length === 0) return;
      const now = performance.now();
      for (const w of chainSpawnWarnings) {
        const timeLeft = Math.max(0, w.timer / 1.8);
        const bounce = 0.5 + 0.5 * Math.sin(now * 0.02);
        const x = V_WIDTH / 2;
        const y = 116 + bounce * 8;
        const ringR = 26 + bounce * 10;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, w.timer));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Anel pulsante de alerta
        ctx.strokeStyle = 'rgba(255, 70, 80,' + (0.85 * timeLeft) + ')';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x, y, ringR, 0, Math.PI * 2);
        ctx.stroke();
        // Círculo de fundo
        ctx.fillStyle = 'rgba(130, 12, 22,' + (0.32 * timeLeft) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
        // Emoji do inimigo gerado
        ctx.font = '24px sans-serif';
        ctx.fillText(w.emoji, x, y - 1);
        // Rótulo pulsante em negrito com contorno
        ctx.font = '800 15px "Arial Black", sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 2.5;
        ctx.strokeText(w.label, x, y + 34);
        ctx.fillStyle = '#ff5e5e';
        ctx.fillText(w.label, x, y + 34);
        ctx.restore();
      }
    }

    // MC libertado pela Militante foge em disparada com balão de deboche
    function spawnMcEscape() {
      escapingMCs.push({
        x: renan.x + 30,
        y: GROUND_Y - 60,
        speed: 85,
        life: 4.2,
        anim: 0
      });
      // Deixa clara a fuga: explosão de microfones + abalo na câmera
      spawnParticles(renan.x + 45, GROUND_Y - 55, '#d4e157', 16);
      spawnParticles(renan.x + 45, GROUND_Y - 75, '#ffd400', 10);
    }

    function drawEscapingMc(e) {
      const w = 50;
      const h = 68;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, e.life * 1.2));
      const bob = Math.sin(e.anim * 14) * 3;
      const x = e.x;
      const y = e.y + bob;
      // Usa o sprite oficial do MC quando disponível (não uma "caixa amarela com microfone")
      const spr = loadedSprites.mc;
      if (spr && spr.width && spr.height) {
        ctx.drawImage(spr, x, y, w, h);
      } else {
        // Fallback procedural: corpo verde-limão (estilo do MC) correndo pra fora da tela
        ctx.fillStyle = '#d4e157';
        ctx.strokeStyle = '#0b1528';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(x, y + 18, w, h - 26, 7);
        ctx.fill();
        ctx.stroke();
        // Boné vermelho
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(x + 6, y + 2, 26, 7);
        ctx.fillRect(x + 1, y + 7, 17, 4);
        // Cabeça
        ctx.fillStyle = '#fbd4b4';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + 12, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Corrente dourada
      ctx.fillStyle = '#ffd400';
      for (let cx = x + 9; cx <= x + w - 10; cx += 5) {
        ctx.beginPath();
        ctx.arc(cx, y + 25, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Microfone
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎤', x + w / 2, y + 43);
      // Balão de deboche
      drawSpeechBubble(x + w / 2, y - 4, 'HIHI LEVEI VANTAGI', 'MC');
      ctx.restore();
    }

    // --- SPAWNER PROGRESSIVO POR TEMPO DE CORRIDA (0-15s, 15-40s, 40s+) ---
    // NUNCA spawna 2 obstáculos na mesma posição X
    function spawnNextFeature() {
      const spawnX = V_WIDTH + 50;

      // Garante distância segura de qualquer entidade já presente na ponta direita
      for (const obs of obstacles) {
        // Espectro fica PRESO no canto direito — não ocupa a zona de spawn dos outros
        if (obs instanceof EspectroObstacle) continue;
        // Neutralizado/limpado não bloqueia: ele não ameaça mais e só está de passagem
        if (obs.neutralized || obs.cleared) continue;
        if (Math.abs(obs.x - spawnX) < 140) return;
      }
      for (const p of pulpits) {
        if (Math.abs(p.x - spawnX) < 140) return;
      }

      // Distribuição por tempo de jogo:
      // FASE 1 (0-15s): Simples e calma — TOGA rara e JORNALISTA aparece cedo (p/ ser conhecida)
      // Durante ~4.5s após uma intro de tipo NOVO, evita apresentar outro tipo inédito
      // (deixa respirar entre apresentações; troca o spawn por púlpito seguro).
      if (gameTime < 15) {
        const r = Math.random();
        const cooling = (performance.now() - lastIntroAt) < 4500;
        if (r < 0.40) {
          pulpits.push(createNextPulpit(spawnX));
        } else if (r < 0.60 && (!cooling || encounteredTypes.has('ExMblObstacle'))) {
          obstacles.push(new ExMblObstacle(spawnX));
        } else if (r < 0.78 && (!cooling || encounteredTypes.has('LadraoObstacle'))) {
          obstacles.push(new LadraoObstacle(spawnX, 1));
        } else if (r < 0.92 && (!cooling || encounteredTypes.has('JornalistaObstacle'))) {
          obstacles.push(new JornalistaObstacle(spawnX));
        } else if (!cooling || encounteredTypes.has('TogaObstacle')) {
          obstacles.push(new TogaObstacle(spawnX));
        } else {
          pulpits.push(createNextPulpit(spawnX));
        }

      // FASE 2 (15-40s): Acrescenta MC Latrocínio e DRONE do Cury
      } else if (gameTime < 40) {
        const r = Math.random();
        if (r < 0.26) {
          pulpits.push(createNextPulpit(spawnX));
        } else if (r < 0.44) {
          obstacles.push(new ExMblObstacle(spawnX));
        } else if (r < 0.60) {
          obstacles.push(new McLatrocinioObstacle(spawnX));
        } else if (r < 0.74 && !obstacles.some((o) => o instanceof DroneObstacle)) {
          obstacles.push(new DroneObstacle(spawnX, 410));
        } else if (r < 0.86) {
          obstacles.push(new LadraoObstacle(spawnX, 1));
        } else if (r < 0.96) {
          obstacles.push(new JornalistaObstacle(spawnX));
        } else {
          obstacles.push(new TogaObstacle(spawnX));
        }

      // FASE 3 (Após 40s): Todos os tipos, incluindo minichefia de ladrões
      } else {
        const r = Math.random();
        // Espectro: raro, standalone (folga ≥260px de qualquer entidade) e nunca duplicado em tela
        const espectroOk = !obstacles.some((o) => o instanceof EspectroObstacle)
          && obstacles.every((o) => o.x < spawnX - 260);
        if (r < 0.20) {
          pulpits.push(createNextPulpit(spawnX));
        } else if (r < 0.36) {
          obstacles.push(new JornalistaObstacle(spawnX));
        } else if (r < 0.50) {
          obstacles.push(new McLatrocinioObstacle(spawnX));
        } else if (r < 0.58 && !obstacles.some((o) => o instanceof DroneObstacle)) {
          obstacles.push(new DroneObstacle(spawnX, 410));
        } else if (r < 0.68 && espectroOk) {
          obstacles.push(new EspectroObstacle(spawnX));
        } else if (r < 0.80 && !thiefSquadActive && obstacles.length <= 1) {
          // Trio de ladrões bem espaçado (116px entre si p/ dar respiro entre pulos)
          thiefSquadActive = true;
          thiefSquadCount = 3;
          thiefSquadCaught = 0;
          obstacles.push(new LadraoObstacle(spawnX, 1));
          obstacles.push(new LadraoObstacle(spawnX + 116, 2));
          obstacles.push(new LadraoObstacle(spawnX + 232, 3));
        } else if (r < 0.92) {
          obstacles.push(new ExMblObstacle(spawnX));
        } else {
          obstacles.push(new TogaObstacle(spawnX));
        }
      }

      // Apresenta em slow-mo qualquer tipo de inimigo inédito desta sessão
      for (const obs of obstacles) maybeIntroduceObstacle(obs);
    }

    // Aparição FORÇADA do Espectro aos 30s de corrida (1x por run).
    // Depois disso o Espectro só volta pelo raro aleatório da fase 3.
    function maybeForceEspectroSpawn() {
      if (espectroForcedThisRun) return;
      if (gameState !== STATE.PLAYING) return;
      if (obstacles.some((o) => o instanceof EspectroObstacle)) return;

      const edgeX = V_WIDTH + 50;
      // Mesmas salvaguardas do spawner: folga de 140px na borda e folga ≥260px de entidades
      const blocked = obstacles.some((o) => Math.abs(o.x - edgeX) < 140)
        || pulpits.some((p) => Math.abs(p.x - edgeX) < 140)
        || obstacles.some((o) => o.x > edgeX - 260);
      if (blocked) {
        scheduleSpawn(0.6, maybeForceEspectroSpawn);
        return;
      }

      espectroForcedThisRun = true;
      const ghost = new EspectroObstacle(edgeX);
      obstacles.push(ghost);
      maybeIntroduceObstacle(ghost);
    }

    // Perfil do card de apresentação por tipo de inimigo
    const ENCOUNTER_PROFILES = {
      JornalistaObstacle: { name: 'JORNALISTA', quip: 'E O FEMINICÍDIO, CANDIDATO?', emoji: '📢' },
      ExMblObstacle:      { name: 'EX-MBL',      quip: 'EX-MBL TRAIDOR',          emoji: '🗣️' },
      McLatrocinioObstacle:{ name: 'MC LATROCÍNIO', quip: 'TROPA TROPA TROPA',    emoji: '🎶' },
      LadraoObstacle:     { name: 'LADRÃO DE CELULAR', quip: 'PASSA O CELULAR!',  emoji: '📱' },
      MilitanteChaser:    { name: 'MILITANTE',   quip: 'SOLTA ELE!',              emoji: '🚩' },
      DroneObstacle:      { name: 'DRONE',       quip: 'MISÓGINO, AGRESSOR DE MULHER!', emoji: '🚁' },
      TogaObstacle:       { name: 'TOGA DO SUPREMO', quip: 'INDEFERIDO!',         emoji: '⚖️' },
      EspectroObstacle:   { name: 'ESPECTRO',     quip: 'MORTE A ADOLF HITLER!!', emoji: '👻' }
    };

    function maybeIntroduceObstacle(obs) {
      const profile = ENCOUNTER_PROFILES[obs.constructor.name];
      if (!profile) return;
      triggerEncounterIntro(obs.constructor.name, profile.name, profile.quip, profile.emoji);
    }

    // Sprite (PNG) usado como miniatura no card de introdução — no lugar do emoji
    const INTRO_THUMB_SPRITES = {
      JornalistaObstacle: 'jornalista',
      ExMblObstacle: 'exmbl',
      McLatrocinioObstacle: 'mc',
      LadraoObstacle: 'ladrao',
      MilitanteChaser: 'militante',
      DroneObstacle: 'drone',
      TogaObstacle: 'toga',
      EspectroObstacle: 'espectro'
    };

    // Arquivo real (assets/audio/enemy_*.mp3) por tipo de inimigo no card de introdução
    function enemyFixtureKey(typeKey) {
      const map = {
        JornalistaObstacle: 'enemy_jornalista',
        ExMblObstacle: 'enemy_exmbl',
        McLatrocinioObstacle: 'enemy_mc',
        LadraoObstacle: 'enemy_ladrao',
        MilitanteChaser: 'enemy_militante',
        DroneObstacle: 'enemy_drone',
        TogaObstacle: 'enemy_toga',
        EspectroObstacle: 'enemy_espectro'
      };
      return map[typeKey] || null;
    }

    function spawnCollectible(x) {
      const pRoll = Math.random();
      let type = 'valete';

      // Bandeira imperial MUITO rara (4%); Clássica comum; Onça rara
      if (pRoll < 0.04) {
        type = 'imperial';
      } else if (pRoll < 0.12) {
        type = 'onca';
      } else if (pRoll < 0.26) {
        type = 'livro';
      } else if (pRoll < 0.42) {
        type = 'espadim';
      } else if (pRoll < 0.58) {
        type = 'broche';
      } else if (pRoll < 0.90) {
        type = 'classica';
      } else {
        type = 'valete';
      }

      collectibles.push(new CollectibleItem(x, GROUND_Y - 100, type));
    }

    // Formata votos no padrão pt-BR: 1000 -> "1.000", 12000 -> "12.000"
    function formatVotes(n) {
      return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function formatTimeSeconds(t) {
      const s = Math.max(0, Math.floor(t));
      const m = Math.floor(s / 60);
      const r = s % 60;
      return `${m}:${r.toString().padStart(2, '0')}`;
    }

    // --- AVISO DE PERK ACABANDO ---
    // Últimos 2s de invencibilidade (onça/imperial/livro): efeitos piscam em vermelho
    function getLowestPerkTimer() {
      let t = Infinity;
      if (oncaRidingTimer > 0) t = Math.min(t, oncaRidingTimer);
      if (imperialModeTimer > 0) t = Math.min(t, imperialModeTimer);
      if (bookInvincibleTimer > 0) t = Math.min(t, bookInvincibleTimer);
      return t;
    }

    function perkIsEnding() {
      const t = getLowestPerkTimer();
      return t !== Infinity && t < 2.0;
    }

    function perkBlinkOff() {
      return Math.floor(performance.now() / 160) % 2 === 0;
    }

    function updateHudDisplay() {
      // Só escreve no DOM quando o valor muda — reduz operações DOM de ~360/s para ~30/s
      // Ticker de soma: calcula o delta de cada contador e mostra +XXXX ao lado dele
      const vDelta = votes - lastVisVotes; lastVisVotes = votes;
      const hDelta = handcuffs - lastVisHandcuffs; lastVisHandcuffs = handcuffs;
      const lDelta = lives - lastVisLives; lastVisLives = lives;
      if (vDelta) pulseHudDelta('hud-votes', vDelta, vDelta > 0 ? '#ffe08a' : '#fca5a5');
      if (hDelta) pulseHudDelta('hud-handcuffs', hDelta, '#86efac');
      if (lDelta) pulseHudDelta('hud-lives', lDelta, lDelta > 0 ? '#86efac' : '#fca5a5');

      const vF = formatVotes(votes); const hF = handcuffs;
      const tF = formatTimeSeconds(gameTime);
      if (hudCache.votes !== vF) { hudCache.votes = vF; document.getElementById('hud-votes').textContent = vF; }
      if (hudCache.time !== tF)  { hudCache.time = tF;  document.getElementById('hud-time').textContent = tF; }
      if (hudCache.handcuffs !== hF) { hudCache.handcuffs = hF; document.getElementById('hud-handcuffs').textContent = hF; }

      const livesKey = '❤'.repeat(Math.max(0, lives));
      if (hudCache.lives !== livesKey) {
        hudCache.lives = livesKey;
        document.getElementById('hud-lives').textContent = livesKey || '—';
      }

      const currentRank = getRankByVotes(votes);
      if (hudCache.rank !== currentRank.title) {
        hudCache.rank = currentRank.title;
        document.getElementById('hud-rank').textContent = currentRank.title;
      }

      // Barra de progresso até a próxima patente (cheia = patente máxima)
      const rankIdx = RANK_TIERS.indexOf(currentRank);
      let pct = 1;
      let nextTitle = '';
      if (rankIdx > 0) {
        const cur = RANK_TIERS[rankIdx].min;
        const next = RANK_TIERS[rankIdx - 1].min;
        pct = Math.max(0, Math.min(1, (votes - cur) / (next - cur)));
        nextTitle = RANK_TIERS[rankIdx - 1].title;
      }
      const pctKey = `${pct.toFixed(2)}|${nextTitle}`;
      if (hudCache.rankPct !== pctKey) {
        hudCache.rankPct = pctKey;
        const fill = document.getElementById('hud-rank-fill');
        if (fill) {
          fill.style.width = `${Math.round(pct * 100)}%`;
          const track = fill.parentElement;
          if (track) {
            track.title = nextTitle ? `Próxima patente: ${nextTitle}` : 'Patente máxima alcançada!';
          }
        }
      }
      // Meta de votos exibida no fim da barra de patente: "VOTOS" pequeno em cima e o número grande embaixo
      const targetStr = rankIdx > 0 ? `VOTOS ${formatVotes(RANK_TIERS[rankIdx - 1].min)}` : 'Alexandre, O Grande';
      if (hudCache.rankTarget !== targetStr) {
        hudCache.rankTarget = targetStr;
        const tgtLabel = document.getElementById('hud-rank-target-label');
        const tgtNum = document.getElementById('hud-rank-target-num');
        if (tgtLabel && tgtNum) {
          tgtLabel.textContent = rankIdx > 0 ? 'VOTOS' : '';
          tgtNum.textContent = rankIdx > 0 ? formatVotes(RANK_TIERS[rankIdx - 1].min) : 'Alexandre, O Grande';
          tgtNum.classList.toggle('max-shrink', rankIdx === 0);
        }
      }

      const multVal = getActiveMultiplier();
      const mKey = multVal > 1 ? `x${multVal}` : '';
      if (hudCache.mult !== mKey) {
        hudCache.mult = mKey;
        const multEl = document.getElementById('hud-mult');
        if (multVal > 1) { multEl.style.display = 'inline-flex'; multEl.textContent = mKey; }
        else multEl.style.display = 'none';
      }

      const perkEl = document.getElementById('hud-perk-active');
      let perkKey = '';
      if (oncaRidingTimer > 0) perkKey = 'ONÇA PINTADA';
      else if (imperialModeTimer > 0) perkKey = 'MODO IMPERIAL';
      else if (bookInvincibleTimer > 0) perkKey = 'LIVRO AMARELO';
      else if (hasShield) perkKey = 'ESCUDO R14';
      else if (hasSwordStrike) perkKey = 'ESPADIM';
      if (hudCache.perk !== perkKey) {
        hudCache.perk = perkKey;
        if (perkKey) { perkEl.style.display = 'inline-flex'; perkEl.textContent = perkKey; }
        else perkEl.style.display = 'none';
      }

      // Invencibilidade na reta final: badge pisca para sinalizar o fim iminente
      if (perkKey) {
        perkEl.classList.toggle('ending', perkIsEnding());
      } else {
        perkEl.classList.remove('ending');
      }

      // Status Minichefia Presos n/3
      const squadEl = document.getElementById('hud-squad');
      if (thiefSquadActive) {
        squadEl.style.display = 'inline-flex';
        squadEl.textContent = `PRESOS: ${thiefSquadCaught}/3`;
      } else {
        squadEl.style.display = 'none';
      }

      // Assombrado pelo Espectro (👻 com timer de 3s)
      const hauntVal = hauntedTimer > 0 ? `👻 ${Math.ceil(hauntedTimer)}s` : '';
      if (hudCache.haunt !== hauntVal) {
        hudCache.haunt = hauntVal;
        const hauntEl = document.getElementById('hud-haunt');
        if (hauntEl) {
          if (hauntedTimer > 0) {
            hauntEl.style.display = 'inline-flex';
            hauntEl.textContent = hauntVal;
          } else {
            hauntEl.style.display = 'none';
          }
        }
      }
    }

    function checkPulpitCollision(p) {
      // Hitbox do Renan
      const rx = renan.x + 5;
      const ry = renan.y + 6;
      const rw = renan.w - 10;
      const rh = renan.h - 6;

      const px = p.x;
      const py = p.y;
      const pw = p.w;
      const ph = p.h;

      if (rx + rw > px && rx < px + pw && ry + rh > py && ry < py + ph) {
        const isLandingOnTop = (renan.vy >= 0) && (renan.y + renan.h - renan.vy <= py + 24);

        if (isLandingOnTop) {
          renan.y = py - renan.h;
          renan.vy = 0;
          renan.isGrounded = true;
          renan.isFastFalling = false;
          renan.currentPlatform = p;

          if (!p.hasDiaper && !p.stumbled) {
            p.hasDiaper = true;
            p.diaperScale = 1.4;
            p.stumbled = false;
            const pGain = grantVotes(1400);
            votes += pGain;
            audio.playDiaperPlaced();
            buzz(30);

            // Mensagem oficial no BANNER do topo com leitura impecável
            const shoutText = CANDIDATE_INSULTS[p.candidateName] || `${p.candidateName} FUJÃO`;
            mostrarBanner(shoutText, "pulpit", "👶");

            freezeTimer = 0.22;
spawnParticles(p.x + p.w / 2, p.y + 4, '#ffffff', 14);
            spawnParticles(p.x + p.w / 2, p.y + 4, '#ffd400', 10);

            if (lives < MAX_LIVES) {
              lives++;
              addFloatingText(p.x + p.w / 2, p.y - 52, "+1 VIDA ❤", '#2ecc71');
            }
          }
        } else if (!p.stumbled) {
          // Escudo R14 também absorve o TROMBO lateral no púlpito (consome o escudo)
          if (hasShield) {
            hasShield = false;
            p.stumbled = true;
            renan.vy = -8;
            renan.isGrounded = false;
            renan.isFastFalling = false;
            renan.currentPlatform = null;
            audio.playHit();
            buzz(45);
            spawnParticles(renan.x + renan.w / 2, renan.y + renan.h, '#3498db', 12);
            mostrarBanner("ESCUDO ABSORVEU O IMPACTO!", "perk", "🛡️");
            return;
          }

          // Invencível (onça/imperial/livro): tromba no púlpito sem perder vida
          if (renan.isInvincible()) {
            p.stumbled = true;
            renan.vy = -8;
            renan.isGrounded = false;
            renan.isFastFalling = false;
            renan.currentPlatform = null;
            audio.playHit();
            buzz(30);
            if (oncaRidingTimer > 0) {
              mostrarBanner("ATROPELADO PELO PÚLPITO! ONÇA SEGURA", "perk", "🐆");
            } else {
              mostrarBanner("INVENCÍVEL! TROMBA NO PÚLPITO SEM SUSTO", "perk", "💛");
            }
            return;
          }

          // Colisão lateral não é morte injusta: o Renan tropeça, perde 1 vida e é jogado para cima
          p.stumbled = true;
          renan.vy = -8;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          cameraShake = 4;
          audio.playHit();
          buzz(45);

          lives -= 1;
          if (lives <= 0) {
            triggerGameOver(`Tropeçou ${MAX_LIVES} vezes no púlpito e caiu do debate!`);
            return;
          }

          mostrarBanner(`TROPEÇOU! · RESTAM ${lives} ${lives === 1 ? 'VIDA' : 'VIDAS'}`, "danger", "😵");
          spawnParticles(renan.x + renan.w / 2, renan.y + renan.h, '#ffffff', 6);
        }
      }
    }

    function checkAABB(x1, y1, w1, h1, x2, y2, w2, h2) {
      return (x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2);
    }

    // --- RENDERIZAÇÃO DO AMBIENTE ---
    function drawStudioBackground() {
      // Fundo azul-marinho sólido e uniforme na cor exata #0f1f3d (RGB 15, 31, 61),
      // idêntico à cor de fundo dos novos sprites para camuflagem e fusão perfeita 1:1.
      // Sem gradientes, vinhetas ou luzes que possam revelar o contorno retangular do sprite.
      ctx.fillStyle = '#0f1f3d';
      ctx.fillRect(0, 0, V_WIDTH, GROUND_Y);

      // CHÃO DO PALCO DO DEBATE
      // Linha dourada delimitadora do piso de corrida
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(V_WIDTH, GROUND_Y);
      ctx.stroke();

      // Base do tablado (abaixo do chão por onde o personagem corre)
      ctx.fillStyle = '#0b162c';
      ctx.fillRect(0, GROUND_Y, V_WIDTH, V_HEIGHT - GROUND_Y);

      // Marcações sutis de passos no piso do estúdio
      ctx.strokeStyle = 'rgba(255, 212, 0, 0.12)';
      ctx.lineWidth = 2;
      const offset = (distanceCovered * 1.2) % 40;
      for (let x = -offset; x < V_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 14);
        ctx.lineTo(x + 18, GROUND_Y + 14);
        ctx.stroke();
      }
    }

// --- DESENHO DO SISTEMA DE BANNER (pill suave, sem outline pesado) ---
    function drawActiveBanner() {
      if (!activeBanner) return;

      ctx.save();
      const useGlobal = activeBanner.mode === 'global';
      const bW = Math.round(V_WIDTH * (useGlobal ? 0.7 : 0.62));
      const bH = Math.round(V_HEIGHT * (useGlobal ? 0.1 : 0.06));
      let bX = Math.round((V_WIDTH - bW) / 2);
      let bY;
      if (useGlobal) {
        bY = Math.round((V_HEIGHT - bH) / 2);
      } else {
        bY = 322;
      }

      // Fade suave de entrada (0.2s) e saída (0.4s)
      let alpha = 1;
      if (activeBanner.timer < 0.4) {
        alpha = Math.max(0, activeBanner.timer / 0.4);
      } else if (activeBanner.timer > activeBanner.duration - 0.2) {
        alpha = Math.max(0, (activeBanner.duration - activeBanner.timer) / 0.2);
      }
      ctx.globalAlpha = alpha;

      // Fundo glass translúcido + borda sutil (sem glow amarelo agressivo)
      ctx.fillStyle = 'rgba(11, 18, 34, 0.76)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 16);
      ctx.fill();

      // Faixa de acento discreta na esquerda, na cor do tipo
      const accent = activeBanner.tipo === 'danger' ? '#ff8794'
        : activeBanner.tipo === 'reward' ? '#86efac'
        : activeBanner.tipo === 'rank' ? '#ffd88f' : '#ffe08a';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(bX + 6, bY + 8, 5, bH - 16, 3);
      ctx.stroke();

      // Ícone + Texto: peso 700 ("Black" → 700), sem contorno preto pesado
      const cx = bX + bW / 2;
      const cy = bY + bH / 2;

      const fullText = `${activeBanner.icone} ${activeBanner.texto}`;
      const maxLineW = bW - 40;
      let textFont = 17;
      let lines = [fullText];
      const words = fullText.split(' ');
      while (textFont >= 11) {
        ctx.font = `700 ${textFont}px "Arial Black", sans-serif`;
        const tmp = [];
        let cur = '';
        for (const w of words) {
          const cand = cur ? cur + ' ' + w : w;
          if (cur && ctx.measureText(cand).width > maxLineW) {
            tmp.push(cur);
            cur = w;
          } else {
            cur = cand;
          }
        }
        if (cur) tmp.push(cur);
        const fitsAll = tmp.every((l) => ctx.measureText(l).width <= maxLineW);
        if ((fitsAll && tmp.length <= 2) || textFont <= 11) {
          lines = tmp;
          break;
        }
        textFont -= 1;
      }
      ctx.font = `700 ${textFont}px "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lineH = Math.ceil(textFont * 1.25);
      const textStartY = cy - ((lines.length - 1) * lineH) / 2;

      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#ffe08a';
      for (let i = 0; i < lines.length; i++) {
        ctx.strokeText(lines[i], cx, textStartY + i * lineH);
        ctx.fillText(lines[i], cx, textStartY + i * lineH);
      }

      ctx.restore();
    }

    // Modo pixel (padrão do jogo): renderiza a cena em um offscreen de baixa resolução
    // (fator PIXEL_RATIO) e reescala com nearest-neighbor. Os textos do canvas são
    // desenhados com fonte pixel (via proxy de ctx.font) para ficarem nítidos em vez
    // de borrados. Com ?pixel=0 o render volta à resolução cheia sem pixelização.
    function render() {
      if (!PIXEL_MODE) {
        drawScene();
        return;
      }
      const realCtx = ctx;
      const fullW = canvas.width;
      const fullH = canvas.height;
      const lowW = Math.max(2, Math.round(fullW / PIXEL_RATIO));
      const lowH = Math.max(2, Math.round(fullH / PIXEL_RATIO));
      const low = document.createElement('canvas');
      low.width = lowW;
      low.height = lowH;
      const lowCtx = low.getContext('2d');
      const s = Math.min(lowW / V_WIDTH, lowH / V_HEIGHT);
      const ov = { scale: VIEW.scale, ox: VIEW.ox, oy: VIEW.oy };
      VIEW.scale = s;
      VIEW.ox = (lowW - V_WIDTH * s) / 2;
      VIEW.oy = (lowH - V_HEIGHT * s) / 2;
      ctx = makePixelFontProxy(lowCtx);
      try {
        drawScene();
      } finally {
        ctx = realCtx;
        VIEW.scale = ov.scale;
        VIEW.ox = ov.ox;
        VIEW.oy = ov.oy;
      }
      realCtx.setTransform(1, 0, 0, 1, 0, 0);
      realCtx.globalAlpha = 1;
      realCtx.fillStyle = '#04081a';
      realCtx.fillRect(0, 0, fullW, fullH);
      realCtx.imageSmoothingEnabled = false;
      realCtx.drawImage(low, 0, 0, fullW, fullH);
      realCtx.imageSmoothingEnabled = true;
    }

    function drawScene() {
      // Limpa todo o canvas em coordenadas de dispositivo (bonita borda letterbox)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#04081a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Vista virtual escalada uniformemente e centralizada (barras escuras laterais)
      ctx.save();
      ctx.setTransform(VIEW.scale, 0, 0, VIEW.scale, VIEW.ox, VIEW.oy);

      // Tremor de tela sutil
      if (cameraShake > 0) {
        const shakeX = (Math.random() - 0.5) * cameraShake * 2;
        const shakeY = (Math.random() - 0.5) * cameraShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // Fundo e Palco
      drawStudioBackground();

      // Púlpitos
      pulpits.forEach(p => p.draw());

      // Coletáveis (Perks & Bandeiras)
      collectibles.forEach(c => c.draw());

      // Obstáculos e Inimigos
      obstacles.forEach(o => o.draw());

      // Renan
      renan.draw();

      // Partículas
      particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.life);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Textos Flutuantes de Mecânica (ESCUDO!, +1 VIDA…) — contorno leve
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.lineWidth = 2;
        ctx.font = '700 14px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 3;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // MC escapando de corrida (fuga + balão de deboche)
      for (const esc of escapingMCs) drawEscapingMc(esc);

      // BANNER PRINCIPAL DE AVISOS NO TOPO
      drawActiveBanner();

      // Indicador pulsante de reação em cadeia (de onde o inimigo gerado vem)
      drawChainWarnings();

      // Assombração: pulso em VÓRTICE que cresce a partir do Renan até cobrir a tela
      // por inteiro — no PICO (0,5s) a tela fica COMPLETAMENTE opaca (cegueira total,
      // cobre inclusive o HUD via overlay DOM #haunt-blind). Curto, mas 100% punitivo.
      function drawHauntOverlay() {
        // Morreu com a assombração ativa: a cegueira NÃO pode voltar a piscar na
        // tela final (a render continua rodando no game over)
        if (gameState !== STATE.PLAYING) return;
        if (hauntedTimer <= 0) return;
        const tTotal = 3 - hauntedTimer; // tempo decorrido do efeito
        // Fade de entrada e saída do efeito total
        const fade = Math.min(1, tTotal / 0.3, hauntedTimer / 0.3);
        if (fade <= 0.05) return;

        // Ciclo: a cegueira CRESCE gradualmente e só fica 100% no fim de cada ciclo (0,3s)
        const cycle = 1.5;
        const ph = (performance.now() / 1000) % cycle;
        const fullDur = 0.3;
        const fullStart = cycle - fullDur; // rampa de 1,2s -> cego por completo 0,3s
        const isFull = ph >= fullStart;
        const grow = isFull ? 1 : ph / fullStart; // crescente (0→1) até o fim do ciclo

        // Centro do vórtice: sobre o Renan (a assombração "engole" o personagem)
        const rc = renan || {};
        const cx = Math.max(0, Math.min(V_WIDTH, (rc.x || V_WIDTH / 2) + (rc.w || 0) / 2));
        const cy = Math.max(0, Math.min(V_HEIGHT, (rc.y || V_HEIGHT / 2) + (rc.h || 0) / 2));

        ctx.save();
        if (isFull) {
          // Cegueira total por 0,3s no pico do pulso (mesma cor do pulso: rgba(6,2,18))
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#060212';
          ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
          setHauntBlind(true);
        } else {
          const farX = Math.max(cx, V_WIDTH - cx);
          const farY = Math.max(cy, V_HEIGHT - cy);
          const maxR = Math.hypot(farX, farY) + 24;
          const r = Math.max(8, 24 + (maxR - 24) * grow);
          const dark = Math.min(1, (0.4 + 0.6 * grow) * fade);
          const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
          g.addColorStop(0, `rgba(30, 12, 64, ${(dark * 0.6).toFixed(3)})`);
          g.addColorStop(0.6, `rgba(22, 9, 52, ${(dark * 0.85).toFixed(3)})`);
          g.addColorStop(0.9, `rgba(130, 60, 220, ${(0.4 * fade).toFixed(3)})`);
          g.addColorStop(1, `rgba(6, 2, 18, ${dark.toFixed(3)})`);
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
          setHauntBlind(false);
        }
        ctx.restore();
      }

    // Efeito de tela do OVERDRIVE unificado (onça + imperial)
    function drawOverdriveEffect() {
      if (!overdriveKind) return;
      const cfg = OVERDRIVE_CONFIG[overdriveKind];
      const t = performance.now() / 1000;
      const pulse = 0.1 + Math.sin(t * 4) * 0.05;
      const aStr = pulse.toFixed(3);
      ctx.save();
      // Vinheta escura pulsante nas bordas (dramatiza o modo ativo)
      const g = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
      g.addColorStop(0, `rgba(0,0,0,${aStr})`);
      g.addColorStop(0.5, `rgba(0,0,0,0)`);
      g.addColorStop(1, `rgba(0,0,0,${aStr})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      // Brilho lateral na cor do modo
      ctx.fillStyle = hexToRgba(cfg.fx, (pulse * 0.6).toFixed(3));
      const v = 22;
      ctx.fillRect(0, 0, v, V_HEIGHT);
      ctx.fillRect(V_WIDTH - v, 0, v, V_HEIGHT);
      // Selo discreto com o nome do modo
      ctx.textAlign = 'center';
      ctx.font = '900 12px "Arial Black", sans-serif';
      ctx.fillStyle = hexToRgba(cfg.fx, '0.85');
      ctx.fillText(`${cfg.bannerEmoji} ${cfg.hudTag}`, V_WIDTH / 2, 26);
      ctx.textAlign = 'left';
      ctx.restore();
    }

    // Pulso dourado da VASSOURADA: anel de choque saindo do Renan até as bordas.
    // Estilo do pulso da assombração, porém em amarelo/dourado e como onda que limpa.
    function drawFlagSweepPulse() {
      if (!flagSweep) return;
      const s = flagSweep;
      const grow = Math.min(1, s.t / s.dur);
      const ring = Math.sin(grow * Math.PI); // acende no meio, apaga no fim
      const r = Math.max(10, 24 + (s.maxR - 24) * grow);
      ctx.save();
      const g = ctx.createRadialGradient(s.cx, s.cy, 2, s.cx, s.cy, r);
      g.addColorStop(0, `rgba(255, 212, 0, ${(0.18 * ring).toFixed(3)})`);
      g.addColorStop(0.85, `rgba(255, 212, 0, ${(0.06 * ring).toFixed(3)})`);
      g.addColorStop(0.94, `rgba(255, 236, 130, ${(0.9 * ring).toFixed(3)})`);
      g.addColorStop(0.99, `rgba(255, 246, 200, ${(0.85 * ring).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255, 212, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
      // Borda do anel bem definida
      ctx.strokeStyle = `rgba(255, 226, 102, ${(0.95 * ring).toFixed(3)})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(s.cx, s.cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Card de apresentação "PRIMEIRO CONFRONTO" (acima de tudo)
      drawIntroCard();

      // Efeito pulsante de ASSOMBRADO (Espetrô) por cima do card
      drawHauntOverlay();

      // Efeito de tela do overdrive (onça/imperial)
      drawOverdriveEffect();

      // Vassourada: pulso dourado do Renan expandindo até as bordas
      drawFlagSweepPulse();

      // Pausa dramática do "MACHISTA!" destacado (bateu no drone)
      if (machistaFlashTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        ctx.translate(V_WIDTH / 2, V_HEIGHT / 2);
        ctx.rotate(Math.sin(performance.now() * 0.04) * 0.06);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff8794';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ff8794';
        ctx.font = '700 28px sans-serif';
        ctx.fillText(machistaKillFlash > 0 ? 'DRONE ABATIDO!' : 'MACHISTA!', 0, -16);
        ctx.shadowBlur = 6;
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px sans-serif';
        ctx.fillText(
          machistaKillFlash > 0 ? `+${formatVotes(machistaKillFlash)} VOTOS` : '-2.114 VOTOS · -1 VIDA',
          0,
          34
        );
        ctx.restore();
      }

      // Versão do jogo, discreta no canto inferior esquerdo
      ctx.save();
      ctx.globalAlpha = 0.32;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'normal 10px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('v' + GAME_VERSION, 8, V_HEIGHT - 8);
      ctx.restore();

      // Overlay de PAUSA (desenhado por último para não ser encoberto)
      if (isPaused) {
        ctx.save();
        ctx.fillStyle = 'rgba(4, 9, 18, 0.72)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255, 212, 0, 0.55)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffd400';
        ctx.font = '800 34px "Arial Black", sans-serif';
        ctx.fillText('PAUSADO', V_WIDTH / 2, V_HEIGHT / 2 - 30);
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#c6d3ea';
        ctx.font = '700 14px "Arial Black", sans-serif';
        ctx.fillText('TOQUE EM ▶ OU PRESSIONE P PARA CONTINUAR', V_WIDTH / 2, V_HEIGHT / 2 + 20);
        ctx.restore();
      }

      ctx.restore();
    }

    // --- GAME LOOP (ROBUSTO CONTRA CONGELAMENTO) ---
    let lastTime = performance.now();

    function gameLoop(now) {
      // Se timestamp não for numérico, recorre a performance.now()
      if (!now || isNaN(now) || !isFinite(now)) {
        now = performance.now();
      }

      // Delta time clamp estrito entre 0 e 50ms (0.05s); padrão 16.67ms se inválido
      let rawDt = (now - lastTime) / 1000;
      if (isNaN(rawDt) || !isFinite(rawDt) || rawDt <= 0) {
        rawDt = 0.01667;
      }
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);
      lastTime = now;

      // Execução protegida por try/catch para que falhas transitórias não matem o loop
      try {
        if (gameState === STATE.PLAYING && !isPaused) {
          updateWorld(dt);
        }
        render();
      } catch (loopErr) {
        console.error("Erro no ciclo de atualização/renderização:", loopErr);
        // Nunca congelar em silêncio: pinta a mensagem de erro na tela
        try {
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillStyle = '#ff5e5e';
          ctx.font = '12px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          const msg = 'ERRO: ' + (loopErr && loopErr.message ? loopErr.message : String(loopErr));
          ctx.fillText(msg.slice(0, 120), 10, 40);
        } catch (screenErr) { /* sem falha adicional */ }
      }

      requestAnimationFrame(gameLoop);
    }

    // --- TELAS E TRANSIÇÕES ---
    const overlayStart = document.getElementById('overlay-start');
    const overlayGameOver = document.getElementById('overlay-gameover');
    const btnPlay = document.getElementById('btn-play');
    const btnReplay = document.getElementById('btn-replay');
    const btnShare = document.getElementById('btn-share');
    const btnHome = document.getElementById('btn-home');
    const soundToggle = document.getElementById('sound-toggle');
    const shareToast = document.getElementById('share-toast');

    // Opção persistente: pula as apresentações de inimigos (por dispositivo)
    const chkSkipIntros = document.getElementById('chk-skip-intros');
    if (chkSkipIntros) {
      chkSkipIntros.checked = getSkipIntrosFlag();
      chkSkipIntros.addEventListener('change', () => setSkipIntrosFlag(chkSkipIntros.checked));
    }

    // Animação de entrada da tela inicial: o quadro do Renan cresce (CSS) e, ao
    // terminar, libera o fade-in de textos/botão e o toque/tecla para iniciar.
    // A música 'start' já dispara no load — a animação roda junto desde o início.
    const MENU_INTRO_MS = 2250; // deve casar com startArtGrow (styles.css)
    let menuIntroTimer = null;
    function playMenuIntro() {
      overlayStart.classList.remove('reveal-done');
      menuIntroDone = false;
      clearTimeout(menuIntroTimer);
      menuIntroTimer = setTimeout(() => {
        menuIntroDone = true;
        overlayStart.classList.add('reveal-done');
      }, MENU_INTRO_MS);
    }

    function startGame() {
      audio.init();
      realAudio.unlock();
      realAudio.setBgm('game');
      audio.playStartSting();
      isPaused = false;
      syncPauseUi();
      gameState = STATE.PLAYING;
      resetWorld();
      overlayStart.classList.add('hidden');
      overlayGameOver.classList.add('hidden');
      // Sessão nova: libera registro no ranking
      lbSubmittedThisRun = false;
      const lbSubmitBtn = document.getElementById('lb-submit');
      if (lbSubmitBtn) lbSubmitBtn.disabled = false;
    }

    function requestStartGame() {
      if (gameState === STATE.PLAYING) return;
      startGame();
    }

    function syncPauseUi() {
      const pIcon = document.getElementById('pause-icon');
      const plIcon = document.getElementById('play-icon');
      if (!pIcon || !plIcon) return;
      pIcon.style.display = isPaused ? 'none' : 'block';
      plIcon.style.display = isPaused ? 'block' : 'none';
    }

    function togglePause() {
      if (gameState !== STATE.PLAYING) return;
      isPaused = !isPaused;
      if (!isPaused) audio.init();
      syncPauseUi();
    }

    document.getElementById('pause-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      audio.playClick();
      togglePause();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && gameState === STATE.PLAYING && !isPaused) togglePause();
    });

    function triggerGameOver(reasonText) {
      if (gameState === STATE.GAMEOVER) return;
      gameState = STATE.GAMEOVER;
      setHauntBlind(false); // se morreu durante a assombração, garante que o blackout não fique preso na tela
      hauntedTimer = 0; // encerra o ciclo de cegueira: o overlay não volta a piscar no game over
      realAudio.setBgm(null);
      audio.playGameOverSting();
      cameraShake = 6;

      // Salva recorde: cada algema vale +2.114 votos no fechamento (151×14)
      const VOTES_PER_HANDCUFF = 2114; // 151×14 — números do partido
      const finalVotes = votes + handcuffs * VOTES_PER_HANDCUFF;
      lastFinalScore = finalVotes;
      lastGameTime = gameTime;
      lastVotes = finalVotes;

      const isNewRecord = finalVotes > highscore;
      lastRunWasNewRecord = isNewRecord;
      if (isNewRecord) {
        highscore = finalVotes;
        localStorage.setItem('renan_mission_best', highscore.toString());
        audio.playNewRecord();
        buzz([40, 30, 40, 30, 90]);
      }

      // Obtém a Patente conquistada
      const rank = getRankByVotes(finalVotes);

      // Preenche dados da tela final (frase rotativa + tempo de sobrevivência)
      const goLabel = document.getElementById('go-time-label');
      goLabel.textContent = `Sobreviveu por ${gameTime.toFixed(1)}s`;
      document.getElementById('go-score').textContent = handcuffs;
      document.getElementById('go-votes').textContent = formatVotes(finalVotes);
      document.getElementById('go-obstacles').textContent = obstaclesCleared;
      document.getElementById('go-record').textContent = formatVotes(highscore);

      // Nota de conversão de algemas em votos
      const convNoteEl = document.getElementById('go-conv-note');
      if (convNoteEl) {
        if (handcuffs > 0) {
          convNoteEl.style.display = 'block';
          convNoteEl.textContent = `${handcuffs} algemas → +${formatVotes(handcuffs * VOTES_PER_HANDCUFF)} votos`;
        } else {
          convNoteEl.style.display = 'none';
        }
      }

      // Prepara o ranking comunitário (carrega a lista)
      const lbSubmitBtn = document.getElementById('lb-submit');
      if (lbSubmitBtn) lbSubmitBtn.disabled = false;
      refreshLeaderboard();

      // Exibe a Patente com destaque visual
      const rankBoxEl = document.getElementById('go-rank-box');
      const rankTitleEl = document.getElementById('go-rank-title');
      rankTitleEl.textContent = rank.title;

      if (rank.isGold) {
        rankBoxEl.classList.add('gold-tier');
        rankTitleEl.classList.add('gold-tier');
      } else {
        rankBoxEl.classList.remove('gold-tier');
        rankTitleEl.classList.remove('gold-tier');
      }

      setTimeout(() => {
        overlayGameOver.classList.remove('hidden');
        if (isNewRecord) {
          const badgeEl = document.getElementById('go-new-record');
          if (badgeEl) badgeEl.classList.add('show');
        }
      }, 350);
    }

    btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      requestStartGame();
    });

    btnReplay.addEventListener('click', (e) => {
      e.stopPropagation();
      startGame();
    });

    // Voltar para a tela inicial (discreto, no rodapé da tela final) e tocar a abertura de novo
    btnHome.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.playClick();
      audio.init();
      realAudio.unlock();
      gameState = STATE.MENU;
      isPaused = false;
      syncPauseUi();
      worldTimeScale = 1;
      overlayGameOver.classList.add('hidden');
      overlayStart.classList.remove('hidden');
      resetWorld();
      playMenuIntro();
      lbSubmittedThisRun = false;
      const lbSubmitBtn = document.getElementById('lb-submit');
      if (lbSubmitBtn) lbSubmitBtn.disabled = false;
      if (audio.enabled) realAudio.setBgm('start');
    });

    // --- COMPARTILHAMENTO ---
    function buildSharePayload() {
      const shareUrl = window.location.href;
      const text = `Consegui ${formatVotes(lastVotes || 0)} votos para o Renan! Jogue também e ajude o Renan a conseguir mais votos para essa Eleição! #PraCimaDelesRenan #14`;
      return { text, url: shareUrl, full: `${text}\n${shareUrl}` };
    }

    // --- CARD PNG DE RECORDE (P2) ---
    // Gera um card 1080x1350 com patente/placar para compartilhar como imagem.
    const cardFileName = 'pra-cima-deles-renan-recorde.png';
    const shareArtImg = new Image();
    shareArtImg.src = './assets/capa-renan.png';
    let shareArtReady = false;
    let shareArtFailed = false;
    shareArtImg.onload = () => { shareArtReady = true; };
    shareArtImg.onerror = () => { shareArtFailed = true; };

    function roundRectPath(c, x, y, w, h, r) {
      const rr = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + rr, y);
      c.arcTo(x + w, y, x + w, y + h, rr);
      c.arcTo(x + w, y + h, x, y + h, rr);
      c.arcTo(x, y + h, x, y, rr);
      c.arcTo(x, y, x + w, y, rr);
      c.closePath();
    }

    function buildShareCardBlob() {
      return new Promise((resolve) => {
        const W = 1080, H = 1350;
        const cnv = document.createElement('canvas');
        cnv.width = W; cnv.height = H;
        const c = cnv.getContext('2d');
        const draw = () => {
          const finalVotes = lastVotes || 0;
          const totalCuffs = handcuffs;
          const rank = getRankByVotes(finalVotes);

          // Fundo em degradê
          const g = c.createLinearGradient(0, 0, 0, H);
          g.addColorStop(0, '#1a2c52');
          g.addColorStop(0.55, '#0f1f3d');
          g.addColorStop(1, '#0b1528');
          c.fillStyle = g;
          c.fillRect(0, 0, W, H);

          // Moldura dourada
          c.strokeStyle = 'rgba(255,212,0,0.4)';
          c.lineWidth = 6;
          roundRectPath(c, 30, 30, W - 60, H - 60, 28);
          c.stroke();
          c.strokeStyle = 'rgba(255,255,255,0.08)';
          c.lineWidth = 2;
          roundRectPath(c, 48, 48, W - 96, H - 96, 22);
          c.stroke();

          c.textAlign = 'center';
          c.textBaseline = 'alphabetic';

          // Título em pixel (como no jogo: Pixelify Sans, amarelo)
          const pix = (weight, size, serif) => PIXEL_MODE
            ? `${weight} ${size}px "Pixelify Sans", "Press Start 2P", "Courier New", monospace`
            : `${serif ? '900' : 'bold'} ${size}px ${serif ? 'Georgia, serif' : 'Arial, sans-serif'}`;

          c.fillStyle = '#ffffff';
          c.font = pix(700, 44, true);
          c.fillText('pra cima deles,', W / 2, 126);
          c.fillStyle = '#ffd400';
          c.fillText('renan!', W / 2, 178);

          // Hashtag abaixo do título (como na tela inicial)
          c.save();
          c.shadowColor = 'rgba(255, 212, 0, 0.35)';
          c.shadowBlur = 14;
          c.fillStyle = '#ffd400';
          c.font = pix(700, 24, false);
          c.fillText('#PraCimaDelesRenan', W / 2, 228);
          c.restore();
          c.shadowColor = 'transparent';
          c.shadowBlur = 0;

          // Arte oficial
          const dim = 480;
          const artY = 258;
          const artX = W / 2 - dim / 2;
          if (shareArtReady) {
            c.save();
            roundRectPath(c, artX, artY, dim, dim, 26);
            c.clip();
            c.drawImage(shareArtImg, artX, artY, dim, dim);
            c.restore();
          } else {
            const g2 = c.createLinearGradient(0, artY, 0, artY + dim);
            g2.addColorStop(0, '#23375f');
            g2.addColorStop(1, '#0d1930');
            c.fillStyle = g2;
            roundRectPath(c, artX, artY, dim, dim, 26);
            c.fill();
            c.fillStyle = '#ffd400';
            c.font = pix(700, 120, true);
            c.fillText('★', W / 2, artY + dim / 2 + 42);
          }

          // Selo #14 no canto superior direito da arte (como na tela inicial)
          const pillW = 112, pillH = 60, pillPad = 12;
          const pillX = artX + dim - pillW - pillPad;
          const pillY = artY + pillPad;
          c.fillStyle = '#ffd400';
          roundRectPath(c, pillX, pillY, pillW, pillH, pillH / 2);
          c.fill();
          c.save();
          c.textBaseline = 'middle';
          c.fillStyle = '#0b1528';
          c.font = pix(700, 34, false);
          c.fillText('#14', pillX + pillW / 2, pillY + pillH / 2 + 1);
          c.restore();
          c.textBaseline = 'alphabetic';

          // Placar principal: votos
          c.fillStyle = '#9ab0d3';
          c.font = pix(600, 30, false);
          c.fillText('VOTOS OBTIDOS', W / 2, artY + dim + 72);
          c.fillStyle = '#ffd400';
          c.font = pix(700, 84, true);
          c.fillText(formatVotes(finalVotes), W / 2, artY + dim + 186);

          // Linha de estáticas
          const stats = [
            { label: 'ALGEMAS', value: String(totalCuffs) },
            { label: 'TEMPO', value: formatTimeSeconds(lastGameTime) },
            { label: 'OBSTÁCULOS', value: String(obstaclesCleared) }
          ];
          const statY = artY + dim + 252;
          const statW = 292, statH = 112;
          const gap = 36;
          const leftX = (W - (statW * 3 + gap * 2)) / 2;
          stats.forEach((s, i) => {
            const x = leftX + i * (statW + gap);
            c.fillStyle = 'rgba(255,255,255,0.05)';
            roundRectPath(c, x, statY, statW, statH, 18);
            c.fill();
            c.fillStyle = '#ffffff';
            c.font = pix(700, 52, true);
            c.fillText(s.value, x + statW / 2, statY + 62);
            c.fillStyle = '#8da4c4';
            c.font = pix(600, 26, false);
            c.fillText(s.label, x + statW / 2, statY + 103);
          });

          // Patente alcançada
          const patY = statY + statH + 34;
          c.fillStyle = rank.isGold ? '#ffd400' : '#ffffff';
          c.font = pix(600, 28, false);
          c.fillText('PATENTE ALCANÇADA', W / 2, patY);
          c.fillStyle = rank.isGold ? '#ffd400' : '#ffffff';
          c.font = pix(700, 36, true);
          c.fillText(rank.title, W / 2, patY + 50);

          // Recorde
          const recY = patY + 96;
          if (lastRunWasNewRecord) {
            c.fillStyle = '#ffd400';
            c.font = pix(700, 28, false);
            c.fillText('★ NOVO RECORDE ★', W / 2, recY);
          } else {
            c.fillStyle = '#8da4c4';
            c.font = pix(600, 26, false);
            c.fillText(`RECORDE: ${formatVotes(highscore)}`, W / 2, recY);
          }

          // Rodapé sutil, unificado (uma fonte só)
          c.fillStyle = '#6b84a8';
          c.font = pix(500, 24, false);
          c.fillText('Criado por @ssalomao14', W / 2, H - 70);
          c.fillStyle = '#4e6588';
          c.font = pix(400, 20, false);
          c.fillText('Pontuação lúdica, sem premiação.', W / 2, H - 38);

          cnv.toBlob((blob) => resolve(blob), 'image/png');
        };
        if (shareArtReady || shareArtFailed) {
          draw();
        } else {
          shareArtImg.onload = () => { shareArtReady = true; draw(); };
          shareArtImg.onerror = () => { shareArtFailed = true; draw(); };
        }
      });
    }

    function downloadShareCard(blob, payload) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cardFileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(payload.full).catch(() => {});
      }
      showShareToast('Card de recorde gerado e link copiado! #PraCimaDelesRenan #14');
    }

    // Botão USAR COMPARTILHAR: abre o menu nativo do dispositivo (mobile).
    // No desktop (sem Web Share de verdade) copia o texto e mostra um banner.
    function isMobileUA() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)
        && (('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0);
    }

    function copyShareToClipboard(full) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(full).catch(() => {}); // clipboard pode exigir permissão
      }
      showShareToast('Texto e link copiados para compartilhamento · #PraCimaDelesRenan #14');
    }

    btnShare.addEventListener('click', async (e) => {
      e.stopPropagation();
      audio.playClick();
      const payload = buildSharePayload();
      try {
        const blob = await buildShareCardBlob();
        if (!blob) throw new Error('card-failed');
        const file = new File([blob], cardFileName, { type: 'image/png' });
        if (navigator.share && (navigator.canShare && navigator.canShare({ files: [file] }))) {
          navigator.share({ title: 'pra cima deles, renan!', text: payload.text, url: payload.url, files: [file] })
            .catch((err) => {
              if (!err || err.name !== 'AbortError') downloadShareCard(blob, payload);
            });
        } else {
          downloadShareCard(blob, payload);
        }
      } catch (err) {
        // Fallback: compartilhamento só de texto (comportamento de antes)
        console.error('[share-card]', err);
        if (navigator.share && isMobileUA()) {
          navigator.share(payload).catch(() => {});
        } else {
          copyShareToClipboard(payload.full);
        }
      }
    });

    // --- RANKING COMUNITÁRIO ---
    function getLocalLeaderboard() {
      try {
        const raw = localStorage.getItem(LB_STORAGE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        return (Array.isArray(arr) ? arr : []).slice().sort((a, b) => (b.votes || 0) - (a.votes || 0));
      } catch (err) {
        return [];
      }
    }

    function saveLocalLeaderboard(list) {
      try {
        localStorage.setItem(LB_STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
      } catch (err) {}
    }

    async function fetchLeaderboard(top = 10) {
      if (LEADERBOARD_API_URL) {
        try {
          const sep = LEADERBOARD_API_URL.includes('?') ? '&' : '?';
          const resp = await fetch(`${LEADERBOARD_API_URL}${sep}top=${top}`, { mode: 'cors' });
          if (resp.ok) {
            const data = await resp.json();
            const entries = Array.isArray(data) ? data : (data && data.entries);
            if (Array.isArray(entries)) {
              return entries
                .map((it) => ({ nick: String(it.nick || 'Anônimo').slice(0, 16), votes: Number(it.votes) || 0 }))
                .sort((a, b) => b.votes - a.votes)
                .slice(0, top);
            }
          }
        } catch (err) {}
        return null;
      }
      return getLocalLeaderboard().slice(0, top);
    }

    async function submitLeaderboard(nick, votes) {
      const entry = { nick: (nick || 'Anônimo').slice(0, 16) || 'Anônimo', votes: Math.floor(votes) };
      if (LEADERBOARD_API_URL) {
        try {
          const resp = await fetch(LEADERBOARD_API_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entry)
          });
          if (resp.ok) {
            lbSubmittedThisRun = true;
            return { ok: true, message: 'Resultado registrado na comunidade!' };
          }
          return { ok: false, message: 'Falha ao registrar (servidor recusou).' };
        } catch (err) {
          return { ok: false, message: 'Sem conexão com o servidor do ranking.' };
        }
      }
      const list = getLocalLeaderboard();
      list.push(Object.assign({}, entry, { at: Date.now() }));
      saveLocalLeaderboard(list);
      lbSubmittedThisRun = true;
      return { ok: true, message: 'Registrado (modo local — conecte um backend para ranking comunitário).' };
    }

    function renderLeaderboardList(entries) {
      const listEl = document.getElementById('lb-list');
      if (!listEl) return;
      if (!entries || !entries.length) {
        listEl.innerHTML = '<div class="lb-empty">Nenhum resultado ainda. Seja o primeiro!</div>';
        return;
      }
      const medals = ['🥇', '🥈', '🥉'];
      // Garante 10 posições exibidas: pad com "aguardando líder" quando faltarem jogadores
      const rows = entries.slice(0, 10).map((it, i) => {
        const pos = i + 1;
        const isMine = lbSubmittedThisRun && it.nick === lastLbNick && it.votes === lastFinalScore;
        const badge = pos <= 3 ? `<span class="lb-medal">${medals[pos - 1]}</span>` : `<span class="lb-pos">${pos}</span>`;
        const tier = getRankByVotes(it.votes);
        return `<div class="lb-row${isMine ? ' mine' : ''}">${badge}<span class="lb-nick">${escapeHtml(it.nick)}</span><span class="lb-patente${isMine ? ' mine' : ''}">${escapeHtml(tier.title)}</span><span class="lb-votes">${formatVotes(it.votes)}</span></div>`;
      });
      while (rows.length < 10) {
        const pos = rows.length + 1;
        rows.push(`<div class="lb-row lb-empty-row"><span class="lb-pos">${pos}</span><span class="lb-nick lb-dim">Aguardando líder…</span><span class="lb-patente lb-dim">—</span><span class="lb-votes lb-dim">—</span></div>`);
      }
      listEl.innerHTML = rows.join('');
    }

    async function refreshLeaderboard() {
      const noteEl = document.getElementById('lb-note');
      const entries = await fetchLeaderboard(10);
      if (entries) {
        renderLeaderboardList(entries);
        if (noteEl) {
          noteEl.textContent = LEADERBOARD_API_URL
            ? 'Ranking da comunidade atualizado ao vivo.'
            : 'Modo local: conecte um backend para o ranking comunitário.';
        }
      } else {
        renderLeaderboardList(getLocalLeaderboard().slice(0, 10));
        if (noteEl) noteEl.textContent = 'Servidor indisponível — mostrando registros locais.';
      }
    }

    const lbSubmitEl = document.getElementById('lb-submit');
    if (lbSubmitEl) {
      lbSubmitEl.addEventListener('click', async (e) => {
        e.stopPropagation();
        audio.playClick();
        if (lastFinalScore <= 0) {
          showShareToast('Jogue primeiro para registrar um resultado!');
          return;
        }
        if (lbSubmittedThisRun) {
          showShareToast('Resultado desta partida já foi registrado.');
          return;
        }
        const nickEl = document.getElementById('lb-nick');
        lastLbNick = (nickEl ? nickEl.value.trim() : '') || 'Anônimo';
        lbSubmitEl.disabled = true;
        const res = await submitLeaderboard(lastLbNick, lastFinalScore);
        showShareToast(res.message);
        if (res.ok) {
          await refreshLeaderboard();
        } else {
          lbSubmitEl.disabled = false;
        }
      });
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function showShareToast(msg = "Copiado para a área de transferência!") {
      shareToast.textContent = msg;
      shareToast.classList.add('show');
      setTimeout(() => {
        shareToast.classList.remove('show');
      }, 2600);
    }

    // Toggle de som (estado persistido no localStorage)
    function syncSoundUi() {
      if (soundToggle) soundToggle.classList.toggle('muted', !audio.enabled);
    }

    function toggleMute() {
      audio.enabled = !audio.enabled;
      localStorage.setItem('renan_mission_muted', audio.enabled ? '0' : '1');
      if (audio.enabled) audio.init();
      realAudio.enabled = audio.enabled;
      if (audio.enabled) {
        realAudio.unlock();
        // Na tela final (GAMEOVER) mantém o silêncio: game.mp3 é música de ação e
        // NUNCA deve voltar a tocar depois que a partida termina.
        realAudio.setBgm(gameState === STATE.PLAYING ? 'game' : (gameState === STATE.GAMEOVER ? null : 'start'));
      } else {
        realAudio.setBgm(null);
      }
      syncSoundUi();
    }

    soundToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });

    // --- GLOSSÁRIO DA LORE (MODAL) ---
    const btnGlossary = document.getElementById('btn-glossary');
    const glossaryModal = document.getElementById('glossary-modal');
    const glossaryClose = document.getElementById('glossary-close');

    // Glossário repaginado: cards horizontais com o sprite (maior que no jogo) + balão original do personagem
    const GLOSSARY_ENTRIES = [
      { sprite: 'run1', sword: true, name: 'Renan Santos', quote: 'O homi é bão.', bubble: 'Vamos para o Livro Amarelo!', bname: 'RENAN' },
      { sprite: 'onca', name: 'Onça Pintada', desc: 'Mascote da Missão e símbolo de preservação e soberania.', bubble: 'GRRR! ATROPELO QUEM OUSAR!', bname: 'ONÇA' },
      { sprite: 'jornalista', name: 'Jornalista', desc: 'Caricatura das sabatinas enviesadas de campanha.', bubble: 'E O FEMINICÍDIO, CANDIDATO?', bname: 'JORNALISTA' },
      { sprite: 'exmbl', name: 'Ex-MBL (Dissidente)', quote: 'Disculpa, Disculpa, Bolsonaro!', desc: 'Crítica aos traidores do movimento que se aliaram ao bolsonarismo.', bubble: 'EX-MBL TRAIDOR', bname: 'EX-MBL' },
      { sprite: 'mc', name: 'MC Latrocínio', desc: 'Sátira sobre o crime organizado e a apologia ao crime no funk.', bubble: 'TROPA TROPA TROPA', bname: 'MC LATROCÍNIO' },
      { sprite: 'ladrao', name: 'Ladrão de Celular', desc: 'Vítima da sociedade que rouba celular pra tomar uma cervejinha.', bubble: 'PASSA O CELULAR!', bname: 'LADRÃO' },
      { sprite: 'militante', name: 'Militante de Esquerda', desc: 'Caricatura da militância universitária que defende bandido.', bubble: 'SOLTA ELE!', bname: 'MILITANTE' },
      { sprite: 'drone', name: 'Drone do Cury', quote: 'Nem picanha nem fuzil, eu quero é RIVOTRIL', desc: 'Sátira sobre as propostas caricatas de adversários políticos com narrativas genéricas e frases prontas.', bubble: 'MISÓGINO, AGRESSOR DE MULHER!', bname: 'DRONE' },
      { sprite: 'toga', name: 'Toga do Supremo', quote: 'Decisão ilegal não se cumpre!', desc: 'Representação do autoritarismo e das decisões judiciais monocráticas ilegais.', bubble: 'INDEFERIDO!', bname: 'TOGA' },
      { sprite: 'espectro', name: 'Espectro', quote: 'Não comeu, matou!', desc: 'Espectro sugador de alma que fede a cebola e faz planos obsessivos de como destruir Renan Santos.', bubble: 'ASSOMBRA OS DEBATES', bname: 'ESPECTRO' },
      { kind: 'pulpit', name: 'LULA / FLÁVIO', desc: 'Púlpitos vazios de Lula e Flávio Bolsonaro nos debates, onde os 2 fogem do Renan a todo custo.' },
      { sprite: 'valete', name: 'Revista Valete', desc: 'Publicação cultural do MBL que fundamenta a batalha das ideias.', bubble: 'IDÉIAS PARA DEBATER!', bname: 'VALETE' },
      { sprite: 'espadim', name: 'Espadim de Tiradentes', desc: 'Símbolo histórico da liberdade e dever cívico. Presenteada a Renan pelo seu Vice Aroldo Medina, tenente-coronel da reserva da polícia militar.', bubble: 'ONE-SHOT ESPADIM!', bname: 'ESPADIM' },
      { sprite: 'livro', name: 'O Livro Amarelo', desc: 'Documento programático e plano de propostas da Missão.', bubble: 'X3 VOTOS ATIVO!', bname: 'LIVRO' },
      { sprite: 'classica', name: 'Bandeira Clássica e Imperial', desc: 'Brasões representativos dos ideais e do futuro do movimento.', bubble: 'COMBO + VOTOS!', bname: 'BANDEIRAS' }
    ];

    // Glossário em DOM puro: sem canvas/ctx — usa sprites já processados ou emoji de fallback
    function buildGlossaryCards() {
      const track = document.getElementById('glossary-track');
      if (!track || track.children.length > 0) return;

      const fallbackEmojis = {
        run1: '🏃', onca: '🐆', jornalista: '📢', exmbl: '👶', mc: '🎤',
        ladrao: '📱', militante: '🚩', drone: '🚁', toga: '⚖️', espectro: '👻',
        valete: '🃏', espadim: '⚔️', livro: '📕', classica: '🏳️'
      };

      GLOSSARY_ENTRIES.forEach((entry) => {
        const card = document.createElement('div');
        card.className = 'glossary-card';

        const area = document.createElement('div');
        area.className = 'glossary-sprite-area';

        let hasSprite = false;
        if (entry.sword) {
          try {
            const img = document.createElement('img');
            img.src = './assets/capa-renan.png';
            img.alt = entry.name;
            area.appendChild(img);
            hasSprite = true;
          } catch (e) { /* usa emoji */ }
        }
        if (!hasSprite && entry.sprite) {
          const spr = loadedSprites[entry.sprite];
          if (spr && spr.width && typeof spr.toDataURL === 'function') {
            try {
              const img = document.createElement('img');
              img.src = spr.toDataURL('image/png');
              img.alt = entry.name;
              area.appendChild(img);
              hasSprite = true;
            } catch (e) { /* canvas tainted/falha -> usa emoji */ }
          }
        }
        if (!hasSprite) {
          const emojiSpan = document.createElement('span');
          emojiSpan.className = 'glossary-emoji';
          emojiSpan.textContent = entry.sprite ? (fallbackEmojis[entry.sprite] || '🎭') : '🏛️';
          area.appendChild(emojiSpan);
        }

        card.appendChild(area);

        const info = document.createElement('div');
        info.className = 'glossary-info';
        const nameEl = document.createElement('div');
        nameEl.className = 'glossary-name';
        nameEl.textContent = entry.name;
        info.appendChild(nameEl);

        if (entry.quote) {
          const quoteEl = document.createElement('div');
          quoteEl.className = 'glossary-quote';
          quoteEl.textContent = `"${entry.quote}"`;
          info.appendChild(quoteEl);
        }
        if (entry.desc) {
          const descEl = document.createElement('div');
          descEl.className = 'glossary-desc';
          descEl.textContent = entry.desc;
          info.appendChild(descEl);
        }

        card.appendChild(info);

        track.appendChild(card);
      });
    }

    function openGlossary() {
      if (glossaryModal) glossaryModal.classList.remove('hidden');
      buildGlossaryCards();
    }

    function closeGlossary() {
      if (glossaryModal) glossaryModal.classList.add('hidden');
    }

    if (btnGlossary) {
      btnGlossary.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        openGlossary();
      });
    }
    if (glossaryClose) {
      glossaryClose.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        closeGlossary();
      });
    }
    if (glossaryModal) {
      glossaryModal.addEventListener('click', (e) => {
        if (e.target === glossaryModal) closeGlossary();
      });
    }

    // --- APOIE A MISSÃO (box com canais; links são placeholders até preencher) ---
    const btnSupport = document.getElementById('btn-support');
    const apoioModal = document.getElementById('apoio-modal');
    const apoioClose = document.getElementById('apoio-close');

    function openApoio() {
      if (apoioModal) apoioModal.classList.remove('hidden');
    }

    function closeApoio() {
      if (apoioModal) apoioModal.classList.add('hidden');
    }

    if (btnSupport) {
      btnSupport.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        openApoio();
      });
    }
    if (apoioClose) {
      apoioClose.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        closeApoio();
      });
    }
    if (apoioModal) {
      apoioModal.addEventListener('click', (e) => {
        if (e.target === apoioModal) closeApoio();
      });
      apoioModal.querySelectorAll('.apoio-link').forEach((linkEl) => {
        linkEl.addEventListener('click', (e) => {
          if (linkEl.getAttribute('href') === '#') {
            e.preventDefault();
            e.stopPropagation();
            audio.playClick();
            showShareToast('Link em breve! Já deixei marcado pra preencher.');
          }
        });
      });
    }

    // --- SOBRE O JOGO (modal estático; conteúdo editável em index.html) ---
    const linkSobre = document.getElementById('link-sobre');
    const sobreModal = document.getElementById('sobre-modal');
    const sobreClose = document.getElementById('sobre-close');

    function openSobre() {
      if (sobreModal) sobreModal.classList.remove('hidden');
    }

    function closeSobre() {
      if (sobreModal) sobreModal.classList.add('hidden');
    }

    if (linkSobre) {
      linkSobre.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        audio.playClick();
        openSobre();
      });
    }
    if (sobreClose) {
      sobreClose.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        closeSobre();
      });
    }
    if (sobreModal) {
      sobreModal.addEventListener('click', (e) => {
        if (e.target === sobreModal) closeSobre();
      });
    }

    // --- PRIVACIDADE & AVISOS (modal estático; conteúdo editável em index.html) ---
    const linkPrivacidade = document.getElementById('link-privacidade');
    const privacidadeModal = document.getElementById('privacidade-modal');
    const privacidadeClose = document.getElementById('privacidade-close');

    function openPrivacidade() {
      if (privacidadeModal) privacidadeModal.classList.remove('hidden');
    }

    function closePrivacidade() {
      if (privacidadeModal) privacidadeModal.classList.add('hidden');
    }

    if (linkPrivacidade) {
      linkPrivacidade.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        audio.playClick();
        openPrivacidade();
      });
    }
    if (privacidadeClose) {
      privacidadeClose.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playClick();
        closePrivacidade();
      });
    }
    if (privacidadeModal) {
      privacidadeModal.addEventListener('click', (e) => {
        if (e.target === privacidadeModal) closePrivacidade();
      });
    }

    // --- RESPONSIVIDADE CANVAS (Ajuste nítido com DevicePixelRatio) ---
    function resizeCanvas() {
      const wrapper = document.getElementById('game-wrapper');
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Resolução nativa em pixels reais
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));

      // Escala UNIFORME + letterbox: mantém a proporção 420x700 e centraliza
      const scale = Math.min(canvas.width / V_WIDTH, canvas.height / V_HEIGHT);
      VIEW.scale = scale;
      VIEW.ox = (canvas.width - V_WIDTH * scale) / 2;
      VIEW.oy = (canvas.height - V_HEIGHT * scale) / 2;

      // Propriedades do canvas padrão (a cena seta o transform a cada frame)
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 150);
    });

    // Mute persistido no localStorage + resume do AudioContext no primeiro gesto
    audio.enabled = localStorage.getItem('renan_mission_muted') !== '1';
    realAudio.enabled = audio.enabled;
    syncSoundUi();

    // Pré-carrega a música para o primeiro toque ser instantâneo (sem atraso de fetch/decodificação)
    realAudio.prewarm('start');
    realAudio.prewarm('game');

    // Música de introdução na tela inicial: tenta autoplay no load (navegadores que
    // permitem — ex.: localhost/Chrome com engagement — tocam logo no refresh); senão,
    // a faixa fica na fila do AudioContext e o primeiro gesto (qualquer) faz o resume.
    if (realAudio.enabled) {
      audio.init();              // garante o ctx (pode ficar suspenso aguardando gesto)
      realAudio.unlock();        // libera o caminho do setBgm mesmo antes do gesto
      realAudio.setBgm('start'); // dispara sozinho se o autoplay permitir; senão, na fila
    }

// Unlock determinístico a cada gesto de QUALQUER tipo (pointer/mouse, tecla
      // ou toque): resume o AudioContext re-tentando em cada gesto (iOS às vezes
      // rejeita o 1º) e garante a intro na tela inicial. A voz do Renan só toca
      // uma vez, na primeira interação. O jogo em andamento não é afetado.
      let audioUnlockedByGesture = false;
      function firstGestureUnlock() {
        // unlock ANTES do audio.init(): se o ctx ainda estiver suspenso, o unlock
        // purga o nó de música que foi criado em silêncio no load (pré-gesto).
        realAudio.unlock();
        audio.init();
        if (audioUnlockedByGesture) return;
        audioUnlockedByGesture = true;
        if (realAudio.enabled && gameState !== STATE.PLAYING) {
          realAudio.setBgm('start');
          realAudio.playOne('renan_voice', 1.0);
        }
      }
      window.addEventListener('pointerdown', firstGestureUnlock);
      window.addEventListener('keydown', firstGestureUnlock);
      window.addEventListener('touchstart', firstGestureUnlock);

    // Iniciação
    resizeCanvas();
    resetWorld();
    playMenuIntro();
    requestAnimationFrame(gameLoop);
  