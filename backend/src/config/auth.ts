import { authService } from "../services/auth.service"

const PASSWORD = process.env.ADMIN_PASSWORD || 'mypassword'

export const ADMIN_DB = process.env.ADMIN_USER || 'admin'

export const PASSWORD_DB = await authService.hashPassword(PASSWORD)

