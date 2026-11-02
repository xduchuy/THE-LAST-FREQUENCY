import { CHANNELS, DIFFICULTIES, createMission, restoreMission } from './mission.js';
export const STORAGE_KEY = 'the_last_frequency_save_v3';
export const LEGACY_KEY = 'the_last_frequency_save_v1'; // Verified against the supplied V2.2 HTML.
export const LEGACY_BACKUP_KEY = `${LEGACY_KEY}_backup_v31`;
const ids = CHANNELS.slice(0,5).map(c=>c.id);
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const number = (value, fallback, lo, hi) => Number.isFinite(value) ? Math.max(lo, Math.min(hi,value)) : fallback;
const stations = value => [...new Set((Array.isArray(value) ? value.slice(0,32) : []).filter(id=>ids.includes(id)))];
export function compatibleFields(data = {}) {
  const band = new Map();
  for (const pair of Array.isArray(data.bandMemory) ? data.bandMemory.slice(0,451) : []) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const [i,v] = pair;
    if (Number.isInteger(i) && i>=0 && i<=450 && Number.isFinite(v) && v>=0 && v<=100) band.set(i, Math.round(v));
  }
  const result = {
    operatorNote: typeof data.operatorNote === 'string' ? data.operatorNote.slice(0,1600) : '',
    operatorEvents: (Array.isArray(data.operatorEvents) ? data.operatorEvents.slice(-28) : []).filter(v=>typeof v==='string').map(v=>v.slice(0,300)),
    bandMemory: [...band], sensedIds: stations(data.sensedIds),
    codeDigits: Array.isArray(data.codeDigits) && data.codeDigits.length===4 ? data.codeDigits.map(v=>Number.isInteger(v)&&v>=0&&v<=9 ? v : 0) : [0,0,0,0],
    volume: number(data.volume,.8,0,1), frequency: Number.isFinite(data.frequency)&&data.frequency>=3&&data.frequency<=12 ? data.frequency : 3
  };
  for (const key of ['muted','reducedMotion','highQuality','assistMode']) if(typeof data[key]==='boolean') result[key]=data[key];
  return result;
}
export function validateCurrent(data) {
  if (!object(data) || (data.schemaVersion !== undefined && data.schemaVersion !== 31)) return null;
  if (!object(data.mission) || data.mission.version !== 3 || !Object.hasOwn(DIFFICULTIES,data.mission.difficulty)) return null;
  const archive = object(data.archive) ? { ...compatibleFields(data.archive), discoveredIds:stations(data.archive.discoveredIds), source:LEGACY_KEY } : null;
  return { ...compatibleFields(data), schemaVersion:31, mission:restoreMission(data.mission), archive,
    legacyDecision: ['imported','declined'].includes(data.legacyDecision) ? data.legacyDecision : null };
}
export function migrateLegacy(data) {
  if (!object(data) || !['operatorNote','discoveredIds','bandMemory','volume','frequency'].some(k=>Object.hasOwn(data,k))) return null;
  if (Object.hasOwn(data,'mission') || Object.hasOwn(data,'schemaVersion')) return null;
  const common = compatibleFields(data);
  return { ...common, codeDigits:[0,0,0,0], sensedIds:[], mission:createMission(), schemaVersion:31,
    archive:{...common, discoveredIds:stations(data.discoveredIds), source:LEGACY_KEY}, legacyDecision:'imported' };
}
function parse(raw) {
  if (typeof raw !== 'string' || raw.length > 512_000) throw new Error('Bản lưu quá lớn hoặc không hợp lệ.');
  return JSON.parse(raw);
}
export function readGameSave(storage) {
  let current;
  try {
    current = storage.getItem(STORAGE_KEY);
    if (current !== null) {
      const save = validateCurrent(parse(current));
      if (!save) return { save:null, legacy:null, writable:false, error:'Phiên bản lưu chưa được hỗ trợ. Bản gốc được giữ nguyên.' };
      return { save, legacy:null, writable:true, error:null };
    }
    const raw = storage.getItem(LEGACY_KEY);
    return { save:null, legacy:raw === null ? null : migrateLegacy(parse(raw)), writable:true, error:null };
  } catch {
    let writable = current == null;
    if (current != null) {
      try { storage.setItem(`${STORAGE_KEY}_recovery_backup`,current); writable=true; } catch { writable=false; }
    }
    return { save:null, legacy:null, writable, error:'Không đọc được bản lưu. Dữ liệu gốc được giữ hoặc sao lưu; ca mới vẫn chơi được.' };
  }
}
export function writeGameSave(storage, save) {
  try { storage.setItem(STORAGE_KEY,JSON.stringify({...save,schemaVersion:31})); return {ok:true}; }
  catch { return {ok:false,error:'Không thể lưu trên thiết bị này. Kiểm tra quyền lưu trữ hoặc dung lượng.'}; }
}
export function importLegacySave(storage) {
  try {
    const current=storage.getItem(STORAGE_KEY);
    if (current!==null) {
      const valid=validateCurrent(parse(current));
      if(valid) return {ok:true,save:valid,existing:true};
      return {ok:false,error:'Bản lưu hiện tại chưa tương thích và được giữ nguyên.'};
    }
    const raw=storage.getItem(LEGACY_KEY), save=migrateLegacy(parse(raw));
    if (!save) throw new Error('Không nhận diện hồ sơ cũ.');
    if (storage.getItem(LEGACY_BACKUP_KEY)===null) storage.setItem(LEGACY_BACKUP_KEY,raw);
    const result=writeGameSave(storage,save);
    return result.ok ? {ok:true,save} : result;
  } catch { return {ok:false,error:'Khôi phục chưa thành công. Hồ sơ cũ vẫn được giữ nguyên.'}; }
}
