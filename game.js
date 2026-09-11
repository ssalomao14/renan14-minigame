
    /**
     * RENAN EM MISSÃO — PROTÓTIPO PLATAFORMA
     * Loop Core: Corrida contínua, pulo variável, fast-fall e colocação de fraldas em púlpitos vazios.
     */

    // Versão SemVer do jogo (major.minor.patch) — bump via `node bump-version.js [major|minor|patch]`
    const GAME_VERSION = '0.1.0';

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
    }

    const audio = new SoundEngine();

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

    // --- SISTEMA OFICIAL DE PATENTES (6 NÍVEIS) ---
    const RANK_TIERS = [
      { min: 5500, title: "Alexandre, O Grande", isGold: true },
      { min: 3500, title: "General da Missão", isGold: true },
      { min: 2000, title: "Coronel da Missão", isGold: true },
      { min: 1000, title: "Capitão da Missão", isGold: false },
      { min: 400,  title: "Soldado da Missão", isGold: false },
      { min: 0,    title: "Recruta da Missão", isGold: false }
    ];

    let currentRankTier = RANK_TIERS[RANK_TIERS.length - 1];

    function getRankByScore(scoreVal) {
      for (const tier of RANK_TIERS) {
        if (scoreVal >= tier.min) {
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
    const encounteredTypes = new Set(); // Tipos já apresentados nesta sessão
    // Fila de spawns dependentes de tempo (substitui setTimeout)
    let pendingSpawns = [];
    // Câmera com aspecto uniforme (evita distorção)
    const VIEW = { scale: 1, ox: 0, oy: 0 };
    // Cache de valores do HUD para só escrever no DOM quando mudar
    const hudCache = { diapers: null, score: null, handcuffs: null, rank: null, mult: null, perk: null, squad: null, lives: null };

    function mostrarBanner(texto, tipo = "info", icone = "⚠️") {
      activeBanner = {
        texto,
        tipo,
        icone,
        duration: 2.8,
        timer: 2.8
      };
    }

    // --- INTRODUÇÃO PAUSADA POR PERSONAGEM (CARD "PRIMEIRO CONFRONTO") ---
    // Uma vez por sessão, cada tipo de inimigo é apresentado em slow-mo com balão + nome,
    // dando tempo de ler a piada e aprender a mecânica. Toque pula.
    function triggerEncounterIntro(typeKey, name, quip, emoji) {
      if (encounteredTypes.has(typeKey)) return;
      if (gameState !== STATE.PLAYING) return;
      encounteredTypes.add(typeKey);
      activeCard = {
        typeKey,
        name,
        quip,
        emoji: emoji || '🎭',
        duration: 2.6,
        timer: 2.6
      };
      worldTimeScale = 0.24;
      audio.playReveal();
      buzz(20);
    }

    function endIntroCard() {
      if (!activeCard) return;
      activeCard = null;
      worldTimeScale = 1;
    }

    function skipIntroCard() {
      if (activeCard) endIntroCard();
    }

    // Agenda uma função para rodar dentro do game loop (evita setTimeout fora de contexto)
    function scheduleSpawn(seconds, fn) {
      pendingSpawns.push({ t: seconds, fn });
    }

    // Card de apresentação desenhado no meio do canvas (fade in/out, ênfase editorial)
    function drawIntroCard() {
      if (!activeCard) return;
      const card = activeCard;
      const alpha = Math.min(1, (card.duration - card.timer) / 0.18, card.timer / 0.25, 1);
      if (alpha <= 0) return;

      const cx = V_WIDTH / 2;
      const cw = 288;
      const ch = 128;
      const cy = 210;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);

      // Fundo do card
      ctx.fillStyle = 'rgba(11, 19, 36, 0.96)';
      ctx.strokeStyle = '#ffd400';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(255,212,0,0.5)';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.roundRect(cx - cw / 2, cy - ch / 2, cw, ch, 16);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Emoji grande
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(card.emoji, cx, cy - 26);

      // Nome do personagem
      ctx.font = '900 20px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(card.name, cx, cy + 12);
      ctx.fillStyle = '#ffd400';
      ctx.fillText(card.name, cx, cy + 12);

      // Piada/frase em 1 linha
      ctx.font = '900 13px "Arial Black", sans-serif';
      let quip = card.quip;
      let qSize = 13;
      ctx.font = `900 ${qSize}px "Arial Black", sans-serif`;
      while (ctx.measureText(quip).width > cw - 28 && qSize > 9) {
        qSize -= 1;
        ctx.font = `900 ${qSize}px "Arial Black", sans-serif`;
      }
      ctx.fillStyle = '#c6d3ea';
      ctx.fillText(quip, cx, cy + 38);

      // Dica de skip piscante
      if (Math.sin(performance.now() * 0.008) > -0.3) {
        ctx.font = '900 9.5px "Arial Black", sans-serif';
        ctx.fillStyle = '#6c84a8';
        ctx.fillText('PRIMEIRO CONFRONTO — TOQUE PARA PULAR', cx, cy + 58);
      }

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

    let score = 0;
    let diapersPlaced = 0;
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
    let hasShield = false;          // Broche R14 absorve 1 colisão
    let hasSwordStrike = false;     // Espadim de Tiradentes (one-shot próximo obstáculo)

    // Minichefia Ladrão de Celular (sequência de 3 ladrões)
    let thiefSquadActive = false;
    let thiefSquadCount = 0;
    let thiefSquadCaught = 0;

    // Prisioneiros capturados (MC e Ladrões) para dinâmica da Militante
    let prisonersHeld = 0;

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
          if (!this.isGrounded && this.isFastFalling) {
            spawnDust(this.x + this.w / 2, GROUND_Y, 8);
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
          ctx.save();
          ctx.strokeStyle = '#ffd400';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = '#ffd400';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 46, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
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
        ctx.save();
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

    function handleInputStart() {
      audio.init();

      // Toque durante o card de introdução = pula a apresentação (sem impacto no pulo)
      if (activeCard) {
        skipIntroCard();
        return;
      }

      if (gameState === STATE.MENU) {
        startGame();
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
      handleInputStart();
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleInputEnd();
    }, { passive: false });

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleInputStart();
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
      const maxW = maxWidth || 170;
      ctx.font = '900 13px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let measureW = ctx.measureText(text).width;
      let fontSize = 13;
      while (measureW > maxW - 20 && fontSize > 9) {
        fontSize -= 1;
        ctx.font = `900 ${fontSize}px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        measureW = ctx.measureText(text).width;
      }

      const padX = 12;
      const bw = Math.ceil(measureW + padX * 2);
      const bh = fontSize + 12;
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

      ctx.fillStyle = '#0b1528';
      ctx.fillText(text, x, by + bh / 2 + 0.5);

      if (name) {
        ctx.font = '900 8.5px "Arial Black", sans-serif';
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
          entityBubble(this, 'JORNALISTA', 'ONDE ESTÁ O FEMINICÍDIO?');
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
          entityBubble(this, 'EX-MBL', 'MILITANTE OURO!');
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
          entityBubble(this, 'MC', 'PC PAYPAL!');
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
        this.slowerSpeed = 24;
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
          entityBubble(this, 'LADRÃO', 'MEU CELULAR!');
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
      }

      update(dx, dt) {
        if (this.neutralized) {
          // Neutralizada: voa para fora da tela (esquerda)
          this.x -= dx + 260 * dt;
        } else {
          // Perseguidora: corre da esquerda para a direita SEMPRE mais rápido que o scroll
          // (dx = corrente da pista). Net = +persecSpeed px/s no cursor da tela.
          const persecSpeed = 58;
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
          entityBubble(this, 'MILITANTE', 'SOLTA ELE!');
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
        this.speedX = 70;
        this.cleared = false;
        this.neutralized = false;
        this.propellerAngle = 0;
        this.bubblePeriod = 2.2;
        this.attackTriggered = false;
      }

      update(dx, dt) {
        this.time += dt * 3.8;
        this.propellerAngle += dt * 25;
        // Sempre vem da direita voando (linha reta, sem flutuação senoidal)
        this.x -= (dx + this.speedX * dt);
        // Rasante: ao se aproximar do Renan, desce rápido até bem baixo, forçando o pulo
        if (!this.attackTriggered && this.x <= V_WIDTH * RENAN_X_RATIO + 40) {
          this.attackTriggered = true;
        }
        if (this.attackTriggered) {
          const targetY = GROUND_Y - 54;
          if (this.y < targetY) this.y = Math.min(targetY, this.y + 330 * dt);
          else this.y = Math.max(targetY, this.y - 60 * dt);
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
            drawSpeechBubble(this.x + this.w / 2, this.y - 6, 'GRAVA! GRAVA!', 'DRONE');
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
          } else if (this.type === 'algema') {
            ctx.strokeStyle = '#cfd8dc';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(cx - 8, cy, 8, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy, 8, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ffd400';
            ctx.fillRect(cx - 3, cy - 2, 6, 4);
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
        life: 1,
        vy: -1.6
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
      hudCache.diapers = null; hudCache.score = null; hudCache.handcuffs = null;
      hudCache.rank = null; hudCache.mult = null; hudCache.perk = null; hudCache.squad = null;
      hudCache.lives = null;

      lives = MAX_LIVES;
      machistaFlashTimer = 0;

      currentSpeedPx = INITIAL_SPEED_PX;
      freezeTimer = 0;
      score = 0;
      diapersPlaced = 0;
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

      cardMultiplierTimer = 0;
      flagComboCount = 0;
      imperialModeTimer = 0;
      bookInvincibleTimer = 0;
      oncaRidingTimer = 0;
      hasShield = false;
      hasSwordStrike = false;

      thiefSquadActive = false;
      thiefSquadCount = 0;
      thiefSquadCaught = 0;
      prisonersHeld = 0;

      renan.reset();

      // Púlpito inicial bem à frente para começar com calma
      const firstPulpit = createNextPulpit(V_WIDTH + 180);
      pulpits.push(firstPulpit);
      // Apresenta a mecânica central logo no início (só no primeiro confronto da sessão)
      triggerEncounterIntro('Pulpit-' + firstPulpit.candidateName, firstPulpit.candidateName || 'CANDIDATO', CANDIDATE_INSULTS[firstPulpit.candidateName] || 'Pule na cabeça e deixe a fralda!', '👶');
    }

    function getActiveMultiplier() {
      let mult = 1;
      if (cardMultiplierTimer > 0) mult *= 2;
      if (imperialModeTimer > 0) mult *= 3;
      return mult;
    }

    function updateWorld(dt) {
      // Temporizadores de perks e banner
      if (cardMultiplierTimer > 0) cardMultiplierTimer -= dt;
      if (imperialModeTimer > 0) imperialModeTimer -= dt;
      if (bookInvincibleTimer > 0) bookInvincibleTimer -= dt;
      if (oncaRidingTimer > 0) oncaRidingTimer -= dt;

      if (activeBanner) {
        activeBanner.timer -= dt;
        if (activeBanner.timer <= 0) {
          activeBanner = null;
        }
      }

      // Card de apresentação de personagem (slow-mo controlado)
      if (activeCard) {
        activeCard.timer -= dt;
        if (activeCard.timer <= 0) {
          endIntroCard();
        }
        worldTimeScale = 0.24;
      } else {
        worldTimeScale += (1 - worldTimeScale) * Math.min(1, dt * 8);
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

      // Rampa suave de velocidade: 230 px/s até 600 px/s ao longo de ~90 segundos
      if (currentSpeedPx < MAX_SPEED_PX) {
        const rampRate = (MAX_SPEED_PX - INITIAL_SPEED_PX) / 90; // ~4.1 px/s por segundo
        currentSpeedPx = Math.min(MAX_SPEED_PX, currentSpeedPx + rampRate * dt);
      }

      const effectiveSpeed = currentSpeedPx * speedFactor * worldTimeScale * dt;
      gameTime += dt;
      distanceCovered += effectiveSpeed;

      const currentMult = getActiveMultiplier();
      score += dt * 10 * currentMult;

      // Verificação de promoção de patente com banner oficial
      const newRank = getRankByScore(score);
      if (newRank.title !== currentRankTier.title) {
        currentRankTier = newRank;
        mostrarBanner(`PROMOVIDO A ${newRank.title.toUpperCase()}!`, "rank", "🎖️");
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
        if (!obs.cleared && obs.x + obs.w < renan.x && !obs.neutralized) {
          obs.cleared = true;
          obstaclesCleared++;
          const pts = 50 * currentMult;
          score += pts;
          audio.playObstaclePass();
          addFloatingText(renan.x + 10, renan.y - 10, `+${pts}`, "#48bb78");
        }

        // Colisão com Renan (ignorada durante a graça de respawn)
        if (spawnGraceTimer <= 0 && !obs.neutralized && checkAABB(renan.x + 2, renan.y + 4, renan.w - 4, renan.h - 4, obs.x + 2, obs.y + 4, obs.w - 4, obs.h - 4)) {
          handleObstacleCollision(obs, i);
          continue;
        }

        // Remove fora da tela
        if (obs.x < -120) {
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

      if (cameraShake > 0) cameraShake = Math.max(0, cameraShake - 0.4);

      updateHudDisplay();
    }

    function applyCollectible(type) {
      const mult = getActiveMultiplier();
      audio.playDiaperPlaced();

      if (type === 'valete') {
        cardMultiplierTimer = 5;
        mostrarBanner("X2 PONTOS! VALETE ATIVO", "perk", "🃏");
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
        mostrarBanner("MODO ONÇA! ATROPELAMENTO", "perk", "🐆");
        addFloatingText(renan.x, renan.y - 24, "ONÇA!", "#e67e22");
      } else if (type === 'classica') {
        flagComboCount++;
        const pts = (flagComboCount === 1 ? 50 : (flagComboCount === 2 ? 150 : 300 + (flagComboCount - 3) * 150)) * mult;
        score += pts;
        freezeTimer = 0.5;
        mostrarBanner(`COMBO! +${pts} PONTOS`, "flag", "🚩");
        addFloatingText(renan.x, renan.y - 20, `+${pts}`, "#2ecc71");
      } else if (type === 'imperial') {
        imperialModeTimer = 6;
        mostrarBanner("MODO IMPERIAL! X3 ATIVO", "flag", "👑");
        addFloatingText(renan.x, renan.y - 25, "X3 PONTOS!", "#ffd400");
      } else if (type === 'algema') {
        handcuffs++;
        score += 30 * mult;
        mostrarBanner("+1 ALGEMA POLICIAL", "item", "⛓️");
        addFloatingText(renan.x, renan.y - 20, "+1 ALGEMA", "#ffd400");
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

    function handleObstacleCollision(obs, index) {
      // Espadim de Tiradentes (one-shot no obstáculo)
      if (hasSwordStrike) {
        hasSwordStrike = false;
        obs.neutralized = true;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 16);
        mostrarBanner("GOLPE DE ESPADIM! +80", "perk", "⚔️");
        score += 80;
        return;
      }

      // Montado na Onça ou Invencível
      if (renan.isInvincible()) {
        obs.neutralized = true;
        spawnParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#ffd400', 14);
        score += 75;
        mostrarBanner("ATROPELADO PELA ONÇA! +75", "perk", "🐆");
        return;
      }

      // Verificação de Stomp (pulo na cabeça)
      const isStomp = renan.vy > 0 && (renan.y + renan.h - renan.vy <= obs.y + 26);

      if (obs instanceof JornalistaObstacle) {
        if (isStomp) {
          renan.vy = -8.8;
          obs.neutralize();
          diapersPlaced += 5;
          score += 150;
          mostrarBanner("+5 FRALDAS! LARGA O MICROFONE!", "reward", "🎤");

          // Drone extra surge após atraso mínimo seguro de 0.9s (fila do game loop)
          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4) {
              obstacles.push(new DroneObstacle(V_WIDTH + 60, 420));
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
          diapersPlaced += 2;
          score += 100;
          mostrarBanner("+2 FRALDAS! DISSIDENTE NEUTRALIZADO", "reward", "👶");
          return;
        } else {
          // Lateral: perde 1 vida e 1 fralda
          if (!loseLife(1, "Caiu do debate atropelado pelo traidor!")) return;
          renan.vy = -7;
          renan.isGrounded = false;
          renan.isFastFalling = false;
          renan.currentPlatform = null;
          if (diapersPlaced > 0) diapersPlaced--;
          mostrarBanner("PERDEU 1 FRALDA E 1 VIDA! TRAIDOR!", "danger", "⚠️");
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
          score += 100;
          handcuffs++;
          prisonersHeld++;
          mostrarBanner("PRENDEU! +100 PTS +1 ALGEMA", "reward", "⛓️");

          // Militante surge após atraso seguro de 1.1s (fila do game loop)
          scheduleSpawn(1.1, () => {
            if (obstacles.length < 4) {
              obstacles.push(new MilitanteChaser(-40));
              mostrarBanner("SOLTA ELE! MILITANTE CHEGANDO", "danger", "🚩");
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
          obs.neutralized = true;
          diapersPlaced += 1;
          handcuffs++;
          prisonersHeld++;
          thiefSquadCaught++;
          score += 60;
          mostrarBanner("+1 FRALDA +1 ALGEMA!", "reward", "📱");

          if (thiefSquadCaught >= 3) {
            thiefSquadActive = false;
            score += 150;
            mostrarBanner("QUADRILHA DESMANTELADA! +150", "reward", "🏆");

            scheduleSpawn(1.0, () => {
              if (obstacles.length < 4) {
                obstacles.push(new MilitanteChaser(-40));
                mostrarBanner("SOLTA ELE! MILITANTE CHEGANDO", "danger", "🚩");
              }
            });
          }
          return;
        }
      } else if (obs instanceof MilitanteChaser) {
        if (isStomp) {
          renan.vy = -8.6;
          obs.neutralized = true;
          diapersPlaced += 2;
          score += 80;
          mostrarBanner("+2 FRALDAS! MILITANTE NEUTRALIZADA", "reward", "⭐");

          scheduleSpawn(0.9, () => {
            if (obstacles.length < 4) {
              obstacles.push(new DroneObstacle(V_WIDTH + 60, 420));
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
            score = Math.max(0, score - 60);
            mostrarBanner("PRESO LIBERTADO PELA MILITANTE! -1 VIDA", "danger", "🚩");
          } else {
            mostrarBanner("PETISTA! TRAIDOR! -1 VIDA", "danger", "🚩");
          }
          obs.neutralized = true;
          cameraShake = 4;
          audio.playHit();
          buzz(35);
          return;
        }
      } else if (obs instanceof DroneObstacle) {
        // "Tropeço" no drone: pausa dramática + MACHISTA! destacado no centro
        if (!loseLife(1, "O drone acabou com o debate do Renan!")) return;
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        score = Math.max(0, score - 40);
        obs.neutralized = true;
        cameraShake = 5;
        audio.playHit();
        buzz(50);
        freezeTimer = 0.9;
        machistaFlashTimer = 1.0;
        mostrarBanner("MACHISTA! -40 PONTOS · -1 VIDA", "danger", "🚁");
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
          score += 120;
          cameraShake = 3;
          buzz(30);
          spawnParticles(obs.x + obs.w / 2, obs.y + 10, '#ffd400', 12);
          mostrarBanner("TOGA NEUTRALIZADA! +120", "reward", "⚖️");
          addFloatingText(obs.x + obs.w / 2, obs.y - 10, "+120", '#ffd400');
          return;
        }

        // Lateral não é morte injusta: Renan tropeça, perde 2 vidas e 1 fralda
        renan.vy = -7;
        renan.isGrounded = false;
        renan.isFastFalling = false;
        renan.currentPlatform = null;
        if (diapersPlaced > 0) diapersPlaced--;
        obs.neutralized = true;
        cameraShake = 4;
        audio.playHit();
        buzz(45);

        if (!loseLife(2, "Levou muitos tropeços na Toga e caiu do debate!")) return;

        mostrarBanner(`TOGA INDEFERIU! -1 FRALDA · RESTAM ${lives} ${lives === 1 ? 'VIDA' : 'VIDAS'}`, "danger", "⚖️");
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
      if (gameTime < 15) {
        const r = Math.random();
        if (r < 0.40) {
          pulpits.push(createNextPulpit(spawnX));
        } else if (r < 0.60) {
          obstacles.push(new ExMblObstacle(spawnX));
        } else if (r < 0.78) {
          obstacles.push(new LadraoObstacle(spawnX, 1));
        } else if (r < 0.92) {
          obstacles.push(new JornalistaObstacle(spawnX));
        } else {
          obstacles.push(new TogaObstacle(spawnX));
        }
        return;
      }

      // FASE 2 (15-40s): Acrescenta MC Latrocínio e DRONE do Cury
      if (gameTime < 40) {
        const r = Math.random();
        if (r < 0.26) {
          pulpits.push(createNextPulpit(spawnX));
        } else if (r < 0.44) {
          obstacles.push(new ExMblObstacle(spawnX));
        } else if (r < 0.60) {
          obstacles.push(new McLatrocinioObstacle(spawnX));
        } else if (r < 0.74) {
          obstacles.push(new DroneObstacle(spawnX, 410));
        } else if (r < 0.86) {
          obstacles.push(new LadraoObstacle(spawnX, 1));
        } else if (r < 0.96) {
          obstacles.push(new JornalistaObstacle(spawnX));
        } else {
          obstacles.push(new TogaObstacle(spawnX));
        }
        return;
      }

      // FASE 3 (Após 40s): Todos os tipos, incluindo minichefia de ladrões
      const r = Math.random();
      if (r < 0.22) {
        pulpits.push(createNextPulpit(spawnX));
      } else if (r < 0.40) {
        obstacles.push(new JornalistaObstacle(spawnX));
      } else if (r < 0.54) {
        obstacles.push(new McLatrocinioObstacle(spawnX));
      } else if (r < 0.66) {
        obstacles.push(new DroneObstacle(spawnX, 410));
      } else if (r < 0.88 && !thiefSquadActive && obstacles.length <= 1) {
        // Trio de ladrões bem espaçado
        thiefSquadActive = true;
        thiefSquadCount = 3;
        thiefSquadCaught = 0;
        obstacles.push(new LadraoObstacle(spawnX, 1));
        obstacles.push(new LadraoObstacle(spawnX + 90, 2));
        obstacles.push(new LadraoObstacle(spawnX + 180, 3));
      } else if (r < 0.94) {
        obstacles.push(new ExMblObstacle(spawnX));
      } else {
        obstacles.push(new TogaObstacle(spawnX));
      }

      // Apresenta em slow-mo qualquer tipo de inimigo/púlpito inédito desta sessão
      for (const obs of obstacles) maybeIntroduceObstacle(obs);
      for (const p of pulpits) {
        const key = 'Pulpit-' + p.candidateName;
        triggerEncounterIntro(key, p.candidateName || 'CANDIDATO', CANDIDATE_INSULTS[p.candidateName] || 'Pule na cabeça e deixe a fralda!', '👶');
      }
    }

    // Perfil do card de apresentação por tipo de inimigo
    const ENCOUNTER_PROFILES = {
      JornalistaObstacle: { name: 'JORNALISTA', quip: 'PERGUNTA DESCONFORTAVEL!', emoji: '📢' },
      ExMblObstacle:      { name: 'EX-MBL',      quip: 'MILITANTE OURO!',         emoji: '🗣️' },
      McLatrocinioObstacle:{ name: 'MC LATROCÍNIO', quip: 'PC PAYPAL!',           emoji: '🎤' },
      LadraoObstacle:     { name: 'LADRÃO DE CELULAR', quip: 'DÁ O CELULAR!',     emoji: '📱' },
      MilitanteChaser:    { name: 'MILITANTE',   quip: 'SOLTA ELE!',              emoji: '🚩' },
      DroneObstacle:      { name: 'DRONE',       quip: 'FILMA TUDO!',             emoji: '🚁' },
      TogaObstacle:       { name: 'TOGA DO SUPREMO', quip: 'INDEFERIDO!',         emoji: '⚖️' }
    };

    function maybeIntroduceObstacle(obs) {
      const profile = ENCOUNTER_PROFILES[obs.constructor.name];
      if (!profile) return;
      triggerEncounterIntro(obs.constructor.name, profile.name, profile.quip, profile.emoji);
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
      } else if (pRoll < 0.78) {
        type = 'classica';
      } else if (pRoll < 0.90) {
        type = 'algema';
      } else {
        type = 'valete';
      }

      collectibles.push(new CollectibleItem(x, GROUND_Y - 100, type));
    }

    function updateHudDisplay() {
      // Só escreve no DOM quando o valor muda — reduz operações DOM de ~360/s para ~30/s
      const dF = diapersPlaced; const sF = Math.floor(score); const hF = handcuffs;
      if (hudCache.diapers !== dF) { hudCache.diapers = dF; document.getElementById('hud-diapers').textContent = dF; }
      if (hudCache.score !== sF)   { hudCache.score = sF;   document.getElementById('hud-score').textContent = sF; }
      if (hudCache.handcuffs !== hF) { hudCache.handcuffs = hF; document.getElementById('hud-handcuffs').textContent = hF; }

      const livesKey = '❤'.repeat(Math.max(0, lives));
      if (hudCache.lives !== livesKey) {
        hudCache.lives = livesKey;
        document.getElementById('hud-lives').textContent = livesKey || '—';
      }

      const currentRank = getRankByScore(score);
      if (hudCache.rank !== currentRank.title) {
        hudCache.rank = currentRank.title;
        document.getElementById('hud-rank').textContent = currentRank.title;
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

      // Status Minichefia Presos n/3
      const squadEl = document.getElementById('hud-squad');
      if (thiefSquadActive) {
        squadEl.style.display = 'inline-flex';
        squadEl.textContent = `PRESOS: ${thiefSquadCaught}/3`;
      } else {
        squadEl.style.display = 'none';
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

          if (!p.hasDiaper) {
            p.hasDiaper = true;
            p.diaperScale = 1.4;
            p.stumbled = false;
            diapersPlaced++;
            score += 100;
            cameraShake = 3;
            audio.playDiaperPlaced();
            buzz(30);

            // Mensagem oficial no BANNER do topo com leitura impecável
            const shoutText = CANDIDATE_INSULTS[p.candidateName] || `${p.candidateName} FUJÃO`;
            mostrarBanner(shoutText, "pulpit", "👶");

            freezeTimer = 0.22;
            spawnParticles(p.x + p.w / 2, p.y + 4, '#ffffff', 14);
            spawnParticles(p.x + p.w / 2, p.y + 4, '#ffd400', 10);
            addFloatingText(p.x + p.w / 2, p.y - 30, "+100 FRALDA!", '#ffd400');

            // Fralda colocada recupera 1 vida (até o máximo de 3)
            if (lives < MAX_LIVES) {
              lives++;
              addFloatingText(p.x + p.w / 2, p.y - 52, "+1 VIDA ❤", '#2ecc71');
            }
          }
        } else if (!p.stumbled) {
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

          score = Math.max(0, score - 15);
          mostrarBanner(`TROPEÇOU! -15 · RESTAM ${lives} ${lives === 1 ? 'VIDA' : 'VIDAS'}`, "danger", "😵");
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
      const bW = Math.round(V_WIDTH * 0.82);
      const bH = Math.round(V_HEIGHT * 0.12);
      const bX = Math.round((V_WIDTH - bW) / 2);
      const bY = 56; // Logo abaixo da barra de HUD

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

// Ícone + Texto em negrito grande, com AUTOAJUSTE para nunca extrapolar a caixa
      const cx = bX + bW / 2;
      const cy = bY + bH / 2;

      let fontSize = 20;
      ctx.font = `900 ${fontSize}px "Arial Black", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const fullText = `${activeBanner.icone} ${activeBanner.texto}`;
      while (ctx.measureText(fullText).width > bW - 32 && fontSize > 12) {
        fontSize -= 1;
        ctx.font = `900 ${fontSize}px "Arial Black", sans-serif`;
      }

      // Contorno preto de 4px
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(fullText, cx, cy);

      // Cor amarela #ffd400 de alto contraste
      ctx.fillStyle = '#ffd400';
      ctx.fillText(fullText, cx, cy);

      ctx.restore();
    }

    function render() {
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
        ctx.font = '900 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // BANNER PRINCIPAL DE AVISOS NO TOPO
      drawActiveBanner();

      // Card de apresentação "PRIMEIRO CONFRONTO" (acima de tudo)
      drawIntroCard();

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
        ctx.fillText('MACHISTA!', 0, -16);
        ctx.shadowBlur = 8;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 26px sans-serif';
        ctx.fillText('-40 PONTOS · -1 VIDA', 0, 34);
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
        if (gameState === STATE.PLAYING) {
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
    const soundBtn = document.getElementById('sound-btn');
    const soundOn = document.getElementById('sound-icon-on');
    const soundOff = document.getElementById('sound-icon-off');
    const shareToast = document.getElementById('share-toast');

    function startGame() {
      audio.init();
      gameState = STATE.PLAYING;
      resetWorld();
      overlayStart.classList.add('hidden');
      overlayGameOver.classList.add('hidden');
    }

    function triggerGameOver(reasonText) {
      if (gameState === STATE.GAMEOVER) return;
      gameState = STATE.GAMEOVER;
      audio.playHit();
      cameraShake = 12;

      // Salva recorde
      const finalScore = Math.floor(score);
      lastFinalScore = finalScore;
      lastGameTime = gameTime;

      const isNewRecord = finalScore > highscore;
      if (isNewRecord) {
        highscore = finalScore;
        localStorage.setItem('renan_mission_best', highscore.toString());
        audio.playNewRecord();
        buzz([40, 30, 40, 30, 90]);
      }

      // Obtém a Patente conquistada
      const rank = getRankByScore(finalScore);

      // Preenche dados da tela final
      document.getElementById('go-time-label').textContent = `Sobreviveu por ${gameTime.toFixed(1)}s`;
      document.getElementById('go-score').textContent = finalScore;
      document.getElementById('go-diapers').textContent = diapersPlaced;
      document.getElementById('go-obstacles').textContent = obstaclesCleared;
      document.getElementById('go-record').textContent = highscore;

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
      startGame();
    });

    btnReplay.addEventListener('click', (e) => {
      e.stopPropagation();
      startGame();
    });

    // --- COMPARTILHAMENTO E EXPORTAÇÃO DE CARD ---
    const btnSaveImage = document.getElementById('btn-save-image');

    btnShare.addEventListener('click', async (e) => {
      e.stopPropagation();
      const rank = getRankByScore(lastFinalScore);
      const shareUrl = window.location.href;
      const shareText = `Fiz ${lastFinalScore} pontos (${lastGameTime.toFixed(1)}s) e alcancei a patente "${rank.title}" no Renan em Missão! Consegue me superar? ${shareUrl}`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: "Renan em Missão: Corrida do Livro Amarelo",
            text: shareText,
            url: shareUrl
          });
          return;
        } catch (err) {
          // Usuário cancelou ou navegador barrou, segue para wa.me/fallback
        }
      }

      // Fallback oficial via WhatsApp e Área de Transferência
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
          showShareToast("Link e pontuação prontos para envio!");
        });
      }
    });

    // Baixar Card de Desempenho como Imagem PNG via Canvas (Protegido contra crash)
    btnSaveImage.addEventListener('click', (e) => {
      e.stopPropagation();
      try {
        const rank = getRankByScore(lastFinalScore);
        const cardCanvas = document.createElement('canvas');
        cardCanvas.width = 600;
        cardCanvas.height = 420;
        const cCtx = cardCanvas.getContext('2d');
        if (!cCtx) throw new Error("Contexto 2D indisponível");

        // Fundo Azul-Marinho Oficial #0f1f3d
        cCtx.fillStyle = '#0f1f3d';
        cCtx.fillRect(0, 0, 600, 420);

        // Borda Dourada Imperial
        cCtx.strokeStyle = '#ffd400';
        cCtx.lineWidth = 8;
        cCtx.strokeRect(12, 12, 576, 396);

        // Título Oficial
        cCtx.fillStyle = '#ffd400';
        cCtx.font = '900 28px sans-serif';
        cCtx.textAlign = 'center';
        cCtx.fillText('RENAN EM MISSÃO: O LIVRO AMARELO', 300, 58);

        // Patente
        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'bold 16px sans-serif';
        cCtx.fillText('PATENTE ALCANÇADA:', 300, 105);

        cCtx.fillStyle = '#ffd400';
        cCtx.font = '900 24px sans-serif';
        cCtx.fillText(rank.title.toUpperCase(), 300, 140);

        // Estatísticas
        cCtx.fillStyle = '#182747';
        cCtx.fillRect(60, 175, 480, 140);
        cCtx.strokeStyle = 'rgba(255,212,0,0.3)';
        cCtx.strokeRect(60, 175, 480, 140);

        cCtx.fillStyle = '#94a3b8';
        cCtx.font = 'bold 14px sans-serif';
        cCtx.fillText('PONTOS', 140, 210);
        cCtx.fillText('TEMPO', 300, 210);
        cCtx.fillText('FRALDAS', 460, 210);

        cCtx.fillStyle = '#ffd400';
        cCtx.font = '900 32px sans-serif';
        cCtx.fillText(lastFinalScore.toString(), 140, 260);
        cCtx.fillText(`${lastGameTime.toFixed(1)}s`, 300, 260);
        cCtx.fillText(diapersPlaced.toString(), 460, 260);

        // Frase Desafio
        cCtx.fillStyle = '#ffffff';
        cCtx.font = 'italic 16px sans-serif';
        cCtx.fillText('"Debate sem fujões — Quem tem missão não arrega!"', 300, 360);

        // Chamada única e protegida para toDataURL
        const dataUrl = cardCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.download = `renan-em-missao-recorde-${lastFinalScore}.png`;
        a.href = dataUrl;
        a.click();
        showShareToast("Card baixado com sucesso!");
      } catch (err) {
        console.warn("Falha ao exportar imagem canvas, acionando fallback:", err);
        showShareToast("Card compartilhado em texto!");
      }
    });

    function showShareToast(msg = "Copiado para a área de transferência!") {
      shareToast.textContent = msg;
      shareToast.classList.add('show');
      setTimeout(() => {
        shareToast.classList.remove('show');
      }, 2600);
    }

    // Toggle de som
    soundBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.enabled = !audio.enabled;
      if (audio.enabled) {
        audio.init();
        soundOn.style.display = 'block';
        soundOff.style.display = 'none';
      } else {
        soundOn.style.display = 'none';
        soundOff.style.display = 'block';
      }
    });

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

    // Iniciação
    resizeCanvas();
    resetWorld();
    requestAnimationFrame(gameLoop);
  