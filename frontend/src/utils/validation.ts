export function validateSignUp(data: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  // Values are translation keys (see i18n.ts): SignUp.tsx turns them into text.
  const errors: Record<string, string> = {};
  const username = data.username.trim();
  const email = data.email.trim().toLowerCase();

  if (!username) {
    errors.username = "signup_errUsernameRequired";
  } else if (!/^[A-Za-z0-9_-]{3,20}$/.test(username)) {
    errors.username = "signup_errUsernameFormat";
  }

  if (!email) {
    errors.email = "signup_errEmailRequired";
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "signup_errEmailInvalid";
  }

  if (!data.password) {
    errors.password = "signup_errPasswordRequired";
  } else if (data.password.length < 8 || data.password.length > 72) {
    errors.password = "signup_errPasswordLength";
  } else if (!/[A-Za-z]/.test(data.password) || !/[0-9]/.test(data.password)) {
    errors.password = "signup_errPasswordFormat";
  }

  if (data.confirmPassword !== data.password) {
    errors.confirmPassword = "signup_errPasswordMatch";
  }

  return errors;
}