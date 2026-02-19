import { Router } from 'express'
import { installService } from '../services/install.service'

const router = Router()

// Verificar dependencias
router.get('/check', async (_req, res) => {
  const deps = await installService.checkDependencies()
  res.json(deps)
})

// Instalar paquete específico
router.post('/nginx',   async (_req, res) => res.json({ message: await installService.installNginx() }))
router.post('/certbot', async (_req, res) => res.json({ message: await installService.installCertbot() }))
router.post('/docker',  async (_req, res) => res.json({ message: await installService.installDocker() }))

export { router as installRouter }