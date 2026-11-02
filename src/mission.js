/** Pure gameplay rules: seconds, MHz, degrees. Rendering and audio live in main.js. */
export const DIFFICULTIES = {
  cadet: { label: 'Tân binh', duration: 1080, drain: 0.055, capture: 3.5, drift: 0.004, threshold: 0.55 },
  operator: { label: 'Điện báo viên', duration: 720, drain: 0.085, capture: 4.5, drift: 0.012, threshold: 0.68 },
  veteran: { label: 'Cựu binh', duration: 540, drain: 0.115, capture: 6, drift: 0.02, threshold: 0.76 }
};
export const CHANNELS = [
  { id: 'borealis', freq: 3.20, bearing: 35, label: 'BOREALIS' },
  { id: 'echo7', freq: 4.75, bearing: 110, label: 'ECHO-7' },
  { id: 'orpheus', freq: 6.18, bearing: 65, label: 'ORPHEUS' },
  { id: 'k19', freq: 8.90, bearing: 145, label: 'K-19' },
  { id: 'helios4', freq: 11.40, bearing: 95, label: 'HELIOS-4' },
  { id: 'chronos_final', freq: 9.65, bearing: 80, label: 'CHRONOS' }
];
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export function createMission(difficulty = 'operator') {
  if (!Object.hasOwn(DIFFICULTIES,difficulty)) difficulty = 'operator';
  return { version: 3, difficulty, status: 'briefing', elapsed: 0, battery: 100, heat: 12,
    antenna: 90, coolant: 3, score: 0, combo: 0, collected: [], unlocked: false,
    progress: 0, captureId: null, scanCooldown: 0, trip: 0, overheats: 0,
    interruptions: 0, reason: '', lastCaptureAt: null, scans: 0, mistakes: 0 };
}
export function restoreMission(saved) {
  if (!saved || saved.version !== 3 || !Object.hasOwn(DIFFICULTIES,saved.difficulty)) return createMission();
  const m = createMission(saved.difficulty);
  const limits = { elapsed: [0, DIFFICULTIES[m.difficulty].duration], battery: [0,100], heat: [0,100], antenna: [0,180], coolant: [0,3], score: [0,100000], combo: [0,6], scanCooldown: [0,18], trip: [0,8], overheats: [0,1000], interruptions: [0,10000], scans: [0,10000], mistakes: [0,10000] };
  for (const [key,[lo,hi]] of Object.entries(limits)) {
    if (Number.isFinite(saved[key])) m[key] = clamp(saved[key],lo,hi);
  }
  m.collected = [...new Set((Array.isArray(saved.collected) ? saved.collected.slice(0,32) : []).filter(id => CHANNELS.slice(0,5).some(c => c.id === id)))];
  for (const key of ['coolant','combo','score','overheats','interruptions','scans','mistakes']) m[key]=Math.floor(m[key]);
  m.unlocked = saved.unlocked === true && m.collected.length === 5;
  m.status = saved.status === 'won' && m.unlocked && m.battery>0 && m.elapsed<DIFFICULTIES[m.difficulty].duration ? 'won' : saved.status === 'lost' ? 'lost' : saved.status === 'briefing' ? 'briefing' : 'paused';
  m.reason = m.status === 'lost' ? (m.battery <= 0 ? 'battery' : 'timeout') : '';
  m.lastCaptureAt = Number.isFinite(saved.lastCaptureAt) ? clamp(saved.lastCaptureAt,0,m.elapsed) : null;
  if(m.status!=='won' && terminalReason(m)) endMission(m);
  return m;
}
export function stormAt(m) {
  const phase = m.elapsed % 90;
  return { active: phase >= 60 && phase < 78, warning: phase >= 50 && phase < 60, next: phase < 60 ? 60-phase : 150-phase };
}
export function carrierFrequency(m, channel) {
  const d = DIFFICULTIES[m.difficulty].drift;
  return channel.freq + Math.sin(m.elapsed * 0.38 + channel.bearing) * d * (stormAt(m).active ? 1.4 : 1);
}
export function antennaGain(m, channel) {
  return Math.exp(-Math.pow((m.antenna-channel.bearing)/55,2));
}
export function captureDuration(m, id) {
  return id === 'chronos_final' ? 8 : DIFFICULTIES[m.difficulty].capture;
}
export const SIMULATION_STEP = .05;
export const MAX_CAPTURE_GAP = 2; // Longer gaps have no continuous reception evidence.
export function terminalReason(m) {
  if(m.battery<=0) return 'battery';
  if(m.elapsed>=DIFFICULTIES[m.difficulty].duration-1e-9) return 'timeout';
  return null;
}
export function endMission(m) {
  const reason=terminalReason(m);
  if(!reason || m.status==='won' || m.status==='lost') return false;
  m.status='lost';m.reason=reason;m.progress=0;m.captureId=null;return true;
}
export function tickMission(m, dt, input = {}) {
  if(m.status!=='playing' || !Number.isFinite(dt) || dt<=0) return [];
  if(endMission(m)) return [{type:'lost',reason:m.reason}];
  const events=[];
  // At most one mission duration, with a finite upper bound (21,601 steps).
  let remaining=Math.min(dt,DIFFICULTIES[m.difficulty].duration-m.elapsed+SIMULATION_STEP);
  if(!input || typeof input!=='object')input={};
  const safeInput=dt>MAX_CAPTURE_GAP?{...input,holding:false,captureAllowed:false}:input;
  while(remaining>1e-9 && m.status==='playing'){
    const step=Math.min(SIMULATION_STEP,remaining);
    events.push(...stepMission(m,step,safeInput));remaining-=step;
  }
  return events;
}
function stepMission(m,dt,input) {
  const events = [];
  m.elapsed += dt;
  m.scanCooldown = Math.max(0,m.scanCooldown-dt);
  m.trip = Math.max(0,m.trip-dt);
  const powered = input.powerOn===true && m.trip <= 0;
  const storm = stormAt(m).active;
  m.battery = clamp(m.battery + dt * (powered ? -(DIFFICULTIES[m.difficulty].drain + (input.holding ? 0.35 : 0) + (storm ? 0.05 : 0)) : 0.16),0,100);
  m.heat = clamp(m.heat + dt * (powered && input.holding ? (storm ? 8 : 6) : powered ? -0.65 : -3.5),0,100);
  if (m.heat >= 100) {
    m.trip = 8; m.heat = 72; m.battery = Math.max(0,m.battery-8); m.overheats++;
    m.combo = 0; events.push({type:'overheat'});
  }
  if (endMission(m)) return [...events,{type:'lost',reason:m.reason}];
  const reception=evaluateReception(m,input);
  const ch=reception.targetStation;
  const receiving=input.holding===true && input.captureAllowed!==false && reception.canCapture;
  if (receiving) {
    if (m.captureId !== ch.id) { m.captureId = ch.id; m.progress = 0; }
    m.progress += dt;
    if (m.progress >= captureDuration(m,ch.id)-1e-9) {
      m.progress = 0;
      m.combo = m.lastCaptureAt !== null && m.elapsed-m.lastCaptureAt < 90 ? m.combo+1 : 1;
      m.lastCaptureAt = m.elapsed;
      m.score += 1000 + Math.min(5,m.combo-1)*200;
      if (ch.id === 'chronos_final') {
        m.status = 'won';
        m.score += Math.round((DIFFICULTIES[m.difficulty].duration-m.elapsed)*10 + m.battery*20);
        events.push({type:'won',id:ch.id});
      } else {
        m.collected.push(ch.id); m.battery = Math.min(100,m.battery+7);
        events.push({type:'captured',id:ch.id});
      }
    }
  } else if (m.progress > 0) {
    m.progress = Math.max(0,m.progress-dt*1.8);
    if (m.progress === 0) { m.interruptions++; m.combo=0; events.push({type:'interrupted'}); }
  }
  return events;
}
export function useCoolant(m) {
  if (m.status !== 'playing' || endMission(m) || m.coolant <= 0) return false;
  m.coolant--; m.heat=Math.max(0,m.heat-45); return true;
}
export function scan(m) {
  if (m.status !== 'playing' || endMission(m) || m.scanCooldown > 0 || m.battery <= 3 || m.trip > 0) return null;
  const target = CHANNELS.find(c => !m.collected.includes(c.id) && (c.id !== 'chronos_final' || m.unlocked));
  if (!target) return null;
  m.battery-=3; m.scanCooldown=18; m.scans++;
  return target;
}
export function submitCode(m, code) {
  if (m.status !== 'playing') return 'locked';
  if (endMission(m)) return 'lost';
  if (m.collected.length < 5) return 'locked';
  if (m.unlocked) return 'unlocked';
  if(typeof code!=='string' || !/^\d{4}$/.test(code)) return 'invalid';
  if (code === '7429') { m.unlocked = true; m.score+=1500; return 'correct'; }
  m.battery = Math.max(0,m.battery-5); m.elapsed=Math.min(DIFFICULTIES[m.difficulty].duration,m.elapsed+15); m.combo=0; m.mistakes++;
  return endMission(m)?'lost':'wrong';
}

