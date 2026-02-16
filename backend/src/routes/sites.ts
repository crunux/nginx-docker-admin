import { Router } from 'express'
import { nginxService } from '../services/nginx.service'

const router = Router()

router.get('/', async (_req, res) => {
  const sites = await nginxService.listSites()
  res.json(sites)
})

router.post('/', async (req, res) => {
  const { name, domain, port } = req.body
  await nginxService.createSite(name, domain, port)
  res.json({ ok: true })
})

router.put('/:name', async (req, res) => {
  await nginxService.updateSite(req.params.name, req.body.config)
  res.json({ ok: true })
})

router.delete('/:name', async (req, res) => {
  await nginxService.deleteSite(req.params.name)
  res.json({ ok: true })
})

router.post('/:name/enable', async (req, res) => {
  await nginxService.enableSite(req.params.name)
  res.json({ ok: true })
})

router.post('/:name/disable', async (req, res) => {
  await nginxService.disableSite(req.params.name)
  res.json({ ok: true })
})

router.get('/test', async (_req, res) => {
  const result = await nginxService.testConfig()
  res.json({ result })
})

export { router as sitesRouter }
