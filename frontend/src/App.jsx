import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Participant from './Participant'
import './App.css'
import VerifiedRequester from './VerifiedRequester'
import UnverifiedRequester from './UnverifiedRequester'

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [userIsVerified, setUserIsVerified] = useState(false); // TODO: implement logic to determine if requester is already verified or not

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
        // TODO: properly differentiate between verified and unverified requesters and show appropriate dashboard
        userIsVerified ? (
          <VerifiedRequester userAddress={user.address} />
        ) : (
          <UnverifiedRequester userAddress={user.address} setFormSubmitted={setUserIsVerified} />
        )
      )}
    </>
  )
}

export default App
