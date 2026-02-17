// backend/src/routes/config.ts
import { Router } from 'express'
import { configService } from '../services/config.service'
import { installService } from '../services/install.service'

const router = Router()

router.get('/',      async (_req, res) => res.json(await configService.get()))
router.put('/',      async (req,  res) => res.json(await configService.update(req.body)))
router.post('/reset',async (_req, res) => res.json(await configService.reset()))

// Check de dependencias
router.get('/dependencies', async (_req, res) => {
  const deps = await installService.checkDependencies()
  res.json(deps)
})

// Instalar dependencia
router.post('/install/:tool', async (req, res) => {
  const { tool } = req.params
  const map: Record<string, () => Promise<string>> = {
    nginx:   () => installService.installNginx(),
    certbot: () => installService.installCertbot(),
    docker:  () => installService.installDocker(),
  }

  if (!map[tool]) {
    return res.status(400).json({ error: `Tool "${tool}" no soportada` })
  }

  const message = await map[tool]()
  res.json({ message })
})

export { router as configRouter }