import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Participant from './Participant'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Check if user is authenticated
    const userAddress = localStorage.getItem("userAddress")
    const userRole = localStorage.getItem("userRole")

    if (!userAddress || !userRole) {
      // Redirect to login if not authenticated
      navigate("/login")
      return
    }

    setUser({ address: userAddress, role: userRole })
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem("userAddress")
    localStorage.removeItem("userRole")
    navigate("/login")
  }

  if (!user) {
    return null // Show nothing while checking auth
  }

  return (
    <>
      <header className="app-header">
        <div className="user-info">
          <span>Welcome, {user.role}</span>
          <span className="address">{user.address.slice(0, 6)}...{user.address.slice(-4)}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      {user.role === 'participant' ? (
        <Participant userAddress={user.address} />
      ) : (
        <div className="requester-dashboard">
          <h1>Requester Dashboard</h1>
          <p>Coming soon...</p>
        </div>
      )}
    </>
  )
}

export default App
