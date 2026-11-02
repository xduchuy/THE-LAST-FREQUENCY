import { MissionClock, STALL_THRESHOLD } from './mission-clock.js';
import { evaluateReception, receptionText } from './reception.js';
const missionClock=new MissionClock();
let clockUpdating=false;
let keyboardCaptureHeld=false;
let lastTelemetryPaint=-Infinity, lastHudPaint=-Infinity;
let telemetryPaints=0, hudPaints=0;
import { createOverlayManager, escapeAction } from './overlay-manager.js';
import { setupInputManager, accumulateDrag, pointerCoordinates, ownsPointer, smoothApproach } from './input-manager.js';
import { STORAGE_KEY, readGameSave, writeGameSave, importLegacySave } from './storage.js';
import { frameRadio, radioPixelRatio } from './camera-framing.js';
let overlays;
let storageSession;
let archive = null;
let legacyDecision = null;
let pendingSaveTimer = null;
let lastStorageWrite = -Infinity;
let capturePointerId = null;
import { setupMobileLayout } from './mobile-layout.js';
import { CHANNELS, DIFFICULTIES, createMission, restoreMission, stormAt, carrierFrequency, antennaGain, captureDuration, scan, useCoolant, submitCode } from './mission.js';
let mission = createMission();
let holdingCapture = false;
let lastMissionSave = 0;
import './styles.css';

    import * as THREE from 'three';

    /*************************************************************************
     * 1. STATION DATA & DISCOVERY-FIRST MYSTERY PUZZLE CONFIGURATION
     *************************************************************************/


    const STATIONS = [
      {
        id: 'borealis',
        freq: 3.20,
        bandHint: 'VÙNG SÓNG 3.0 – 3.6 MHz',
        name: 'TRẠM KHÍ TƯỢNG BOREALIS',
        callsign: 'CW BEACON // BOREALIS',
        type: 'morse_beacon',
        morseCodeString: '--... --...', // True ITU Morse for '7 7'
        morseDisplay: '--...   --... (Lặp lại chu kỳ)',
        carrierPitch: 680,
        segments: [
          '[ĐỒNG BỘ SÓNG MANG 3.20 MHz — TRẠM KHÍ TƯỢNG BOREALIS]',
          '"...Cảnh báo bão từ cấp độ 9 tại Vĩ tuyến Bắc. Mọi trạm nghe rõ hãy đối chiếu Bảng Mã Morse Quốc Tế..."',
          '"...Chữ số đầu tiên (D1) của Khóa Ủy Quyền Chronos chính là Mã Khu Vực Bắc Cực đang được phát lặp lại bằng chuỗi xung Morse [ --... ] ở đầu sóng mang này."'
        ],
        subtitle: '[BOREALIS 3.20 MHz]: "...Cảnh báo bão từ cấp độ 9. Chữ số đầu tiên (D1) của Khóa Chronos chính là Mã Khu Vực Bắc Cực đang phát lặp lại bằng chuỗi xung Morse [ --... ] ở đầu sóng mang này."',
        clueTitle: 'Hồ sơ #1 — Tín hiệu Morse Bắc Cực (Tìm D1)',
        clueText: 'Trạm Borealis phát lặp lại chuỗi mã Morse `--...` (2 gạch dài, 3 chấm ngắn). Tra bảng mã Morse quốc tế cho chuỗi `--...` để xác định chữ số D1.'
      },
      {
        id: 'echo7',
        freq: 4.75,
        bandHint: 'VÙNG SÓNG 4.4 – 5.1 MHz',
        name: 'ĐÀI SỐ ĐẾM ECHO-7',
        callsign: 'NUMBERS // ECHO-7',
        type: 'numbers_station',
        morseCodeString: '....- --...', // '4 7'
        morseDisplay: 'NHỊP XUNG ĐẾM // 8 - 0 - 4 // OFFSET +1',
        carrierPitch: 520,
        segments: [
          '[ĐỒNG BỘ SÓNG MANG 4.75 MHz — ĐÀI SỐ ĐẾM ECHO-7]',
          '"...TÁM — KHÔNG — BỐN... Thông báo giao thức xác thực nhân sự cho Dự Án Chronos..."',
          '"...Để xác định Chữ số thứ hai (D2): Hãy tìm bản ghi Hộp đen Tàu nghiên cứu Orpheus trên dải tần trung (khoảng 6 MHz), lấy [Số lượng kỹ sư còn thức trực liên lạc] cộng thêm độ lệch bảo mật (+1)."'
        ],
        subtitle: '[ECHO-7 4.75 MHz]: "...TÁM - KHÔNG - BỐN... Quy tắc xác thực Chữ số thứ hai (D2): Tìm Hộp đen Tàu Orpheus trên dải tần 6 MHz, lấy [Số lượng kỹ sư còn thức trực liên lạc] cộng thêm 1."',
        clueTitle: 'Hồ sơ #2 — Giao thức Dịch mã ECHO-7 (Quy tắc D2)',
        clueText: 'Đài số đếm ECHO-7 quy định công thức: D2 = (Số kỹ sư còn thức trực đài trên tàu Orpheus) + 1. Cần dò tìm tín hiệu thủy âm của tàu Orpheus để lấy số liệu.'
      },
      {
        id: 'orpheus',
        freq: 6.18,
        bandHint: 'VÙNG SÓNG 5.9 – 6.5 MHz',
        name: 'HỘP ĐEN TÀU NGHIÊN CỨU ORPHEUS',
        callsign: 'HYDROPHONE // ORPHEUS',
        type: 'sonar_hydrophone',
        morseCodeString: '...--', // '3'
        morseDisplay: 'XUNG SONAR THỦY ÂM // ĐỘ SÂU 420M',
        carrierPitch: 410,
        segments: [
          '[ĐỒNG BỘ SÓNG MANG 6.18 MHz — PHAO THỦY ÂM TÀU ORPHEUS]',
          '"...Nhật ký khoang áp suất ở độ sâu 420m: Trong tổng số 12 thành viên thủy thủ đoàn, 9 người đã vào buồng ngủ đông an toàn, hiện chỉ còn 3 kỹ sư thức trực buồng máy..."',
          '"...Ghi chú chuyển tiếp: Chữ số thứ ba (D3) của khóa Chronos bằng đúng [Số lượng vệ tinh lớp Helios còn hoạt động] do Trạm Rừng Sâu K-19 báo cáo ở vùng sóng 8–9 MHz."'
        ],
        subtitle: '[ORPHEUS 6.18 MHz]: "...Độ sâu 420m. Trong đoàn 12 người, 9 người đã vào buồng ngủ đông, chỉ còn 3 kỹ sư thức trực buồng máy. Chữ số thứ ba (D3) bằng số lượng vệ tinh Helios còn hoạt động do Trạm K-19 báo cáo..."',
        clueTitle: 'Hồ sơ #3 — Nhật ký Thủy thủ đoàn Orpheus (Dữ kiện D2 & D3)',
        clueText: 'Bản ghi xác nhận: 12 thành viên trừ 9 người ngủ đông = còn 3 kỹ sư đang thức trực (kết hợp với quy tắc của Đài ECHO-7 để tính D2). Đồng thời D3 bằng số vệ tinh Helios còn hoạt động tại Trạm K-19.'
      },
      {
        id: 'k19',
        freq: 8.90,
        bandHint: 'VÙNG SÓNG 8.6 – 9.2 MHz',
        name: 'TRẠM VIỄN THÔNG RỪNG SÂU K-19',
        callsign: 'FSK DATA // RELAY K-19',
        type: 'fsk_modem',
        morseCodeString: '..---', // '2'
        morseDisplay: 'FSK 170Hz SHIFT // BAUD 50 // ORBIT TRACKING',
        carrierPitch: 790,
        segments: [
          '[ĐỒNG BỘ SÓNG MANG 8.90 MHz — TRẠM VIỄN THÔNG RỪNG SÂU K-19]',
          '"...Báo cáo giám sát quỹ đạo cực: Trong 5 vệ tinh lớp Helios được phóng lên, 3 vệ tinh đầu đã mất liên lạc hoàn toàn; hiện chỉ còn 2 vệ tinh (Helios-3 và Helios-4) duy trì hoạt động..."',
          '"...Công thức tạo Chữ số thứ tư (D4): Lấy tổng (D1 + D3) nhân với [Hệ số hiệu chuẩn pha] đang phát từ vệ tinh Helios-4 ở dải tần cao trên 11 MHz."'
        ],
        subtitle: '[THÁP K-19 8.90 MHz]: "...Trong 5 vệ tinh phóng lên, 3 chiếc đã mất tín hiệu, hiện chỉ còn 2 vệ tinh (Helios-3 và Helios-4) hoạt động. Chữ số thứ tư (D4) bằng (D1 + D3) nhân với Hệ số hiệu chuẩn pha của Helios-4..."',
        clueTitle: 'Hồ sơ #4 — Báo cáo Quỹ đạo Trạm K-19 (Dữ kiện D3 & Công thức D4)',
        clueText: 'Trạm K-19 báo cáo 5 vệ tinh trừ 3 chiếc hỏng = còn 2 vệ tinh đang hoạt động (dữ kiện của D3). Ngoài ra, chữ số cuối được tính bằng công thức: D4 = (D1 + D3) × Hệ số hiệu chuẩn pha từ Helios-4.'
      },
      {
        id: 'helios4',
        freq: 11.40,
        bandHint: 'VÙNG SÓNG 11.1 – 11.7 MHz',
        name: 'VỆ TINH KHÍ QUYỂN HELIOS-4',
        callsign: 'SAT WHISTLER // HELIOS-4',
        type: 'ionosphere_whistler',
        morseCodeString: '.---- ----.', // '1 9'
        morseDisplay: 'WHISTLER DISPERSION // PHASE FACTOR = 1.0',
        carrierPitch: 920,
        segments: [
          '[ĐỒNG BỘ SÓNG MANG 11.40 MHz — VỆ TINH KHÍ QUYỂN HELIOS-4]',
          '"...Đo đạc tầng điện ly: Hệ số hiệu chuẩn pha hiện tại cố định bằng 1 (Tổng kiểm tra của cả 4 chữ số khóa ủy quyền phải bằng 22)..."',
          '"...Sau khi mở khóa Bộ Giải Mã Chronos, hãy lấy tần số hiện tại của vệ tinh này (11.40 MHz) trừ đi độ dịch chuyển Doppler 1.75 MHz để dò tới Tần Số Cuối Cùng."'
        ],
        subtitle: '[HELIOS-4 11.40 MHz]: "...Hệ số hiệu chuẩn pha hiện tại cố định bằng 1 (Tổng kiểm tra 4 chữ số khóa bằng 22). Sau khi mở khóa Bộ Giải Mã, hãy lấy tần số 11.40 MHz này trừ đi độ lệch Doppler 1.75 MHz để tìm Tần Số Cuối Cùng..."',
        clueTitle: 'Hồ sơ #5 — Viễn trắc Vệ tinh Helios-4 (Hệ số D4 & Độ lệch Doppler)',
        clueText: 'Vệ tinh Helios-4 phát Hệ số hiệu chuẩn pha = 1 (kiểm tra chéo: tổng D1+D2+D3+D4 = 22). Để tìm Tần Số Cuối Cùng sau khi mở khóa, lấy tần số Helios-4 (11.40 MHz) trừ đi 1.75 MHz.'
      }
    ];

    const FINAL_STATION = {
      id: 'chronos_final',
      freq: 9.65,
      bandHint: 'TẦN SỐ ĐỒNG BỘ CHRONOS',
      name: 'TRẠM CHỈ HUY CHRONOS — TÍN HIỆU CUỐI CÙNG',
      callsign: 'CHRONOS // 7429 VERIFIED',
      type: 'final_harmonic',
      morseCodeString: '... --- ...',
      morseDisplay: 'HARMONIC CARRIER LOCK // 9.65 MHz',
      carrierPitch: 640,
      segments: [
        '[ĐỒNG BỘ HOÀN TẤT 9.65 MHz — TRẠM CHỈ HUY CHRONOS]',
        '"...Gửi người trực đài cuối cùng: Mã ủy quyền 7429 đã đồng bộ hóa toàn bộ mạng lưới khiên từ trường Bắc Bán Cầu..."',
        '"...Cơn bão từ cực đại đang tan dần. Bình minh đã ló dạng sau khung cửa sổ mưa. Cảm ơn bạn đã giữ vững tần số cuối cùng."'
      ],
      subtitle: '[CHRONOS 9.65 MHz]: "Liên kết đồng bộ hoàn tất! Mạng lưới khiên từ trường đã kích hoạt thành công. Bình minh đang trở lại trên toàn dải tần..."',
      clueTitle: 'Bức Điện Cuối Cùng — Dự Án CHRONOS',
      clueText: 'Bạn đã giải mã thành công Tín Hiệu Cuối Cùng tại 9.65 MHz và khôi phục mạng lưới liên lạc.'
    };

    /*************************************************************************
     * 2. CENTRAL GAME STATE & BACKWARD-COMPATIBLE LOCALSTORAGE PERSISTENCE
     *************************************************************************/
    const GAME_STATE = {
      OFF: 'OFF',
      IDLE: 'IDLE',
      TUNING: 'TUNING',
      LOCKING: 'LOCKING',
      DECODED: 'DECODED'
    };

    const state = {
      radioState: GAME_STATE.OFF,
      powerOn: false,
      warmUpLevel: 0.0, // 0.0 (cold) -> 1.0 (warmed up tubes & CRT)
      frequency: 3.00,
      targetFrequency: 3.00,
      volume: 0.8,
      muted: false,
      signalStrength: 0,
      lockProgress: 0, // 0.0 to 2.0 seconds
      activeStation: null,
      discoveredIds: [],
      sensedIds: [], // Stations player has swept across (callsign sensed)
      operatorNote: '',
      operatorEvents: [],
      // -1 = unvisited; 0..100 = maximum observed signal strength in that band cell.
      bandMemory: Array(451).fill(-1),
      codeDigits: [0, 0, 0, 0],
      codeUnlocked: false,
      gameCompleted: false,
      assistMode: false,
      scopeMode: 'wave', // 'wave' | 'spectrum'
      reducedMotion: false,
      highQuality: !window.matchMedia('(pointer: coarse)').matches,
      dawnProgress: 0.0, // 0.0 (stormy night) -> 1.0 (dawn epilogue)
      lastTuneTimestamp: 0
    };

    function storageAccess() { try { return window.localStorage; } catch { return null; } }
    function applySave(saved) {
      mission = restoreMission(saved.mission);
      archive = saved.archive || null; legacyDecision = saved.legacyDecision || null;
      for (const key of ['operatorNote','operatorEvents','sensedIds','codeDigits','assistMode','volume','muted','reducedMotion','highQuality']) {
        if (saved[key] !== undefined) state[key] = saved[key];
      }
      state.bandMemory = Array(451).fill(-1);
      for (const [i,v] of saved.bandMemory) state.bandMemory[i] = v;
      state.frequency = saved.frequency; state.targetFrequency = saved.frequency;
      state.discoveredIds = [...mission.collected]; state.codeUnlocked = mission.unlocked;
      state.gameCompleted = mission.status === 'won'; state.dawnProgress = state.gameCompleted ? 1 : 0;
    }
    function loadProgress() {
      storageSession = readGameSave(storageAccess());
      if (storageSession.save) applySave(storageSession.save);
      document.getElementById('legacy-recovery').hidden = !storageSession.legacy;
      if (storageSession.error) document.getElementById('storage-notice').textContent = storageSession.error;
      if (!storageSession.writable) document.getElementById('save-status').textContent='BẢN LƯU ĐƯỢC BẢO VỆ';
    }
    function saveProgress(force = false) {
      if (!storageSession?.writable || storageSession.legacy) return;
      const now = performance.now();
      if (force !== true && now-lastStorageWrite < 1000) {
        if (!pendingSaveTimer) pendingSaveTimer = setTimeout(() => saveProgress(true), 1000-(now-lastStorageWrite));
        return;
      }
      clearTimeout(pendingSaveTimer); pendingSaveTimer=null; lastStorageWrite=now;
      const payload = { mission, archive, legacyDecision,
        operatorNote:state.operatorNote, operatorEvents:state.operatorEvents, sensedIds:state.sensedIds,
        bandMemory:state.bandMemory.flatMap((v,i)=>v<0?[]:[[i,v]]), codeDigits:state.codeDigits,
        assistMode:state.assistMode, volume:state.volume, muted:state.muted, reducedMotion:state.reducedMotion,
        highQuality:state.highQuality, frequency:Number(state.frequency.toFixed(2)) };
      const result = writeGameSave(storageAccess(),payload);
      document.getElementById('save-status').textContent = result.ok ? 'TỰ ĐỘNG LƯU' : 'KHÔNG THỂ LƯU';
      if (!result.ok) document.getElementById('storage-notice').textContent = result.error;
    }

    /*************************************************************************
     * 3. ADVANCED PROCEDURAL WEB AUDIO DSP ENGINE (PHASE 0 & PHASE 3)
     *    - Accurate ITU Morse Lookahead Scheduler (Dot=1, Dash=3, Gaps=1/3/7)
     *    - Multi-bus mixer: Static, Carrier, Station Transmission, Rain Ambience
     *    - DynamicsCompressor limiter to prevent clipping/pops
     *************************************************************************/
    class RadioAudioEngine {
      constructor() {
        this.ctx = null;
        this.initialized = false;
        this.masterGain = null;
        this.limiter = null;
        this.analyser = null;
        this.noiseGain = null;
        this.noiseFilter = null;
        this.rainGain = null;
        this.carrierOsc = null;
        this.carrierGain = null;
        this.stationOsc = null;
        this.stationSubOsc = null;
        this.stationGain = null;
        this.schedulerTimer = null;
        this.nextEventTime = 0;
        this.morseQueue = [];
        this.morseQueueStationId = null;
        this.stepCounter = 0;
        this.timeDomainData = new Uint8Array(128);
        this.freqDomainData = new Uint8Array(128);
      }

      init() {
        if (this.initialized) {
          if (this.ctx && this.ctx.state === 'suspended' && !document.hidden) {
            this.ctx.resume().catch(() => {});
          }
          return;
        }
        try {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          this.ctx = new AudioCtx();

          // Safety Dynamics Compressor / Limiter
          this.limiter = this.ctx.createDynamicsCompressor();
          this.limiter.threshold.setValueAtTime(-10, this.ctx.currentTime);
          this.limiter.knee.setValueAtTime(12, this.ctx.currentTime);
          this.limiter.ratio.setValueAtTime(8, this.ctx.currentTime);
          this.limiter.attack.setValueAtTime(0.005, this.ctx.currentTime);
          this.limiter.release.setValueAtTime(0.15, this.ctx.currentTime);

          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

          this.analyser = this.ctx.createAnalyser();
          this.analyser.fftSize = 256;
          this.analyser.smoothingTimeConstant = 0.8;
          this.timeDomainData = new Uint8Array(this.analyser.frequencyBinCount);
          this.freqDomainData = new Uint8Array(this.analyser.frequencyBinCount);

          this.masterGain.connect(this.limiter);
          this.limiter.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);

          // 1. Pink/White Analog Radio Static Buffer (4 seconds seamless loop)
          const bufferSize = this.ctx.sampleRate * 4;
          const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.036;
            b6 = white * 0.115926;
          }

          const noiseSource = this.ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          noiseSource.loop = true;

          this.noiseFilter = this.ctx.createBiquadFilter();
          this.noiseFilter.type = 'bandpass';
          this.noiseFilter.frequency.setValueAtTime(1100, this.ctx.currentTime);
          this.noiseFilter.Q.setValueAtTime(1.45, this.ctx.currentTime);

          this.noiseGain = this.ctx.createGain();
          this.noiseGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

          noiseSource.connect(this.noiseFilter);
          this.noiseFilter.connect(this.noiseGain);
          this.noiseGain.connect(this.masterGain);
          noiseSource.start(0);

          // 2. Subtle Room Rain Ambience Layer
          const rainSource = this.ctx.createBufferSource();
          rainSource.buffer = noiseBuffer;
          rainSource.loop = true;
          const rainFilter = this.ctx.createBiquadFilter();
          rainFilter.type = 'lowpass';
          rainFilter.frequency.setValueAtTime(420, this.ctx.currentTime);
          this.rainGain = this.ctx.createGain();
          this.rainGain.gain.setValueAtTime(0.05, this.ctx.currentTime);
          rainSource.connect(rainFilter);
          rainFilter.connect(this.rainGain);
          this.rainGain.connect(this.limiter);
          rainSource.start(0);

          // 3. Heterodyne Carrier Whistle Oscillator
          this.carrierOsc = this.ctx.createOscillator();
          this.carrierOsc.type = 'sine';
          this.carrierOsc.frequency.setValueAtTime(600, this.ctx.currentTime);

          this.carrierGain = this.ctx.createGain();
          this.carrierGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

          this.carrierOsc.connect(this.carrierGain);
          this.carrierGain.connect(this.masterGain);
          this.carrierOsc.start(0);

          // 4. Primary & Sub Oscillators for Distinct Station Signatures
          this.stationOsc = this.ctx.createOscillator();
          this.stationOsc.type = 'sine';
          this.stationOsc.frequency.setValueAtTime(680, this.ctx.currentTime);

          this.stationSubOsc = this.ctx.createOscillator();
          this.stationSubOsc.type = 'triangle';
          this.stationSubOsc.frequency.setValueAtTime(340, this.ctx.currentTime);

          this.stationGain = this.ctx.createGain();
          this.stationGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

          const subMix = this.ctx.createGain();
          subMix.gain.setValueAtTime(0.28, this.ctx.currentTime);

          this.stationOsc.connect(this.stationGain);
          this.stationSubOsc.connect(subMix);
          subMix.connect(this.stationGain);
          this.stationGain.connect(this.masterGain);

          this.stationOsc.start(0);
          this.stationSubOsc.start(0);

          this.initialized = true;
          this.nextEventTime = this.ctx.currentTime + 0.05;
          this.startLookaheadScheduler();
          this.updateAudioState();
        } catch (e) {
          this.ctx?.close().catch(() => {}); this.ctx=null;
          console.warn('Web Audio API khởi tạo thất bại:', e);
        }
      }

      // Build ITU-standard Morse timing queue: Dot=1u, Dash=3u, SymbolGap=1u, LetterGap=3u, WordGap=7u
      buildMorseTimeline(codeStr, unitSec = 0.095) {
        const events = [];
        const words = codeStr.trim().split(/\s+/);
        words.forEach((word, wIdx) => {
          for (let i = 0; i < word.length; i++) {
            const ch = word[i];
            const dur = ch === '-' ? unitSec * 3 : unitSec * 1;
            events.push({ tone: true, duration: dur });
            if (i < word.length - 1) {
              events.push({ tone: false, duration: unitSec * 1 }); // Intra-character gap (1u)
            }
          }
          if (wIdx < words.length - 1) {
            events.push({ tone: false, duration: unitSec * 3 }); // Letter gap (3u)
          }
        });
        events.push({ tone: false, duration: unitSec * 7 }); // Word repeat gap (7u)
        return events;
      }

      startLookaheadScheduler() {
        if (this.schedulerTimer) clearInterval(this.schedulerTimer);
        this.schedulerTimer = setInterval(() => {
          if (!this.initialized || !this.ctx || document.hidden) return;
          if (!state.powerOn || state.muted || isAnyOverlayOpen() || !['playing','won'].includes(mission.status) || state.signalStrength < 0.22) {
            this.nextEventTime = this.ctx.currentTime + 0.05;
            return;
          }

          const now = this.ctx.currentTime;
          if (this.nextEventTime < now) this.nextEventTime = now + 0.02;

          // Schedule ahead within a 140ms lookahead window
          while (this.nextEventTime < now + 0.14) {
            this.scheduleNextStationEvent(this.nextEventTime);
          }
        }, 50);
      }

      scheduleNextStationEvent(t) {
        const nearest = getNearestStationInfo(state.frequency);
        if (!nearest.station) {
          this.nextEventTime = t + 0.1;
          return;
        }

        const st = nearest.station;
        // Ionospheric fading envelope (slow natural wave)
        const fading = 0.82 + 0.18 * Math.sin(t * 1.4);
        const peakGain = Math.min(0.28, state.signalStrength * 0.25 * state.warmUpLevel * fading);
        const baseFreq = st.carrierPitch || 660;

        // 1. BOREALIS (3.20 MHz): True ITU Morse Beacon (--... = 7)
        if (st.type === 'morse_beacon') {
          if (this.morseQueueStationId !== st.id || this.morseQueue.length === 0) {
            this.morseQueue = this.buildMorseTimeline(st.morseCodeString || '--...', 0.105);
            this.morseQueueStationId = st.id;
          }
          const item = this.morseQueue.shift();
          this.stationOsc.type = 'sine';
          this.stationOsc.frequency.setValueAtTime(baseFreq, t);
          this.stationSubOsc.frequency.setValueAtTime(baseFreq * 0.5, t);

          if (item.tone) {
            this.stationGain.gain.setValueAtTime(0.0005, t);
            this.stationGain.gain.linearRampToValueAtTime(peakGain, t + 0.008);
            this.stationGain.gain.setValueAtTime(peakGain, t + Math.max(0.01, item.duration - 0.012));
            this.stationGain.gain.exponentialRampToValueAtTime(0.0005, t + item.duration);
          }
          this.nextEventTime = t + item.duration;
          return;
        }

        this.morseQueueStationId = null;
        this.stepCounter++;

        // 2. ECHO-7 (4.75 MHz): Numbers Station Harmonic Interval Chime + Count Pulses
        if (st.type === 'numbers_station') {
          const notes = [520, 650, 780, 520, 0, 585, 585, 585, 585, 0];
          const note = notes[this.stepCounter % notes.length];
          const dur = 0.22;
          if (note > 0) {
            this.stationOsc.type = 'triangle';
            this.stationOsc.frequency.setValueAtTime(note, t);
            this.stationSubOsc.frequency.setValueAtTime(note * 0.5, t);
            this.stationGain.gain.setValueAtTime(0.0005, t);
            this.stationGain.gain.linearRampToValueAtTime(peakGain, t + 0.015);
            this.stationGain.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.85);
          }
          this.nextEventTime = t + dur;
          return;
        }

        // 3. ORPHEUS (6.18 MHz): Deep-Sea Hydrophone Sonar Ping with Downward Glide
        if (st.type === 'sonar_hydrophone') {
          const cycle = this.stepCounter % 4;
          const dur = cycle === 0 ? 0.55 : 0.32;
          if (cycle === 0 || cycle === 1) {
            const startP = cycle === 0 ? baseFreq * 1.45 : baseFreq;
            this.stationOsc.type = 'sine';
            this.stationOsc.frequency.setValueAtTime(startP, t);
            this.stationOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.68, t + dur * 0.85);
            this.stationSubOsc.frequency.setValueAtTime(startP * 0.5, t);
            this.stationGain.gain.setValueAtTime(0.0005, t);
            this.stationGain.gain.linearRampToValueAtTime(peakGain * 1.1, t + 0.012);
            this.stationGain.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.92);
          }
          this.nextEventTime = t + dur;
          return;
        }

        // 4. K-19 (8.90 MHz): Rapid FSK Digital Telemetry Bursts (Mark/Space Shift)
        if (st.type === 'fsk_modem') {
          const isBurst = (this.stepCounter % 14) < 10;
          const dur = isBurst ? 0.065 : 0.24;
          if (isBurst) {
            const bit = (this.stepCounter * 7 + 3) % 2;
            const fskFreq = bit === 1 ? baseFreq + 170 : baseFreq;
            this.stationOsc.type = 'square';
            this.stationOsc.frequency.setValueAtTime(fskFreq, t);
            this.stationSubOsc.frequency.setValueAtTime(fskFreq * 0.5, t);
            this.stationGain.gain.setValueAtTime(peakGain * 0.65, t);
            this.stationGain.gain.setValueAtTime(0.0005, t + dur * 0.9);
          }
          this.nextEventTime = t + dur;
          return;
        }

        // 5. HELIOS-4 (11.40 MHz): Ionospheric Whistler Sweep + Satellite Pip
        if (st.type === 'ionosphere_whistler') {
          const isSweep = (this.stepCounter % 5) === 0;
          const dur = isSweep ? 0.62 : 0.18;
          this.stationOsc.type = 'sine';
          if (isSweep) {
            this.stationOsc.frequency.setValueAtTime(baseFreq * 1.9, t);
            this.stationOsc.frequency.exponentialRampToValueAtTime(baseFreq * 0.42, t + dur * 0.92);
            this.stationSubOsc.frequency.setValueAtTime(baseFreq * 0.95, t);
            this.stationGain.gain.setValueAtTime(0.0005, t);
            this.stationGain.gain.linearRampToValueAtTime(peakGain, t + 0.04);
            this.stationGain.gain.exponentialRampToValueAtTime(0.0005, t + dur * 0.95);
          } else {
            this.stationOsc.frequency.setValueAtTime(baseFreq, t);
            this.stationGain.gain.setValueAtTime(0.0005, t);
            this.stationGain.gain.linearRampToValueAtTime(peakGain * 0.75, t + 0.01);
            this.stationGain.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
          }
          this.nextEventTime = t + dur;
          return;
        }

        // 6. CHRONOS FINAL (9.65 MHz): Crystalline Harmonic Triad
        const chord = [523.25, 659.25, 783.99, 1046.5];
        const f = chord[this.stepCounter % chord.length];
        const dur = 0.34;
        this.stationOsc.type = 'triangle';
        this.stationOsc.frequency.setValueAtTime(f, t);
        this.stationSubOsc.frequency.setValueAtTime(f * 0.5, t);
        this.stationGain.gain.setValueAtTime(0.0005, t);
        this.stationGain.gain.linearRampToValueAtTime(peakGain * 1.1, t + 0.025);
        this.stationGain.gain.exponentialRampToValueAtTime(0.0008, t + dur * 0.94);
        this.nextEventTime = t + dur;
      }

      updateAudioState() {
        if (!this.initialized || !this.ctx) return;
        const now = this.ctx.currentTime;

        const targetRain = (state.muted || isAnyOverlayOpen() || mission.status === 'paused' || mission.status === 'lost') ? 0.0001 : Math.max(0.0001, state.volume * 0.045);
        this.rainGain.gain.setTargetAtTime(targetRain, now, 0.1);

        const targetMaster = (state.powerOn && !state.muted && !isAnyOverlayOpen() && mission.status !== 'paused' && mission.status !== 'lost')
          ? Math.max(0.0001, state.volume * Math.max(0.05, state.warmUpLevel))
          : 0.0001;
        this.masterGain.gain.setTargetAtTime(targetMaster, now, state.powerOn ? 0.08 : 0.16);

        if (!state.powerOn) {
          this.noiseGain.gain.setTargetAtTime(0.0001, now, 0.08);
          this.carrierGain.gain.setTargetAtTime(0.0001, now, 0.06);
          this.stationGain.gain.setTargetAtTime(0.0001, now, 0.06);
          return;
        }

        // Morph noise filter frequency & gain based on tuning position and signal strength
        const sig = state.signalStrength;
        const normFreq = (state.frequency - 3.0) / 9.0;
        const cutoff = 680 + normFreq * 1150 - sig * 480;
        this.noiseFilter.frequency.setTargetAtTime(cutoff, now, 0.05);

        // Static drops cleanly when locked onto a station (especially clean on 9.65 MHz Chronos)
        const isFinal = state.activeStation && state.activeStation.id === FINAL_STATION.id;
        const minStatic = isFinal ? 0.025 : 0.085;
        const staticLevel = THREE.MathUtils.lerp(0.36, minStatic, sig * 0.9);
        this.noiseGain.gain.setTargetAtTime(staticLevel, now, 0.05);

        // Heterodyne whistle pitch sweeps as player approaches station center
        const nearest = getNearestStationInfo(state.frequency);
        if (nearest.station && nearest.distance < 0.14) {
          const whistlePitch = 160 + Math.abs(nearest.distance) * 11800;
          const whistleAmp = Math.sin((1 - nearest.distance / 0.14) * Math.PI) * 0.072 * (1 - sig * 0.72);
          this.carrierOsc.frequency.setTargetAtTime(whistlePitch, now, 0.03);
          this.carrierGain.gain.setTargetAtTime(Math.max(0.0001, whistleAmp), now, 0.04);
        } else {
          this.carrierGain.gain.setTargetAtTime(0.0001, now, 0.04);
        }
      }

      // Soft distant thunder rumble synchronized with lightning flash
      playDistantThunder() {
        if (!this.initialized || !this.ctx || state.muted || document.hidden || isAnyOverlayOpen() || !['playing','won'].includes(mission.status)) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(58, now);
        osc.frequency.exponentialRampToValueAtTime(28, now + 1.8);
        const lp = this.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(110, now);

        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.11 * state.volume, now + 0.25);
        g.gain.exponentialRampToValueAtTime(0.0005, now + 2.1);

        osc.connect(lp);
        lp.connect(g);
        g.connect(this.limiter);
        osc.start(now);
        osc.onended=()=>{osc.disconnect();lp.disconnect();g.disconnect();};
        osc.stop(now + 2.15);
      }

      // Tactile mechanical switch click
      playMechanicalClick(pitch = 220) {
        if (!this.initialized || !this.ctx || state.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(pitch, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.045);

        g.gain.setValueAtTime(0.24 * state.volume, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(g);
        g.connect(this.limiter);
        osc.start(now);
        osc.onended=()=>{osc.disconnect();g.disconnect();};
        osc.stop(now + 0.05);
      }

      // Subtle analog detent tick when turning knob
      playTuningTick() {
        if (!this.initialized || !this.ctx || !state.powerOn || state.muted) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(145, now);
        g.gain.setValueAtTime(0.038 * state.volume, now);
        g.gain.exponentialRampToValueAtTime(0.0005, now + 0.016);
        osc.connect(g);
        g.connect(this.limiter);
        osc.start(now);
        osc.onended=()=>{osc.disconnect();g.disconnect();};
        osc.stop(now + 0.02);
      }

      // Electronic confirmation chime when a station locks after 2 seconds
      playSignalLockedChime(isFinal = false) {
        if (!this.initialized || !this.ctx || state.muted) return;
        const now = this.ctx.currentTime;
        const notes = isFinal ? [523.25, 659.25, 783.99, 1046.5] : [587.33, 880.0];
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.11);
          g.gain.setValueAtTime(0.0001, now + idx * 0.11);
          g.gain.linearRampToValueAtTime(0.16 * state.volume, now + idx * 0.11 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0005, now + idx * 0.11 + 0.38);
          osc.connect(g);
          g.connect(this.limiter);
          osc.start(now + idx * 0.11);
          osc.onended=()=>{osc.disconnect();g.disconnect();};
          osc.stop(now + idx * 0.11 + 0.4);
        });
      }

      getWaveformData() {
        if (!this.initialized || !this.analyser) return null;
        this.analyser.getByteTimeDomainData(this.timeDomainData);
        return this.timeDomainData;
      }

      getSpectrumData() {
        if (!this.initialized || !this.analyser) return null;
        this.analyser.getByteFrequencyData(this.freqDomainData);
        return this.freqDomainData;
      }
    }

    const audio = new RadioAudioEngine();

    /*************************************************************************
     * 4. HELPER: STATION DISTANCE & SIGNAL STRENGTH CALCULATION
     *************************************************************************/
    function getAvailableStations() {
      return state.codeUnlocked ? [...STATIONS, FINAL_STATION] : STATIONS;
    }

    function getNearestStationInfo(freq) {
      const list = getAvailableStations();
      let bestStation = null;
      let minDist = Infinity;
      for (const st of list) {
        const channel = CHANNELS.find(c => c.id === st.id);
        const d = Math.abs(freq - carrierFrequency(mission, channel));
        if (d < minDist) {
          minDist = d;
          bestStation = st;
        }
      }
      return { station: bestStation, distance: minDist };
    }

    /*************************************************************************
     * 5. THREE.JS R160 SCENE, PROCEDURAL RADIO & ATMOSPHERIC ENVIRONMENT
     *************************************************************************/
    const container = document.getElementById('canvas-container');
    let renderer = null, scene = null, camera = null;
    let webglAvailable = false;
    let radioBounds = null, frameTarget = null;
    const controlMeshes = {};
    let renderFrames = 0;
    let clock = new THREE.Clock();

    // Interactive 3D Meshes
    const interactables = [];
    let powerSwitchPivot, tuningKnobMesh, volumeKnobMesh, dialNeedleMesh, vuNeedlePivot;
    let pilotLampMat, lockLampMat, dialBacklightMat, scopePlaneMat;
    let radioWarmLight, lampSpotLight, lockGlowLight, moonDirLight, hemiLight;
    let dustParticles;
    let clockMinuteHand, clockHourHand;
    let vuNeedleVelocity = 0;
    let vuNeedleAngle = 0.52;
    let lightningFlashIntensity = 0;
    let nextLightningTime = 14;

    // Dynamic Procedural Canvas Textures
    let dialCanvas, dialCtx, dialTexture;
    let scopeCanvas, scopeCtx, scopeTexture;
    let rainCanvas, rainCtx, rainTexture;
    const raindrops = [];

    // Camera Parallax & Subtle Focus Response State
    const pointerNorm = new THREE.Vector2(0, 0);
    const baseCameraPos = new THREE.Vector3(0, 1.62, 3.38);
    const baseLookAt = new THREE.Vector3(0, 0.66, 0);
    let cameraZoomOffset = 0;

    function initThreeScene() {
      try {
        lastScopePower=null;
        // Clear previous children if retrying
        while (container.firstChild) container.removeChild(container.firstChild);
        interactables.length = 0;

        scene = new THREE.Scene();
        scene.background = new THREE.Color('#101417');
        scene.fog = new THREE.FogExp2('#101417', 0.11);

        camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
        camera.position.copy(baseCameraPos);
        camera.lookAt(baseLookAt);

        renderer = new THREE.WebGLRenderer({ antialias: state.highQuality, powerPreference: 'high-performance' });
        resizeRadioStage();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, state.highQuality ? 2 : 1.15));
        renderer.shadowMap.enabled = state.highQuality;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.08;
        container.appendChild(renderer.domElement);
        renderer.domElement.addEventListener('lostpointercapture',endKnobDrag);

        // Handle WebGL Context Lost / Restored gracefully
        renderer.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          webglAvailable = false;
          releaseAllInput();
          const fallback=document.getElementById('radio-fallback');
          fallback.hidden=false;fallback.textContent='CHẾ ĐỘ HUD · Đồ họa đang khôi phục. Thanh dò, anten và nút thu vẫn hoạt động.';
          document.body.classList.remove('webgl-ready');
          const errBox = document.getElementById('webgl-error-box');
          if (errBox) {
            errBox.classList.remove('hidden');
            errBox.textContent = 'Cảnh báo: Ngữ cảnh đồ họa WebGL tạm thời bị gián đoạn. Hệ thống đang tự động khôi phục...';
          }
        }, false);

        renderer.domElement.addEventListener('webglcontextrestored', () => {
          webglAvailable = true;
          document.body.classList.add('webgl-ready');
          document.getElementById('radio-fallback').hidden=true;
          const errBox = document.getElementById('webgl-error-box');
          if (errBox) errBox.classList.add('hidden');
          drawFrequencyDialCanvas(state.powerOn);
        }, false);

        buildLighting();
        buildDeskAndProps();
        buildRainyWindow();
        buildVintageShortwaveRadio();
        buildDustParticles();
        webglAvailable = true;
        resizeRadioStage(true);
        document.body.classList.add('webgl-ready');
      } catch (err) {
        webglAvailable = false;
        document.body.classList.remove('webgl-ready');
        document.getElementById('radio-fallback').hidden=false;
        document.getElementById('radio-fallback').textContent='CHẾ ĐỘ HUD · Dùng thanh dò tần và anten bên dưới. Radio 3D chưa khả dụng trên trình duyệt này.';
        console.warn('WebGL fallback:', err.message);
        const errBox = document.getElementById('webgl-error-box');
        if (errBox) {
          errBox.classList.remove('hidden');
          errBox.innerHTML = `Không thể khởi tạo WebGL 3D (${err.message || 'Thiết bị hạn chế'}). Bạn vẫn có thể điều khiển đầy đủ bằng giao diện HUD hoặc <button id="btn-retry-webgl" class="underline text-[#F2AE58] ml-1">Thử khởi tạo lại</button>.`;
          const retryBtn = document.getElementById('btn-retry-webgl');
          if (retryBtn) retryBtn.addEventListener('click', () => initThreeScene());
        }
      }
    }

    function buildLighting() {
      // Cold ambient night fill
      hemiLight = new THREE.HemisphereLight('#38536b', '#12100e', 0.45);
      scene.add(hemiLight);
      const frontFill = new THREE.DirectionalLight('#d3c6a4', 1.05);
      frontFill.position.set(.5,1.5,4);scene.add(frontFill);

      // Cold moonlight through rainy window behind the desk
      moonDirLight = new THREE.DirectionalLight('#547899', 0.85);
      moonDirLight.position.set(1.5, 3.8, -3.2);
      moonDirLight.castShadow = true;
      moonDirLight.shadow.mapSize.width = 1024;
      moonDirLight.shadow.mapSize.height = 1024;
      scene.add(moonDirLight);

      // Warm vintage desk lamp spotlight on left
      lampSpotLight = new THREE.SpotLight('#F2AE58', 5.8, 9, Math.PI / 3.1, 0.65, 1.5);
      lampSpotLight.position.set(-1.55, 2.35, 0.85);
      lampSpotLight.target.position.set(-0.15, 0.5, 0.1);
      lampSpotLight.castShadow = true;
      lampSpotLight.shadow.bias = -0.0005;
      lampSpotLight.shadow.mapSize.width = 1024;
      lampSpotLight.shadow.mapSize.height = 1024;
      scene.add(lampSpotLight);
      scene.add(lampSpotLight.target);

      // Warm amber glow emitted from the radio dial faceplate when powered ON
      radioWarmLight = new THREE.PointLight('#F2AE58', 0, 2.8, 1.8);
      radioWarmLight.position.set(0, 0.82, 0.88);
      scene.add(radioWarmLight);

      // Phosphor green glow when locking/decoded
      lockGlowLight = new THREE.PointLight('#9EC6A2', 0, 2.2, 2.0);
      lockGlowLight.position.set(0.55, 0.72, 0.85);
      scene.add(lockGlowLight);
    }

    // Create procedural wood texture
    function createWoodTexture() {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#261811';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 240; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(18, 10, 6, 0.25)' : 'rgba(62, 39, 25, 0.16)';
        const y = Math.random() * 512;
        ctx.fillRect(0, y, 512, 1 + Math.random() * 4);
      }
      const tex = new THREE.CanvasTexture(c);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    // Create procedural speaker grille mesh texture
    function createGrilleTexture() {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#181c1e';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#090b0c';
      const step = 8;
      for (let y = 4; y < 256; y += step) {
        for (let x = 4; x < 256; x += step) {
          ctx.beginPath();
          ctx.arc(x, y, 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return new THREE.CanvasTexture(c);
    }

    function buildDeskAndProps() {
      const woodTex = createWoodTexture();

      // Wooden Desk Surface
      const deskMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        roughness: 0.68,
        metalness: 0.08
      });
      const deskMesh = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.2, 4.2), deskMat);
      deskMesh.position.set(0, -0.1, 0.2);
      deskMesh.receiveShadow = true;
      scene.add(deskMesh);

      // Vintage Articulated Brass/Charcoal Desk Lamp (Left of Radio)
      const lampGroup = new THREE.Group();
      lampGroup.position.set(-1.75, 0, -0.15);

      const darkMetalMat = new THREE.MeshStandardMaterial({ color: '#1f2426', roughness: 0.4, metalness: 0.75 });
      const brassMat = new THREE.MeshStandardMaterial({ color: '#b5894c', roughness: 0.32, metalness: 0.85 });

      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.08, 28), darkMetalMat);
      base.position.y = 0.04;
      base.castShadow = true;
      lampGroup.add(base);

      const stem1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35, 16), brassMat);
      stem1.position.set(-0.08, 0.68, 0);
      stem1.rotation.z = -0.14;
      lampGroup.add(stem1);

      const stem2 = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.15, 16), brassMat);
      stem2.position.set(0.22, 1.65, 0.25);
      stem2.rotation.z = 0.65;
      stem2.rotation.x = 0.28;
      lampGroup.add(stem2);

      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 28, 1, true), darkMetalMat);
      shade.material.side = THREE.DoubleSide;
      shade.position.set(0.55, 1.98, 0.48);
      shade.rotation.z = -0.52;
      shade.rotation.x = -0.25;
      lampGroup.add(shade);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 16, 16),
        new THREE.MeshBasicMaterial({ color: '#F2AE58' })
      );
      bulb.position.set(0.52, 1.92, 0.48);
      lampGroup.add(bulb);

      scene.add(lampGroup);

      // Interactive Field Dossier / Notebook on the Right of the Desk
      const notebookGroup = new THREE.Group();
      notebookGroup.position.set(1.62, 0.03, 0.58);
      notebookGroup.rotation.y = -0.28;

      const folderMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.78, 0.04, 1.02),
        new THREE.MeshStandardMaterial({ color: '#8c6d46', roughness: 0.85 })
      );
      folderMesh.castShadow = true;
      folderMesh.receiveShadow = true;
      folderMesh.userData = { interactType: 'notebook', label: 'SỔ TAY ĐIỀU TRA [NHẤN ĐỂ MỞ]' };
      interactables.push(folderMesh);
      notebookGroup.add(folderMesh);

      const paperMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 0.88),
        new THREE.MeshStandardMaterial({ color: '#dfd5c0', roughness: 0.9 })
      );
      paperMesh.rotation.x = -Math.PI / 2;
      paperMesh.position.y = 0.022;
      notebookGroup.add(paperMesh);

      // Brass Pen resting on notebook
      const penMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.52, 12),
        brassMat
      );
      penMesh.rotation.z = Math.PI / 2;
      penMesh.rotation.y = 0.35;
      penMesh.position.set(0.05, 0.035, 0.12);
      notebookGroup.add(penMesh);

      scene.add(notebookGroup);

      // Ceramic Mug on the Back-Right
      const mugGroup = new THREE.Group();
      mugGroup.position.set(1.55, 0.18, -0.45);
      const mugMat = new THREE.MeshStandardMaterial({ color: '#2b3336', roughness: 0.35, metalness: 0.1 });
      const mugBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.34, 24), mugMat);
      mugBody.castShadow = true;
      mugGroup.add(mugBody);
      scene.add(mugGroup);

      // North Atlantic Sector Map on Left Desk Surface
      const mapCanvas = document.createElement('canvas');
      mapCanvas.width = 256;
      mapCanvas.height = 256;
      const mctx = mapCanvas.getContext('2d');
      mctx.fillStyle = '#d4c8b0';
      mctx.fillRect(0, 0, 256, 256);
      mctx.strokeStyle = 'rgba(45, 65, 75, 0.38)';
      mctx.lineWidth = 1.5;
      for (let i = 32; i < 256; i += 32) {
        mctx.beginPath(); mctx.moveTo(i, 0); mctx.lineTo(i, 256); mctx.stroke();
        mctx.beginPath(); mctx.moveTo(0, i); mctx.lineTo(256, i); mctx.stroke();
      }
      mctx.strokeStyle = '#8c3b2b';
      mctx.beginPath(); mctx.arc(140, 110, 52, 0, Math.PI * 2); mctx.stroke();
      mctx.fillStyle = '#252A2B';
      mctx.font = 'bold 14px IBM Plex Mono, monospace';
      mctx.fillText('SECTOR 7 // 74°N', 24, 34);
      const mapTex = new THREE.CanvasTexture(mapCanvas);

      const mapSheet = new THREE.Mesh(
        new THREE.PlaneGeometry(0.95, 0.75),
        new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.88 })
      );
      mapSheet.rotation.x = -Math.PI / 2;
      mapSheet.rotation.z = 0.18;
      mapSheet.position.set(-1.58, 0.005, 0.56);
      mapSheet.receiveShadow = true;
      scene.add(mapSheet);

      // 1974 Analog Station Desk Clock (Back-Left) displaying ~23:42
      const clockGroup = new THREE.Group();
      clockGroup.position.set(-1.38, 0.22, -0.58);
      clockGroup.rotation.y = 0.38;

      const clockCase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.16), darkMetalMat);
      clockCase.castShadow = true;
      clockGroup.add(clockCase);

      const clockBezel = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.17, 28), brassMat);
      clockBezel.rotation.x = Math.PI / 2;
      clockGroup.add(clockBezel);

      const clockFace = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, 0.175, 28),
        new THREE.MeshStandardMaterial({ color: '#e6dec8', roughness: 0.6 })
      );
      clockFace.rotation.x = Math.PI / 2;
      clockGroup.add(clockFace);

      clockHourHand = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.08, 0.01), darkMetalMat);
      clockHourHand.position.set(0, 0, 0.095);
      clockMinuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.12, 0.01), darkMetalMat);
      clockMinuteHand.position.set(0, 0, 0.098);
      clockGroup.add(clockHourHand, clockMinuteHand);
      scene.add(clockGroup);
    }

    function buildRainyWindow() {
      rainCanvas = document.createElement('canvas');
      rainCanvas.width = 512;
      rainCanvas.height = 512;
      rainCtx = rainCanvas.getContext('2d');

      for (let i = 0; i < (state.highQuality ? 65 : 24); i++) {
        raindrops.push({
          x: Math.random() * 512,
          y: Math.random() * 512,
          len: 12 + Math.random() * 28,
          speed: 1.5 + Math.random() * 3.5,
          alpha: 0.12 + Math.random() * 0.28
        });
      }

      rainTexture = new THREE.CanvasTexture(rainCanvas);

      const windowGroup = new THREE.Group();
      windowGroup.position.set(0, 2.1, -2.15);

      const glassMat = new THREE.MeshStandardMaterial({
        map: rainTexture,
        roughness: 0.2,
        metalness: 0.3,
        emissive: new THREE.Color('#1a2c3d'),
        emissiveMap: rainTexture,
        emissiveIntensity: 0.85
      });

      const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 3.2), glassMat);
      windowGroup.add(glassPane);

      // Window Mullion Frames
      const frameMat = new THREE.MeshStandardMaterial({ color: '#14181b', roughness: 0.7 });
      const vBar1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.12), frameMat);
      vBar1.position.x = -1.2;
      const vBar2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.12), frameMat);
      vBar2.position.x = 1.2;
      const hBar = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.08, 0.12), frameMat);
      hBar.position.y = 0.2;
      windowGroup.add(vBar1, vBar2, hBar);

      scene.add(windowGroup);
    }

    function updateRainWindowTexture() {
      if (!rainCtx) return;
      const dawn = state.dawnProgress;
      const flash = lightningFlashIntensity;

      const grad = rainCtx.createLinearGradient(0, 0, 0, 512);
      if (dawn > 0.01) {
        grad.addColorStop(0, '#162230');
        grad.addColorStop(0.55, '#2b3d4f');
        grad.addColorStop(1, `rgba(242, 174, 88, ${0.25 + dawn * 0.45})`);
      } else {
        grad.addColorStop(0, flash > 0.05 ? '#3a4e63' : '#0d151d');
        grad.addColorStop(0.55, flash > 0.05 ? '#526d85' : '#162430');
        grad.addColorStop(1, '#1c2933');
      }
      rainCtx.fillStyle = grad;
      rainCtx.fillRect(0, 0, 512, 512);

      // Distant horizon glow
      rainCtx.fillStyle = `rgba(242, 174, 88, ${0.06 + dawn * 0.28})`;
      rainCtx.beginPath();
      rainCtx.arc(370, 360, 75 + dawn * 60, 0, Math.PI * 2);
      rainCtx.fill();

      const motionScale = state.reducedMotion ? 0.25 : 1.0;
      for (const drop of raindrops) {
        drop.y += drop.speed * motionScale * (1 - dawn * 0.65);
        if (drop.y > 512) {
          drop.y = -drop.len;
          drop.x = Math.random() * 512;
        }
        rainCtx.strokeStyle = `rgba(170, 205, 230, ${drop.alpha})`;
        rainCtx.lineWidth = 1.5;
        rainCtx.beginPath();
        rainCtx.moveTo(drop.x, drop.y);
        rainCtx.lineTo(drop.x - 2, drop.y + drop.len);
        rainCtx.stroke();
      }
      rainTexture.needsUpdate = true;
    }

    /*************************************************************************
     * 6. DETAILED 3D VINTAGE SHORTWAVE RADIO ("KESTREL SW-74" V2.0 REWORK)
     *    - Fixed createKnurledKnob() returning full THREE.Group with knurling,
     *      skirt, front cap, and brass indicator marker rotating in unison.
     *    - Added chassis screws, speaker depth cone, side louvers, multi-stage antenna.
     *************************************************************************/
    function buildVintageShortwaveRadio() {
      const radioGroup = new THREE.Group();
      radioGroup.position.set(0, 0, 0.15);

      const woodTex = createWoodTexture();
      const grilleTex = createGrilleTexture();

      // Materials
      const cabinetWoodMat = new THREE.MeshStandardMaterial({
        map: woodTex,
        color: '#4a2e1b',
        roughness: 0.48,
        metalness: 0.12
      });
      const faceplateMat = new THREE.MeshStandardMaterial({
        color: '#202527',
        roughness: 0.38,
        metalness: 0.68
      });
      const brushedMetalMat = new THREE.MeshStandardMaterial({
        color: '#949b9e',
        roughness: 0.25,
        metalness: 0.88
      });
      const darkKnurledMat = new THREE.MeshStandardMaterial({
        color: '#282e30',
        roughness: 0.34,
        metalness: 0.8
      });
      const amberBrassMat = new THREE.MeshStandardMaterial({
        color: '#e0a34e',
        roughness: 0.26,
        metalness: 0.88
      });

      // 1. Outer Wooden Sleeve Cabinet
      const mainBody = new THREE.Mesh(new THREE.BoxGeometry(2.38, 1.26, 1.08), cabinetWoodMat);
      mainBody.position.set(0, 0.66, 0);
      mainBody.castShadow = true;
      mainBody.receiveShadow = true;
      radioGroup.add(mainBody);

      // Side Ventilation Louvers & Carry Handle Brackets
      const louverGeo = new THREE.BoxGeometry(0.02, 0.03, 0.56);
      for (let i = 0; i < 6; i++) {
        const yPos = 0.45 + i * 0.075;
        const leftLouver = new THREE.Mesh(louverGeo, darkKnurledMat);
        leftLouver.position.set(-1.195, yPos, 0);
        const rightLouver = new THREE.Mesh(louverGeo, darkKnurledMat);
        rightLouver.position.set(1.195, yPos, 0);
        radioGroup.add(leftLouver, rightLouver);
      }

      // Rubber Feet
      const footGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.06, 16);
      [[-0.98, 0.03, 0.38], [0.98, 0.03, 0.38], [-0.98, 0.03, -0.38], [0.98, 0.03, -0.38]].forEach(([x, y, z]) => {
        const foot = new THREE.Mesh(footGeo, darkKnurledMat);
        foot.position.set(x, y, z);
        radioGroup.add(foot);
      });

      // Recessed Charcoal Aluminum Front Faceplate
      const faceplate = new THREE.Mesh(new THREE.BoxGeometry(2.22, 1.12, 0.06), faceplateMat);
      faceplate.position.set(0, 0.66, 0.525);
      radioGroup.add(faceplate);

      // Corner Hex Screws on Faceplate
      const screwGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.02, 6);
      [[-1.04, 1.15], [1.04, 1.15], [-1.04, 0.17], [1.04, 0.17]].forEach(([sx, sy]) => {
        const screw = new THREE.Mesh(screwGeo, brushedMetalMat);
        screw.rotation.x = Math.PI / 2;
        screw.position.set(sx, sy, 0.558);
        radioGroup.add(screw);
      });

      // Chrome Bezel Strips (Top & Bottom accents)
      const trimTop = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.028, 0.085), brushedMetalMat);
      trimTop.position.set(0, 1.22, 0.53);
      const trimBot = new THREE.Mesh(new THREE.BoxGeometry(2.24, 0.028, 0.085), brushedMetalMat);
      trimBot.position.set(0, 0.10, 0.53);
      radioGroup.add(trimTop, trimBot);

      // 2. Left Speaker Grille Panel with Inner Acoustic Cone Depth
      const speakerFrame = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.62, 0.032), brushedMetalMat);
      speakerFrame.position.set(-0.65, 0.52, 0.555);
      radioGroup.add(speakerFrame);

      const speakerConeRing = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.24, 24), darkKnurledMat);
      speakerConeRing.position.set(-0.65, 0.52, 0.568);
      radioGroup.add(speakerConeRing);

      const speakerGrille = new THREE.Mesh(
        new THREE.PlaneGeometry(0.70, 0.56),
        new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.65, metalness: 0.38, transparent: true, opacity: 0.94 })
      );
      speakerGrille.position.set(-0.65, 0.52, 0.573);
      radioGroup.add(speakerGrille);

      // Metallic KESTREL SW-74 Badge Plate on Speaker Grille
      const badgePlate = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.06, 0.015), amberBrassMat);
      badgePlate.position.set(-0.65, 0.30, 0.58);
      radioGroup.add(badgePlate);

      // 3. Upper Illuminated Frequency Dial Scale (3.00 to 12.00 MHz)
      dialCanvas = document.createElement('canvas');
      dialCanvas.width = 1024;
      dialCanvas.height = 256;
      dialCtx = dialCanvas.getContext('2d');
      dialTexture = new THREE.CanvasTexture(dialCanvas);
      drawFrequencyDialCanvas(false);

      const dialHousing = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.34, 0.04), brushedMetalMat);
      dialHousing.position.set(0, 0.99, 0.55);
      radioGroup.add(dialHousing);

      dialBacklightMat = new THREE.MeshStandardMaterial({
        map: dialTexture,
        emissive: new THREE.Color('#F2AE58'),
        emissiveMap: dialTexture,
        emissiveIntensity: 0.08,
        roughness: 0.25
      });
      const dialBackplane = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 0.28), dialBacklightMat);
      dialBackplane.position.set(0, 0.99, 0.572);
      radioGroup.add(dialBackplane);

      // Moving Red/Amber Frequency Pointer Needle (Slides horizontally along scale)
      dialNeedleMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.26, 0.015),
        new THREE.MeshBasicMaterial({ color: '#ff5733' })
      );
      dialNeedleMesh.position.set(-0.84, 0.99, 0.582);
      radioGroup.add(dialNeedleMesh);

      // Protective Glass Cover over Frequency Dial
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.16,
        roughness: 0.08,
        metalness: 0.1,
        reflectivity: 0.9
      });
      const dialGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.98, 0.28), glassMat);
      dialGlass.position.set(0, 0.99, 0.592);
      radioGroup.add(dialGlass);

      // 4. Analog S-Meter (Signal Strength VU Needle Window)
      const vuFrame = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.24, 0.035), brushedMetalMat);
      vuFrame.position.set(0.02, 0.66, 0.555);
      radioGroup.add(vuFrame);

      const vuFaceCanvas = document.createElement('canvas');
      vuFaceCanvas.width = 256;
      vuFaceCanvas.height = 160;
      const vctx = vuFaceCanvas.getContext('2d');
      vctx.fillStyle = '#1b201e';
      vctx.fillRect(0, 0, 256, 160);
      vctx.strokeStyle = '#F2AE58';
      vctx.lineWidth = 3;
      vctx.beginPath();
      vctx.arc(128, 140, 95, Math.PI * 1.18, Math.PI * 1.82);
      vctx.stroke();
      vctx.fillStyle = '#EAE3D2';
      vctx.font = 'bold 18px IBM Plex Mono, monospace';
      vctx.textAlign = 'center';
      vctx.fillText('S-METER dB', 128, 115);

      const vuFaceTex = new THREE.CanvasTexture(vuFaceCanvas);
      const vuPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.34, 0.20),
        new THREE.MeshStandardMaterial({
          map: vuFaceTex,
          emissive: new THREE.Color('#F2AE58'),
          emissiveMap: vuFaceTex,
          emissiveIntensity: 0.35
        })
      );
      vuPlane.position.set(0.02, 0.66, 0.575);
      radioGroup.add(vuPlane);

      vuNeedlePivot = new THREE.Group();
      vuNeedlePivot.position.set(0.02, 0.57, 0.582);
      const vuNeedle = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.16, 0.008),
        new THREE.MeshBasicMaterial({ color: '#F2AE58' })
      );
      vuNeedle.position.y = 0.08;
      vuNeedlePivot.add(vuNeedle);
      vuNeedlePivot.rotation.z = 0.52;
      radioGroup.add(vuNeedlePivot);

      // 5. Integrated CRT Phosphor Waveform Scope on Radio Faceplate
      scopeCanvas = document.createElement('canvas');
      scopeCanvas.width = 256;
      scopeCanvas.height = 140;
      scopeCtx = scopeCanvas.getContext('2d');
      scopeCtx.fillStyle = '#0e1411';
      scopeCtx.fillRect(0, 0, 256, 140);
      scopeTexture = new THREE.CanvasTexture(scopeCanvas);

      const scopeFrame = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.24, 0.035), brushedMetalMat);
      scopeFrame.position.set(0.48, 0.66, 0.555);
      radioGroup.add(scopeFrame);

      scopePlaneMat = new THREE.MeshStandardMaterial({
        map: scopeTexture,
        emissive: new THREE.Color('#9EC6A2'),
        emissiveMap: scopeTexture,
        emissiveIntensity: 0.85,
        roughness: 0.2
      });
      const scopeScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.20), scopePlaneMat);
      scopeScreen.position.set(0.48, 0.66, 0.575);
      radioGroup.add(scopeScreen);

      // 6. Pilot Lamps (POWER Amber Lamp & SIGNAL LOCK Phosphor Lamp) with Bezels
      const bezelGeo = new THREE.CylinderGeometry(0.036, 0.04, 0.02, 16);
      const powerBezel = new THREE.Mesh(bezelGeo, brushedMetalMat);
      powerBezel.rotation.x = Math.PI / 2;
      powerBezel.position.set(-0.08, 0.45, 0.558);
      const lockBezel = new THREE.Mesh(bezelGeo, brushedMetalMat);
      lockBezel.rotation.x = Math.PI / 2;
      lockBezel.position.set(0.14, 0.45, 0.558);
      radioGroup.add(powerBezel, lockBezel);

      pilotLampMat = new THREE.MeshStandardMaterial({
        color: '#3a2814',
        emissive: new THREE.Color('#F2AE58'),
        emissiveIntensity: 0.0,
        roughness: 0.2
      });
      const powerLamp = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 16), pilotLampMat);
      powerLamp.position.set(-0.08, 0.45, 0.568);
      radioGroup.add(powerLamp);

      lockLampMat = new THREE.MeshStandardMaterial({
        color: '#1b3020',
        emissive: new THREE.Color('#9EC6A2'),
        emissiveIntensity: 0.0,
        roughness: 0.2
      });
      const lockLamp = new THREE.Mesh(new THREE.SphereGeometry(0.026, 16, 16), lockLampMat);
      lockLamp.position.set(0.14, 0.45, 0.568);
      radioGroup.add(lockLamp);

      // 7. Interactive Toggle Switch: POWER
      const switchBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.04, 16), brushedMetalMat);
      switchBase.rotation.x = Math.PI / 2;
      switchBase.position.set(-0.08, 0.30, 0.565);
      radioGroup.add(switchBase);

      powerSwitchPivot = new THREE.Group();
      powerSwitchPivot.position.set(-0.08, 0.30, 0.58);
      powerSwitchPivot.rotation.x = 0.45; // Down = OFF

      const switchBat = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.022, 0.11, 16), brushedMetalMat);
      switchBat.position.y = 0.045;
      const switchTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), amberBrassMat);
      switchTip.position.y = 0.10;
      powerSwitchPivot.add(switchBat, switchTip);

      const powerHitBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.24, 0.18),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      powerHitBox.position.set(-0.08, 0.32, 0.60);
      tagInteractableHierarchy(powerHitBox, 'power', 'CÔNG TẮC NGUỒN POWER [NHẤN]');
      tagInteractableHierarchy(powerSwitchPivot, 'power', 'CÔNG TẮC NGUỒN POWER [NHẤN]');
      interactables.push(powerHitBox, powerSwitchPivot);
      radioGroup.add(powerSwitchPivot, powerHitBox);

      // 8. Interactive Volume Knob (Full Group with skirt, cap, ridges, and marker)
      volumeKnobMesh = createKnurledKnob(0.105, 0.09, darkKnurledMat, brushedMetalMat, amberBrassMat, 18);
      volumeKnobMesh.position.set(0.22, 0.31, 0.59);
      tagInteractableHierarchy(volumeKnobMesh, 'volume', 'NÚM ÂM LƯỢNG VOLUME [KÉO XOAY]');
      interactables.push(volumeKnobMesh);
      radioGroup.add(volumeKnobMesh);

      // 9. Hero Interactive Large Main TUNING Knob (Weighted flywheel dial with knurled ridges)
      tuningKnobMesh = createKnurledKnob(0.21, 0.13, darkKnurledMat, brushedMetalMat, amberBrassMat, 28);
      tuningKnobMesh.position.set(0.75, 0.36, 0.61);
      tagInteractableHierarchy(tuningKnobMesh, 'tuning', 'NÚM DÒ TẦN SỐ TUNING [KÉO TRÁI/PHẢI]');
      interactables.push(tuningKnobMesh);
      radioGroup.add(tuningKnobMesh);

      const labels=document.createElement('canvas'); labels.width=512;labels.height=48;
      const labelContext=labels.getContext('2d');labelContext.fillStyle='#b8ab87';labelContext.font='bold 19px monospace';labelContext.textAlign='center';
      for(const [text,x] of [['POWER',-.08],['VOL',.22],['TUNING',.75]]) labelContext.fillText(text,(x+.35)/1.4*512,32);
      const labelPlate=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.07),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(labels),transparent:true}));
      labelPlate.position.set(.35,.16,.59);radioGroup.add(labelPlate);

      // 10. Multi-Segment Telescoping Whip Antenna on Back
      const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.14, 16), brushedMetalMat);
      antennaBase.position.set(-0.92, 1.32, -0.35);
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.7, 12), brushedMetalMat);
      seg1.position.set(-0.86, 1.68, -0.35);
      seg1.rotation.z = -0.18;
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.020, 0.7, 12), brushedMetalMat);
      seg2.position.set(-0.74, 2.32, -0.35);
      seg2.rotation.z = -0.18;
      const segTip = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), amberBrassMat);
      segTip.position.set(-0.68, 2.66, -0.35);
      radioGroup.add(antennaBase, seg1, seg2, segTip);

      scene.add(radioGroup);
      radioGroup.updateWorldMatrix(true,true);
      radioBounds = new THREE.Box3().setFromObject(mainBody);
      for(const mesh of [tuningKnobMesh,volumeKnobMesh,powerHitBox]) radioBounds.union(new THREE.Box3().setFromObject(mesh));
      controlMeshes.power=powerHitBox; controlMeshes.tuning=tuningKnobMesh; controlMeshes.volume=volumeKnobMesh;
      for(const [type, mesh, width] of [['tuning',tuningKnobMesh,.52],['volume',volumeKnobMesh,.28]]) {
        const hit=new THREE.Mesh(new THREE.BoxGeometry(width,type==='volume'?.29:.52,.20),new THREE.MeshBasicMaterial({visible:false}));
        hit.position.copy(mesh.position); hit.position.z+=.04;
        tagInteractableHierarchy(hit,type,type==='tuning'?'TUNING — KÉO ĐỂ DÒ SÓNG':'VOLUME — KÉO ĐỂ CHỈNH ÂM');
        interactables.push(hit); radioGroup.add(hit);
      }
    }

    // Helper: Recursively assign userData so raycaster identifies any child mesh of a Group
    function tagInteractableHierarchy(rootObj, interactType, label) {
      rootObj.userData = { interactType, label };
      rootObj.traverse((child) => {
        child.userData = { interactType, label, rootGroup: rootObj };
      });
    }

    // PHASE 0 CRITICAL FIX: Returns the complete THREE.Group so skirt, cylinder,
    // knurled ridges, frontCap, and brass indicator marker all exist and rotate together!
    function createKnurledKnob(radius, depth, bodyMat, capMat, markerMat, ridgeCount = 24) {
      const group = new THREE.Group();

      // 1. Beveled metallic base skirt
      const skirt = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 1.06, radius * 1.14, depth * 0.36, 32),
        capMat
      );
      skirt.rotation.x = Math.PI / 2;
      skirt.position.z = -depth * 0.32;
      skirt.castShadow = true;
      group.add(skirt);

      // 2. Main cylindrical drum
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, depth, 36),
        bodyMat
      );
      cylinder.rotation.x = Math.PI / 2;
      cylinder.castShadow = true;
      group.add(cylinder);

      // 3. Tactile 3D Knurling Ridges around perimeter
      const ridgeGeo = new THREE.BoxGeometry(radius * 0.06, depth * 0.88, radius * 0.06);
      for (let i = 0; i < ridgeCount; i++) {
        const angle = (i / ridgeCount) * Math.PI * 2;
        const ridge = new THREE.Mesh(ridgeGeo, capMat);
        ridge.rotation.x = Math.PI / 2;
        ridge.rotation.y = angle;
        ridge.position.set(
          Math.cos(angle) * (radius * 0.99),
          Math.sin(angle) * (radius * 0.99),
          0
        );
        group.add(ridge);
      }

      // 4. Brushed metallic front cap
      const frontCap = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.78, radius * 0.78, 0.018, 32),
        capMat
      );
      frontCap.rotation.x = Math.PI / 2;
      frontCap.position.z = depth * 0.51;
      group.add(frontCap);

      // 5. High-contrast Amber Brass indicator marker bar (rotates with group.rotation.z)
      const marker = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.13, radius * 0.58, 0.026),
        markerMat
      );
      marker.position.set(0, radius * 0.44, depth * 0.53);
      group.add(marker);

      return group;
    }

    function drawFrequencyDialCanvas(isPowered) {
      if (!dialCtx) return;
      const w = dialCanvas.width;
      const h = dialCanvas.height;

      dialCtx.fillStyle = isPowered ? '#1c1812' : '#111416';
      dialCtx.fillRect(0, 0, w, h);

      if (isPowered) {
        const grad = dialCtx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, w * 0.55);
        grad.addColorStop(0, 'rgba(242, 174, 88, 0.32)');
        grad.addColorStop(1, 'rgba(20, 16, 12, 0.05)');
        dialCtx.fillStyle = grad;
        dialCtx.fillRect(0, 0, w, h);
      }

      // Scale ticks from 3.0 to 12.0 MHz
      const padX = 76;
      const usableW = w - padX * 2;

      dialCtx.strokeStyle = isPowered ? '#F2AE58' : '#586063';
      dialCtx.fillStyle = isPowered ? '#F2AE58' : '#687074';
      dialCtx.font = 'bold 26px IBM Plex Mono, monospace';
      dialCtx.textAlign = 'center';

      for (let mhz = 30; mhz <= 120; mhz++) {
        const val = mhz / 10;
        const t = (val - 3.0) / 9.0;
        const x = padX + t * usableW;

        const isMajor = mhz % 10 === 0;
        const isHalf = mhz % 5 === 0;
        const tickTop = isMajor ? 45 : (isHalf ? 62 : 76);
        const tickBot = 112;

        dialCtx.lineWidth = isMajor ? 3.5 : (isHalf ? 2 : 1.2);
        dialCtx.beginPath();
        dialCtx.moveTo(x, tickTop);
        dialCtx.lineTo(x, tickBot);
        dialCtx.stroke();

        if (isMajor) {
          dialCtx.fillText(val.toFixed(0), x, 152);
        }
      }

      // Sub-bandPhosphor line
      dialCtx.strokeStyle = isPowered ? '#9EC6A2' : '#3a4640';
      dialCtx.lineWidth = 2;
      dialCtx.beginPath();
      dialCtx.moveTo(padX, 185);
      dialCtx.lineTo(w - padX, 185);
      dialCtx.stroke();

      dialCtx.fillStyle = isPowered ? '#9EC6A2' : '#4d5c53';
      dialCtx.font = '600 18px IBM Plex Mono, monospace';
      dialCtx.textAlign = 'left';
      dialCtx.fillText('KESTREL SW-74 // SHORTWAVE MHz', padX, 222);
      dialCtx.textAlign = 'right';
      dialCtx.fillText('BAND: 3.00 - 12.00 MHz', w - padX, 222);

      dialTexture.needsUpdate = true;
    }

    function buildDustParticles() {
      const count = state.highQuality ? 110 : 35;
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 4.2;
        positions[i * 3 + 1] = 0.2 + Math.random() * 2.4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        color: '#F2AE58',
        size: 0.022,
        transparent: true,
        opacity: 0.38
      });
      dustParticles = new THREE.Points(geo, mat);
      scene.add(dustParticles);
    }

    /*************************************************************************
     * 7. WAVEFORM & SPECTRUM RENDERING (WITH CRT PHOSPHOR PERSISTENCE)
     *************************************************************************/
    const hudWaveCanvas = document.getElementById('hud-wave-canvas');
    const hudWaveCtx = hudWaveCanvas.getContext('2d');
    let lastScopePower=null;

    function updateOscilloscopes(elapsedTime) {
      if (!state.powerOn && lastScopePower===false) return;
      lastScopePower=state.powerOn;
      const waveData = audio.getWaveformData();
      const specData = state.scopeMode === 'spectrum' ? audio.getSpectrumData() : null;

      // 1. Update 3D Radio CRT Screen (with authentic phosphor persistence trail)
      if (scopeCtx) {
        const w = scopeCanvas.width;
        const h = scopeCanvas.height;
        scopeCtx.fillStyle = state.powerOn ? 'rgba(14, 20, 17, 0.30)' : '#0e1411';
        scopeCtx.fillRect(0, 0, w, h);

        // Subtle CRT graticule grid
        scopeCtx.strokeStyle = 'rgba(158, 198, 162, 0.11)';
        scopeCtx.lineWidth = 1;
        for (let x = 0; x < w; x += 32) {
          scopeCtx.beginPath(); scopeCtx.moveTo(x, 0); scopeCtx.lineTo(x, h); scopeCtx.stroke();
        }
        for (let y = 0; y < h; y += 35) {
          scopeCtx.beginPath(); scopeCtx.moveTo(0, y); scopeCtx.lineTo(w, y); scopeCtx.stroke();
        }

        if (state.powerOn && state.warmUpLevel > 0.08) {
          const isDecoded = state.radioState === GAME_STATE.DECODED;
          scopeCtx.strokeStyle = isDecoded ? '#F2AE58' : '#9EC6A2';
          scopeCtx.lineWidth = 2.4;

          if (state.scopeMode === 'spectrum' && specData && !state.muted) {
            const bars = 32;
            const barW = w / bars;
            scopeCtx.fillStyle = isDecoded ? 'rgba(242, 174, 88, 0.75)' : 'rgba(158, 198, 162, 0.75)';
            for (let i = 0; i < bars; i++) {
              const val = (specData[i] / 255) * state.warmUpLevel;
              const barH = Math.max(2, val * (h * 0.85));
              scopeCtx.fillRect(i * barW + 1, h - barH, barW - 2, barH);
            }
          } else {
            scopeCtx.beginPath();
            const len = waveData ? waveData.length : 64;
            for (let i = 0; i < len; i++) {
              const x = (i / (len - 1)) * w;
              let norm = 0;
              if (waveData && !state.muted) {
                norm = ((waveData[i] - 128) / 128) * state.warmUpLevel;
              } else {
                norm = Math.sin(i * 0.35 + elapsedTime * 10) * (0.12 + state.signalStrength * 0.36) * state.warmUpLevel;
              }
              const y = h * 0.5 + norm * (h * 0.42);
              if (i === 0) scopeCtx.moveTo(x, y);
              else scopeCtx.lineTo(x, y);
            }
            scopeCtx.stroke();
          }
        }
        if (scopeTexture) {
          scopeTexture.needsUpdate = true;
        }
      }

      // 2. Update HUD Mini Oscilloscope / Spectrum (with Phosphor Persistence, Graticule & Signal Brightness)
      if (hudWaveCtx) {
        const w = hudWaveCanvas.width;
        const h = hudWaveCanvas.height;
        // Subtle persistence trail instead of hard clear
        hudWaveCtx.fillStyle = state.powerOn ? 'rgba(15, 22, 16, 0.34)' : '#101611';
        hudWaveCtx.fillRect(0, 0, w, h);

        // Engraved CRT graticule crosshairs
        hudWaveCtx.strokeStyle = 'rgba(139, 168, 138, 0.14)';
        hudWaveCtx.lineWidth = 1;
        hudWaveCtx.beginPath();
        hudWaveCtx.moveTo(0, h / 2);
        hudWaveCtx.lineTo(w, h / 2);
        hudWaveCtx.moveTo(w / 2, 0);
        hudWaveCtx.lineTo(w / 2, h);
        hudWaveCtx.stroke();

        if (!state.powerOn) {
          hudWaveCtx.strokeStyle = '#334034';
          hudWaveCtx.lineWidth = 1.2;
          hudWaveCtx.beginPath();
          hudWaveCtx.moveTo(0, h / 2);
          hudWaveCtx.lineTo(w, h / 2);
          hudWaveCtx.stroke();
        } else if (state.scopeMode === 'spectrum' && specData && !state.muted) {
          const bars = 22;
          const barW = w / bars;
          const alpha = 0.55 + state.signalStrength * 0.4;
          hudWaveCtx.fillStyle = `rgba(139, 168, 138, ${alpha.toFixed(2)})`;
          for (let i = 0; i < bars; i++) {
            const val = (specData[i] / 255) * state.warmUpLevel;
            const barH = Math.max(2, val * (h - 4));
            hudWaveCtx.fillRect(i * barW + 1, h - barH, barW - 1.5, barH);
          }
        } else {
          const glowAlpha = 0.62 + state.signalStrength * 0.38;
          hudWaveCtx.strokeStyle = state.radioState === GAME_STATE.DECODED
            ? '#C89049'
            : `rgba(139, 168, 138, ${glowAlpha.toFixed(2)})`;
          hudWaveCtx.lineWidth = 1.6;
          hudWaveCtx.beginPath();
          const len = waveData ? waveData.length : 48;
          for (let i = 0; i < len; i++) {
            const x = (i / (len - 1)) * w;
            let norm = 0;
            if (waveData && !state.muted) {
              norm = ((waveData[i] - 128) / 128) * state.warmUpLevel;
            } else {
              norm = Math.sin(i * 0.4 + elapsedTime * 10) * (0.14 + state.signalStrength * 0.38) * state.warmUpLevel;
            }
            const y = h * 0.5 + norm * (h * 0.42);
            if (i === 0) hudWaveCtx.moveTo(x, y);
            else hudWaveCtx.lineTo(x, y);
          }
          hudWaveCtx.stroke();
        }
      }
    }

    /*************************************************************************
     * 8. CORE INTERACTION: UNIFIED POINTER EVENTS, POINTER CAPTURE & SAFETY
     *************************************************************************/
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const tooltipEl = document.getElementById('hover-tooltip');

    let activeDragType = null; // 'tuning' | 'volume' | null
    let activePointerId = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartValue = 0;
    let lastTickFreq = state.frequency;

    function isAnyOverlayOpen() { return Boolean(overlays?.top()); }

    function resolveInteractType(hitObj) {
      let cur = hitObj;
      while (cur) {
        if (cur.userData && cur.userData.interactType) {
          return { type: cur.userData.interactType, label: cur.userData.label };
        }
        cur = cur.parent;
      }
      return null;
    }

    function onPointerDown(e) {
      if (!webglAvailable || !renderer || !renderer.domElement) return;
      if (isAnyOverlayOpen() || activePointerId !== null || e.button > 0) return;
      if (e.target !== renderer.domElement) return;

      audio.init();
      e.preventDefault();

      const x = e.clientX;
      const y = e.clientY;
      const coords = pointerCoordinates(x,y,renderer.domElement.getBoundingClientRect());
      pointer.set(coords.x,coords.y);

      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactables, true);

      if (hits.length > 0) {
        const info = resolveInteractType(hits[0].object);
        if (!info) return;

        if (info.type === 'power') {
          togglePower();
        } else if (info.type === 'notebook') {
          openJournalDrawer('tab-clues');
        } else if (info.type === 'tuning') {
          activeDragType = 'tuning';
          activePointerId = e.pointerId;
          dragStartX = x;
          dragStartY = y;
          dragStartValue = state.targetFrequency;
          container.style.cursor = 'ew-resize';
          try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) {}
        } else if (info.type === 'volume') {
          activeDragType = 'volume';
          activePointerId = e.pointerId;
          dragStartX = x;
          dragStartY = y;
          dragStartValue = state.volume;
          container.style.cursor = 'ns-resize';
          try { renderer.domElement.setPointerCapture(e.pointerId); } catch (_) {}
        }
      }
    }

    function onPointerMove(e) {
      const x = e.clientX;
      const y = e.clientY;
      if (!renderer?.domElement) return;
      const coords=pointerCoordinates(x,y,renderer.domElement.getBoundingClientRect());
      pointerNorm.set(coords.x,coords.y);
      if (activePointerId !== null && e.pointerId !== activePointerId) return;

      if (activeDragType) {
        if (isAnyOverlayOpen()) { endKnobDrag(); return; }
        e.preventDefault();
        dragStartValue=accumulateDrag(dragStartValue,activeDragType,x-dragStartX,dragStartY-y,e.shiftKey,e.pointerType==='touch');
        if (activeDragType==='tuning') setTargetFrequency(dragStartValue);
        else setMasterVolume(dragStartValue);
        dragStartX=x; dragStartY=y;
        return;
      }

      // Hover tooltip check on desktop pointer
      if (e.pointerType === 'mouse' && webglAvailable && renderer && e.target === renderer.domElement && !isAnyOverlayOpen()) {
        raycaster.setFromCamera(pointerNorm, camera);
        const hits = raycaster.intersectObjects(interactables, true);
        if (hits.length > 0) {
          const info = resolveInteractType(hits[0].object);
          if (info && info.label) {
            tooltipEl.textContent = info.label;
            tooltipEl.style.left = `${Math.min(window.innerWidth - 220, x + 14)}px`;
            tooltipEl.style.top = `${Math.max(12, y - 14)}px`;
            tooltipEl.classList.remove('opacity-0');
            container.style.cursor = 'pointer';
            return;
          }
        }
        tooltipEl.classList.add('opacity-0');
        container.style.cursor = 'grab';
      } else {
        tooltipEl.classList.add('opacity-0');
      }
    }

    function endKnobDrag(event) {
      if (event && !ownsPointer(activePointerId,event)) return;
      if (!activeDragType) return;
      const id=activePointerId; activeDragType=null; activePointerId=null;
      if (renderer?.domElement && id!==null && renderer.domElement.hasPointerCapture(id)) renderer.domElement.releasePointerCapture(id);
      container.style.cursor='grab'; saveProgress();
    }

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove, {passive:false});
    window.addEventListener('pointerup', endKnobDrag);
    window.addEventListener('pointercancel', endKnobDrag);


    /*************************************************************************
     * 9. STATE TRANSITIONS, TUNING INERTIA & 2-SECOND LOCKING LOGIC
     *************************************************************************/
    let activeTranscriptTimer = null;

    function togglePower() {
      if(!clockUpdating){updateMission();if(mission.status==='lost' && !state.powerOn)return;}
      if (mission.trip > 0 && !state.powerOn) return;
      state.powerOn = !state.powerOn;
      audio.playMechanicalClick(state.powerOn ? 280 : 170);

      if (!state.powerOn) {
        state.radioState = GAME_STATE.OFF;
        state.signalStrength = 0;
        state.lockProgress = 0;
        state.activeStation = null;
        if (activeTranscriptTimer) clearInterval(activeTranscriptTimer);
      } else {
        state.radioState = GAME_STATE.IDLE;
      }

      drawFrequencyDialCanvas(state.powerOn);
      audio.updateAudioState();
      updateHUD(undefined,true);
      renderMissionPanel(true);
      saveProgress();
    }

    function setTargetFrequency(newFreq) {
      if(!clockUpdating){updateMission();if(mission.status==='lost')return;}
      const clamped = THREE.MathUtils.clamp(newFreq, 3.00, 12.00);
      state.targetFrequency = Math.round(clamped * 100) / 100;
      state.lastTuneTimestamp = performance.now();
      missionClock.noteInput(mission,readRadioInput());
      const sliderEl = document.getElementById('hud-freq-slider');
      if (sliderEl) sliderEl.value = Math.round(state.targetFrequency * 100);
    }

    function setMasterVolume(val) {
      state.volume = THREE.MathUtils.clamp(val, 0, 1);
      document.getElementById('slider-volume').value = Math.round(state.volume * 100);
      document.getElementById('lbl-vol').textContent = `${Math.round(state.volume * 100)}%`;
      audio.updateAudioState();
      saveProgress();
    }

    function toggleMute() {
      state.muted = !state.muted;
      const btn = document.getElementById('btn-mute-toggle');
      btn.textContent = state.muted ? 'ĐANG TẮT TIẾNG (MUTED)' : 'ĐANG BẬT TIẾNG';
      btn.classList.toggle('active-amber', state.muted);
      audio.updateAudioState();
      saveProgress();
    }

    // V2.2 — genuine observed-frequency memory, not a fabricated global RF spectrum.
    let lastBandMemorySample = 0;
    let lastBandMemorySave = 0;
    let lastBandChartPaint = 0;
    function sampleBandMemory(nowMs) {
      if (!state.powerOn || document.hidden || isAnyOverlayOpen() || nowMs - lastBandMemorySample < 135) return;
      lastBandMemorySample = nowMs;
      const i = THREE.MathUtils.clamp(Math.round((state.frequency - 3.00) * 50), 0, 450);
      const reading = Math.round(state.signalStrength * 100);
      const previous = state.bandMemory[i];
      if (previous === -1 || reading > previous) {
        state.bandMemory[i] = reading;
        if (nowMs - lastBandMemorySave > 4500) {
          lastBandMemorySave = nowMs;
          saveProgress();
        }
      }
      // The chart is only repainted while its journal tab is visible.
      if (!document.getElementById('tab-workbench').classList.contains('hidden') && nowMs - lastBandChartPaint > 145) {
        lastBandChartPaint = nowMs;
        drawBandMemory();
      }
    }

    function drawBandMemory() {
      const canvas = document.getElementById('band-memory-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const L = 50, R = 18, T = 23, B = 37;
      const plotW = W - L - R, plotH = H - T - B;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#0b120d'; ctx.fillRect(0, 0, W, H);
      ctx.font = '12px monospace';
      ctx.lineWidth = 1;
      for (let k = 0; k <= 9; k++) {
        const x = L + (k / 9) * plotW;
        ctx.strokeStyle = '#334637'; ctx.beginPath();ctx.moveTo(x,T);ctx.lineTo(x,H-B);ctx.stroke();
        ctx.fillStyle = '#a99b79';ctx.textAlign = 'center';ctx.fillText((3+k).toFixed(0),x,H-15);
      }
      for (let k = 0; k <= 4; k++) {
        const y = T + (k / 4) * plotH;
        ctx.strokeStyle = '#1c3223';ctx.beginPath();ctx.moveTo(L,y);ctx.lineTo(W-R,y);ctx.stroke();
        ctx.fillStyle = '#859b81';ctx.textAlign = 'right';ctx.fillText(`${100-k*25}`,L-9,y+4);
      }
      ctx.fillStyle = '#b8a884'; ctx.font='12px monospace';ctx.textAlign='left';
      ctx.fillText('S-METER / %',L,T-8);
      ctx.textAlign='right';ctx.fillText('MHz', W-R, H-15);
      // A dark area remains dark until that exact band cell is observed.
      for (let i = 0; i < state.bandMemory.length; i++) {
        const value = state.bandMemory[i];
        if (value < 0) continue;
        const x = L + i / 450 * plotW;
        const h = Math.max(2, value / 100 * plotH);
        ctx.fillStyle = value > 55 ? '#a9b887' : value > 14 ? '#829e80' : '#4a6750';
        ctx.fillRect(x, T + plotH - h, Math.max(1.2, plotW/450), h);
      }
      const markerX = L + THREE.MathUtils.clamp((state.frequency - 3) / 9, 0, 1) * plotW;
      ctx.strokeStyle = '#d6a75f';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(markerX,T);ctx.lineTo(markerX,H-B);ctx.stroke();
      ctx.fillStyle = '#d6a75f';ctx.beginPath();ctx.moveTo(markerX,T);ctx.lineTo(markerX-6,T-8);ctx.lineTo(markerX+6,T-8);ctx.fill();
      const seen = state.bandMemory.reduce((n,v) => n + Number(v >= 0), 0);
      document.getElementById('band-scan-count').textContent = `${seen} / 451 Ô ĐÃ ĐO`;
      document.getElementById('band-selected-frequency').textContent = `VỊ TRÍ KIM: ${state.frequency.toFixed(2)} MHz`;
    }

    function addOperatorEvent(message) {
      const minSinceStart = Math.floor(clock.getElapsedTime() / 60);
      const stampMinutes = 23 * 60 + 42 + minSinceStart;
      const stamp = `${String(Math.floor(stampMinutes / 60) % 24).padStart(2,'0')}:${String(stampMinutes % 60).padStart(2,'0')}`;
      state.operatorEvents.push(`${stamp} // ${message}`);
      if (state.operatorEvents.length > 28) state.operatorEvents.shift();
      renderOperatorEvents();
      saveProgress();
    }

    function renderOperatorEvents() {
      const el = document.getElementById('operator-event-list');
      if (!el) return;
      el.replaceChildren();
      if (!state.operatorEvents.length) {
        el.textContent = 'Chưa có tín hiệu nào được ghi vào nhật ký.';
        return;
      }
      for (const entry of [...state.operatorEvents].reverse().slice(0,10)) {
        const row = document.createElement('div');
        row.className = 'border-b border-[#455043]/40 pb-1.5';
        row.textContent = entry;
        el.appendChild(row);
      }
    }

    function saveOperatorNote() {
      state.operatorNote = document.getElementById('operator-note').value.slice(0, 1600);
      const status = document.getElementById('operator-note-status');
      status.textContent = '✓ ĐÃ LƯU VÀO BĂNG NHỚ CỤC BỘ';
      saveProgress();
    }

    function exportOperatorLog() {
      saveOperatorNote();
      const records = STATIONS.filter(st => state.discoveredIds.includes(st.id));
      const content = [
        'THE LAST FREQUENCY // CHRONOS 1974',
        'OPERATOR FIELD LOG / SIMULATED RECORD',
        '========================================',
        `Tiến độ: ${records.length}/5 trạm`,
        ...records.map(st => `${st.freq.toFixed(2)} MHz | ${st.name} | ${st.clueText}`),
        '', 'GHI CHÚ CÁ NHÂN:', state.operatorNote || '(trống)',
        '', 'NHẬT KÝ THU SÓNG:', ...(state.operatorEvents.length ? state.operatorEvents : ['(trống)']),
        '', 'DỮ LIỆU CƯỜNG ĐỘ ĐÃ ĐO (MHz, S-METER %):',
        ...state.bandMemory.flatMap((v, i) => v < 0 ? [] : [`${(3+i*.02).toFixed(2)}, ${v}`])
      ].join('\n');
      const blob = new Blob(['\uFEFF'+content], {type:'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'CHRONOS_operator_log_1974.txt';
      document.body.appendChild(a); a.click();a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      document.getElementById('operator-note-status').textContent = '✓ ĐÃ TẠO BĂNG NHẬT KÝ .TXT';
    }

    function updateRadioSimulation(dt, nowMs, radioDt=dt) {
      // Smooth tube & CRT warm-up / cool-down curve
      const targetWarm = state.powerOn ? 1.0 : 0.0;
      state.warmUpLevel = smoothApproach(state.warmUpLevel,targetWarm,state.powerOn?3.2:6,radioDt);

      // Animate 3D Power Toggle Switch
      if (powerSwitchPivot) {
        const targetRotX = state.powerOn ? -0.45 : 0.45;
        powerSwitchPivot.rotation.x = THREE.MathUtils.lerp(powerSwitchPivot.rotation.x, targetRotX, dt * 14);
      }

      // Smoothly interpolate frequency with slight analog flywheel inertia
      const freqDiff = state.targetFrequency - state.frequency;
      if (Math.abs(freqDiff) > 0.0002) {
        state.frequency = smoothApproach(state.frequency,state.targetFrequency,14,radioDt);
      } else {
        state.frequency = state.targetFrequency;
      }

      // Play subtle mechanical detent tick every 0.04 MHz
      if (Math.abs(state.frequency - lastTickFreq) >= 0.04) {
        lastTickFreq = state.frequency;
        audio.playTuningTick();
      }

      // Rotate 3D Tuning & Volume Knob Groups (cylinder, skirt, ridges & brass marker rotate together)
      if (tuningKnobMesh) {
        const normFreq = (state.frequency - 3.0) / 9.0;
        tuningKnobMesh.rotation.z = -normFreq * Math.PI * 6;
        if (dialNeedleMesh) {
          dialNeedleMesh.position.x = THREE.MathUtils.lerp(-0.84, 0.84, normFreq);
        }
      }
      if (volumeKnobMesh) {
        volumeKnobMesh.rotation.z = -(state.volume - 0.5) * Math.PI * 1.6;
      }

      if (!state.powerOn) {
        // Spring-damped S-Meter needle return to rest
        const restDiff = 0.52 - vuNeedleAngle;
        vuNeedleVelocity = (vuNeedleVelocity + restDiff * 45 * dt) * Math.pow(0.12, dt);
        vuNeedleAngle += vuNeedleVelocity * dt;
        if (vuNeedlePivot) vuNeedlePivot.rotation.z = vuNeedleAngle;

        if (pilotLampMat) pilotLampMat.emissiveIntensity = state.warmUpLevel * 1.6;
        if (lockLampMat) lockLampMat.emissiveIntensity = 0;
        if (dialBacklightMat) dialBacklightMat.emissiveIntensity = 0.05 + state.warmUpLevel * 0.8;
        if (radioWarmLight) radioWarmLight.intensity = state.warmUpLevel * 2.2;
        if (lockGlowLight) lockGlowLight.intensity = THREE.MathUtils.lerp(lockGlowLight.intensity, 0, dt * 8);
        audio.updateAudioState();
        return;
      }

      // Radio is ON: Calculate signal proximity
      const nearest = getNearestStationInfo(state.frequency);
      const dist = nearest.distance;
      const isActivelyMoving = (nowMs - state.lastTuneTimestamp) < 160 || Math.abs(freqDiff) > 0.005;

      // Gaussian-like bell curve around station frequency
      let rawSignal = 0;
      if (dist < 0.22) {
        rawSignal = Math.exp(-Math.pow(dist / 0.055, 2));
      }
      // Record that the player has sensed this carrier band
      if (rawSignal > 0.45 && nearest.station && !state.sensedIds.includes(nearest.station.id)) {
        state.sensedIds.push(nearest.station.id);
        renderStationChips();
        saveProgress();
      }

      // Subtle ionospheric flutter
      const flutter = (Math.sin(nowMs * 0.008) * 0.025 + (Math.random() - 0.5) * 0.02);
      state.signalStrength = THREE.MathUtils.clamp((rawSignal + flutter * rawSignal) * state.warmUpLevel * antennaGain(mission, CHANNELS.find(c => c.id === nearest.station.id)), 0, 1);
      sampleBandMemory(nowMs);

      // Determine State Machine: IDLE -> TUNING -> LOCKING -> DECODED
      const withinLockWindow = dist <= 0.032 && nearest.station;

      if (withinLockWindow && state.activeStation?.id === nearest.station.id) {
        state.radioState = GAME_STATE.DECODED;
      } else {
        state.activeStation = null;
        state.lockProgress = mission.progress;
        state.radioState = mission.progress > 0 ? GAME_STATE.LOCKING : isActivelyMoving ? GAME_STATE.TUNING : GAME_STATE.IDLE;
      }

      // Update 3D Lamps & Spring-Damped VU Needle
      if (pilotLampMat) pilotLampMat.emissiveIntensity = 1.6 * state.warmUpLevel;
      if (dialBacklightMat) dialBacklightMat.emissiveIntensity = 0.05 + 0.82 * state.warmUpLevel;
      if (radioWarmLight) radioWarmLight.intensity = 2.2 * state.warmUpLevel;

      const lockBlink = state.radioState === GAME_STATE.LOCKING
        ? (0.4 + 0.8 * Math.abs(Math.sin(nowMs * 0.015)))
        : (state.radioState === GAME_STATE.DECODED ? 2.2 : 0.0);
      if (lockLampMat) lockLampMat.emissiveIntensity = lockBlink;
      if (lockGlowLight) lockGlowLight.intensity = THREE.MathUtils.lerp(lockGlowLight.intensity, lockBlink * 0.85, dt * 6);

      if (vuNeedlePivot) {
        const targetAngle = THREE.MathUtils.lerp(0.52, -0.52, state.signalStrength);
        const accel = (targetAngle - vuNeedleAngle) * 68;
        vuNeedleVelocity = (vuNeedleVelocity + accel * dt) * Math.pow(0.06, dt);
        vuNeedleAngle += vuNeedleVelocity * dt;
        vuNeedlePivot.rotation.z = vuNeedleAngle;
      }

      audio.updateAudioState();
      updateHUD(nearest);
    }

    // Play progressive demodulation transcript segments upon locking a station
    function startProgressiveDemodulation(station) {
      if (activeTranscriptTimer) clearInterval(activeTranscriptTimer);
      const txSubEl = document.getElementById('tx-subtitle');
      const segs = station.segments || [station.subtitle];
      let idx = 0;
      txSubEl.textContent = segs[0];
      activeTranscriptTimer = setInterval(() => {
        idx++;
        if (idx < segs.length) {
          txSubEl.textContent = segs.slice(0, idx + 1).join(' ');
        } else {
          clearInterval(activeTranscriptTimer);
        }
      }, 1150);
    }

    function onStationLocked(station) {
      state.radioState = GAME_STATE.DECODED;
      state.activeStation = station;
      state.lockProgress = 2.0;

      const isFinal = station.id === FINAL_STATION.id;
      if(mission.status!=='lost'){audio.playSignalLockedChime(isFinal);startProgressiveDemodulation(station);}

      if (!isFinal && !state.discoveredIds.includes(station.id)) {
        state.discoveredIds.push(station.id);
        addOperatorEvent(`ĐÃ GIẢI ĐIỀU CHẾ: ${station.freq.toFixed(2)} MHz / ${station.name}`);
        renderJournalStations();
        renderStationChips();
        updateDecoderUI();
        saveProgress();
      }

      if (isFinal && !state.gameCompleted) {
        addOperatorEvent('CHRONOS: ĐÃ PHÁT HIỆN TẦN SỐ CUỐI CÙNG');
        state.gameCompleted = true;
        saveProgress();
        showVictoryReport();

      }
    }

    /*************************************************************************
     * 10. UI / HUD UPDATES & DISCOVERY-FIRST JOURNAL / PUZZLE LOGIC
     *************************************************************************/
    const hudFreqEl = document.getElementById('hud-freq');
    const hudCallsignTagEl = document.getElementById('hud-callsign-tag');
    const hudSigPctEl = document.getElementById('hud-sig-pct');
    const hudSigBarEl = document.getElementById('hud-sig-bar');
    const hudSmeterNeedleEl = document.getElementById('hud-smeter-needle');
    const lockContainerEl = document.getElementById('lock-container');
    const hudLockBarEl = document.getElementById('hud-lock-bar');
    const lockTimerTextEl = document.getElementById('lock-timer-text');
    const lockStatusTextEl = document.getElementById('lock-status-text');
    const stateBadgeEl = document.getElementById('state-badge');
    const statusLedEl = document.getElementById('status-led');
    const powerDotEl = document.getElementById('power-dot');
    const btnHudPower = document.getElementById('btn-hud-power');
    const txBannerEl = document.getElementById('transmission-banner');
    const txTitleEl = document.getElementById('tx-station-title');
    const txCodeEl = document.getElementById('tx-station-code');
    const txClueEl = document.getElementById('tx-clue-summary');
    const proximityToastEl = document.getElementById('proximity-toast');
    let hudNeedlePos = 2;

    function updateHUD(nearestInfo,force=false) {
      const now=performance.now();if(!force && now-lastHudPaint<100)return;
      lastHudPaint=now;hudPaints++;
      btnHudPower.setAttribute('aria-pressed', String(state.powerOn));
      writeNodeText(hudFreqEl,state.frequency.toFixed(2));
      const sigPct = Math.round(state.signalStrength * 100);
      writeNodeText(hudSigPctEl,`${sigPct}%`);
      hudSigBarEl.style.width = `${sigPct}%`;

      // Physical HUD S-Meter needle with inertia & subtle static micro-tremor
      if (hudSmeterNeedleEl) {
        const microJitter = (state.powerOn && !state.reducedMotion)
          ? (Math.random() - 0.5) * (1.8 - state.signalStrength * 1.2)
          : 0;
        const targetNeedle = state.powerOn
          ? THREE.MathUtils.clamp(3 + sigPct * 0.92 + microJitter, 2, 97)
          : 2;
        hudNeedlePos = THREE.MathUtils.lerp(hudNeedlePos, targetNeedle, 0.25);
        hudSmeterNeedleEl.style.left = `${hudNeedlePos.toFixed(1)}%`;
      }

      writeNodeText(stateBadgeEl,state.radioState);

      // Jewel Pilot Lamps & Power Switch appearance
      if (!state.powerOn) {
        statusLedEl.className = 'pilot-jewel lamp-off w-3.5 h-3.5 shrink-0';
        powerDotEl.className = 'pilot-jewel lamp-off w-2.5 h-2.5';
        btnHudPower.classList.remove('active-amber');
        writeNodeText(hudCallsignTagEl,'OFFLINE');
        hudCallsignTagEl.className = 'worn-label text-[9px] text-[#72765C]';
        lockContainerEl.classList.add('hidden');
        txBannerEl.classList.add('hidden');
        proximityToastEl.classList.add('opacity-0');
        return;
      }

      btnHudPower.classList.add('active-amber');
      powerDotEl.className = 'pilot-jewel lamp-amber w-2.5 h-2.5';

      if (nearestInfo && nearestInfo.distance < 0.09 && nearestInfo.station) {
        writeNodeText(hudCallsignTagEl,nearestInfo.station.callsign);
        hudCallsignTagEl.className = 'worn-label text-[9px] text-[#8BA88A] border-[#8BA88A]/60';
      } else {
        writeNodeText(hudCallsignTagEl,'STATIC NOISE');
        hudCallsignTagEl.className = 'worn-label text-[9px] text-[#D7C8A5]/70';
      }

      if (state.radioState === GAME_STATE.DECODED) {
        statusLedEl.className = 'pilot-jewel lamp-phosphor w-3.5 h-3.5 shrink-0';
      } else {
        statusLedEl.className = 'pilot-jewel lamp-amber w-3.5 h-3.5 shrink-0';
      }

      // 2-Second Lock Progress Bar
      if (state.radioState === GAME_STATE.LOCKING || state.radioState === GAME_STATE.DECODED) {
        lockContainerEl.classList.remove('hidden');
        const duration = captureDuration(mission, getNearestStationInfo(state.frequency).station.id);
        const pct = state.radioState === GAME_STATE.DECODED ? 100 : Math.min(100, (mission.progress / duration) * 100);
        hudLockBarEl.style.width = `${pct}%`;
        writeNodeText(lockTimerTextEl,`${mission.progress.toFixed(1)}s / ${duration.toFixed(1)}s`);
        writeNodeText(lockStatusTextEl,state.radioState === GAME_STATE.DECODED
          ? 'ĐÃ KHÓA TÍN HIỆU (SIGNAL LOCKED)'
          : 'GIỮ SPACE / THU BẢN TIN...');
      } else {
        lockContainerEl.classList.add('hidden');
      }

      // Transmission Banner when Decoded
      if (state.radioState === GAME_STATE.DECODED && state.activeStation) {
        txBannerEl.classList.remove('hidden');
        writeNodeText(txTitleEl,`${state.activeStation.freq.toFixed(2)} MHz — ${state.activeStation.name}`);
        writeNodeText(txCodeEl,state.activeStation.callsign);
        writeNodeText(txClueEl,`✓ Đã lưu vào Hồ sơ: ${state.activeStation.clueTitle}`);
        proximityToastEl.classList.add('opacity-0');
      } else {
        txBannerEl.classList.add('hidden');
        if (nearestInfo && nearestInfo.distance < 0.14 && nearestInfo.distance > 0.032) {
          proximityToastEl.classList.remove('opacity-0');
        } else {
          proximityToastEl.classList.add('opacity-0');
        }
      }
    }

    // DISCOVERY-FIRST: Stamped Metal & Bakelite Station Preset Tags
    function renderStationChips() {
      const containerEl = document.getElementById('station-chips');
      const count = state.discoveredIds.length;
      document.getElementById('progress-counter').textContent = `${count}/5 TÍN HIỆU`;
      document.getElementById('journal-badge').textContent = `${count}/5`;
      document.getElementById('tab-clue-count').textContent = `${count}/5`;

      containerEl.innerHTML = '';
      STATIONS.forEach((st, idx) => {
        const isFound = state.discoveredIds.includes(st.id);
        const isSensed = state.sensedIds.includes(st.id);
        const btn = document.createElement('button');

        if (isFound) {
          btn.className = 'btn-analog active-phosphor px-2.5 py-1 font-mono-tech text-[11px]';
          btn.textContent = `✓ ${st.freq.toFixed(2)} MHz [${st.id.toUpperCase()}]`;
          btn.title = `${st.name} — Đã ghi nhận (Nhấn để xoay nhanh tới tần số này)`;
          btn.addEventListener('click', () => {
            audio.init();
            if (!state.powerOn) togglePower();
            setTargetFrequency(st.freq);
            saveProgress();
          });
        } else {
          btn.className = 'worn-label hover:border-[#A18B62] px-2.5 py-1 font-mono-tech text-[10px] text-[#D7C8A5]/65 transition';
          if (state.assistMode || isSensed) {
            btn.textContent = `◌ KÊNH #0${idx + 1} (${st.bandHint})`;
            btn.title = `Vùng sóng có tín hiệu (${st.bandHint}) — Hãy tự tinh chỉnh trong vùng này`;
            btn.addEventListener('click', () => {
              audio.init();
              if (!state.powerOn) togglePower();
              const bandStart = Math.max(3.0, Math.floor(st.freq) - 0.15);
              setTargetFrequency(bandStart);
            });
          } else {
            btn.textContent = `◌ KÊNH #0${idx + 1} [CHƯA GHI]`;
            btn.title = 'Tín hiệu chưa định vị — Xoay núm TUNING rà sóng hoặc bật Radar Phụ Trợ trong Hồ sơ';
            btn.addEventListener('click', () => openJournalDrawer('tab-clues'));
          }
        }
        containerEl.appendChild(btn);
      });

      if (state.codeUnlocked) {
        const finalBtn = document.createElement('button');
        finalBtn.className = 'btn-analog active-amber px-3 py-1 font-mono-tech text-[11px] font-bold animate-pulse-slow';
        finalBtn.textContent = state.gameCompleted ? '★ 9.65 MHz [CHRONOS]' : '★ TẦN SỐ CUỐI [ĐÃ MỞ CHỐT]';
        finalBtn.title = state.gameCompleted ? 'Dò tới 9.65 MHz' : 'Tính toán 11.40 - 1.75 MHz và dò tới Tần Số Cuối Cùng!';
        finalBtn.addEventListener('click', () => {
          if (state.gameCompleted) {
            audio.init();
            if (!state.powerOn) togglePower();
            setTargetFrequency(FINAL_STATION.freq);
          } else {
            openJournalDrawer('tab-decoder');
          }
        });
        containerEl.appendChild(finalBtn);
      }
    }

    // Render 1974 Intelligence Signal Log Cards
    function renderJournalStations() {
      const listEl = document.getElementById('journal-stations-list');
      listEl.innerHTML = '';

      STATIONS.forEach((st, idx) => {
        const isFound = state.discoveredIds.includes(st.id);
        const card = document.createElement('div');
        const logNumber = `CR-74/0${idx + 1}`;
        const logTime = `14.11.1974 // 23:${42 + idx * 3} GMT`;

        if (isFound) {
          card.className = 'paper-document p-4 font-typewriter transition';
          card.innerHTML = `
            <div class="flex flex-wrap items-center justify-between border-b border-[#795843]/40 pb-1.5 mb-2 gap-1">
              <div>
                <div class="text-[10px] font-mono-tech text-[#795843] font-bold">
                  PHIẾU THU SÓNG SỐ: ${logNumber} // ${logTime}
                </div>
                <div class="text-xs sm:text-sm font-bold text-[#23211D]">
                  ${st.freq.toFixed(2)} MHz — ${st.name}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span class="ink-stamp">DECODED</span>
                <button data-tune="${st.freq}" class="btn-journal-retune btn-analog px-2 py-1 font-mono-tech text-[10px]">
                  QUAY TỚI ĐÀI ↻
                </button>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between text-[10px] font-mono-tech bg-[#cbb993]/60 px-2 py-1 border border-[#8c7b5b] mb-2">
              <span><strong>CALLSIGN:</strong> ${st.callsign}</span>
              <span><strong>PHÂN LOẠI:</strong> <code>${st.morseDisplay}</code></span>
            </div>

            <p class="text-xs text-[#23211D] italic mb-2.5 leading-relaxed bg-[#e6dcc2]/70 p-2.5 border-l-2 border-[#795843]">
              ${st.subtitle}
            </p>

            <div class="p-2.5 bg-[#d1c097] border border-[#795843]/60 text-xs text-[#23211D] leading-relaxed">
              <div class="text-[10px] font-bold uppercase text-[#795843] mb-0.5">✎ GHI CHÚ BÀN TRỰC (${st.clueTitle}):</div>
              <div>${st.clueText}</div>
            </div>
          `;
        } else {
          const regionLabel = state.assistMode ? st.bandHint : 'CHƯA ĐỊNH VỊ DẢI TẦN';
          card.className = 'paper-document-unlogged p-3.5 font-mono-tech transition';
          card.innerHTML = `
            <div class="flex items-center justify-between border-b border-[#555D55]/50 pb-1.5">
              <span class="text-xs font-bold text-[#D7C8A5]/80">HỒ SƠ TRỐNG #${logNumber} // ${regionLabel}</span>
              <span class="worn-label text-[9px] text-[#C89049]">CHƯA THU NHẬN</span>
            </div>
            <p class="text-[11px] text-[#D7C8A5]/65 mt-2 font-typewriter leading-relaxed">
              ${state.assistMode
                ? `[DỮ LIỆU QUÉT SƠ BỘ]: Phát hiện bức xạ sóng mang yếu trong khoảng ${st.bandHint}. Hãy xoay núm TUNING rà chậm và căn anten rồi giữ SPACE để thu bản tin.`
                : '[BẢN GHI BỊ BỎ TRỐNG]: Chưa có dữ liệu giải điều chế. Hãy xoay núm TUNING rà dọc băng tần 3.00 – 12.00 MHz để bắt tín hiệu.'}
            </p>
          `;
        }
        listEl.appendChild(card);
      });

      listEl.querySelectorAll('.btn-journal-retune').forEach((btn) => {
        btn.addEventListener('click', () => {
          const f = parseFloat(btn.dataset.tune);
          closeJournalDrawer();
          audio.init();
          if (!state.powerOn) togglePower();
          setTargetFrequency(f);
        });
      });
    }

    // Journal Drawer & Tabs Controls
    const journalDrawer = document.getElementById('journal-drawer');
    const journalBackdrop = document.getElementById('journal-backdrop');

    function openJournalDrawer(tabId = 'tab-clues') {
      renderJournalStations();
      updateDecoderUI();
      switchJournalTab(tabId);
      if (tabId === 'tab-workbench') {
        drawBandMemory();
        renderOperatorEvents();
      }
      renderArchive();
      overlays.open('journal');
    }

    function closeJournalDrawer() { overlays.close('journal'); }

    function switchJournalTab(tabId) {
      document.getElementById('tab-clues').classList.toggle('hidden', tabId !== 'tab-clues');
      document.getElementById('tab-decoder').classList.toggle('hidden', tabId !== 'tab-decoder');
      document.getElementById('tab-workbench').classList.toggle('hidden', tabId !== 'tab-workbench');
      if (tabId === 'tab-workbench') { drawBandMemory(); renderOperatorEvents(); }
      document.querySelectorAll('.journal-tab').forEach((btn) => {
        const active = btn.dataset.tab === tabId;
        btn.classList.toggle('border-[#A18B62]', active);
        btn.classList.toggle('bg-[#363b33]', active);
        btn.classList.toggle('text-[#E0D8C1]', active);
        btn.classList.toggle('border-[#454a42]', !active);
        btn.classList.toggle('bg-[#242722]', !active);
        btn.classList.toggle('text-[#D7C8A5]/60', !active);
      });
    }

    function updateDecoderUI() {
      for (let i = 0; i < 4; i++) {
        document.getElementById(`digit-val-${i}`).textContent = state.codeDigits[i];
      }
      const badge = document.getElementById('decoder-lock-badge');
      const finalBox = document.getElementById('final-mission-box');
      const interlockNotice = document.getElementById('decoder-interlock-notice');
      const allFound = state.discoveredIds.length >= 5;

      if (interlockNotice) {
        if (allFound) {
          interlockNotice.className = 'vintage-instrument p-2.5 font-mono-tech text-[11px] text-[#8BA88A] border-[#8BA88A]/50';
          interlockNotice.innerHTML = '✓ <strong>ĐÃ ĐỒNG BỘ 5/5 PHIẾU TÍN HIỆU:</strong> Chốt hãm cơ khí đã mở. Bạn có thể dập chốt xác thực mã Chronos.';
        } else {
          interlockNotice.className = 'vintage-instrument p-2.5 font-mono-tech text-[11px] text-[#D7C8A5]';
          interlockNotice.innerHTML = `🔒 <strong>CHỐT HÃM AN NINH CƠ KHÍ:</strong> Cần thu đủ <strong>5/5 phiếu tín hiệu</strong> (Hiện tại: <strong>${state.discoveredIds.length}/5</strong>) trước khi mở khóa Chronos.`;
        }
      }

      if (state.codeUnlocked) {
        badge.textContent = 'ĐÃ MỞ CHỐT [7429]';
        badge.className = 'worn-label-brass px-2 py-0.5 text-[10px]';
        finalBox.classList.remove('hidden');
      } else {
        badge.textContent = 'CHƯA MỞ KHÓA';
        badge.className = 'worn-label text-[10px] text-[#C89049]';
        finalBox.classList.add('hidden');
      }
    }

    // Verify the 4-digit puzzle answer (7 - 4 - 2 - 9) — Gated by all 5 stations discovered!
    function verifyChronosCode() {
      updateMission();
      if(mission.status!=='playing')return;
      audio.init();
      const entered = state.codeDigits.join('');
      const feedbackEl = document.getElementById('decoder-feedback');

      if (state.discoveredIds.length < 5) {
        audio.playMechanicalClick(120);
        feedbackEl.textContent = `🔒 CHỐT HÃM CHƯA MỞ: Mới thu được ${state.discoveredIds.length}/5 trạm phát sóng. Hãy thu thập đủ 5 phiếu ghi trước!`;
        feedbackEl.className = 'vintage-instrument font-mono-tech text-xs text-center py-2 px-2.5 text-[#e09382] border-[#9E4735]';
        return;
      }

      const result = submitCode(mission, entered);
      if(result==='lost'){handleMissionEvents([{type:'lost',reason:mission.reason}]);return;}
      if (result === 'locked') return;
      if (result === 'correct' || result === 'unlocked') {
        state.codeUnlocked = true;
        audio.playSignalLockedChime(true);
        feedbackEl.textContent = '✓ MÃ ỦY QUYỀN 7429 KHỚP CHỐT! Hãy lấy tần số Helios-4 trừ 1.75 MHz và dò tới Tần Số Cuối Cùng!';
        feedbackEl.className = 'vintage-instrument font-mono-tech text-xs text-center py-2 px-2.5 text-[#8BA88A] border-[#8BA88A]';
        updateDecoderUI();
        renderStationChips();
        saveProgress();
      } else {
        audio.playMechanicalClick(130);
        const sum = state.codeDigits.reduce((a, b) => a + b, 0);
        feedbackEl.textContent = `✗ MÃ ${entered} SAI LỆCH (Tổng 4 bánh số = ${sum}, yêu cầu tổng kiểm tra = 22). −5% pin, −15 giây.`;
        feedbackEl.className = 'vintage-instrument font-mono-tech text-xs text-center py-2 px-2.5 text-[#e09382] border-[#9E4735]';
        saveProgress();
      }
    }

    /*************************************************************************
     * 11. DOM EVENT LISTENERS & MODAL BINDINGS
     *************************************************************************/
    document.getElementById('btn-start-session').addEventListener('click', () => {
      audio.init();
      overlays.close('intro', {restoreFocus:false});
      if (storageSession.legacy) { storageSession.legacy=null; legacyDecision='declined'; document.getElementById('legacy-recovery').hidden=true; }
      if (mission.status === 'briefing') mission = createMission(document.getElementById('difficulty').value);
      if (mission.status === 'won') showVictoryReport();
      else if (mission.status === 'lost') showMissionModal();
      else mission.status = 'playing';
      if (!state.powerOn && ['playing','won'].includes(mission.status)) togglePower();
      updateMission(performance.now());
      saveProgress();

    });

    btnHudPower.addEventListener('click', () => {
      audio.init();
      togglePower();
    });

    // Backup Analog Fine-Tuning Slider
    const hudFreqSlider = document.getElementById('hud-freq-slider');
    if (hudFreqSlider) {
      hudFreqSlider.addEventListener('input', (e) => {
        audio.init();
        const val = parseInt(e.target.value, 10) / 100;
        setTargetFrequency(val);
      });
      hudFreqSlider.addEventListener('change', () => saveProgress());
    }

    // Scope Mode Toggle (Waveform vs Spectrum)
    document.getElementById('btn-toggle-scope-mode').addEventListener('click', (e) => {
      state.scopeMode = state.scopeMode === 'wave' ? 'spectrum' : 'wave';
      e.target.textContent = state.scopeMode === 'wave' ? 'CRT: WAVE' : 'CRT: SPEC';
    });

    // Replay current station demodulation transcript
    document.getElementById('btn-replay-tx').addEventListener('click', () => {
      if (state.activeStation) startProgressiveDemodulation(state.activeStation);
    });

    // Scanner Assist Mode Toggle
    const btnAssistMode = document.getElementById('btn-assist-mode');
    function updateAssistButtonUI() {
      if (!btnAssistMode) return;
      btnAssistMode.textContent = state.assistMode ? 'ĐANG BẬT (HIỆN VÙNG SÓNG)' : 'ĐANG TẮT';
      btnAssistMode.classList.toggle('active-amber', state.assistMode);
    }
    btnAssistMode.addEventListener('click', () => {
      state.assistMode = !state.assistMode;
      updateAssistButtonUI();
      renderStationChips();
      renderJournalStations();
      saveProgress();
    });

    document.querySelectorAll('.btn-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.init();
        const step = parseFloat(btn.dataset.step);
        setTargetFrequency(state.targetFrequency + step);
        saveProgress();
      });
    });

    document.getElementById('btn-workbench').addEventListener('click', () => openJournalDrawer('tab-workbench'));
    const operatorNoteEl = document.getElementById('operator-note');
    let noteDebounce = null;
    operatorNoteEl.addEventListener('input', () => {
      // Keep the latest keystrokes in memory so a sudden pagehide still persists them.
      state.operatorNote = operatorNoteEl.value.slice(0, 1600);
      document.getElementById('operator-note-status').textContent = 'ĐANG GHI...';
      clearTimeout(noteDebounce);
      noteDebounce = setTimeout(saveOperatorNote, 500);
    });
    document.getElementById('btn-save-operator-note').addEventListener('click', () => {
      clearTimeout(noteDebounce); saveOperatorNote(); audio.playMechanicalClick(210);
    });
    document.getElementById('btn-export-operator-log').addEventListener('click', exportOperatorLog);
    document.getElementById('band-memory-canvas').addEventListener('click', (e) => {
      // Allow click-to-tune without revealing the contents of untouched frequencies.
      const canvas = e.currentTarget;
      const bounds = canvas.getBoundingClientRect();
      const px = (e.clientX - bounds.left) / bounds.width * canvas.width;
      const t = THREE.MathUtils.clamp((px - 50) / (canvas.width - 50 - 18), 0, 1);
      const freq = 3 + t * 9;
      closeJournalDrawer();
      audio.init();
      if (!state.powerOn) togglePower();
      setTargetFrequency(freq);
      saveProgress();
    });
    document.getElementById('btn-journal').addEventListener('click', () => openJournalDrawer('tab-clues'));
    document.getElementById('btn-open-journal-inline').addEventListener('click', () => openJournalDrawer('tab-clues'));
    document.getElementById('btn-close-journal').addEventListener('click', closeJournalDrawer);
    journalBackdrop.addEventListener('click', closeJournalDrawer);

    document.querySelectorAll('.journal-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchJournalTab(btn.dataset.tab));
    });

    document.querySelectorAll('.digit-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.init();
        audio.playMechanicalClick(310);
        const idx = parseInt(btn.dataset.digit, 10);
        const dir = parseInt(btn.dataset.dir, 10);
        state.codeDigits[idx] = (state.codeDigits[idx] + dir + 10) % 10;
        updateDecoderUI();
        // Mechanical drum step roll animation
        const digitEl = document.getElementById(`digit-val-${idx}`);
        if (digitEl && !state.reducedMotion) {
          digitEl.classList.remove('drum-anim-up', 'drum-anim-down');
          void digitEl.offsetWidth;
          digitEl.classList.add(dir > 0 ? 'drum-anim-up' : 'drum-anim-down');
        }
        saveProgress();
      });
    });

    document.getElementById('btn-verify-code').addEventListener('click', verifyChronosCode);

    document.getElementById('btn-tune-final-hint').addEventListener('click', () => {
      closeJournalDrawer();
      if (!state.powerOn) togglePower();
    });

    // 3-Tier Progressive Hint System
    const HINT_TIERS = {
      '1': `
        <div class="text-[#F2AE58] font-semibold">CẤP ĐỘ 1 — PHƯƠNG PHÁP TIẾP CẬN:</div>
        <div>• Trước tiên hãy rà dọc dải tần 3.00 – 12.00 MHz để thu thập đủ 5 bản ghi tín hiệu.</div>
        <div>• Mỗi chữ số khóa <code>[D1-D2-D3-D4]</code> không nằm độc lập mà liên kết chéo giữa các trạm. Bạn có thể mở mục <strong>Hướng Dẫn</strong> để tra cứu Bảng Mã Morse Quốc Tế (0–9).</div>
      `,
      '2': `
        <div class="text-[#9EC6A2] font-semibold">CẤP ĐỘ 2 — LIÊN KẾT DỮ KIỆN GIỮA CÁC TRẠM:</div>
        <div>• <strong>D1:</strong> Giải mã chuỗi Morse <code>--...</code> tại Trạm Khí Tượng Borealis (3.20 MHz).</div>
        <div>• <strong>D2:</strong> Lấy số kỹ sư còn thức trên Tàu Orpheus (6.18 MHz: 12 người trừ 9 người ngủ đông) rồi cộng thêm 1 theo quy tắc của Đài ECHO-7 (4.75 MHz).</div>
        <div>• <strong>D3:</strong> Lấy số vệ tinh Helios còn hoạt động tại Trạm K-19 (8.90 MHz: 5 vệ tinh trừ 3 chiếc mất liên lạc).</div>
        <div>• <strong>D4:</strong> Áp dụng công thức <code>(D1 + D3) × Hệ số hiệu chuẩn pha</code> của Vệ tinh Helios-4 (11.40 MHz).</div>
      `,
      '3': `
        <div class="text-[#F2AE58] font-semibold">CẤP ĐỘ 3 — LỜI GIẢI SUY LUẬN CHI TIẾT:</div>
        <div>• <strong>D1 = 7</strong> (Mã Morse <code>--...</code> là chữ số 7).</div>
        <div>• <strong>D2 = 4</strong> (Tàu Orpheus còn 3 kỹ sư thức trực + 1 = 4).</div>
        <div>• <strong>D3 = 2</strong> (Còn 2 vệ tinh Helios-3 và Helios-4 hoạt động).</div>
        <div>• <strong>D4 = 9</strong> (Tính theo <code>(7 + 2) × 1 = 9</code>, tổng 4 số = 22).</div>
        <div>• Sau khi mở khóa bằng mã <strong>7429</strong>, hãy xoay radio tới tần số <code>11.40 - 1.75 = 9.65 MHz</code> và giữ PHÁT SOS 8 giây!</div>
      `
    };

    document.querySelectorAll('.btn-hint-tier').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = btn.dataset.hint;
        const box = document.getElementById('puzzle-hint-box');
        const lbl = document.getElementById('hint-level-indicator');
        box.innerHTML = HINT_TIERS[tier] || '';
        box.classList.remove('hidden');
        lbl.textContent = `ĐANG HIỆN CẤP ĐỘ ${tier}/3`;
        document.querySelectorAll('.btn-hint-tier').forEach(b => b.classList.toggle('active-amber', b === btn));
      });
    });

    // Settings Modal
    const settingsModal = document.getElementById('settings-modal');
    function closeSettingsModal() {
      overlays.close('settings');
    }
    document.getElementById('btn-sound').addEventListener('click', () => {
      overlays.open('settings');
    });
    document.getElementById('btn-close-settings').addEventListener('click', closeSettingsModal);

    document.getElementById('slider-volume').addEventListener('input', (e) => {
      audio.init();
      setMasterVolume(parseInt(e.target.value, 10) / 100);
    });

    document.getElementById('btn-mute-toggle').addEventListener('click', () => {
      audio.init();
      toggleMute();
    });

    document.getElementById('btn-reduced-motion').addEventListener('click', (e) => {
      state.reducedMotion = !state.reducedMotion;
      e.target.textContent = state.reducedMotion ? 'BẬT (ON)' : 'TẮT';
      e.target.classList.toggle('active-amber', state.reducedMotion);
      saveProgress();
    });

    document.getElementById('btn-quality-toggle').addEventListener('click', (e) => {
      state.highQuality = !state.highQuality;
      e.target.textContent = state.highQuality ? 'CAO (HIGH)' : 'TIẾT KIỆM (LOW)';
      e.target.classList.toggle('active-amber', state.highQuality);
      if (renderer) {
        renderer.shadowMap.enabled=state.highQuality;
        resizeRadioStage();
      }
      saveProgress();
    });

    function resetAllProgress() {
      overlays.clear();
      overlays.open('intro');
      holdingCapture = false;
      if (activeTranscriptTimer) clearInterval(activeTranscriptTimer);
      mission = createMission(document.getElementById('difficulty').value);
      state.powerOn = false;
      state.radioState = GAME_STATE.OFF;
      state.warmUpLevel = 0;
      state.signalStrength = 0;
      overlays.close('mission');

      document.getElementById('difficulty').disabled = false;
      document.getElementById('btn-start-session').textContent = 'NHẬN CA TRỰC →';
      document.getElementById('resume-notice').textContent = '';
      document.getElementById('mission-feedback').textContent = 'Ca trực mới. Dò 3.20 MHz, anten 35° để nhận BOREALIS.';
      document.getElementById('antenna').value = 90;
      closeJournalDrawer();
      closeHelpModal();
      state.discoveredIds = [];
      state.sensedIds = [];
      state.operatorNote = '';
      state.operatorEvents = [];
      state.bandMemory = Array(451).fill(-1);
      operatorNoteEl.value = '';
      document.getElementById('operator-note-status').textContent = 'CHƯA GHI CHÉP';
      renderOperatorEvents();
      drawBandMemory();
      state.codeDigits = [0, 0, 0, 0];
      state.codeUnlocked = false;
      state.gameCompleted = false;
      state.dawnProgress = 0.0;
      state.targetFrequency = 3.00;
      state.frequency = 3.00;
      state.activeStation = null;
      state.lockProgress = 0;
      if (hudFreqSlider) hudFreqSlider.value = 300;
      renderStationChips();
      renderJournalStations();
      updateDecoderUI();
      updateHUD();
      closeSettingsModal();
      overlays.close('victory');
      drawFrequencyDialCanvas(false);
      saveProgress();
      renderMissionPanel();
    }

    document.getElementById('btn-reset-progress').addEventListener('click', resetAllProgress);
    document.getElementById('btn-replay-reset').addEventListener('click', resetAllProgress);
    document.getElementById('btn-continue-freeplay').addEventListener('click', () => {
      overlays.close('victory');
      audio.init();
    });

    // Help Modal
    const helpModal = document.getElementById('help-modal');
    function closeHelpModal() {
      overlays.close('help');
    }
    document.getElementById('btn-help').addEventListener('click', () => {
      overlays.open('help');
    });
    document.getElementById('btn-close-help').addEventListener('click', closeHelpModal);

    function resizeRadioStage(immediate = false) {
      if (!renderer || !camera) return;
      const rect=container.getBoundingClientRect();
      if (rect.width<1 || rect.height<1) return;
      renderer.setPixelRatio(radioPixelRatio(rect.width,rect.height,window.devicePixelRatio,state.highQuality));
      renderer.setSize(rect.width,rect.height);
      camera.aspect=rect.width/rect.height;
      if (radioBounds) {
        frameTarget=frameRadio(radioBounds,camera.aspect);
        camera.fov=frameTarget.fov;
        if(immediate) camera.position.copy(frameTarget.position);
      }
      camera.updateProjectionMatrix();
    }
    new ResizeObserver(()=>{ releaseAllInput(); resizeRadioStage(); }).observe(container);

    /*************************************************************************
     * 12. MAIN RENDER & SIMULATION LOOP (SINGLE RAF LOOP)
     *************************************************************************/
    let rainFrameCounter = 0;
    const nightColor=new THREE.Color('#547899'), dawnColor=new THREE.Color('#f2b66d');

    function animate() {
      requestAnimationFrame(animate);
      const frameDelta=clock.getDelta();
      const dt = Math.min(0.1,frameDelta);
      const elapsed = clock.elapsedTime;
      const nowMs = performance.now();

      const blocked = isAnyOverlayOpen() || document.hidden;
      if (blocked && holdingCapture) releaseCapture();
      updateRadioSimulation(dt,nowMs,Math.min(frameDelta,STALL_THRESHOLD));
      updateMission(nowMs);
      renderMissionPanel();
      if (mission.status === 'playing' && !blocked && nowMs-lastMissionSave > 1000) { saveProgress(); lastMissionSave = nowMs; }
      updateOscilloscopes(elapsed);

      // Update 1974 Analog Desk Clock hands (starts at 23:42 and advances smoothly)
      if (clockMinuteHand && clockHourHand) {
        const totalMinutes = 23 * 60 + 42 + elapsed / 60;
        const minAngle = -((totalMinutes % 60) / 60) * Math.PI * 2;
        const hrAngle = -(((totalMinutes / 60) % 12) / 12) * Math.PI * 2;
        clockMinuteHand.rotation.z = minAngle;
        clockHourHand.rotation.z = hrAngle;
      }

      // Dawn transition when Chronos 9.65 MHz ending is completed
      if (state.gameCompleted && state.dawnProgress < 1.0) {
        state.dawnProgress = Math.min(1.0, state.dawnProgress + dt * 0.18);
        if (moonDirLight) {
          moonDirLight.color.lerpColors(nightColor, dawnColor, state.dawnProgress);
          moonDirLight.intensity = 0.85 + state.dawnProgress * 0.9;
        }
        if (hemiLight) {
          hemiLight.intensity = 0.45 + state.dawnProgress * 0.45;
        }
      }

      // Occasional distant lightning flash during storm (when not Reduced Motion and before Dawn)
      if (!state.reducedMotion && state.dawnProgress < 0.3) {
        if (elapsed > nextLightningTime) {
          lightningFlashIntensity = 1.0;
          nextLightningTime = elapsed + 16 + Math.random() * 24;
          audio.playDistantThunder();
        }
      }
      if (lightningFlashIntensity > 0.001) {
        lightningFlashIntensity = Math.max(0, lightningFlashIntensity - dt * 3.2);
        if (moonDirLight && state.dawnProgress < 0.3) {
          moonDirLight.intensity = 0.85 + lightningFlashIntensity * 2.4;
        }
      }

      // Update rainy window canvas at 30fps for smooth performance
      rainFrameCounter++;
      if (rainFrameCounter % 2 === 0) {
        updateRainWindowTexture();
      }

      // Gently drift dust motes in the warm desk lamp beam
      if (dustParticles && !state.reducedMotion) {
        dustParticles.rotation.y = elapsed * 0.018;
        dustParticles.position.y = Math.sin(elapsed * 0.4) * 0.04;
      }

      if (camera && frameTarget && webglAvailable) {
        const alpha=state.reducedMotion?1:1-Math.exp(-dt*9);
        camera.position.lerp(frameTarget.position,alpha);
        camera.lookAt(frameTarget.center);
      }

      if (webglAvailable && renderer && scene && camera) {
        renderer.render(scene, camera); renderFrames++;
      }
    }

    // Persist the final few signal samples when leaving the tab.
    window.addEventListener('pagehide', () => {updateMission(performance.now(),false);saveProgress(true);});

    // Boot Application
    window.addEventListener('DOMContentLoaded', () => {
      loadProgress();
      overlays.open('intro');
      initializeMissionUI();
      operatorNoteEl.value = state.operatorNote;
      renderOperatorEvents();
      drawBandMemory();
      initThreeScene();
      setMasterVolume(state.volume);
      if (hudFreqSlider) hudFreqSlider.value = Math.round(state.frequency * 100);
      updateAssistButtonUI();
      const motionBtn = document.getElementById('btn-reduced-motion');
      motionBtn.textContent = state.reducedMotion ? 'BẬT (ON)' : 'TẮT';
      motionBtn.classList.toggle('active-amber', state.reducedMotion);
      const qualityBtn = document.getElementById('btn-quality-toggle');
      qualityBtn.textContent = state.highQuality ? 'CAO (HIGH)' : 'TIẾT KIỆM (LOW)';
      qualityBtn.classList.toggle('active-amber', state.highQuality);
      const muteBtn = document.getElementById('btn-mute-toggle');
      muteBtn.textContent = state.muted ? 'ĐANG TẮT TIẾNG (MUTED)' : 'ĐANG BẬT TIẾNG';
      muteBtn.classList.toggle('active-amber', state.muted);
      renderStationChips();
      renderJournalStations();
      updateDecoderUI();
      updateHUD();
      animate();
    });

