import { useState } from 'react'
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

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationErrors = validateSignUp(formData)
    console.log('Errors found:', validationErrors)

    setErrors(validationErrors)
    // validation + appel API : prochaines étapes
  }

  return (
    <Background>
      <NeonFrame variant="pink" size="md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
          />

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

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password..."
            value={formData.confirmPassword}
            onChange={handleChange}
          />

          <Button type="submit" variant="green" styleType="filled">
            CREATE ACCOUNT
          </Button>

          <p className="text-center text-neon-pink/70 text-xs font-body">
            Already have an account?{' '}
            <a href="/login" className="text-neon-green underline">
              Login
            </a>
          </p>
        </form>
      </NeonFrame>
    </Background>
  )
}