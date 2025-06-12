import { useState, useEffect } from 'react'
import './AdminView.css'
import { API_ENDPOINTS } from '../config/api'

const AdminView = ({ orders, onUpdateOrderStatus }) => {
  const [filter, setFilter] = useState('all') // 'all', 'pending', 'preparing', 'completed'
  const [menuStock, setMenuStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 백엔드에서 메뉴 재고 정보 가져오기
  const fetchMenuStock = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_ENDPOINTS.MENU}?includeUnavailable=true`)
      const data = await response.json()
      
      if (data.success) {
        // 디버깅: API 응답 로그
        console.log('📋 관리자 화면 - API 응답:', data);
        console.log('📦 메뉴 데이터:', data.data);
        
        // 백엔드 데이터를 관리자 화면 형식으로 변환
        const stockData = data.data.map(item => {
          console.log(`🔍 ${item.name}: stock=${item.stock}, max_stock=${item.max_stock}`);
          return {
            id: item.id,
            name: item.name,
            stock: item.stock || 0,
            maxStock: item.max_stock || 50,
            minStock: 5, // 최소 재고 기준
            soldOut: item.soldOut || false
          };
        });
        
        console.log('📊 변환된 재고 데이터:', stockData);
        setMenuStock(stockData)
        setError(null)
      } else {
        setError('재고 정보를 불러오는데 실패했습니다.')
      }
    } catch (err) {
      console.error('재고 정보 로딩 오류:', err)
      setError('서버에 연결할 수 없습니다.')
      // 오류 시 기본 데이터 사용
      setMenuStock([
        { id: 1, name: '아메리카노 (HOT)', stock: 0, maxStock: 20, minStock: 5, soldOut: true },
        { id: 2, name: '아메리카노 (ICE)', stock: 0, maxStock: 15, minStock: 5, soldOut: true },
        { id: 3, name: '카페라떼', stock: 0, maxStock: 18, minStock: 5, soldOut: true }
      ])
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트 시 재고 정보 로드
  useEffect(() => {
    fetchMenuStock()
    
    // 30초마다 재고 정보 새로고침
    const interval = setInterval(fetchMenuStock, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getFilteredOrders = () => {
    if (filter === 'all') return orders
    return orders.filter(order => order.status === filter)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ff9800'
      case 'preparing': return '#2196f3'
      case 'completed': return '#4caf50'
      default: return '#666'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '주문 접수'
      case 'preparing': return '제조 중'
      case 'completed': return '제조 완료'
      default: return '알 수 없음'
    }
  }

  const updateStock = async (menuId, newStock) => {
    try {
      // 백엔드에 재고 업데이트 요청
      const response = await fetch(`${API_ENDPOINTS.MENU}/${menuId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: Math.max(0, newStock),
          operation: 'set'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 성공 시 로컬 상태 업데이트
        setMenuStock(prev => prev.map(menu => 
          menu.id === menuId ? { ...menu, stock: Math.max(0, newStock) } : menu
        ))
        
        // 재고 정보 새로고침
        fetchMenuStock()
      } else {
        alert(`재고 업데이트 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('재고 업데이트 오류:', error)
      alert('재고 업데이트 중 오류가 발생했습니다.')
    }
  }

  const restockAll = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.MENU}/restock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('전체 재고가 보충되었습니다!')
        fetchMenuStock()
      } else {
        alert(`재고 보충 실패: ${data.error}`)
      }
    } catch (error) {
      console.error('재고 보충 오류:', error)
      alert('재고 보충 중 오류가 발생했습니다.')
    }
  }

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return 'out-of-stock'
    if (stock <= minStock) return 'low-stock'
    return 'normal'
  }

  const getStockStatusText = (stock, minStock) => {
    if (stock === 0) return '품절'
    if (stock <= minStock) return '재고 부족'
    return '정상'
  }

  return (
    <div className="admin-view">
      {/* 대시보드 통계 */}
      <div className="admin-header">
        <h2>관리자 대시보드</h2>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">총 주문</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{orders.filter(o => o.status === 'pending').length}</span>
            <span className="stat-label">주문 접수</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{orders.filter(o => o.status === 'preparing').length}</span>
            <span className="stat-label">제조 중</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{orders.filter(o => o.status === 'completed').length}</span>
            <span className="stat-label">제조 완료</span>
          </div>
        </div>
      </div>

      {/* 재고 관리 섹션 */}
      <div className="stock-management">
        <div className="stock-header">
          <h3>재고 현황</h3>
          <div className="stock-controls">
            <button 
              className="refresh-btn"
              onClick={fetchMenuStock}
              disabled={loading}
            >
              {loading ? '새로고침 중...' : '새로고침'}
            </button>
            <button 
              className="restock-btn"
              onClick={restockAll}
              disabled={loading}
            >
              전체 재고 보충
            </button>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="loading">재고 정보를 불러오는 중...</div>
        ) : (
          <div className="stock-grid">
            {menuStock.map(menu => (
            <div key={menu.id} className={`stock-card ${getStockStatus(menu.stock, menu.minStock)}`}>
              <div className="stock-header">
                <h4>{menu.name}</h4>
                <span className={`stock-status ${getStockStatus(menu.stock, menu.minStock)}`}>
                  {getStockStatusText(menu.stock, menu.minStock)}
                </span>
              </div>
              <div className="stock-info">
                <div className="stock-current">
                  <span className="stock-number">{menu.stock}</span>
                  <span className="stock-unit">개</span>
                </div>
                <div className="stock-controls">
                  <button 
                    className="stock-btn decrease"
                    onClick={() => updateStock(menu.id, menu.stock - 1)}
                    disabled={menu.stock === 0}
                  >
                    -
                  </button>
                  <button 
                    className="stock-btn increase"
                    onClick={() => updateStock(menu.id, menu.stock + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              {menu.stock <= menu.minStock && (
                <div className="stock-warning">
                  ⚠️ 재고가 부족합니다 (최소: {menu.minStock}개)
                </div>
              )}
            </div>
          ))}
          </div>
        )}
      </div>

      {/* 주문 관리 섹션 */}
      <div className="order-management">
        <h3>주문 현황</h3>
        
        <div className="filter-section">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            주문 접수
          </button>
          <button 
            className={`filter-btn ${filter === 'preparing' ? 'active' : ''}`}
            onClick={() => setFilter('preparing')}
          >
            제조 중
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            제조 완료
          </button>
        </div>

        <div className="orders-section">
          {getFilteredOrders().length === 0 ? (
            <div className="no-orders">주문이 없습니다.</div>
          ) : (
            <div className="orders-list">
              {getFilteredOrders().map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">주문 #{order.id}</span>
                    <span className="order-time">{order.timestamp}</span>
                    <span 
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  
                  <div className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">
                          {item.name}
                          {item.syrup && ' (시럽)'}
                          {item.extraShot && ' (샷추가)'}
                          {item.quantity > 1 && ` x${item.quantity}`}
                        </span>
                        <span className="item-price">{(item.totalPrice * item.quantity).toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-footer">
                    <span className="order-total">
                      총 금액: {order.total.toLocaleString()}원
                    </span>
                    <div className="order-actions">
                      {order.status === 'pending' && (
                        <button 
                          className="status-btn preparing"
                          onClick={() => onUpdateOrderStatus(order.id, 'preparing')}
                        >
                          제조 시작
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button 
                          className="status-btn completed"
                          onClick={() => onUpdateOrderStatus(order.id, 'completed')}
                        >
                          제조 완료
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminView 