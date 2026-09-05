// Ce que le formulaire gère (avec confirmPassword pour la validation)
export interface SignUpFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}

// Ce qu'on envoie réellement à l'API (sans confirmPassword)
export interface RegisterPayload {
  username: string
  email: string
  password: string
}

// Ce que l'API renvoie après création (jamais le hash, jamais le password)
export interface User {
  id: number
  username: string
  email: string
  createdAt: string
}