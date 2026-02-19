import type { Request, Response, NextFunction } from 'express'
import { jwtVerify } from '../utils/auth'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sin token' })

  try {
    jwtVerify(token)
    next()
  } catch {
    res.status(401).json({ error: 'Token invalido' })
  }
}