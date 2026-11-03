// Presentation only. Mission/reception remain the sole source of gameplay truth.
export function contextualMessage({mission, reception, storm, holding, frequency, signal, tuning, nearby, notice}) {
  if(mission.status!=='playing')return {text:'',tone:'quiet'};
  if(mission.trip>0)return {text:'CẦU CHÌ NGẮT · MỞ MENU ĐỂ LÀM MÁT',tone:'danger'};
  if(mission.battery<20)return {text:'PIN YẾU · TẮT NGUỒN ĐỂ SẠC',tone:'danger'};
  if(mission.heat>80)return {text:'NHIỆT CAO · MỞ MENU ĐỂ LÀM MÁT',tone:'danger'};
  if(holding && reception.canCapture)return {text:'ĐANG THU · GIỮ ĐỀU TAY',tone:'signal'};
  if(notice)return {text:notice,tone:'notice'};
  if(storm.active)return {text:'BÃO TỪ · SÓNG ĐANG TRÔI',tone:'warning'};
  if(storm.warning)return {text:'BÃO TỪ ĐANG ĐẾN',tone:'warning'};
  if(tuning)return {text:`${frequency.toFixed(2)} MHz · SIGNAL ${Math.round(signal*100)}%`,tone:'quiet'};
  if(reception.canCapture)return {text:'ĐÃ KHÓA TÍN HIỆU · GIỮ THU',tone:'signal'};
  if(reception.reason==='collected' && nearby)return {text:'BẢN TIN ĐÃ LƯU',tone:'quiet'};
  if(reception.reason==='off')return {text:'NGUỒN TẮT · ĐANG SẠC PIN',tone:'quiet'};
  if(reception.reason==='warming')return {text:'ĐANG LÀM NÓNG ĐÈN',tone:'quiet'};
  if(reception.reason==='antenna')return {text:'SÓNG MANG LÂN CẬN · CĂN ANTEN',tone:'quiet'};
  if(reception.reason==='locked' && nearby)return {text:'CHRONOS · CẦN GIẢI KHÓA TRONG HỒ SƠ',tone:'quiet'};
  if(nearby)return {text:'SÓNG MANG LÂN CẬN',tone:'quiet'};
  return {text:'',tone:'quiet'};
}
export function createMinimalUI(doc=document,now=()=>performance.now()) {
  let notice='',until=0;
  const write=(id,text)=>{const node=doc.getElementById(id);if(node.textContent!==text)node.textContent=text;};
  return {
    notify(text){notice=text;until=now()+3500;},
    render(data){
      const result=contextualMessage({...data,notice:now()<until?notice:''});
      const node=doc.getElementById('context-readout');
      if(result.text)write('context-readout',result.text);node.style.opacity=result.text?'1':'0';node.dataset.tone=result.tone;node.setAttribute('aria-hidden',String(!result.text));
      // Tuning telemetry is visual; avoid announcing every frequency step.
      node.setAttribute('aria-live',data.tuning?'off':'polite');
      doc.getElementById('essential-status').classList.toggle('resource-danger',data.mission.battery<20||data.mission.heat>80);
      doc.getElementById('mobile-recording').classList.toggle('is-recording',data.mission.progress>0||data.holding);
      write('fallback-frequency',`${data.frequency.toFixed(2)} MHz`);
      write('fallback-signal',`SIGNAL ${Math.round(data.signal*100)}%`);
    }
  };
}
