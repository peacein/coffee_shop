import { useState } from 'react'
import './App.css'
import CustomerView from './components/CustomerView'
import AdminView from './components/AdminView'

function App() {
  const [currentView, setCurrentView] = useState('customer') // 'customer' or 'admin'
  const [orders, setOrders] = useState([])

  const addOrder = (order) => {
    setOrders(prev => [...prev, { ...order, id: Date.now(), status: 'pending' }])
  }

  const updateOrderStatus = (orderId, status) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId ? { ...order, status } : order
    ))
  }

  return (
    <div className="app">
      <nav className="app-nav">
        <div className="nav-logo">
          COZY
        </div>
        <div className="nav-menu">
          <button 
            className={`nav-btn ${currentView === 'customer' ? 'active' : ''}`}
            onClick={() => setCurrentView('customer')}
          >
            주문하기
          </button>
          <button 
            className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => setCurrentView('admin')}
          >
            관리자
          </button>
        </div>
        <div className="nav-spacer"></div>
      </nav>

      {currentView === 'customer' ? (
        <CustomerView onAddOrder={addOrder} />
      ) : (
        <AdminView orders={orders} onUpdateOrderStatus={updateOrderStatus} />
      )}
    </div>
  )
}

export default App
