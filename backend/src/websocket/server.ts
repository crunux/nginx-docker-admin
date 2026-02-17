import { logHandlers } from './logServer'
import { $, type ServerWebSocket } from 'bun'
import si from 'systeminformation'
import { jwtVerify } from '../utils/auth'

interface WsData {
  clientId: string
  authenticated: boolean
}

const activeProcs = new Map<string, ReturnType<typeof Bun.spawn>>()
const activeReaders = new Map<string, boolean>() // controla si el loop sigue vivo
const activeTimers  = new Map<string, ReturnType<typeof setInterval>>() // ← para stats

type LogHandler =  keyof typeof logHandlers

export function createWsServer() {
  Bun.serve<WsData>({
    port: 4001,

    fetch(req, server) {
      const url      = new URL(req.url)
      const token    = url.searchParams.get('token')
      const clientId = crypto.randomUUID()
      let authenticated = false

      if (!token) {
        return new Response('Not Token Set', { status: 401 })
      }

      const validToken = jwtVerify(token)
      
      if (validToken){
        // return new Response('Unauthorized', { status: 401 })
        authenticated = true
      }
      

      const upgraded = server.upgrade(req, {
        data: { clientId, authenticated },
      })

      return upgraded
        ? undefined
        : new Response('WebSocket upgrade failed', { status: 500 })
    },

    websocket: {
      open(ws: ServerWebSocket<WsData>) {

        if (!ws.data.authenticated) {
        // Notificar antes de cerrar para que el cliente sepa el motivo
          ws.send(JSON.stringify({
            type:    'error',
            code:    'TOKEN_EXPIRED',
            message: 'Tu sesión ha expirado',
          }))
          ws.close(1008, 'Token expired')
          return
        }

        ws.send(JSON.stringify({
          type: 'connected',
          message: '🟢 Conectado al servidor de logs',
        }))
      },

      async message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
        const msg = JSON.parse(raw.toString()) as {
          action: 'subscribe' | 'unsubscribe'
          topic:  string,
          interval?: number
        }        

        if (msg.action === 'subscribe') {
          if (msg.topic === 'system:stats') {
            startStatsStream(ws, msg.interval || 2000)
            return
          }
          await startStream(ws, msg.topic)
        }

        if (msg.action === 'unsubscribe') {
          stopStream(ws.data.clientId)
          stopStatsStream(ws.data.clientId)
          ws.send(JSON.stringify({ type: 'unsubscribed' }))
        }
      },

      close(ws: ServerWebSocket<WsData>) {
        stopStream(ws.data.clientId)
        stopStatsStream(ws.data.clientId)
      },
    },
  })

  console.log('WebSocket server en :4001')
}

async function startStream(ws: ServerWebSocket<WsData>, topic: string) {
  stopStream(ws.data.clientId) // matar stream previo

  const [type, project] = topic.split(':')

  const proc = type === 'docker' && project
    ? logHandlers.docker(project)
    : logHandlers[type as LogHandler]?.()

  if (!proc) {
    ws.send(JSON.stringify({ type: 'error', message: `Topic "${topic}" no válido` }))
    return
  }

  activeProcs.set(ws.data.clientId, proc)
  activeReaders.set(ws.data.clientId, true) // marcar como activo

  ws.send(JSON.stringify({ type: 'subscribed', topic }))

  // Iniciar los dos streams en paralelo sin await
  // para no bloquear el loop del servidor
  readStream(ws, proc.stdout, 'log')
  readStream(ws, proc.stderr, 'error')

  // Detectar cuando el proceso termina
  proc.exited.then((code) => {
    // Solo notificar si el cliente sigue conectado al mismo stream
    if (activeReaders.get(ws.data.clientId)) {
      try {
        ws.send(JSON.stringify({
          type:    'ended',
          message: `Proceso terminó con código ${code}`,
        }))
      } catch {}
    }
  })
}

// Loop continuo que no se detiene hasta que se mata el proceso
async function readStream(
  ws:      ServerWebSocket<WsData>,
  stream:  ReadableStream | null,
  logType: 'log' | 'error'
) {
  if (!stream) return
  
  const reader  = stream.getReader()
  const decoder = new TextDecoder()
  let   buffer  = '' // acumular chunks parciales

  try {
    while (true) {
      // Verificar si este cliente aún debe recibir logs
      if (!activeReaders.get(ws.data.clientId)) break

      const { done, value } = await reader.read()

      if (done) break

      // Acumular en buffer para manejar líneas cortadas entre chunks
      buffer += decoder.decode(value, { stream: true })

      // Procesar líneas completas
      const lines = buffer.split('\n')

      // La última parte puede estar incompleta, guardarla para el próximo chunk
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (!line.trim()) continue

        try {
          ws.send(JSON.stringify({
            type:      logType,
            line,
            timestamp: new Date().toISOString(),
          }))
        } catch {
          // WS cerrado, salir del loop
          return
        }
      }
    }

    // Enviar lo que quedó en el buffer al terminar
    if (buffer.trim()) {
      try {
        ws.send(JSON.stringify({
          type:      logType,
          line:      buffer,
          timestamp: new Date().toISOString(),
        }))
      } catch {}
    }

  } catch (err: any) {
    // Si el proceso fue matado intencionalmente, no es un error real
    if (activeReaders.get(ws.data.clientId)) {
      console.error('[ws] stream error:', err?.message)
    }
  } finally {
    try { reader.releaseLock() } catch {}
  }
}

function stopStream(clientId: string) {
  // Marcar como inactivo ANTES de matar el proceso
  // para que readStream sepa que debe salir limpiamente
  activeReaders.set(clientId, false)

  const proc = activeProcs.get(clientId)
  if (proc) {
    try { proc.kill() } catch {}
    activeProcs.delete(clientId)
  }
}

