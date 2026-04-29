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

    if (userRole === 'requester') {
      fetch(`http://localhost:3000/admin/status/${userAddress}`)
        .then((res) => res.json())
        .then((data) => setRequesterStatus(data))
        .catch(() =>
          setRequesterStatus({ approved: false, organization: null }),
        )
    }
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
      ) : requesterStatus === null ? null : requesterStatus.approved ? (
        <VerifiedRequester
          userAddress={user.address}
          requesterName={requesterStatus.organization}
        />
      ) : requesterStatus.organization ? (
        <div className="mx-auto max-w-xl px-4 py-16">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Application Pending
                </CardTitle>
                <Badge variant="secondary">Pending review</Badge>
              </div>
              <CardDescription>
                Your application has been submitted and is waiting for an admin
                to review and approve it.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You'll get access to the requester dashboard automatically once
              an admin approves you on-chain. Feel free to close this tab.
            </CardContent>
          </Card>
        </div>
      ) : (
        <UnverifiedRequester
          userAddress={user.address}
          setFormSubmitted={(submitted) => {
            if (submitted)
              setRequesterStatus({ approved: false, organization: 'pending' })
          }}
        />
      )}
    </div>
  )
}

export default App
