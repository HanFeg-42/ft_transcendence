export function validateSignUp(data: { username: string; email: string; password: string; confirmPassword: string }) {    const errors: Record<string, string> = {}

    if (!data.username.trim()) 
    {
    errors.username = 'Username is required'
    }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) 
    {
    errors.email = 'Invalid email format'
    }
    if (!data.password) {
    errors.password = 'Password is required'
    } 
    else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    }
    if (data.confirmPassword !== data.password) {
    errors.confirmPassword = 'Passwords do not match'
    }
    return errors
}