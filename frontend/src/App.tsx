import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
// import DesignSystem from './pages/DesignSystem'
// import Design from './pages/Design'
// import Profile from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      <Route path="/login" element={<Login />} />
      {/* <Route path="/DesignSystem" element={<DesignSystem />} /> */}
      {/* <Route path="/Design" element={<Design />} /> */}
      {/* <Route path="/ProfilePage" element={<Profile />} /> */}
    </Routes>
  )
}

export default App