// API 기본 URL 설정
// 배포 후 VITE_API_URL 환경변수를 실제 백엔드 URL로 설정하세요
// 예: https://coffee-shop-backend-xxxx.onrender.com
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  MENU: `${API_BASE_URL}/api/menu`,
  ORDERS: `${API_BASE_URL}/api/orders`,
  HEALTH: `${API_BASE_URL}/api/health`
};

export default API_BASE_URL; 