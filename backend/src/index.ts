import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authRouter } from './routes/auth'
import { sitesRouter } from './routes/sites'
import { sslRouter } from './routes/ssl'
import { dockerRouter } from './routes/docker'
import { authMiddleware } from './middleware/auth'
import { errorHandler } from './middleware/errorHandler'
import { createWsServer } from './websocket/server'
import { subdomainsRouter } from './routes/subdomains'
import { systemRouter } from './routes/system'

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

// Rutas públicas
app.use('/api/auth', authRouter)

// Rutas protegidas
app.use('/api/sites',  authMiddleware, sitesRouter)
app.use('/api/ssl',    authMiddleware, sslRouter)
app.use('/api/docker', authMiddleware, dockerRouter)
app.use('/api/subdomains', authMiddleware, subdomainsRouter)
app.use('/api/system', authMiddleware, systemRouter)

app.use(errorHandler)

app.listen(4000, () => console.log('API corriendo en :4000'))

createWsServer()