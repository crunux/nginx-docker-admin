import { Router } from 'express'
import { subdomainService } from '../services/subdomain.service'
import { sslService }       from '../services/ssl.service'

const router = Router()

router.get('/', async (_req, res) => {
  const subdomains = await subdomainService.listSubdomains()
  res.json(subdomains)
})

router.post('/', async (req, res) => {
  const { name, subdomain, domain, port } = req.body
  await subdomainService.createSubdomain(name, subdomain, domain, port)
  res.json({ ok: true })
})

router.put('/:name', async (req, res) => {
  await subdomainService.updateSubdomain(req.params.name, req.body.port)
  res.json({ ok: true })
})

router.delete('/:name', async (req, res) => {
  await subdomainService.deleteSubdomain(req.params.name)
  res.json({ ok: true })
})

router.post('/:name/enable', async (req, res) => {
  await subdomainService.enableSubdomain(req.params.name)
  res.json({ ok: true })
})

router.post('/:name/disable', async (req, res) => {
  await subdomainService.disableSubdomain(req.params.name)
  res.json({ ok: true })
})

// Emitir SSL para el subdominio
router.post('/:name/ssl', async (req, res) => {
  const { email } = req.body
  const subdomains = await subdomainService.listSubdomains()
  const sub = subdomains.find(s => s.name === req.params.name)

  if (!sub) return res.status(404).json({ error: 'Subdominio no encontrado' })

  const result = await sslService.issueCert(sub.fullDomain, email)
  res.json({ result })
})

export { router as subdomainsRouter }