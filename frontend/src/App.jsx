import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'

import Participant from './Participant'
import Admin from './Admin'
import VerifiedRequester from './VerifiedRequester'
import UnverifiedRequester from './UnverifiedRequester'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import './App.css'

function App() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [requesterStatus, setRequesterStatus] = useState(null)

  useEffect(() => {
    const userAddress = localStorage.getItem('userAddress')
    const userRole = localStorage.getItem('userRole')

    if (!userAddress || !userRole) {
      navigate('/login')
      return
    }

    setUser({ address: userAddress, role: userRole })
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('userAddress')
    localStorage.removeItem('userRole')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="app-header">
        <div className="user-info">
          <span>Welcome, {user.role}</span>
          <span className="address">
            {user.address.slice(0, 6)}…{user.address.slice(-4)}
          </span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        >
          Logout
        </Button>
      </header>

      {user.role === 'admin' ? (
        <Admin userAddress={user.address} />
      ) : user.role === 'participant' ? (
        <Participant userAddress={user.address} />
      ) : user.role === 'requester' ? (
        <UnverifiedRequester userAddress={user.address} />
      ) : null}
      </div>
    )
  }

export default App
