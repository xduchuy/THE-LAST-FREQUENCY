import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY, LEGACY_KEY, LEGACY_BACKUP_KEY, readGameSave, importLegacySave, migrateLegacy, validateCurrent, writeGameSave } from '../src/storage.js';
import { createMission } from '../src/mission.js';
class MemoryStorage {
 constructor(entries={}){this.values=new Map(Object.entries(entries));this.fail=false;}
 getItem(k){return this.values.get(k)??null;}
 setItem(k,v){if(this.fail)throw Error('quota');this.values.set(k,v);}
}
const legacy={operatorNote:'Ghi chú V2.2', discoveredIds:['borealis','echo7','fake','borealis'],sensedIds:['k19'],bandMemory:[[0,2],[10,89]],volume:.4,muted:true,frequency:6.18,gameCompleted:true,codeUnlocked:true};
test('verified V2.2 migration preserves compatible fields but grants no Night Shift progress',()=>{
 const s=migrateLegacy(legacy);assert.equal(s.operatorNote,legacy.operatorNote);assert.equal(s.volume,.4);assert.equal(s.frequency,6.18);
 assert.deepEqual(s.archive.discoveredIds,['borealis','echo7']);assert.deepEqual(s.bandMemory,legacy.bandMemory);
 assert.deepEqual(s.mission,createMission());assert.equal(s.mission.unlocked,false);assert.equal(s.mission.score,0);assert.deepEqual(s.mission.collected,[]);
});
test('valid V3 wins over legacy; imports are idempotent and leave original bytes untouched',()=>{
 const storage=new MemoryStorage({[LEGACY_KEY]:JSON.stringify(legacy)});
 assert.ok(readGameSave(storage).legacy);
 const first=importLegacySave(storage);assert.equal(first.ok,true);const raw=storage.getItem(STORAGE_KEY);
 assert.equal(importLegacySave(storage).existing,true);assert.equal(storage.getItem(STORAGE_KEY),raw);
 assert.equal(storage.getItem(LEGACY_KEY),JSON.stringify(legacy));assert.equal(storage.getItem(LEGACY_BACKUP_KEY),JSON.stringify(legacy));
 assert.equal(readGameSave(storage).legacy,null);
});
test('migration write failure does not mark completion or delete legacy; retry succeeds',()=>{
 const storage=new MemoryStorage({[LEGACY_KEY]:JSON.stringify(legacy)});storage.fail=true;
 assert.equal(importLegacySave(storage).ok,false);assert.equal(storage.getItem(STORAGE_KEY),null);assert.ok(readGameSave(storage).legacy);
 storage.fail=false;assert.equal(importLegacySave(storage).ok,true);
});
test('corrupt JSON is backed up before recovery; unknown versions are protected from writes',()=>{
 const storage=new MemoryStorage({[STORAGE_KEY]:'{bad'});const read=readGameSave(storage);
 assert.equal(read.save,null);assert.equal(read.writable,true);assert.equal(storage.getItem(`${STORAGE_KEY}_recovery_backup`),'{bad');
 const unknown=new MemoryStorage({[STORAGE_KEY]:JSON.stringify({schemaVersion:99})});assert.equal(readGameSave(unknown).writable,false);
 assert.equal(readGameSave(null).save,null);assert.equal(writeGameSave(null,{}).ok,false);
});
test('validation bounds arrays, rejects invalid digits and nonfinite or out-of-range frequency',()=>{
 const save=validateCurrent({mission:createMission(),operatorNote:'x'.repeat(3000),operatorEvents:Array(100).fill('log'),frequency:Infinity,
  bandMemory:[[0,50],[0,60],[-1,50],[451,3],[1,Infinity],[2,-1]],codeDigits:[1.5,9,Infinity,-1],archive:{discoveredIds:['fake','k19','k19']}});
 assert.equal(save.operatorNote.length,1600);assert.equal(save.operatorEvents.length,28);assert.equal(save.frequency,3);
 assert.deepEqual(save.bandMemory,[[0,60]]);assert.deepEqual(save.codeDigits,[0,9,0,0]);assert.deepEqual(save.archive.discoveredIds,['k19']);
 assert.equal(validateCurrent({mission:{version:9,difficulty:'operator'}}),null);assert.equal(migrateLegacy(null),null);
 assert.equal(validateCurrent({mission:{version:3,difficulty:'toString'}}),null);
});

test('current-save write failure after backup still leaves migration retryable',()=>{
 const storage=new MemoryStorage({[LEGACY_KEY]:JSON.stringify(legacy)});
 const write=storage.setItem.bind(storage);storage.setItem=(key,value)=>{if(key===STORAGE_KEY)throw Error('quota on current');write(key,value);};
 assert.equal(importLegacySave(storage).ok,false);assert.equal(storage.getItem(STORAGE_KEY),null);assert.ok(storage.getItem(LEGACY_BACKUP_KEY));assert.ok(readGameSave(storage).legacy);
});
