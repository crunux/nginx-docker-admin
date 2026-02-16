import si from 'systeminformation'

export interface SystemInfo {
  cpu:     CpuInfo
  ram:     RamInfo
  disk:    DiskInfo[]
  network: NetworkInfo[]
  os:      OsInfo
}

export interface CpuInfo {
  manufacturer: string
  brand:        string
  speed:        number
  cores:        number
  usage:        number
}

export interface RamInfo {
  total:     number
  used:      number
  free:      number
  percent:   number
}

export interface DiskInfo {
  fs:        string
  mount:     string
  size:      number
  used:      number
  available: number
  percent:   number
}

export interface NetworkInfo {
  iface:    string
  rx_bytes: number
  tx_bytes: number
  rx_sec:   number | null
  tx_sec:   number | null
}

export interface OsInfo {
  platform:  string
  distro:    string
  release:   string
  hostname:  string
  uptime:    number
}

export const systemService = {
  async getAll(): Promise<SystemInfo> {
    const [cpu, cpuLoad, mem, disks, network, os] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
    ])

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand:        cpu.brand,
        speed:        cpu.speed,
        cores:        cpu.cores,
        usage:        Math.round(cpuLoad.currentLoad),
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
        iface:    n.iface,
        rx_bytes: n.rx_bytes,
        tx_bytes: n.tx_bytes,
        rx_sec:   n.rx_sec,
        tx_sec:   n.tx_sec,
      })),

      os: {
        platform: os.platform,
        distro:   os.distro,
        release:  os.release,
        hostname: os.hostname,
        uptime:   si.time().uptime,
      },
    }
  },

  async getCpu()     { return (await si.currentLoad()).currentLoad },
  async getRam()     { return si.mem() },
  async getDisks()   { return si.fsSize() },
  async getNetwork() { return si.networkStats() },
}