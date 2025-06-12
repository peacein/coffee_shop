import { useState, useEffect } from 'react'
import './CustomerView.css'
import { API_ENDPOINTS } from '../config/api'

const CustomerView = ({ onAddOrder }) => {
  const [cart, setCart] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // API에서 메뉴 데이터 가져오기
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.MENU}?includeUnavailable=true`)
        const data = await response.json()
        
        if (data.success) {
          setMenuItems(data.data)
        } else {
          setError('메뉴를 불러오는데 실패했습니다.')
        }
      } catch (err) {
        console.error('메뉴 로딩 오류:', err)
        setError('서버에 연결할 수 없습니다.')
        // 오류 시 기본 메뉴 사용
        setMenuItems([
          {
            id: 1,
            name: '아메리카노 (HOT)',
            price: 3000,
            image: '/images/menu/americano-hot.jpg',
            category: 'coffee',
            stock: 15,
            soldOut: false
          },
          {
            id: 2,
            name: '아메리카노 (ICE)',
            price: 3000,
            image: '/images/menu/americano-ice.jpg',
            category: 'coffee',
            stock: 8,
            soldOut: false
          },
          {
            id: 3,
            name: '카페라떼',
            price: 4000,
            image: '/images/menu/cafe-latte.jpg',
            category: 'coffee',
            stock: 12,
            soldOut: false
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const addToCart = (item, syrup = false, extraShot = false) => {
    const optionsPrice = (syrup ? 0 : 0) + (extraShot ? 500 : 0)
    const totalPrice = item.price + optionsPrice
    
    const cartItem = {
      ...item,
      syrup,
      extraShot,
      totalPrice,
      // 동일한 메뉴+옵션 조합을 식별하기 위한 키
      itemKey: `${item.id}_${syrup}_${extraShot}`
    }

    setCart(prev => {
      const existingItemIndex = prev.findIndex(cartItem => cartItem.itemKey === `${item.id}_${syrup}_${extraShot}`)
      
      if (existingItemIndex >= 0) {
        // 이미 있으면 수량 증가
        const updatedCart = [...prev]
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1
        }
        return updatedCart
      } else {
        // 없으면 새로 추가
        return [...prev, { ...cartItem, quantity: 1 }]
      }
    })
  }

  const removeFromCart = (index) => {
    setCart(prev => {
      const updatedCart = [...prev]
      if (updatedCart[index].quantity > 1) {
        // 수량이 1보다 크면 수량만 감소
        updatedCart[index] = {
          ...updatedCart[index],
          quantity: updatedCart[index].quantity - 1
        }
        return updatedCart
      } else {
        // 수량이 1이면 아이템 제거
        return prev.filter((_, i) => i !== index)
      }
    })
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0)
  }

  const handleOrder = async () => {
    if (cart.length === 0) return
    
    try {
      // 백엔드 API로 주문 전송
      const response = await fetch(API_ENDPOINTS.ORDERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            totalPrice: item.totalPrice,
            quantity: item.quantity,
            syrup: item.syrup,
            extraShot: item.extraShot
          }))
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // 주문 성공 시
        onAddOrder(data.data)
        setCart([])
        alert('주문이 완료되었습니다!')
        
        // 메뉴 재고 정보 새로고침
        const menuResponse = await fetch(`${API_ENDPOINTS.MENU}?includeUnavailable=true`)
        const menuData = await menuResponse.json()
        if (menuData.success) {
          setMenuItems(menuData.data)
        }
      } else {
        // 주문 실패 시 (재고 부족 등)
        alert(`주문 실패: ${data.error}`)
        if (data.details) {
          const detailsMsg = data.details.map(detail => 
            `${detail.menuName}: 요청 ${detail.requestedQuantity}개, 재고 ${detail.currentStock}개`
          ).join('\n')
          alert(`재고 부족 상세:\n${detailsMsg}`)
        }
      }
    } catch (error) {
      console.error('주문 오류:', error)
      alert('주문 중 오류가 발생했습니다. 다시 시도해주세요.')
    }
  }

  const handleAddToCart = (item, menuIndex) => {
    const syrupCheckbox = document.querySelector(`#syrup-${menuIndex}`)
    const shotCheckbox = document.querySelector(`#shot-${menuIndex}`)
    
    const syrup = syrupCheckbox?.checked || false
    const extraShot = shotCheckbox?.checked || false
    
    addToCart(item, syrup, extraShot)
    
    // 체크박스 초기화
    if (syrupCheckbox) syrupCheckbox.checked = false
    if (shotCheckbox) shotCheckbox.checked = false
  }

  const getOptionsText = (item) => {
    const options = []
    if (item.syrup) options.push('시럽')
    if (item.extraShot) options.push('샷추가')
    return options.length > 0 ? ` (${options.join(', ')})` : ''
  }

  if (loading) {
    return (
      <div className="customer-view">
        <div className="loading">메뉴를 불러오는 중...</div>
      </div>
    )
  }

  return (
    <div className="customer-view">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      <div className="menu-section">
        <h2>메뉴</h2>
        <div className="menu-grid">
          {menuItems.map((item, index) => (
            <div key={item.id} className="menu-item">
              <div className="menu-image">
                <img src={item.image_url} alt={item.name} />
              </div>
              <div className="menu-info">
                <h3>{item.name}</h3>
                <p className="price">{item.price.toLocaleString()}원</p>
                <p className="description">{item.description}</p>
                <div className="menu-options">
                  <label className="option">
                    <input 
                      type="checkbox" 
                      id={`syrup-${index}`}
                    /> 시럽 추가 (+0원)
                  </label>
                  <label className="option">
                    <input 
                      type="checkbox" 
                      id={`shot-${index}`}
                    /> 샷 추가 (+500원)
                  </label>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(item, index)}
                >
                  담기
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cart-section">
        <h2>장바구니</h2>
        {cart.length === 0 ? (
          <p className="empty-cart">장바구니가 비어있습니다.</p>
        ) : (
          <div className="cart-content">
            <div className="cart-items">
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="item-details">
                    <span className="item-name">
                      {item.name}{getOptionsText(item)}
                      {item.quantity > 1 && <span className="quantity"> x{item.quantity}</span>}
                    </span>
                  </div>
                  <span className="item-price">{(item.totalPrice * item.quantity).toLocaleString()}원</span>
                  <button 
                    className="remove-btn"
                    onClick={() => removeFromCart(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="cart-total">
                <strong>총 금액: {getTotalPrice().toLocaleString()}원</strong>
              </div>
              <button className="order-btn" onClick={handleOrder}>
                주문하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CustomerView 