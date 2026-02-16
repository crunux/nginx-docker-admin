import { Router } from 'express'
import { systemService } from '../services/system.service'

const router = Router()

router.get('/',        async (_req, res) => res.json(await systemService.getAll()))
router.get('/cpu',     async (_req, res) => res.json({ usage: await systemService.getCpu() }))
router.get('/ram',     async (_req, res) => res.json(await systemService.getRam()))
router.get('/disk',    async (_req, res) => res.json(await systemService.getDisks()))
router.get('/network', async (_req, res) => res.json(await systemService.getNetwork()))

export { router as systemRouter }