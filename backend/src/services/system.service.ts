import si from 'systeminformation'

export interface CpuInfo {
  manufacturer: string
  brand:        string
  speed:        number
  cores:        number
  usage:        number
  cores_load:   number[]  // ← carga por core para el dashboard
}

export interface RamInfo {
  total:   number
  used:    number
  free:    number
  percent: number
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
  rx_sec:   number
  tx_sec:   number
}

export interface OsInfo {
  platform: string
  distro:   string
  release:  string
  hostname: string
  uptime:   number
}

export interface SystemInfo {
  source:  'host' | 'container'
  cpu:     CpuInfo
  ram:     RamInfo
  disk:    DiskInfo[]
  network: NetworkInfo[]
  os:      OsInfo
}

// ── Helpers ────────────────────────────────────────────────

const isRunningInDocker = async (): Promise<boolean> => {
  try {
    await Bun.file('/.dockerenv').text()
    return true
  } catch {
    return false
  }
}

const getSourceMode = async (): Promise<'host' | 'container'> => {
  const inDocker = await isRunningInDocker()
  if (!inDocker) return 'host'

  // Si /proc del host está montado, tenemos acceso a métricas reales
  try {
    const cpuinfo = await Bun.file('/proc/cpuinfo').text()
    return cpuinfo.length > 0 ? 'host' : 'container'
  } catch {
    return 'container'
  }
}

// ── Service ────────────────────────────────────────────────

export const systemService = {
  async getAll(): Promise<SystemInfo> {
    const [cpu, cpuLoad, mem, disks, network, os, source] = await Promise.all([
      si.cpu(),
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.osInfo(),
      getSourceMode(),
    ])

    return {
      source,

      cpu: {
        manufacturer: cpu.manufacturer,
        brand:        cpu.brand,
        speed:        cpu.speed,
        cores:        cpu.cores,
        usage:        Math.round(cpuLoad.currentLoad),
        cores_load:   cpuLoad.cpus.map(c => Math.round(c.load)),
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
        rx_sec:   n.rx_sec  ?? 0,
        tx_sec:   n.tx_sec  ?? 0,
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

  // Versión ligera para el WebSocket (solo lo que cambia frecuentemente)
  async getLive(): Promise<Pick<SystemInfo, 'cpu' | 'ram' | 'network' | 'source'>> {
    const [cpuLoad, mem, network, source] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.networkStats(),
      getSourceMode(),
    ])

    return {
      source,
      cpu: {
        manufacturer: '',
        brand:        '',
        speed:        0,
        cores:        cpuLoad.cpus.length,
        usage:        Math.round(cpuLoad.currentLoad),
        cores_load:   cpuLoad.cpus.map(c => Math.round(c.load)),
      },
      ram: {
        total:   mem.total,
        used:    mem.used,
        free:    mem.free,
        percent: Math.round((mem.used / mem.total) * 100),
      },
      network: network.map(n => ({
        iface:    n.iface,
        rx_bytes: n.rx_bytes,
        tx_bytes: n.tx_bytes,
        rx_sec:   n.rx_sec  ?? 0,
        tx_sec:   n.tx_sec  ?? 0,
      })),
    }
  },

  async getCpu()     { return (await si.currentLoad()).currentLoad },
  async getRam()     { return si.mem() },
  async getDisks()   { return si.fsSize() },
  async getNetwork() { return si.networkStats() },
}
// import si from 'systeminformation'

// export interface SystemInfo {
//   cpu:     CpuInfo
//   ram:     RamInfo
//   disk:    DiskInfo[]
//   network: NetworkInfo[]
//   os:      OsInfo
// }

// export interface CpuInfo {
//   manufacturer: string
//   brand:        string
//   speed:        number
//   cores:        number
//   usage:        number
// }

// export interface RamInfo {
//   total:     number
//   used:      number
//   free:      number
//   percent:   number
// }

// export interface DiskInfo {
//   fs:        string
//   mount:     string
//   size:      number
//   used:      number
//   available: number
//   percent:   number
// }

// export interface NetworkInfo {
//   iface:    string
//   rx_bytes: number
//   tx_bytes: number
//   rx_sec:   number | null
//   tx_sec:   number | null
// }

// export interface OsInfo {
//   platform:  string
//   distro:    string
//   release:   string
//   hostname:  string
//   uptime:    number
// }

// export const systemService = {
//   async getAll(): Promise<SystemInfo> {
//     const [cpu, cpuLoad, mem, disks, network, os] = await Promise.all([
//       si.cpu(),
//       si.currentLoad(),
//       si.mem(),
//       si.fsSize(),
//       si.networkStats(),
//       si.osInfo(),
//     ])

//     return {
//       cpu: {
//         manufacturer: cpu.manufacturer,
//         brand:        cpu.brand,
//         speed:        cpu.speed,
//         cores:        cpu.cores,
//         usage:        Math.round(cpuLoad.currentLoad),
//       },

//       ram: {
//         total:   mem.total,
//         used:    mem.used,
//         free:    mem.free,
//         percent: Math.round((mem.used / mem.total) * 100),
//       },

//       disk: disks.map(d => ({
//         fs:        d.fs,
//         mount:     d.mount,
//         size:      d.size,
//         used:      d.used,
//         available: d.available,
//         percent:   Math.round(d.use),
//       })),

//       network: network.map(n => ({
//         iface:    n.iface,
//         rx_bytes: n.rx_bytes,
//         tx_bytes: n.tx_bytes,
//         rx_sec:   n.rx_sec,
//         tx_sec:   n.tx_sec,
//       })),

//       os: {
//         platform: os.platform,
//         distro:   os.distro,
//         release:  os.release,
//         hostname: os.hostname,
//         uptime:   si.time().uptime,
//       },
//     }
//   },

//   async getCpu()     { return (await si.currentLoad()).currentLoad },
//   async getRam()     { return si.mem() },
//   async getDisks()   { return si.fsSize() },
//   async getNetwork() { return si.networkStats() },
// }