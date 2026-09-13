import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import GameWs from './pages/GameWs' // TEMP
import ChatWs from './pages/ChatWs'   // TEMP

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/ws-game" element={<GameWs />} /> {/* TEMP */}
      <Route path="/ws-chat" element={<ChatWs />} /> {/* TEMP */}
    </Routes>
  )
}

export default App