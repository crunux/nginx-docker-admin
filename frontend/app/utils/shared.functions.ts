import type { SystemStats } from '~/types/systemInfo'

export const formatStat = (key: string, value: SystemStats): string => {
	switch (key) {
		case 'cpu':
			return `${Math.round(value.cpu.usage)}% (${value.cpu.cores.length} cores)`
		case 'ram': {
			const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(1)
			return `${gb(value.ram.used)} / ${gb(value.ram.total)} GB (${value.ram.percent}%)`
		}

		case 'disk': {
			const gb = (bytes: number) => (bytes / 1024 ** 3).toFixed(1)
			const primary = value.disk[0]
			// const secondary = value.disk[1]
			// if (secondary && primary) {
			// 	return ` primary: ${gb(primary.used)} / ${gb(primary.size)} GB (${primary.percent}%) - secondary: ${gb(secondary.used)} / ${gb(secondary.size)} GB (${secondary.percent}%)`
			// }
			if (!primary) return '—'
			return `${gb(primary.used)} / ${gb(primary.size)} GB (${primary.percent}%)`
		}

		case 'network': {
			const bps = (bytes: number) => {
				if (bytes <= 0) return '0 KB/s'
				if (bytes < 1024) return `${bytes.toFixed(0)} B/s`
				if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB/s`
				return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`
			}
			const active = value.network.find(n => n.rx_sec > 0 || n.tx_sec > 0)
			if (!active) return 'Sin actividad'
			return `${active.iface} ↓ ${bps(active.rx_sec)} ↑ ${bps(active.tx_sec)}`
		}

		default:
			return '—'
	}
}

export const Capitalize = (str: string): string => {
	if (!str) return ''
	return str.charAt(0).toUpperCase() + str.slice(1)
}
