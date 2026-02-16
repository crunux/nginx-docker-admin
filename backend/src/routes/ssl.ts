import { Router } from 'express'
import { sslService } from '../services/ssl.service'

const router = Router()

router.get('/', async (_req, res) => {
  const certs = await sslService.listCerts()
  res.json({ certs })
})

router.post('/issue', async (req, res) => {
  const { domain, email } = req.body
  const result = await sslService.issueCert(domain, email)
  res.json({ result })
})

router.post('/renew', async (_req, res) => {
  const result = await sslService.renewAll()
  res.json({ result })
})

router.delete('/:domain', async (req, res) => {
  const result = await sslService.revokeCert(req.params.domain)
  res.json({ result })
})

export { router as sslRouter }