// NIGHT SHIFT — player input, mission UI and integration with the original radio.
function feedback(message) {
  document.getElementById('mission-feedback').textContent = message;
}
function initializeMissionUI() {
  document.getElementById('difficulty').value = mission.difficulty;
  document.getElementById('difficulty').disabled = mission.status !== 'briefing';
  document.getElementById('antenna').value = mission.antenna;
  if (mission.status !== 'briefing') {
    document.getElementById('btn-start-session').textContent = mission.status === 'paused' ? 'TIẾP TỤC CA TRỰC →' : 'XEM BÁO CÁO CA TRỰC →';
    document.getElementById('resume-notice').textContent = `Băng lưu: ${mission.collected.length}/5 bản tin. Đồng hồ dừng khi bạn rời game.`;
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) state.reducedMotion = true;
  renderMissionPanel();
}
function readRadioInput() {
  const nearest=getNearestStationInfo(state.frequency);
  return {powerOn:state.powerOn,holding:holdingCapture,stationId:nearest.station?.id,distance:nearest.distance,
    frequency:state.frequency,targetFrequency:state.targetFrequency,signal:state.signalStrength,warmUpLevel:state.warmUpLevel};
}
function updateMission(now=performance.now(),active=!isAnyOverlayOpen()&&!document.hidden) {
  if(clockUpdating)return;
  clockUpdating=true;
  try {
    const result=missionClock.advance(mission,now,active,readRadioInput());
    handleMissionEvents(result.events);
    if(result.stall && mission.status==='playing'){
      feedback('Gián đoạn khung hình: đã tính thời gian và tài nguyên chờ; không ghi tín hiệu trong khoảng gián đoạn.');
    }
  }finally{clockUpdating=false;}
}
function handleMissionEvents(events) {
  for (const event of events) {
    if (event.type === 'captured' || event.type === 'won') {
      releaseCapture();
      onStationLocked([...STATIONS, FINAL_STATION].find(s => s.id === event.id));
      feedback(event.type === 'won' ? 'ĐÃ PHÁT SOS. MẠNG LƯỚI ĐƯỢC KHÔI PHỤC.' : `Đã lưu ${CHANNELS.find(c => c.id === event.id).label}. +7% pin. Mở hồ sơ để đọc dữ kiện.`);
    } else if (event.type === 'overheat') {
      releaseCapture();
      if (state.powerOn) togglePower();
      feedback('QUÁ NHIỆT! Cầu chì ngắt 8 giây. −8% pin. Dùng bình làm mát hoặc chờ máy nguội.');
      addOperatorEvent('QUÁ NHIỆT: cầu chì bảo vệ đã ngắt');
    } else if (event.type === 'lost') {
      releaseCapture();
      overlays.clear();
      if (state.powerOn) togglePower();
      showMissionModal();
    } else if (event.type === 'interrupted') feedback('Bản ghi mất đồng bộ. Căn lại sóng và anten trước khi giữ THU.');
  }
  if (events.length) saveProgress(events.some(event=>event.type==='lost'||event.type==='won'));
}
function renderMissionPanel(force=false) {
  const now=performance.now();if(!force && now-lastTelemetryPaint<100)return;
  lastTelemetryPaint=now;telemetryPaints++;
  const d = DIFFICULTIES[mission.difficulty];
  const remaining = Math.max(0,Math.ceil(d.duration-mission.elapsed));
  writeText('mission-time',`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`);
  writeText('mission-score',String(mission.score).padStart(5,'0'));
  writeText('mobile-log-count',`${mission.collected.length}/5`);
  writeText('mission-combo',mission.combo > 1 ? `CHUỖI ${mission.combo} · +${Math.min(5,mission.combo-1)*200}` : `${mission.collected.length}/5 BẢN TIN`);
  writeText('battery-value',`${Math.ceil(mission.battery)}%`);
  document.getElementById('battery-meter').value = mission.battery;
  writeText('heat-value',`${Math.round(mission.heat)}°C`);
  document.getElementById('heat-meter').value = mission.heat;
  document.getElementById('mission-panel').classList.toggle('resource-danger',mission.battery<20 || mission.heat>80);
  writeText('antenna-value',`${String(Math.round(mission.antenna)).padStart(3,'0')}°`);
  writeText('coolant-count',`${mission.coolant} BÌNH · −45°C`);
  writeText('mission-difficulty',d.label.toUpperCase());
  const storm = stormAt(mission);
  const stormEl = document.getElementById('storm-status');
  stormEl.className = `storm-strip${storm.active ? ' danger' : storm.warning ? ' warning' : ''}`;
  writeNodeText(stormEl, mission.trip>0 ? `CẦU CHÌ NGẮT · CÒN ${Math.ceil(mission.trip)}S` : storm.active ? '⚡ BÃO TỪ · TRÔI SÓNG / NHIỆT TĂNG' : storm.warning ? `⚠ BÃO TỪ SAU ${Math.ceil(storm.next)} GIÂY` : `KHÍ QUYỂN ỔN ĐỊNH · BÃO SAU ${Math.ceil(storm.next)}S`);
  const phase = document.getElementById('mission-phase');
  const objective = document.getElementById('mission-objective');
  if (mission.status === 'won') {
    writeNodeText(phase,'04 / BÌNH MINH'); writeNodeText(objective,'SOS được xác nhận. Mạng lưới đã phục hồi. Bạn có thể khám phá radio hoặc nhận ca mới.');
  } else if (mission.unlocked) {
    writeNodeText(phase,'03 / PHÁT TÍN HIỆU CUỐI'); writeNodeText(objective,'Lấy tần số HELIOS-4 trừ 1.75 MHz. Anten 80°. Giữ PHÁT SOS đủ 8 giây.');
  } else if (mission.collected.length===5) {
    writeNodeText(phase,'02 / GIẢI KHÓA CHRONOS'); writeNodeText(objective,'Đủ 5 bản tin. Mở HỒ SƠ & KHÓA SỐ, đối chiếu dữ kiện để tìm mã 4 số. Sai mã: −5% pin / −15 giây.');
  } else {
    writeNodeText(phase,`01 / THU THẬP · ${mission.collected.length}/5`);
    const next = CHANNELS.find(c => !mission.collected.includes(c.id));
    writeNodeText(objective,`Mục tiêu: ${next.label}, vùng ${(next.freq-.1).toFixed(1)}–${(next.freq+.1).toFixed(1)} MHz. Anten khoảng ${next.bearing}°. Thu các trạm theo thứ tự bất kỳ.`);
  }
  const nextTarget=CHANNELS.find(c=>!mission.collected.includes(c.id));
  writeText('mobile-objective-label',mission.unlocked?'CHRONOS · ANTEN 80°':mission.collected.length===5?'ĐỦ 5 BẢN TIN · MỞ KHÓA SỐ':`${nextTarget.label} · ${(nextTarget.freq-.1).toFixed(1)}–${(nextTarget.freq+.1).toFixed(1)} MHz · ${nextTarget.bearing}°`);
  const reception=evaluateReception(mission,readRadioInput());
  const channel=reception.targetStation;
  const duration=reception.captureDuration || 1;
  const pct=Math.min(100,Math.round(mission.progress/duration*100));
  writeText('capture-value',`${pct}%`);
  const fill=document.getElementById('capture-fill');if(fill.style.width!==`${pct}%`)fill.style.width=`${pct}%`;
  writeText('capture-status',receptionText(reception));
  const btn=document.getElementById('btn-capture');
  btn.disabled=['terminal','inactive','trip','off','locked','collected','invalid'].includes(reception.reason);
  btn.classList.toggle('receiving',holdingCapture);
  const captureLabel = channel?.id === 'chronos_final' ? '◉ GIỮ ĐỂ PHÁT SOS <kbd>SPACE</kbd>' : '● GIỮ ĐỂ THU BẢN TIN <kbd>SPACE</kbd>';
  if (btn.innerHTML !== captureLabel) btn.innerHTML = captureLabel;
  document.getElementById('btn-scan').disabled = mission.status !== 'playing' || mission.scanCooldown>0 || mission.battery<=3 || mission.trip>0;
  const scanButton = document.getElementById('btn-scan');
  const scanLabel = `QUÉT SÓNG <kbd>R</kbd><small>${mission.scanCooldown>0 ? `NẠP LẠI ${Math.ceil(mission.scanCooldown)}S` : '−3% PIN'}</small>`;
  if (scanButton.innerHTML !== scanLabel) scanButton.innerHTML = scanLabel;
  document.getElementById('btn-coolant').disabled = mission.status !== 'playing' || mission.coolant<=0;
}
function missionSummary() {
  return `ĐIỂM: ${mission.score} · ${DIFFICULTIES[mission.difficulty].label}\nBản tin: ${mission.collected.length}/5 · Pin: ${Math.ceil(mission.battery)}%\nThời gian: ${Math.floor(mission.elapsed/60)}p ${Math.floor(mission.elapsed%60)}s\nQuá nhiệt: ${mission.overheats} · Sai mã: ${mission.mistakes}`;
}
function showMissionModal() {
  const lost = mission.status === 'lost';

  document.getElementById('mission-modal-title').textContent = lost ? 'Tín hiệu đã tắt.' : 'Ca trực tạm dừng.';
  document.getElementById('mission-modal-text').textContent = lost ? (mission.reason==='battery' ? 'Ắc quy cạn kiệt. Trạm 07 không còn đủ năng lượng để giữ liên lạc.' : 'Cửa sổ liên lạc đã khép lại. Bão từ nuốt chửng tín hiệu cuối cùng.') : 'Đồng hồ, pin và nhiệt đã dừng. Ca trực được lưu trên trình duyệt này.';
  document.getElementById('mission-summary').innerText = missionSummary();
  document.getElementById('btn-resume').hidden = lost;
  overlays.open('mission');
  (lost ? document.getElementById('btn-new-shift') : document.getElementById('btn-resume')).focus();
}
function pauseMission() {
  if (mission.status !== 'playing') return;
  updateMission(performance.now(),false);
  if(mission.status!=='playing')return;
  releaseAllInput(); mission.status='paused'; saveProgress(); showMissionModal(); audio.updateAudioState();
}
function resumeMission() {
  if (mission.status !== 'paused') return;
  mission.status='playing'; overlays.close('mission');
  audio.init(); audio.updateAudioState(); saveProgress();
}
function showVictoryReport() {
  let best=mission.score;
  try { const key=`tlf_best_${mission.difficulty}`; best=Math.max(Number(localStorage.getItem(key))||0,mission.score); localStorage.setItem(key,String(best)); } catch {}
  document.getElementById('victory-score').innerText = `${missionSummary()}\nKỶ LỤC ĐỘ KHÓ NÀY: ${best}`;
  overlays.open('victory');
}
function runScan() {
  updateMission();
  if (!state.powerOn || isAnyOverlayOpen()) { feedback('Bật PWR trước khi quét sóng.'); return; }
  const channel=scan(mission);
  if (!channel) return;
  state.sensedIds = [...new Set([...state.sensedIds,channel.id])];
  // A sweep gives a useful coarse reading; the operator must still tune and align.
  setTargetFrequency(Math.max(3,channel.freq-0.07));
  feedback(`QUÉT: ${channel.label} / ${channel.freq.toFixed(1)} MHz ±0.1 / anten ${channel.bearing}°. −3% pin.`);
  renderStationChips(); audio.playMechanicalClick(400); saveProgress();
}
function coolMachine() {
  updateMission();
  if (isAnyOverlayOpen() || !useCoolant(mission)) return;
  feedback('Đã thay bình làm mát: −45°C.'); audio.playMechanicalClick(180); saveProgress();
}
const captureButton=document.getElementById('btn-capture');
captureButton.addEventListener('pointerdown',e=>{
  if (captureButton.disabled || isAnyOverlayOpen() || mission.status!=='playing' || capturePointerId!==null) return;
  updateMission();if(mission.status!=='playing')return;
  e.preventDefault(); capturePointerId=e.pointerId; captureButton.setPointerCapture(e.pointerId); refreshCaptureHold();missionClock.noteInput(mission,readRadioInput());audio.init();
});
function refreshCaptureHold(){holdingCapture=keyboardCaptureHeld || capturePointerId!==null;captureButton.classList.toggle('receiving',holdingCapture);}
function releaseCapture(event) {
  if(event && !ownsPointer(capturePointerId,event))return;
  if(holdingCapture && !clockUpdating)updateMission();
  if(!event)keyboardCaptureHeld=false;
  const id=capturePointerId; capturePointerId=null;
  if(id!==null && captureButton.hasPointerCapture(id)) captureButton.releasePointerCapture(id);
  refreshCaptureHold();missionClock.noteInput(mission,readRadioInput());
}
function releaseAllInput() { releaseCapture(); endKnobDrag(); }
captureButton.addEventListener('lostpointercapture', releaseCapture);
window.addEventListener('pointerup',releaseCapture);
window.addEventListener('pointercancel',releaseCapture);
document.getElementById('btn-scan').addEventListener('click',runScan);
document.getElementById('btn-coolant').addEventListener('click',coolMachine);
document.getElementById('btn-pause').addEventListener('click',pauseMission);
document.getElementById('btn-resume').addEventListener('click',resumeMission);
document.getElementById('btn-new-shift').addEventListener('click',resetAllProgress);
document.getElementById('antenna').addEventListener('input',e=>{ mission.antenna=Number(e.target.value); });
document.getElementById('antenna').addEventListener('change',saveProgress);

