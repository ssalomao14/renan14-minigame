
    /**
     * PRA CIMA DELES, RENAN! — PROTÓTIPO PLATAFORMA
     * Loop Core: Corrida contínua, pulo variável, fast-fall e colocação de fraldas em púlpitos vazios.
     */

    // Versão SemVer do jogo (major.minor.patch) — bump via `node bump-version.js [major|minor|patch]`
    const GAME_VERSION = '0.1.6';

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
        [392, 311, 262, 196].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          const t = now + i * 0.16;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.22, t);
          gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 0.22);
        });
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

      // Deve ser chamado DENTRO de um gesto do usuário (desbloqueia autoplay)
      unlock() {
        if (this.unlocked) return;
        this.unlocked = true;
        if (this._ensureCtx() && this.ctx.state === 'suspended') this.ctx.resume();
      }

      // kind: 'start' (toca UMA vez) | 'game'/'imperial' (loop) | null (para a música com fade)
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
          // Mutado, bloqueado ou parando: elimina a faixa atual imediatamente
          if (prevNode && prevGain && this.ctx) {
            try { prevGain.gain.cancelScheduledValues(this.ctx.currentTime); } catch (err) {}
            try { prevNode.stop(); } catch (err) {}
          }
          return;
        }

        this._loadBuf(kind, (d) => {
          if (!d || !this.ctx || this.bgmKind !== kind) return; // mudou de ideia no meio
          const now = this.ctx.currentTime;
          const src = this.ctx.createBufferSource();
          const g = this.ctx.createGain();
          src.buffer = d;
          src.loop = kind !== 'start'; // introdução da tela inicial toca uma única vez
          // Níveis por trilha: game/imperial ficam em background, intro um pouco à frente
          const level = (kind === 'start') ? 0.38 : 0.26;
          g.gain.setValueAtTime(0.0001, now);
          g.gain.exponentialRampToValueAtTime(level, now + 0.9);
          if (!src.loop) {
            // Fade-out no final da introdução (evita corte seco)
            const end = d.duration || 30;
            g.gain.setValueAtTime(level, now + Math.max(1.2, end - 1.0));
            g.gain.exponentialRampToValueAtTime(0.0001, now + end + 0.02);
            src.onended = () => {
              try { g.disconnect(); } catch (err) {}
              if (this._bgmNode === src) { this._bgmNode = null; this._bgmGain = null; }
            };
          }
          src.connect(g);
          g.connect(this.ctx.destination);
          src.start();
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
    const ctx = canvas.getContext('2d');

    // Prévia de pixelização global (mode de preview — NÃO afeta o jogo normal):
    // acesse a página com ?pixel=1 (ou ?pixel=N para fator de pixelação custom).
    const PIXEL_MODE = /[?&]pixel=/.test(window.location.search);
    const PIXEL_RATIO = Math.max(2, Math.min(8, parseInt((window.location.search.match(/[?&]pixel=(\d+)/) || [])[1] || '2', 10)));

    // Aparência pixelada dos elementos DOM (só na prévia ?pixel=N)
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

    // --- SISTEMA OFICIAL DE PATENTES (6 NÍVEIS) ---
    const RANK_TIERS = [
      { min: 100000, title: "Alexandre, O Grande", isGold: true },
      { min: 50000, title: "General da Missão", isGold: true },
      { min: 25000, title: "Coronel da Missão", isGold: true },
      { min: 10000, title: "Capitão da Missão", isGold: false },
      { min: 3000, title: "Soldado da Missão", isGold: false },
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

    // --- SISTEMA DE BANNER NO TOPO DO CANVAS (LEGIBILIDADE MÁXIMA) ---
    // Substitui balões pequenos: retângulo arredondado #0f1f3dcc com texto amarelo #ffd400 e contorno preto
    let activeBanner = null;

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

    function mostrarBanner(texto, tipo = "info", icone = "⚠️", mode = "action") {
      activeBanner = {
        texto,
        tipo,
        icone,
        mode,
        duration: 2.4,
        timer: 2.4
      };
    }

    // --- INTRODUÇÃO PAUSADA POR PERSONAGEM (CARD "PRIMEIRO CONFRONTO") ---
    // Uma vez por sessão, cada tipo de inimigo é apresentado com PAUSA TOTAL do mundo
    // (card + nome + piada; nada se move durante a apresentação; toque pula).
    // A opção "não mostrar novamente" fica persistida no navegador (por dispositivo).
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
        timer: 2.6
      };
      if (activeCard) {
        // Intro já em exibição: enfileira a próxima (nunca substitui a atual)
        pendingIntroQueue.push(card);
        return;
      }
      activeCard = card;
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
    // Layout: tag -> emoji -> nome -> piada -> checkbox -> countdown.
    // A tag vermelha fica AFORA do alcance do emoji (nada de sobreposição).
    const INTRO_BOX_RECT = { x: V_WIDTH / 2 - 160, y: 240, w: 230, h: 20 };
    function drawIntroCard() {
      if (!activeCard) return;
      const card = activeCard;
      const alpha = Math.min(1, (card.duration - card.timer) / 0.18, card.timer / 0.25, 1);
      if (alpha <= 0) return;

      const cx = V_WIDTH / 2;
      const cw = 330;
      const ch = 196;
      const cy = 222;
      const tagText = 'INIMIGO NOVO';
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

      // Emoji grande (abaixo da tag, sem atropelá-la)
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 12;
      ctx.font = '900 40px sans-serif';
      ctx.fillText(card.emoji, cx, cy - 46);
      ctx.shadowBlur = 0;

      // Nome do personagem
      ctx.font = '900 22px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4.5;
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

      // Checkbox "não mostrar apresentação novamente" (fica na própria intro)
      const skipChecked = card.skipChecked != null ? card.skipChecked : getSkipIntrosFlag();
      const boxX = cx - 152;
      const boxY = cy + 20;
      const boxS = 14;
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
      ctx.font = '900 10px "Arial Black", sans-serif';
      ctx.fillStyle = '#c6d3ea';
      ctx.fillText('Não mostrar apresentação novamente', boxX + boxS + 8, boxY + boxS / 2 + 0.5);

      // Assinatura de marca no rodapé do card
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd400';
      ctx.globalAlpha = Math.max(0, alpha * 0.9);
      ctx.font = '900 10px "Arial Black", sans-serif';
      ctx.fillText('— pra cima deles, renan! —', cx, cy + ch / 2 - 26);
      ctx.globalAlpha = Math.max(0, alpha);

      // Barra de countdown (tempo restante da introdução)
      const ratio = Math.max(0, Math.min(1, card.timer / card.duration));
      ctx.fillStyle = 'rgba(255, 212, 0, 0.18)';
      ctx.fillRect(cx - 138, cy + ch / 2 - 13, 276, 7);
      ctx.fillStyle = '#ffd400';
      ctx.fillRect(cx - 138, cy + ch / 2 - 13, Math.round(276 * ratio), 7);

      // Dica de skip piscante
      if (Math.sin(performance.now() * 0.008) > -0.3) {
        ctx.font = '900 9.5px "Arial Black", sans-serif';
        ctx.fillStyle = '#6c84a8';
        ctx.fillText('TOQUE PARA PULAR', cx, cy + ch / 2 + 10);
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
    // Se >0, o flash é de ABATE do drone (MISÓGINO + votos); se 0, é o tropeço (MACHISTA -2.000)
    let machistaKillFlash = 0;
    // Streak de coleta: pop do SoundEngine sobe de tom a cada 3 coletas seguidas (expira em 1.5s)
    let collectStreak = 0;
    let collectStreakTimer = 0;
    // Assombrado pelo Espectro: 3s com pontos congelados (sem perder vida)
    let hauntedTimer = 0;

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
    // (música imperial, textos, efeitos de tela e outras variações entram aqui).
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

      // Toque durante o card de introdução: marcar "não mostrar novamente" ou pular a apresentação.
      // (jogador não pode ficar sem controle durante a pausa)
      if (activeCard) {
        const pt = getPointerPoint(e);
        if (pointInRect(pt, INTRO_BOX_RECT)) {
          toggleSkipIntros();
          return;
        }
        skipIntroCard();
      }

      if (gameState === STATE.MENU) {
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
      ctx.save();
      ctx.font = '900 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffd400';
      ctx.fillText('⚠️', x, y);
      ctx.restore();
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
    function entityBubble(e, name, quip, period) {
      if (e.neutralized || e.x > V_WIDTH + 60 || e.x + e.w < -40) return;
      const p = period || e.bubblePeriod || 2.4;
      if (e.bubbleTimer <= p * 0.45) return;
      drawSpeechBubble(e.x + e.w / 2, e.y - 8, quip, name);
    }

    // Balão de fala estilizado (quadro branco, borda escura, rabinho, legível).
    function drawSpeechBubble(x, y, text, name, maxWidth) {
      ctx.save();
      const maxW = maxWidth || 188;
      const fontFamily = '"Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const padX = 12;

      // Quebra em várias linhas mantendo fonte legível (mín. 11px) — balão cresce, texto não encolhe demais
      let fontSize = 13;
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
        if (widest <= maxW - padX * 2 || fontSize <= 11) break;
        fontSize -= 0.5;
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const lineHeight = Math.ceil(fontSize * 1.25);
      const bw = Math.min(maxW, Math.ceil(Math.max.apply(null, lines.map(l => ctx.measureText(l).width)) + padX * 2));
      const bh = lines.length * lineHeight + 12;
      const bx = x - bw / 2;
      const by = y - bh;

      // Rabinho apontando para o personagem
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x - 5, y - 3);
      ctx.lineTo(x + 5, y - 3);
      ctx.lineTo(x, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#0b1528';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0b1528';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Texto centralizado linha a linha (evita embolamento)
      ctx.fillStyle = '#0b1528';
      const startY = by + (bh - lines.length * lineHeight) / 2 + lineHeight / 2;
      lines.forEach((ln, i) => {
        ctx.fillText(ln, x, startY + i * lineHeight);
      });

      if (name) {
        ctx.font = '900 9.5px "Arial Black", sans-serif';
        ctx.fillStyle = '#6c84a8';
        ctx.fillText(name, x, by - 7);
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
          entityBubble(this, 'LADRÃO', 'PASSA O CELULAR!');
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

    // 8. ESPECTRO (fase etérea/sólida alternada a cada ~1,6s)
    // Etéreo: translúcido (globalAlpha 0.55) e SEM colisão — Renan atravessa.
    // Sólido: opaco, olhos vermelhos acesos 0,4s antes (telegrafe); colide -> "ASSOMBRADO!" 3s.
    class EspectroObstacle {
      constructor(x) {
        this.x = x;
        this.w = 76;
        this.h = 88;
        // Entra na ALTURA DE PERIGO (corpo do Renan), flutuando devagar para a esquerda
        this.baseY = (GROUND_Y - 120) + Math.random() * 30; // topo do bicho na faixa de perigo
        this.y = this.baseY;
        this.zigzagAmp = 30;
        this.phaseTime = Math.random() * 1.6; // fase inicial aleatória (não sincroniza entre spawns)
        this.zigzag = Math.random() * 5;
        this.speedX = 0.55;       // escapa se ignorado (mais lento que o scroll da pista)
        this.hitInset = { x: 12, y: 10 };
        this.cleared = false;
        this.neutralized = false;
        this.bubblePeriod = 2.2;
      }

      // Sem colisão enquanto etéreo OU no telegrafe (0,4s antes de ficar sólido)
      isEthereal() {
        return (this.phaseTime % 1.6) < 1.2;
      }

      update(dx, dt) {
        if (this.neutralized) {
          this.x -= dx + 120 * dt;
          return;
        }
        this.phaseTime += dt;
        this.zigzag += dt * 2.2;
        this.x -= dx * this.speedX;
        // Zigue-zague vertical suave dentro da faixa de perigo
        this.y = this.baseY + Math.sin(this.zigzag) * this.zigzagAmp;

        // Whoosh na virada para a fase sólida (adverte antes da colisão)
        const pNow = this.phaseTime % 1.6;
        const pPrev = (this.phaseTime - dt) % 1.6;
        if (pNow >= 1.2 && pPrev < 1.2) audio.playGhostWarn();
      }

      goEthereal() {
        // Volta para a fase etérea logo após assombrar (evita colisão em sequência)
        this.phaseTime = Math.min(this.phaseTime, 0.55);
      }

      draw() {
        ctx.save();
        if (this.neutralized) {
          if ((this.deathT || 0) < 1) this.deathT = Math.min(1, (this.deathT || 0) + 0.016 * 3);
          // Desfaz em névoa
          ctx.globalAlpha = Math.max(0, 1 - (this.deathT || 0) * 1.4);
        } else {
          const p = this.phaseTime % 1.6;
          ctx.globalAlpha = p < 1.2 ? 0.55 : 1.0;
        }

        const spr = loadedSprites.espectro;
        if (spr && spr.width && spr.height) {
          ctx.drawImage(spr, this.x, this.y, this.w, this.h);
        } else {
          // Fallback procedural: fantasma com rótulo "ESPECTRO" e olhos que acendem na sólida
          const p = this.phaseTime % 1.6;
          const solid = p >= 1.2;
          const telegraph = p >= 0.8 && p < 1.2;

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

          // Olhos: brancos na etérea, vermelhos acesos no telegrafe/sólida
          ctx.fillStyle = (solid || telegraph) ? '#ff2d55' : '#eceff1';
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2 - 8, this.y + 26, 3.4, 0, Math.PI * 2);
          ctx.arc(this.x + this.w / 2 + 8, this.y + 26, 3.4, 0, Math.PI * 2);
          ctx.fill();

          drawEntityLabel(this.x + this.w / 2, this.y + 50, 'ESPECTRO', '#ff8a80');
        }

        if (!this.neutralized) {
          drawWarningIcon(this.x + this.w / 2, this.y - 12 + Math.sin((this.age || 0) * 6) * 2);
          entityBubble(this, 'ESPECTRO', 'MORTE AO ADOLF HITLER!!');
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

      lives = MAX_LIVES;
      machistaFlashTimer = 0;

      // Cada corrida reintroduz os personagens: limpa estado de intro (cards do "primeiro confronto")
      encounteredTypes.clear();
      pendingIntroQueue.length = 0;
      lastIntroAt = 0;
      activeCard = null;
      worldTimeScale = 1;

      currentSpeedPx = INITIAL_SPEED_PX;
freezeTimer = 0;
      collectStreak = 0;
      collectStreakTimer = 0;
      hauntedTimer = 0;
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

    function updateWorld(dt) {
      // Card de apresentação de personagem: PAUSA TOTAL.
      // Enquanto o card está visível o mundo (entidades, renan, cronômetros e spawns)
      // permanece congelado; só o timer do card avança. Toque pula (ver handleInputStart).
      if (activeCard) {
        activeCard.timer -= dt;
        if (activeCard.timer <= 0) {
          endIntroCard();
        } else {
          return; // congela todo o restante do updateWorld durante a pausa
        }
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
      if (hauntedTimer > 0) hauntedTimer -= dt;

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
        mostrarBanner(`PROMOVIDO A ${newRank.title.toUpperCase()}!${promoHashtag}`, "rank", "🎖️", "global");
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

      // TETO DE ENTIDADES ATIVAS: máx 2 nas primeiras fases (<40s), máx 4 após 40s; teto global 6
      const activeEntityCount = obstacles.length + pulpits.length;
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
        if (!obs.cleared && obs.x + obs.w < renan.x && !obs.neutralized && !obs.chainPending) {
          obs.cleared = true;
          obstaclesCleared++;
          const pts = 200 * currentMult;
          votes += pts;
          audio.playObstaclePass();
          addFloatingText(renan.x + 10, renan.y - 10, `+${pts}`, "#48bb78");
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
        if (obs.x < -120 || offScreenRight) {
          if (obs instanceof LadraoObstacle && thiefSquadActive && !obs.neutralized) {
            // Ladrão fugiu pela esquerda
            addFloatingText(60, GROUND_Y - 40, "FUGIU!", "#ff7676");
          }
          obstacles.splice(i, 1);
        }
      }

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

      if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - 0.4);

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

    // Sincroniza a MÚSICA imperial (assets/audio/imperial.mp3). Sem arquivo =
    // silêncio (fallback); o setBgm já ignora troca para o mesmo kind.
    function syncOverdriveBgm() {
      if (gameState === STATE.PLAYING) realAudio.setBgm(overdriveKind ? 'imperial' : 'game');
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
        freezeTimer = 0.5;
        mostrarBanner(`COMBO! +${pts} VOTOS`, "flag", "🚩");
        addFloatingText(renan.x, renan.y - 20, `+${pts}`, "#2ecc71");
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
      if (obs instanceof JornalistaObstacle) return 5000;
      if (obs instanceof ExMblObstacle) return 2000;
      if (obs instanceof McLatrocinioObstacle) return 2000;
      if (obs instanceof LadraoObstacle) return 1000;
      if (obs instanceof MilitanteChaser) return 2000;
      if (obs instanceof TogaObstacle) return 4000;
      if (obs instanceof EspectroObstacle) return 500;
      return 200;
    }

    // Captura um ladrão (stomp): +votos, +1 algema, +1 prisioneiro.
    // Com a quadrilha ativa, ao chegar aos 3 capturados fecha a quadrilha + gera Militante.
    function captureThief(obs) {
      if (obs.neutralized) return;
      obs.neutralized = true;
      const gainD = grantVotes(1000);
      votes += gainD;
      handcuffs++;
      prisonersHeld++;
      thiefSquadCaught++;
      mostrarBanner(`+${formatVotes(gainD)} VOTOS +1 ALGEMA!`, "reward", "📱");
      addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainD)}`, '#ffd400');
      spawnParticles(obs.x + obs.w / 2, obs.y + 10, '#607d8b', 10);
      cameraShake = 3;
      buzz(25);
      audio.playHit();

      if (thiefSquadCaught >= 3) {
        thiefSquadActive = false;
        const gainQ = grantVotes(500);
        votes += gainQ;
        let quadText = `QUADRILHA DESMANTELADA! +${formatVotes(gainQ)} VOTOS`;
        if (!squadHashtagUsedThisRun) {
          squadHashtagUsedThisRun = true;
          quadText += ' #PraCimaDelesRenan';
        }
        mostrarBanner(quadText, "reward", "🏆", "global");

        scheduleSpawn(1.0, () => {
          if (obstacles.length < 4 && !obstacles.some((o) => o instanceof MilitanteChaser)) {
            const m = new MilitanteChaser(-40);
            obstacles.push(m);
            mostrarBanner("MILITANTE GERADA! SOLTA ELE!", "danger", "🚩", "global");
            spawnChainWarning('left', '🚩', 'Militante');
          }
        });
      }
    }

    function handleObstacleCollision(obs, index) {
      // Espadim de Tiradentes: elimina o inimigo pagando o valor dele + bônus
      if (hasSwordStrike) {
        hasSwordStrike = false;
        obs.neutralized = true;
        if (obs instanceof LadraoObstacle && thiefSquadActive && thiefSquadCaught < 3) thiefSquadCaught++;
        // Espectro: espadim vale 500 votos (sem bônus extra de +200)
        const swordBase = (obs instanceof EspectroObstacle) ? 500 : (getObstacleValue(obs) + 200);
        const swordTotal = grantVotes(swordBase);
        votes += swordTotal;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 16);
        addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(swordTotal)}`, '#ffd400');
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

        const oncaBonus = oncaRidingTimer > 0 ? 500 : 0;
        const total = grantVotes(neutralizeVotes + oncaBonus);
        obs.neutralized = true;
        if (obs instanceof LadraoObstacle && thiefSquadActive && thiefSquadCaught < 3) thiefSquadCaught++;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 14);
        votes += total;
        addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(total)}`, '#e67e22');
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
        obs.neutralized = true;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#3498db', 12);
        mostrarBanner("ESCUDO ABSORVEU O IMPACTO!", "perk", "🛡️");
        cameraShake = 6;
        return;
      }

      if (obs instanceof JornalistaObstacle) {
        if (isStomp) {
          renan.vy = -8.8;
          obs.neutralize();
          const gainA = grantVotes(5000);
          votes += gainA;
          mostrarBanner(`+${formatVotes(gainA)} VOTOS! LARGA O MICROFONE!`, "reward", "🎤");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainA)}`, '#ffd400');

          // Drone extra surge após atraso mínimo seguro de 0.9s (fila do game loop)
          // Nunca gera drone se já houver um no ar (evita drone empilhado atrás do outro)
          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof DroneObstacle)) {
              const d = new DroneObstacle(V_WIDTH + 60, 420);
              obstacles.push(d);
              mostrarBanner("AGRESSOR DE MULHER DETECTADO! DRONE DO CURY DESPACHADO!", "danger", "🚁", "global");
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
          obs.neutralized = true;
          cameraShake = 3;
          audio.playHit();
          buzz(35);
          mostrarBanner("E O FEMINICÍDIO, CANDIDATO? -1 VIDA", "danger", "📢");
        }
      } else if (obs instanceof ExMblObstacle) {
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainB = grantVotes(2000);
          votes += gainB;
          mostrarBanner(`EX-MBL NEUTRALIZADO! +${formatVotes(gainB)} VOTOS`, "reward", "👶");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainB)}`, '#ffd400');
          return;
        } else {
          // Lateral: perde 1 vida e 1 fralda
          if (!loseLife(1, "Caiu do debate atropelado pelo traidor!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          if (votes > 0) votes -= 1000;
          mostrarBanner("PERDEU 1.000 VOTOS E 1 VIDA! TRAIDOR!", "danger", "⚠️");
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
          const gainC = grantVotes(2000);
          votes += gainC;
          mostrarBanner(`PRENDEU! +${formatVotes(gainC)} VOTOS +1 ALGEMA`, "reward", "⛓️");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainC)}`, '#ffd400');

          // Militante surge após atraso seguro de 1.1s (fila do game loop)
          // Nunca gera militante se já houver uma perseguindo (evita pilha de militantes)
          scheduleSpawn(1.1, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof MilitanteChaser)) {
              const m = new MilitanteChaser(-40);
              obstacles.push(m);
              mostrarBanner("MILITANTE GERADA! SOLTA ELE!", "danger", "🚩", "global");
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
          const gainE = grantVotes(2000);
          votes += gainE;
          mostrarBanner(`+${formatVotes(gainE)} VOTOS! MILITANTE NEUTRALIZADA`, "reward", "⭐");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainE)}`, '#ffd400');

          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4 && !obstacles.some((o) => o instanceof DroneObstacle)) {
              const d = new DroneObstacle(V_WIDTH + 60, 420);
              obstacles.push(d);
              mostrarBanner("AGRESSOR DE MULHER DETECTADO! DRONE DO CURY DESPACHADO!", "danger", "🚁", "global");
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
        // ABATE no drone: Renan pisa em cima e o derruba — MISÓGINO abatido (+1.500 votos)
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          cameraShake = 4;
          audio.playHit();
          buzz(40);
          machistaFlashTimer = 1.0;
          machistaKillFlash = grantVotes(1500); // mantém o impacto, mas o nome muda p/ MISÓGINO
          votes += machistaKillFlash;
          spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 14);
          mostrarBanner(`MISÓGINO ABATIDO! +${formatVotes(machistaKillFlash)} VOTOS`, "reward", "🚁");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(machistaKillFlash)}`, '#ffd400');
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
        cameraShake = 5;
        audio.playHit();
        buzz(50);
        freezeTimer = 0.9;
        machistaFlashTimer = 1.0;
        if (votes > 0) votes = Math.max(0, votes - 2000);
        mostrarBanner("MACHISTA! -2.000 VOTOS · -1 VIDA", "danger", "🚁");
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
          const gainF = grantVotes(4000);
          votes += gainF;
          cameraShake = 3;
          buzz(30);
          spawnParticles(obs.x + obs.w / 2, obs.y + 10, '#ffd400', 12);
          mostrarBanner(`TOGA AMASSADA! +${formatVotes(gainF)} VOTOS`, "reward", "⚖️");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainF)}`, '#ffd400');
          return;
        }

        // Lateral não é morte injusta: Renan tropeça, perde 2 vidas e 1 fralda
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        if (votes > 0) votes -= 1000;
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
        cameraShake = 6;
        return;
      }

      // ESPECTRO (só colide na fase sólida — etéreo é ignorado no loop de colisão)
      if (obs instanceof EspectroObstacle) {
        if (isStomp) {
          // STOMP na fase sólida: EXORCISMO! +5.000 votos, desfaz em névoa
          renan.vy = -8.6;
          obs.neutralized = true;
          const gainEs = grantVotes(5000);
          votes += gainEs;
          spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#9b59b6', 14);
          mostrarBanner(`ESPECTRO EXORCIZADO! +${formatVotes(gainEs)} VOTOS`, "reward", "👻");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `+${formatVotes(gainEs)}`, '#ff8a80');
          cameraShake = 3;
          buzz(25);
          audio.playHit();
          return;
        }

        // Colisão sólida lateral: ASSOMBRADO! 3s — rouba 15% dos votos (teto 5.000) + véu roxo pulsante
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
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, `-${formatVotes(lost)} VOTOS`, '#c39bd3');
          mostrarBanner(`ASSOMBRADO! -${formatVotes(lost)} VOTOS ROUBADOS`, "danger", "👻");
        } else {
          mostrarBanner("ASSOMBRADO! NADA A ROUBAR…", "danger", "👻");
        }
        return;
      }

      // Qualquer outra colisão lateral vira perda de vida (nunca morte instantânea)
      if (!loseLife(1, "Debate encerrado por colisão!")) return;
      obs.neutralized = true;
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
      cameraShake = Math.max(cameraShake, 6);
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
        ctx.font = '900 16px "Arial Black", sans-serif';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 5;
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
      EspectroObstacle:   { name: 'ESPECTRO',     quip: 'MORTE AO ADOLF HITLER!!', emoji: '👻' }
    };

    function maybeIntroduceObstacle(obs) {
      const profile = ENCOUNTER_PROFILES[obs.constructor.name];
      if (!profile) return;
      triggerEncounterIntro(obs.constructor.name, profile.name, profile.quip, profile.emoji);
    }

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
            const pGain = grantVotes(1000);
            votes += pGain;
            cameraShake = 3;
            audio.playDiaperPlaced();
            buzz(30);

            // Mensagem oficial no BANNER do topo com leitura impecável
            const shoutText = CANDIDATE_INSULTS[p.candidateName] || `${p.candidateName} FUJÃO`;
            mostrarBanner(shoutText, "pulpit", "👶");

            freezeTimer = 0.22;
            spawnParticles(p.x + p.w / 2, p.y + 4, '#ffffff', 14);
            spawnParticles(p.x + p.w / 2, p.y + 4, '#ffd400', 10);
            addFloatingText(p.x + p.w / 2, p.y - 30, `+${formatVotes(pGain)} VOTOS!`, '#ffd400');

            // Fralda colocada recupera 1 vida (até o máximo de 3)
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
            cameraShake = 6;
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
            cameraShake = 3;
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

    // --- DESENHO DO SISTEMA DE BANNER NO TOPO DO CANVAS (70% LARGURA, 14% ALTURA, FONTE 20PX+) ---
    function drawActiveBanner() {
      if (!activeBanner) return;

      ctx.save();
      const useGlobal = activeBanner.mode === 'global';
      // TODOS os boxes de aviso ficam CENTRALIZADOS horizontalmente (banner de ação
      // também acompanha o Renan apenas na vertical, mantendo a leitura no centro)
      const bW = Math.round(V_WIDTH * (useGlobal ? 0.82 : 0.74));
      const bH = Math.round(V_HEIGHT * (useGlobal ? 0.12 : 0.0625));
      let bX = Math.round((V_WIDTH - bW) / 2);
      let bY;
      if (useGlobal) {
        bY = Math.round((V_HEIGHT - bH) / 2);
      } else {
        bY = 322;
      }

      // Animação de fade-in e fade-out
      let alpha = 1;
      if (activeBanner.timer < 0.4) {
        alpha = Math.max(0, activeBanner.timer / 0.4);
      } else if (activeBanner.timer > activeBanner.duration - 0.2) {
        alpha = Math.max(0, (activeBanner.duration - activeBanner.timer) / 0.2);
      }
      ctx.globalAlpha = alpha;

      // Fundo arredondado escuro translúcido #0f1f3dcc
      ctx.fillStyle = 'rgba(15, 31, 61, 0.94)';
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 12);
      ctx.fill();
      ctx.stroke();

      // Sombra e destaque
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 10;

// Ícone + Texto em negrito grande, com QUEBRA DE LINHA automática (até 2 linhas)
      // antes de reduzir a fonte — nunca extrapola a caixa nem encolhe demais
      const cx = bX + bW / 2;
      const cy = bY + bH / 2;

      const fullText = `${activeBanner.icone} ${activeBanner.texto}`;
      const maxLineW = bW - 32;
      let textFont = 18;
      let lines = [fullText];
      const words = fullText.split(' ');
      while (textFont >= 11) {
        ctx.font = `900 ${textFont}px "Arial Black", sans-serif`;
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
      ctx.font = `900 ${textFont}px "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lineH = Math.ceil(textFont * 1.25);
      const textStartY = cy - ((lines.length - 1) * lineH) / 2;

      // Contorno preto de 4px em cada linha
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      // Cor amarela #ffd400 de alto contraste
      ctx.fillStyle = '#ffd400';
      for (let i = 0; i < lines.length; i++) {
        ctx.strokeText(lines[i], cx, textStartY + i * lineH);
        ctx.fillText(lines[i], cx, textStartY + i * lineH);
      }

      ctx.restore();
    }

    // Modo de preview "pixel A": renderiza a cena em um offscreen de baixa resolução
    // (canvas real temporariamente reduzido) e reescala com nearest-neighbor.
    function render() {
      if (!PIXEL_MODE) {
        drawScene();
        return;
      }
      const fullW = canvas.width;
      const fullH = canvas.height;
      const lowW = Math.max(2, Math.round(fullW / PIXEL_RATIO));
      const lowH = Math.max(2, Math.round(fullH / PIXEL_RATIO));
      canvas.width = lowW;
      canvas.height = lowH;
      const s = Math.min(lowW / V_WIDTH, lowH / V_HEIGHT);
      const ov = { scale: VIEW.scale, ox: VIEW.ox, oy: VIEW.oy };
      VIEW.scale = s;
      VIEW.ox = (lowW - V_WIDTH * s) / 2;
      VIEW.oy = (lowH - V_HEIGHT * s) / 2;
      let low;
      try {
        drawScene();
        low = document.createElement('canvas');
        low.width = lowW;
        low.height = lowH;
        low.getContext('2d').drawImage(canvas, 0, 0);
      } finally {
        canvas.width = fullW;
        canvas.height = fullH;
        VIEW.scale = ov.scale;
        VIEW.ox = ov.ox;
        VIEW.oy = ov.oy;
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#04081a';
      ctx.fillRect(0, 0, fullW, fullH);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(low, 0, 0, fullW, fullH);
      ctx.imageSmoothingEnabled = true;
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

      // Textos Flutuantes de Pontuação
      floatingTexts.forEach(ft => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.fillStyle = ft.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.font = '900 15px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 6;
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
      // por inteiro (sem visão) no pico — círculo que expande, e não quadrados em fade.
      function drawHauntOverlay() {
        if (hauntedTimer <= 0) return;
        const tTotal = 3 - hauntedTimer; // tempo decorrido do efeito
        // Fade de entrada e saída do efeito total
        const fade = Math.min(1, tTotal / 0.35, hauntedTimer / 0.35);
        if (fade <= 0.05) return;

        // Ciclo de pulso: cresce até cobrir (62% do ciclo) e encolhe rápido (≈3 pulsos em 3s)
        const cycle = 1.0;
        const ph = (performance.now() / 1000) % cycle;
        const upT = cycle * 0.62;
        const grow = ph <= upT ? ph / upT : Math.max(0, 1 - (ph - upT) / (cycle - upT));

        // Centro do vórtice: sobre o Renan (a assombração "engole" o personagem)
        const rc = renan || {};
        const cx = Math.max(0, Math.min(V_WIDTH, (rc.x || V_WIDTH / 2) + (rc.w || 0) / 2));
        const cy = Math.max(0, Math.min(V_HEIGHT, (rc.y || V_HEIGHT / 2) + (rc.h || 0) / 2));

        // Raio que garante cobrir QUALQUER canto da tela no pico do pulso
        const farX = Math.max(cx, V_WIDTH - cx);
        const farY = Math.max(cy, V_HEIGHT - cy);
        const maxR = Math.hypot(farX, farY) + 24;
        const r = Math.max(8, 24 + (maxR - 24) * grow);

        const dark = Math.min(1, (0.45 + 0.55 * grow) * fade);
        ctx.save();
        const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        g.addColorStop(0, `rgba(30, 12, 64, ${(dark * 0.6).toFixed(3)})`);
        g.addColorStop(0.6, `rgba(22, 9, 52, ${(dark * 0.85).toFixed(3)})`);
        g.addColorStop(0.9, `rgba(130, 60, 220, ${(0.65 * fade).toFixed(3)})`);
        g.addColorStop(1, `rgba(6, 2, 18, ${dark.toFixed(3)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
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

    // Card de apresentação "PRIMEIRO CONFRONTO" (acima de tudo)
      drawIntroCard();

      // Efeito pulsante de ASSOMBRADO (Espetrô) por cima do card
      drawHauntOverlay();

      // Efeito de tela do overdrive (onça/imperial)
      drawOverdriveEffect();

      // Pausa dramática do "MACHISTA!" destacado (bateu no drone)
      if (machistaFlashTimer > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.42)';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        ctx.translate(V_WIDTH / 2, V_HEIGHT / 2);
        ctx.rotate(Math.sin(performance.now() * 0.04) * 0.06);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff2d55';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff2d55';
        ctx.font = '900 44px sans-serif';
        ctx.fillText(machistaKillFlash > 0 ? 'MISÓGINO!' : 'MACHISTA!', 0, -16);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(
          machistaKillFlash > 0 ? `+${formatVotes(machistaKillFlash)} VOTOS ABATIDO!` : '-2.000 VOTOS · -1 VIDA',
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
        ctx.shadowColor = '#ffd400';
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffd400';
        ctx.font = '900 34px "Arial Black", sans-serif';
        ctx.fillText('PAUSADO', V_WIDTH / 2, V_HEIGHT / 2 - 30);
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#c6d3ea';
        ctx.font = '900 14px "Arial Black", sans-serif';
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
      realAudio.setBgm(null);
      audio.playGameOverSting();
      cameraShake = 12;

      // Salva recorde: cada algema vale +2.000 votos no fechamento
      const VOTES_PER_HANDCUFF = 2000;
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
      lbSubmittedThisRun = false;
      const lbSubmitBtn = document.getElementById('lb-submit');
      if (lbSubmitBtn) lbSubmitBtn.disabled = false;
      if (audio.enabled) realAudio.setBgm('start');
    });

    // --- COMPARTILHAMENTO ---
    function buildSharePayload() {
      const shareUrl = window.location.href;
      const text = `Consegui ${formatVotes(lastVotes || 0)} votos para o Renan! Jogue também e ajude o Renan a conseguir mais votos para essa Eleição! #PraCimaDelesRenan`;
      return { text, url: shareUrl, full: `${text}\n${shareUrl}` };
    }

    // --- CARD PNG DE RECORDE (P2) ---
    // Gera um card 1080x1350 com patente/placar para compartilhar como imagem.
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

          // Selo superior
          c.fillStyle = '#ffd400';
          c.font = 'bold 34px Arial, sans-serif';
          c.fillText('CAMPANHA OFICIAL', W / 2, 130);
          c.font = '900 46px Georgia, serif';
          c.fillText('pra cima deles,', W / 2, 168);
          c.fillText('renan!', W / 2, 224);

          // Arte oficial
          const dim = 540;
          const artY = 260;
          if (shareArtReady) {
            c.save();
            roundRectPath(c, W / 2 - dim / 2, artY, dim, dim, 26);
            c.clip();
            c.drawImage(shareArtImg, W / 2 - dim / 2, artY, dim, dim);
            c.restore();
          } else {
            const g2 = c.createLinearGradient(0, artY, 0, artY + dim);
            g2.addColorStop(0, '#23375f');
            g2.addColorStop(1, '#0d1930');
            c.fillStyle = g2;
            roundRectPath(c, W / 2 - dim / 2, artY, dim, dim, 26);
            c.fill();
            c.fillStyle = '#ffd400';
            c.font = '900 120px Georgia, serif';
            c.fillText('★', W / 2, artY + dim / 2 + 42);
          }

          // Placar principal: votos
          c.fillStyle = '#9ab0d3';
          c.font = 'bold 34px Arial, sans-serif';
          c.fillText('VOTOS OBTIDOS', W / 2, artY + dim + 84);
          c.fillStyle = '#ffd400';
          c.font = '900 110px Georgia, serif';
          c.fillText(formatVotes(finalVotes), W / 2, artY + dim + 196);

          // Linha de estáticas
          const stats = [
            { label: 'ALGEMAS', value: String(totalCuffs) },
            { label: 'TEMPO', value: formatTimeSeconds(lastGameTime) },
            { label: 'OBSTÁCULOS', value: String(obstaclesCleared) }
          ];
          const statY = artY + dim + 300;
          const statW = 292, statH = 128;
          const gap = 36;
          const leftX = (W - (statW * 3 + gap * 2)) / 2;
          stats.forEach((s, i) => {
            const x = leftX + i * (statW + gap);
            c.fillStyle = 'rgba(255,255,255,0.05)';
            roundRectPath(c, x, statY, statW, statH, 18);
            c.fill();
            c.fillStyle = '#ffffff';
            c.font = '900 52px Georgia, serif';
            c.fillText(s.value, x + statW / 2, statY + 66);
            c.fillStyle = '#8da4c4';
            c.font = 'bold 26px Arial, sans-serif';
            c.fillText(s.label, x + statW / 2, statY + 108);
          });

          // Patente alcançada
          const patY = statY + statH + 46;
          c.fillStyle = rank.isGold ? '#ffd400' : '#ffffff';
          c.font = 'bold 32px Arial, sans-serif';
          c.fillText('PATENTE ALCANÇADA', W / 2, patY);
          c.fillStyle = rank.isGold ? '#ffd400' : '#ffffff';
          c.font = '900 52px Georgia, serif';
          c.fillText(rank.title, W / 2, patY + 62);

          // Recorde
          const recY = patY + 112;
          if (lastRunWasNewRecord) {
            c.fillStyle = '#ffd400';
            c.font = 'bold 40px Arial, sans-serif';
            c.fillText('★ NOVO RECORDE ★', W / 2, recY);
          } else {
            c.fillStyle = '#8da4c4';
            c.font = 'bold 32px Arial, sans-serif';
            c.fillText(`RECORDE: ${formatVotes(highscore)}`, W / 2, recY);
          }

          // Rodapé
          const footY = H - 110;
          c.fillStyle = '#9ab0d3';
          c.font = 'bold 34px Arial, sans-serif';
          c.fillText('@ssalomao14  ·  #PraCimaDelesRenan', W / 2, footY);
          c.fillStyle = '#5f789c';
          c.font = '26px Arial, sans-serif';
          c.fillText('Pontuação lúdica, sem premiação.', W / 2, footY + 46);

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
      const cardFileName = 'pra-cima-deles-renan-recorde.png';
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
      showShareToast('Card de recorde gerado e link copiado! #PraCimaDelesRenan');
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
      showShareToast('Texto e link copiados para compartilhamento · #PraCimaDelesRenan');
    }

    btnShare.addEventListener('click', async (e) => {
      e.stopPropagation();
      audio.playClick();
      if (lastVotes <= 0) {
        copyShareToClipboard(buildSharePayload().full);
        return;
      }
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
      listEl.innerHTML = entries
        .map((it, i) => {
          const pos = i + 1;
          const isMine = lbSubmittedThisRun && it.nick === lastLbNick && it.votes === lastFinalScore;
          const badge = pos <= 3 ? `<span class="lb-medal">${medals[pos - 1]}</span>` : `<span class="lb-pos">${pos}</span>`;
          return `<div class="lb-row${isMine ? ' mine' : ''}">${badge}<span class="lb-nick">${escapeHtml(it.nick)}</span><span class="lb-votes">${formatVotes(it.votes)} votos</span></div>`;
        })
        .join('');
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
      { sprite: 'ladrao', name: 'Ladrão de Celular', desc: 'Representação dos crimes patrimoniais urbanos.', bubble: 'PASSA O CELULAR!', bname: 'LADRÃO' },
      { sprite: 'militante', name: 'Militante de Esquerda', desc: 'Caricatura da militância universitária que defende bandido.', bubble: 'SOLTA ELE!', bname: 'MILITANTE' },
      { sprite: 'drone', name: 'Drone do Cury', quote: 'Nem picanha nem fuzil, eu quero é RIVOTRIL', desc: 'Sátira sobre as propostas caricatas de adversários políticos com narrativas genéricas e frases prontas.', bubble: 'MISÓGINO, AGRESSOR DE MULHER!', bname: 'DRONE' },
      { sprite: 'toga', name: 'Toga do Supremo', quote: 'Decisão ilegal não se cumpre!', desc: 'Representação do autoritarismo e das decisões judiciais monocráticas ilegais.', bubble: 'INDEFERIDO!', bname: 'TOGA' },
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
        ladrao: '📱', militante: '🚩', drone: '🚁', toga: '⚖️',
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

    // Primeiro gesto desbloqueia o áudio (política de autoplay do navegador).
    // Na tela inicial toca o trecho de campanha + voz do Renan (se os arquivos
    // existirem em assets/audio/); se o jogador já tiver começado, mantém o tema de jogo.
    window.addEventListener('pointerdown', () => {
      audio.init();
      realAudio.unlock();
      if (realAudio.enabled && gameState !== STATE.PLAYING) {
        realAudio.setBgm('start');
        realAudio.playOne('renan_voice', 1.0);
      }
    }, { once: true });

    // Iniciação
    resizeCanvas();
    resetWorld();
    requestAnimationFrame(gameLoop);
  