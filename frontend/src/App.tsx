import { Routes, Route } from 'react-router-dom'
import Welcome from './pages/Welcome'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Home from './pages/Home'
import ProfilePage from './pages/ProfilePage'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import Settings from './pages/Settings'
import Game from './pages/Game'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/game" element={<Game />} />
      </Route>
    </Routes>
  )
}

export default App