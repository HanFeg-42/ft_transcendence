import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      <h1>Pacova Dashboard</h1>
      <p>Welcome, {user?.username}!</p>
    </div>
  )
}