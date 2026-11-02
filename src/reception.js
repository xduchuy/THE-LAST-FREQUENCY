export { evaluateReception } from './mission.js';
export function receptionText(reception) {
  const messages={terminal:'CA TRỰC ĐÃ KẾT THÚC',inactive:'CA TRỰC ĐANG DỪNG',trip:'CHỜ CẦU CHÌ PHỤC HỒI',off:'BẬT PWR ĐỂ THU · ĐANG SẠC PIN',locked:'CHRONOS CHƯA MỞ KHÓA',collected:'BẢN TIN ĐÃ LƯU · DÒ TRẠM TIẾP',invalid:'DỮ LIỆU MÁY THU CHƯA HỢP LỆ',warming:'ĐANG LÀM NÓNG ĐÈN · CHỜ ỔN ĐỊNH',tuning:'TẦN SỐ ĐANG TRƯỢT · CHỜ ỔN ĐỊNH',search:'DÒ SÓNG VỀ VÙNG NHIỆM VỤ',antenna:'CĂN ANTEN / TINH CHỈNH ±0.01 MHz'};
  return reception.canCapture?`TÍN HIỆU TỐT · GIỮ THU ${reception.captureDuration}S`:messages[reception.reason];
}