setupMobileLayout({
  releaseCapture: releaseAllInput,
  pause: pauseMission,
  openJournal: openJournalDrawer,
  openSettings: () => document.getElementById('btn-sound').click(),
  openHelp: () => document.getElementById('btn-help').click()
});

const definition = (id, initialFocus) => ({ element:document.getElementById(id), initialFocus,
  show(){this.element.hidden=false;this.element.classList.remove('hidden','opacity-0','pointer-events-none');this.element.classList.add('flex');},
  hide(){this.element.hidden=true;this.element.classList.add('hidden');this.element.classList.remove('flex');} });
const journalDefinition = { element:journalDrawer, backdrop:journalBackdrop, initialFocus:'#btn-close-journal',
  show(){ journalDrawer.hidden=false; journalBackdrop.classList.remove('hidden','opacity-0'); journalDrawer.classList.remove('translate-y-full','sm:translate-x-full'); },
  hide(){ journalDrawer.hidden=true; journalBackdrop.classList.add('hidden','opacity-0'); journalDrawer.classList.add('translate-y-full','sm:translate-x-full'); } };
overlays=createOverlayManager({intro:definition('intro-overlay'),journal:journalDefinition,settings:definition('settings-modal','#btn-close-settings'),
  help:definition('help-modal','#btn-close-help'),victory:definition('victory-modal','#btn-continue-freeplay'),mission:definition('mission-modal')},
  ()=>{ releaseAllInput();updateMission();audio.updateAudioState();renderMissionPanel(true); });
