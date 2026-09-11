import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Background from '../components/ui/Background'
import NeonFrame from '../components/ui/NeonFrame'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { validateSignUp } from '../utils/validation'
import type { SignUpFormData } from '../types/auth'





export default function SignUp() {
  const [formData, setFormData] = useState<SignUpFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  // Validation errors for individual form fields
  const [errors , setErrors] = useState<Record<string, string>>({})

  // General error coming from the backend
  const [apiError, setApiError] = useState('')

  // Used to disable the button while waiting for the backend response
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()

    // Clear the previous backend error
    setApiError('')

    const validationErrors = validateSignUp(formData)

    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setApiError(data.error || 'Registration failed')
        return
      }

      navigate('/login')
    } catch (error) {
      console.error('Registration request failed:', error)

      setApiError('Unable to connect to the server')
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
            • • • CREATE ACCOUNT • • •
          </h1>

          <Input
            label="Username"
            type="text"
            name="username"
            placeholder="Enter your username..."
            value={formData.username}
            onChange={handleChange}
            error={errors.username}

          />

          <Input
            label="Email"
            type="email"
            name="email"
            placeholder="Enter your email..."
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password..."
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password..."
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />

          {apiError && (
            <p className="text-center text-red-500 text-xs">
              {apiError}
            </p>
          )}

          <Button
            type="submit"
            variant="green"
            styleType="filled"
            disabled={loading}
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </Button>

          <p className="text-center text-neon-pink/70 text-xs font-body">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-neon-green underline"
            >
              Login
            </Link>
          </p>
        </form>
      </NeonFrame>
    </Background>
  )
}