export function evaluateReception(m, radio = {}) {
  if(!radio || typeof radio!=='object')radio={};
  const targetStation = CHANNELS.find(c=>c.id===radio.stationId) || null;
  const result = reason => ({canCapture:reason==='ready', status:reason==='ready'?'ready':'blocked', reason,
    targetStation, captureDuration:targetStation?captureDuration(m,targetStation.id):0});
  if (m.status!=='playing') return result(m.status==='won'||m.status==='lost'?'terminal':'inactive');
  if (m.trip>0) return result('trip');
  if (radio.powerOn!==true) return result('off');
  if (!targetStation) return result('search');
  if (targetStation.id==='chronos_final' && !m.unlocked) return result('locked');
  if (m.collected.includes(targetStation.id)) return result('collected');
  if (![radio.frequency,radio.targetFrequency,radio.distance,radio.signal,radio.warmUpLevel].every(Number.isFinite) || radio.distance<0 || radio.signal<0 || radio.signal>1 || radio.warmUpLevel<0 || radio.warmUpLevel>1) return result('invalid');
  if (radio.warmUpLevel<=.85) return result('warming');
  if (radio.stable===false || Math.abs(radio.targetFrequency-radio.frequency)>=.005) return result('tuning');
  if (radio.distance>.032) return result('search');
  if (radio.signal<DIFFICULTIES[m.difficulty].threshold) return result('antenna');
  return result('ready');
}
