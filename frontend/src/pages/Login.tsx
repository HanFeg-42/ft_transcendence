import { useState } from 'react'
import { Link } from 'react-router-dom'

import Background from '../components/ui/Background'
import NeonFrame from '../components/ui/NeonFrame'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

import type { LoginFormData, LoginResponse } from '../types/auth'

export default function Login() {
  // Stores the email and password entered by the user
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })

  // Message displayed when login fails
  const [error, setError] = useState('')

  // Message displayed when login succeeds
  const [success, setSuccess] = useState('')

  // True while we are waiting for the backend response
  const [loading, setLoading] = useState(false)

  /*
   * Called whenever the user types in an input.
   *
   * e.target.name  -> "email" or "password"
   * e.target.value -> what the user typed
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  /*
   * Called when the user submits the login form.
   *
   * Flow:
   * Login form
   *    ↓
   * POST /api/auth/login
   *    ↓
   * Backend verifies email + password
   *    ↓
   * Backend returns JWT if credentials are valid
   */
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    // Clear messages from the previous attempt
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      // Convert the JSON response into a JavaScript object
      const data = await response.json()

      /*
       * response.ok is false for errors such as:
       * 400 Bad Request
       * 401 Unauthorized
       */
      if (!response.ok) {
        setError(data.error || 'Login failed')
        return
      }

      // Login succeeded
      const loginData: LoginResponse = data

      setSuccess('Logged in successfully')

      /*
       * We receive the JWT here.
       *
       * We already tested that this token works with /api/auth/me.
       * Permanent token storage/auth state will be handled separately.
       */
      console.log('Logged in user:', loginData.user)
    } catch (error) {
      console.error('Login request failed:', error)

      setError('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Background>
      <NeonFrame variant="pink" size="md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <h1 className="font-display text-neon-pink text-center text-sm tracking-widest">
            • • • LOGIN • • •
          </h1>

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email..."
            value={formData.email}
            onChange={handleChange}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password..."
            value={formData.password}
            onChange={handleChange}
          />

          {/* Backend/login error */}
          {error && (
            <p className="text-center text-red-500 text-xs">
              {error}
            </p>
          )}

          {/* Successful login */}
          {success && (
            <p className="text-center text-neon-green text-xs">
              {success}
            </p>
          )}

          <Button
            type="submit"
            variant="green"
            styleType="filled"
            disabled={loading}
          >
            {loading ? 'LOGGING IN...' : 'LOGIN'}
          </Button>

          <p className="text-center text-neon-pink/70 text-xs font-body">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-neon-green underline"
            >
              Create account
            </Link>
          </p>
        </form>
      </NeonFrame>
    </Background>
  )
}