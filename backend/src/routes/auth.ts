import { Router } from 'express'
import { authService } from '../services/auth.service'
import { ADMIN_DB, PASSWORD_DB } from '../config/auth'
import { generateJWT } from '../utils/auth'

const router = Router()

router.post('/login', async (req, res) => {
  
  const { username, password } = req.body
  
  if (username !== ADMIN_DB) {
    return res.status(401).json({ error: 'Credenciales inválidas' })
  }

  // const passwordDB = process.env.ADMIN_HASH || '$2b$10$vbT56furRMWD2mVhvKh5SuvbuGgPvqDL1T3moWls/oV5UN9XYk1.a'
  // const passwordDB = '$2b$10$vbT56furRMWD2mVhvKh5SuvbuGgPvqDL1T3moWls/oV5UN9XYk1.a'

  
  const valid = await authService.verifyPassword(
    password,
    PASSWORD_DB
  )

  if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' })

  const token = generateJWT(username)

  res.json({ token })
})

export { router as authRouter }