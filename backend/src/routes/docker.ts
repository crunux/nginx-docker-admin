import { Router } from 'express'
import { dockerService } from '../services/docker.service'

const router = Router()

// Contenedores
router.get('/containers', async (_req, res) => res.json(await dockerService.listContainers()))
router.get('/stats', async (_req, res) => res.json(await dockerService.getStats()))
router.post('/containers/:id/start', async (req, res) => { await dockerService.startContainer(req.params.id);   res.json({ ok: true }) })
router.post('/containers/:id/stop', async (req, res) => { await dockerService.stopContainer(req.params.id);    res.json({ ok: true }) })
router.post('/containers/:id/restart', async (req, res) => { await dockerService.restartContainer(req.params.id); res.json({ ok: true }) })
router.delete('/containers/:id', async (req, res) => { await dockerService.removeContainer(req.params.id);  res.json({ ok: true }) })

// Proyectos
router.get('/projects', async (_req, res) => res.json(await dockerService.listProjects()))
router.post('/projects', async (req, res) => res.json({ result: await dockerService.buildAndDeploy(req.body.projectName, req.body.composeContent) }))
router.post('/projects/:name/start', async (req, res) => res.json({ result: await dockerService.startProject(req.params.name) }))
router.post('/projects/:name/stop', async (req, res) => res.json({ result: await dockerService.stopProject(req.params.name) }))
router.post('/projects/:name/restart', async (req, res) => res.json({ result: await dockerService.restartProject(req.params.name) }))

// Imágenes
router.get('/images', async (_req, res) => res.json(await dockerService.listImages()))
router.post('/images/pull', async (req, res) => res.json({ result: await dockerService.pullImage(req.body.image) }))
router.post('/system/prune',  async (_req, res) => res.json({ result: await dockerService.pruneSystem() }))

export { router as dockerRouter }

// import { Router } from 'express'
// import { dockerService } from '../services/docker.service'

// const router = Router()

// router.get('/containers', async (_req, res) => {
//   const containers = await dockerService.listContainers()
//   res.json(containers)
// })

// router.post('/deploy', async (req, res) => {
//   const { projectName, composeContent } = req.body
//   const result = await dockerService.buildAndDeploy(projectName, composeContent)
//   res.json({ result })
// })

// router.post('/:name/stop', async (req, res) => {
//   const result = await dockerService.stopProject(req.params.name)
//   res.json({ result })
// })

// router.get('/:name/logs', async (req, res) => {
//   const logs = await dockerService.getLogs(req.params.name)
//   res.json({ logs })
// })

// router.post('/containers/:id/restart', async (req, res) => {
//   await dockerService.restartContainer(req.params.id)
//   res.json({ ok: true })
// })

// export { router as dockerRouter }