import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Participant from './Participant'
import Admin from './Admin'
import './App.css'
import VerifiedRequester from './VerifiedRequester'
import UnverifiedRequester from './UnverifiedRequester'

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requesterStatus, setRequesterStatus] = useState(null) // null = loading, object = loaded

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

    if (userRole === 'requester') {
      fetch(`http://localhost:3000/admin/status/${userAddress}`)
        .then(res => res.json())
        .then(data => setRequesterStatus(data))
        .catch(() => setRequesterStatus({ approved: false, organization: null }))
    }
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

      {user.role === 'admin' ? (
        <Admin userAddress={user.address} />
      ) : user.role === 'participant' ? (
        <Participant userAddress={user.address} />
      ) : (
        requesterStatus === null ? null
        : requesterStatus.approved ? (
          <VerifiedRequester userAddress={user.address} requesterName={requesterStatus.organization} />
        ) : requesterStatus.organization ? (
          <div style={{ padding: "2rem" }}>
            <h2>Application Pending</h2>
            <p>Your application has been submitted and is awaiting admin approval.</p>
          </div>
        ) : (
          <UnverifiedRequester userAddress={user.address} setFormSubmitted={(submitted) => {
            if (submitted) setRequesterStatus({ approved: false, organization: "pending" })
          }} />
        )
      )}
    </>
  )
}

export default App
