import { Routes, Route } from 'react-router-dom'
import SignUp from './pages/SignUp'

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<SignUp />} />
      {/* les autres routes (login, home...) seront ajoutées par vos coéquipiers */}
    </Routes>
  )
}

export default App