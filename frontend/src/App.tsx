import { useState } from 'react'

function App() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <div>
      <h1>Create Account</h1>

      <label>Username</label>
      <input
        type="text"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <label>Email</label>
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </div>
  )
}

export default App