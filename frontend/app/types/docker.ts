// frontend/types/docker.ts
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

export interface DockerProject {
  name:       string
  path:       string
  containers: DockerContainer[]
  running:    number
  total:      number
  hasCompose: boolean
  compose:    string
}

export interface DockerStats {
  id:         string
  name:       string
  cpuPercent: string
  memUsage:   string
  memPercent: string
  netIO:      string
  blockIO:    string
}

export interface DockerImage {
  repository: string
  tag:        string
  id:         string
  size:       string
  createdAt:  string
}