setupInputManager({overlays,
  escape(){ const action=escapeAction(overlays.stack(),mission.status);
    if(action.type==='close') overlays.close(action.id);
    else if(action.type==='pause') pauseMission(); else if(action.type==='resume') resumeMission(); },
  actions:{ power(){audio.init();togglePower();},mute:toggleMute,journal:()=>openJournalDrawer(),workbench:()=>openJournalDrawer('tab-workbench'),scan:runScan,coolant:coolMachine,
    capture(){updateMission();if(!captureButton.disabled && mission.status==='playing'){keyboardCaptureHeld=true;refreshCaptureHold();missionClock.noteInput(mission,readRadioInput());}},
    left(e){setTargetFrequency(state.targetFrequency-(e.shiftKey?.01:.03));saveProgress();},
    right(e){setTargetFrequency(state.targetFrequency+(e.shiftKey?.01:.03));saveProgress();} },
  release:releaseAllInput,
  releaseKeyboard(){updateMission();keyboardCaptureHeld=false;refreshCaptureHold();missionClock.noteInput(mission,readRadioInput());},
  blur(){if(!isAnyOverlayOpen())pauseMission();},
  visibility(hidden){if(hidden){pauseMission();saveProgress(true);audio.ctx?.suspend().catch(()=>{});}
    else if(state.powerOn && !isAnyOverlayOpen())audio.ctx?.resume().catch(()=>{});}
});
function renderArchive() {
  const section=document.getElementById('legacy-archive'); section.hidden=!archive;
  if(!archive)return;
  document.getElementById('archive-notes').textContent=archive.operatorNote || '(Không có ghi chú cũ)';
  document.getElementById('archive-stations').textContent=archive.discoveredIds.map(id=>STATIONS.find(s=>s.id===id).subtitle).join('\n\n') || '(Chưa có bản tin cũ)';
}
document.getElementById('btn-import-legacy').addEventListener('click',()=>{
  const result=importLegacySave(storageAccess());
  if(!result.ok){document.getElementById('storage-notice').textContent=result.error;return;}
  applySave(result.save); storageSession.legacy=null;
  document.getElementById('legacy-recovery').hidden=true;
  document.getElementById('storage-notice').textContent='Đã khôi phục hồ sơ vào Archive. Ca Night Shift mới bắt đầu với tài nguyên mặc định.';
  operatorNoteEl.value=state.operatorNote; initializeMissionUI(); renderArchive(); renderJournalStations(); renderStationChips(); drawBandMemory();
  setMasterVolume(state.volume);document.getElementById('hud-freq-slider').value=Math.round(state.frequency*100);
  const quality=document.getElementById('btn-quality-toggle');quality.textContent=state.highQuality?'CAO (HIGH)':'TIẾT KIỆM (LOW)';quality.classList.toggle('active-amber',state.highQuality);
  const motion=document.getElementById('btn-reduced-motion');motion.textContent=state.reducedMotion?'BẬT (ON)':'TẮT';motion.classList.toggle('active-amber',state.reducedMotion);
  const mute=document.getElementById('btn-mute-toggle');mute.textContent=state.muted?'ĐANG TẮT TIẾNG (MUTED)':'ĐANG BẬT TIẾNG';mute.classList.toggle('active-amber',state.muted);
  if(renderer){renderer.shadowMap.enabled=state.highQuality;resizeRadioStage();}

});
document.getElementById('btn-decline-legacy').addEventListener('click',()=>{
  storageSession.legacy=null;legacyDecision='declined';document.getElementById('legacy-recovery').hidden=true;saveProgress(true);
});
// Read-only diagnostics for integration tests and development tools, never a second state source.
export function getRadioDiagnostics() {
  const rect=renderer?.domElement?.getBoundingClientRect();
  const controls={};
  if(camera && rect) for(const [id,mesh] of Object.entries(controlMeshes)){
    const v=mesh.getWorldPosition(new THREE.Vector3());v.z+=.06;v.project(camera);
    controls[id]={x:rect.left+(v.x+1)*rect.width/2,y:rect.top+(1-v.y)*rect.height/2};
  }
  return {webgl:webglAvailable,controls,highQuality:state.highQuality,pixelRatio:renderer?.getPixelRatio(),shadows:renderer?.shadowMap.enabled,frequency:state.frequency,targetFrequency:state.targetFrequency,volume:state.volume,powerOn:state.powerOn,
    missionStatus:mission.status,missionElapsed:mission.elapsed,battery:mission.battery,heat:mission.heat,progress:mission.progress,reason:mission.reason,holdingCapture,capturePointerId,keyboardCaptureHeld,activePointerId,drag:activeDragType,reception:evaluateReception(mission,readRadioInput()),telemetryPaints,hudPaints,knobRotation:tuningKnobMesh?.rotation.z,volumeRotation:volumeKnobMesh?.rotation.z,
    powerRotation:powerSwitchPivot?.rotation.x,audioState:audio.ctx?.state,audioTime:audio.ctx?.currentTime,
    audioGain:audio.masterGain?.gain.value,rainGain:audio.rainGain?.gain.value,audioInitialized:audio.initialized,schedulerActive:Boolean(audio.schedulerTimer),renderFrames,
    scopeVersion:scopeTexture?.version,textures:renderer?.info.memory.textures,geometries:renderer?.info.memory.geometries,overlay:overlays.top()};
}

if (import.meta.env.DEV) Object.defineProperty(window,'__radioDiagnostics',{value:getRadioDiagnostics,configurable:true});

function writeNodeText(node,value){if(node.textContent!==String(value))node.textContent=String(value);}
function writeText(id,value){writeNodeText(document.getElementById(id),value);}
