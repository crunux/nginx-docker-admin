import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../config/auth'

export function jwtVerify(token: string): { username: string } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { username: string }
    } catch {
      return null
    }
  }

export function generateJWT(username: string): string {
    return jwt.sign(
      { username },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
}