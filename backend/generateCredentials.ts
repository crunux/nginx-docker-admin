import { authService } from './src/services/auth.service'

const password = await authService.hashPassword('tupassword')

console.log(password);
