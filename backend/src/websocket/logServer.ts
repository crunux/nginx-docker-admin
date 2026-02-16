import { $} from 'bun'


const PROJECTS_DIR = process.env.PROJECTS_DIR || '/var/www'

// Guarda los procesos activos por cliente
// const activeStreams = new Map<string, ReturnType<typeof Bun.spawn>>()

const OS = (await $`uname -s`.text()).trim()

const Platform = {
  linux: 'Linux',
  Darwin: 'MacOS',
  win32: 'Windows'
} as const

const CommandPlatform = {
  linux: ['journalctl', '-f', '-n', '50'],
  Darwin: ['log', 'stream'],
  win32: ['Get-WinEvent', '-LogName', 'System', '-MaxEvents', '50']
}
type PlatformKey = keyof typeof Platform

console.log(Platform[OS as PlatformKey] || "Unknown Platform");


const commandSystemLog: string[] = CommandPlatform[OS as PlatformKey]


export type LogTopic =
| { type: 'nginx' }
| { type: 'docker'; project: string }
| { type: 'certbot' }
| { type: 'system' }


export const logHandlers = {

  
  nginx: () => Bun.spawn(
    ['tail', '-f', '/var/log/nginx/access.log', '/var/log/nginx/error.log'],
    { stdout: 'pipe', stderr: 'pipe' }
  ),

  docker: (project: string) => Bun.spawn(
    ['docker', 'logs', '--tail', '100', '--follow', `${project}`],
    { stdout: 'pipe', stderr: 'pipe' }
  ),

  certbot: () => Bun.spawn(
    ['tail', '-f', '/var/log/letsencrypt/letsencrypt.log'],
    { stdout: 'pipe', stderr: 'pipe' }
  ),

  system: () => Bun.spawn(
    commandSystemLog,
    { stdout: 'pipe', stderr: 'pipe' }
  ),
}
