export interface StatsLogMessage {
	type: 'stats'
	data: SystemStats
}

export interface CpuStats {
	usage: number
	cores: number[]
}

export interface RamStats {
	total: number
	used: number
	free: number
	percent: number
}

export interface DiskStat {
	fs: string
	mount: string
	size: number
	used: number
	available: number
	percent: number
}

export interface NetworkStat {
	iface: string
	rx_sec: number
	tx_sec: number
}

export interface SystemStats {
	cpu: CpuStats
	ram: RamStats
	disk: DiskStat[]
	network: NetworkStat[]
	timestamp: number
}
