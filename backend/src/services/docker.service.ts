import { $ } from 'bun'
import path from 'path'
import fs from 'fs/promises'
import { mapSystemError } from '../utils/errors'

const PROJECTS_DIR = process.env.PROJECTS_DIR || '/var/www'

export interface DockerContainer {
  id:      string
  name:    string
  image:   string
  status:  string
  state:   'running' | 'exited' | 'paused' | 'restarting' | 'dead'
  ports:   string
  created: string
  project: string
}

// Separador que NUNCA aparece en output de docker
const SEP = "|"

export const dockerService = {
  async listContainers(): Promise<DockerContainer[]> {
    try {
      // Usamos \x00 (null byte) como separador seguro
      const format = `{{.ID}}${SEP}{{.Names}}${SEP}{{.Image}}${SEP}{{.Status}}${SEP}{{.State}}${SEP}{{.Ports}}${SEP}{{.CreatedAt}}`
      // const format = "{{.ID}}|{{.Names}}|{{.Image}}|{{.Status}}|{{.State}}|{{.Ports}}"

      const out = await $`docker ps -a --format ${format}`.nothrow().text()

      if (!out.trim()) return []

      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [id, name, image, status, state, ports, created] = line.split(SEP)

          return {
            id:      id?.trim()                        || '',
            name:    name?.trim().replace(/^\//, '')   || '',
            image:   image?.trim()                     || '',
            status:  status?.trim()                    || '',
            state:   (state?.trim() || 'exited') as DockerContainer['state'],
            ports:   ports?.trim()                     || '',
            created: created?.trim()                   || '',
            project: detectProject(name?.trim()        || ''),
          }
        })

    } catch (err) {
      console.error('[docker] error:', err)
      throw mapSystemError(err)
    }
  },

  async getStats(): Promise<any[]> {
    try {
      const format = `{{.ID}}${SEP}{{.Name}}${SEP}{{.CPUPerc}}${SEP}{{.MemUsage}}${SEP}{{.MemPerc}}${SEP}{{.NetIO}}${SEP}{{.BlockIO}}`

      // const format = "{{.ID}}|{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}|{{.NetIO}}|{{.BlockIO}}"
      const out    = await $`docker stats --no-stream --format ${format}`.nothrow().text()

      if (!out.trim()) return []

      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [id, name, cpuPercent, memUsage, memPercent, netIO, blockIO] = line.split(SEP)
          return { id, name, cpuPercent, memUsage, memPercent, netIO, blockIO }
        })
    } catch (err) {
      throw mapSystemError(err)
    }
  },

  async listImages(): Promise<any[]> {
    try {
      const format = `{{.Repository}}${SEP}{{.Tag}}${SEP}{{.ID}}${SEP}{{.Size}}${SEP}{{.CreatedAt}}`

      const out    = await $`docker images --format ${format}`.nothrow().text()

      if (!out.trim()) return []

      return out
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [repository, tag, id, size, createdAt] = line.split(SEP)
          return { repository, tag, id, size, createdAt }
        })
    } catch (err) {
      throw mapSystemError(err)
    }
  },

  async listProjects(): Promise<any[]> {
    try {
      const containers = await this.listContainers()

      let dirs: string[] = []
      try {
        const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
        dirs = entries.filter(e => e.isDirectory()).map(e => e.name)
      } catch {
        console.warn(`[docker] PROJECTS_DIR "${PROJECTS_DIR}" no existe`)
      }

      // Agrupar contenedores por proyecto
      const projectMap = new Map<string, DockerContainer[]>()
      for (const c of containers) {
        const key = c.project || 'standalone'
        if (!projectMap.has(key)) projectMap.set(key, [])
        projectMap.get(key)!.push(c)
      }

      const projects = []

      // Proyectos con directorio
      for (const dir of dirs) {
        const projectPath = path.join(PROJECTS_DIR, dir)
        const composePath = path.join(projectPath, 'docker-compose.yml')
        const hasCompose  = await Bun.file(composePath).exists()
        const compose     = hasCompose ? await Bun.file(composePath).text() : ''
        const conts       = projectMap.get(dir) || []

        projects.push({
          name: dir, path: projectPath,
          containers: conts,
          running: conts.filter(c => c.state === 'running').length,
          total:   conts.length,
          hasCompose, compose,
        })

        projectMap.delete(dir)
      }

      // Contenedores sin directorio
      for (const [name, conts] of projectMap.entries()) {
        projects.push({
          name, path: '',
          containers: conts,
          running: conts.filter(c => c.state === 'running').length,
          total:   conts.length,
          hasCompose: false, compose: '',
        })
      }

      return projects

    } catch (err) {
      throw mapSystemError(err)
    }
  },

  async buildAndDeploy(projectName: string, composeContent: string): Promise<string> {
    const projectPath = path.join(PROJECTS_DIR, projectName)
    await fs.mkdir(projectPath, { recursive: true })
    await Bun.write(path.join(projectPath, 'docker-compose.yml'), composeContent)
    return $`docker compose -f ${projectPath}/docker-compose.yml up -d --build`.nothrow().text()
  },

  async startProject(name: string):   Promise<string> {
    return $`docker compose -f ${path.join(PROJECTS_DIR, name)}/docker-compose.yml up -d`.nothrow().text()
  },
  async stopProject(name: string):    Promise<string> {
    return $`docker compose -f ${path.join(PROJECTS_DIR, name)}/docker-compose.yml down`.nothrow().text()
  },
  async restartProject(name: string): Promise<string> {
    return $`docker compose -f ${path.join(PROJECTS_DIR, name)}/docker-compose.yml restart`.nothrow().text()
  },

  async startContainer(id: string):   Promise<void> { await $`docker start   ${id}` },
  async stopContainer(id: string):    Promise<void> { await $`docker stop    ${id}` },
  async restartContainer(id: string): Promise<void> { await $`docker restart ${id}` },
  async removeContainer(id: string):  Promise<void> { await $`docker rm -f   ${id}` },

  async pullImage(image: string): Promise<string> {
    return $`docker pull ${image}`.nothrow().text()
  },

  async pruneSystem(): Promise<string> {
    return $`docker system prune -f`.nothrow().text()
  },

  async getLogs(projectName: string): Promise<string> {
    const projectPath = path.join(PROJECTS_DIR, projectName)
    const hasCompose  = await Bun.file(path.join(projectPath, 'docker-compose.yml')).exists()

    if (hasCompose) {
      return $`docker compose -f ${projectPath}/docker-compose.yml logs --tail=100`.nothrow().text()
    }
    return $`docker logs --tail=100 ${projectName}`.nothrow().text()
  },
}

// docker compose nombra: proyecto-servicio-1
function detectProject(name: string): string {
  const clean = name.replace(/^\//, '')
  const parts = clean.split('-')
  if (parts.length >= 3) return parts.slice(0, -2).join('-')
  if (parts.length === 2) return parts[0]?.trim() || 'standalone'
  return 'standalone'
}