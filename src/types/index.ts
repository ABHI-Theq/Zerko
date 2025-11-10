export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: 'user' | 'admin'
  createdAt: Date
}

export interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

export type ErrorResponse = {
  code: string
  message: string
  details?: Record<string, string[]>
}
