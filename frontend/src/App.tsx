import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Home from './pages/Home'
import ProtectedRoute from './components/auth/ProtectedRoute'
// import DesignSystem from './pages/DesignSystem'
// import Design from './pages/Design'
// import Profile from './pages/ProfilePage'
import GameWs from './pages/GameWs' // TEMP
import ChatWs from './pages/ChatWs'   // TEMP

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<Home />} />
      </Route>
      {/* <Route path="/DesignSystem" element={<DesignSystem />} /> */}
      {/* <Route path="/Design" element={<Design />} /> */}
      {/* <Route path="/ProfilePage" element={<Profile />} /> */}
      <Route path="/ws-game" element={<GameWs />} /> {/* TEMP */}
      <Route path="/ws-chat" element={<ChatWs />} /> {/* TEMP */}
    </Routes>
  )
}

export default App