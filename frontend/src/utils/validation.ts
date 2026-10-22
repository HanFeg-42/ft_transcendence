export function validateSignUp(data: { username: string; email: string; password: string; confirmPassword: string }) {
	const errors: Record<string, string> = {}
	const username = data.username.trim()
	const email = data.email.trim().toLowerCase()
	
	if (!username) {
    errors.username = 'Username is required'
	} else if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) {
		errors.username =
			'Username must be 3-20 characters and contain only letters, numbers, _ or -'
	}
	if (
		!email ||
		email.length > 254 ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
	) {
    errors.email = 'Invalid email format'
	}
	if (!data.password) {
		errors.password = 'Password is required'
	} else if (data.password.length < 8 || data.password.length > 72) {
		errors.password = 'Password must be between 8 and 72 characters'
	} else if (
		!/[A-Za-z]/.test(data.password) ||
		!/[0-9]/.test(data.password)
	) {
		errors.password = 'Password must contain at least one letter and one digit'
	}
	if (data.confirmPassword !== data.password) {
		errors.confirmPassword = 'Passwords do not match'
	}
	return errors
}