function startStatsStream(ws: ServerWebSocket<WsData>, intervalMs: number) {
  // Limpiar timer previo si existe
  stopStatsStream(ws.data.clientId)

  ws.send(JSON.stringify({ type: 'subscribed', topic: 'system:stats' }))

  // Enviar inmediatamente el primer dato sin esperar el intervalo
  sendStats(ws)

  const timer = setInterval(() => sendStats(ws), intervalMs)
  activeTimers.set(ws.data.clientId, timer)
}

async function sendStats(ws: ServerWebSocket<WsData>) {
  try {
    const [cpuLoad, mem, disks, network] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
    ])

    ws.send(JSON.stringify({
      type: 'stats',
      data: {
        cpu: {
          usage: Math.round(cpuLoad.currentLoad),
          cores: cpuLoad.cpus.map(c => Math.round(c.load)),
        },
        ram: {
          total:   mem.total,
          used:    mem.used,
          free:    mem.free,
          percent: Math.round((mem.used / mem.total) * 100),
        },
        disk: disks.map(d => ({
          fs:        d.fs,
          mount:     d.mount,
          size:      d.size,
          used:      d.used,
          available: d.available,
          percent:   Math.round(d.use),
        })),
        network: network.map(n => ({
          iface:  n.iface,
          rx_sec: n.rx_sec ?? 0,
          tx_sec: n.tx_sec ?? 0,
        })),
        timestamp: Date.now(),
      },
    }))
  } catch (err: any) {
    // Si el WS se cerró no hacemos nada
    if (activeTimers.has(ws.data.clientId)) {
      console.error('[ws:stats] error:', err?.message)
    }
  }
}

function stopStatsStream(clientId: string) {
  const timer = activeTimers.get(clientId)
  if (timer) {
    clearInterval(timer)
    activeTimers.delete(clientId)
  }
}
// import jwt from 'jsonwebtoken'
// import { logHandlers } from './logServer'
// import type { ServerWebSocket } from 'bun'

// interface WsData {
//   clientId: string
//   authenticated: boolean
// }

// // Proceso activo por cliente
// const activeProcs = new Map<string, ReturnType<typeof Bun.spawn>>()

// export function createWsServer() {
//   Bun.serve<WsData>({
//     port: 4001,

//     fetch(req, server) {
//       const url    = new URL(req.url)
//       const token  = url.searchParams.get('token')
//       const clientId = crypto.randomUUID()

//       // Verificar JWT antes de hacer upgrade
//       try {
//         jwt.verify(token || '', process.env.JWT_SECRET || 'secret')
//       } catch {
//         return new Response('Unauthorized', { status: 401 })
//       }

//       const upgraded = server.upgrade(req, {
//         data: { clientId, authenticated: true }
//       })

//       return upgraded
//         ? undefined
//         : new Response('WebSocket upgrade failed', { status: 500 })
//     },

//     websocket: {
//       async open(ws: ServerWebSocket<WsData>) {
//         ws.send(JSON.stringify({
//           type: 'connected',
//           message: '🟢 Conectado al servidor de logs'
//         }))
//       },

//       async message(ws: ServerWebSocket<WsData>, raw: string | Buffer) {
//         const msg = JSON.parse(raw.toString()) as {
//           action: 'subscribe' | 'unsubscribe'
//           topic:  string          // 'nginx' | 'certbot' | 'system' | 'docker:project'
//         }

//         if (msg.action === 'subscribe') {
//           await startStream(ws, msg.topic)
//         }

//         if (msg.action === 'unsubscribe') {
//           stopStream(ws.data.clientId)
//           ws.send(JSON.stringify({ type: 'unsubscribed' }))
//         }
//       },

//       close(ws: ServerWebSocket<WsData>) {
//         stopStream(ws.data.clientId)
//       },
//     },
//   })

//   console.log('WebSocket server en :4001')
// }

// async function startStream(ws: ServerWebSocket<WsData>, topic: string) {
//   // Detener stream previo si existe
//   stopStream(ws.data.clientId)

//   const [type, project] = topic.split(':')

//   const proc = type === 'docker' && project
//     ? logHandlers.docker(project)
//     : logHandlers[type as keyof typeof logHandlers]?.()

//   if (!proc) {
//     ws.send(JSON.stringify({ type: 'error', message: `Topic "${topic}" no válido` }))
//     return
//   }

//   activeProcs.set(ws.data.clientId, proc)

//   ws.send(JSON.stringify({ type: 'subscribed', topic }))

//   // Stream stdout
//   streamOutput(ws, proc.stdout, 'log')
//   // Stream stderr
//   streamOutput(ws, proc.stderr, 'error')

//   // Detectar si el proceso termina
//   proc.exited.then((code) => {
//     ws.send(JSON.stringify({
//       type: 'ended',
//       message: `Proceso terminó con código ${code}`
//     }))
//   })
// }

// async function streamOutput(
//   ws: ServerWebSocket<WsData>,
//   stream: ReadableStream | null,
//   logType: 'log' | 'error'
// ) {
//   if (!stream) return

//   const reader = stream.getReader()
//   const decoder = new TextDecoder()

//   try {
//     while (true) {
//       const { done, value } = await reader.read()
//       if (done) break

//       const lines = decoder.decode(value).split('\n').filter(Boolean)

//       for (const line of lines) {
//         ws.send(JSON.stringify({
//           type: logType,
//           line,
//           timestamp: new Date().toISOString(),
//         }))
//       }
//     }
//   } catch {
//     // WS cerrado, ignorar
//   }
// }

// function stopStream(clientId: string) {
//   const proc = activeProcs.get(clientId)
//   if (proc) {
//     proc.kill()
//     activeProcs.delete(clientId)
//   }
// }