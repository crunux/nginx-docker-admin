<script setup lang="ts">

	const { systemStats, connected, tokenExpired, connect, disconnect, subscribeStats } = useLogStream()


	const cards = [
		{
			title: 'Memory',
			// description: 'Monitorea el uso de memoria del sistema en tiempo real.',
			icon: 'i-lucide-memory-stick',
			orientation: 'horizontal' as const,
			color: 'info' as const,
			// highlightColor: "info",
			// highlight: true,
		},
		{
			title: 'CPU',
			// description: 'Monitorea el uso de CPU del sistema en tiempo real.',
			icon: 'i-lucide-cpu',
			orientation: 'horizontal' as const,
			color: 'success' as const,
			// highlightColor: "success",
			// highlight: true
		},
		{
			title: 'Disk',
			// description: 'Monitorea el uso del disco del sistema en tiempo real.',
			icon: 'i-lucide-hard-drive',
			orientation: 'horizontal' as const,
			color: 'warning' as const,
			// highlightColor: "warning",
			// highlight: true
		},
		{
			title: 'Network',
			// description: 'Monitorea el uso de red del sistema en tiempo real.',
			icon: 'i-lucide-network',
			orientation: 'horizontal' as const,
			color: 'error' as const,
			// highlightColor: "error",
			// highlight: true
		}
	]

	// watch(systemStats, (newStats) => {
	// 	console.log('[index-dashboard] systemStats actualizado:', newStats)
	// })

	onMounted(async () => {
		await connect()
		subscribeStats(2000)
	})
	onUnmounted(disconnect)
</script>
<template>
	<UDashboardPanel resizable>
		<template #header>
			<div class="flex items-center justify-center p-2">
				<!-- <h2 class="text-lg font-semibold">Dashboard Nginx, Docker Manager</h2> -->
				<!-- </div>
			<div class="flex items-center justify-between mx-2"> -->
				<div class="flex items-center gap-2">
					<span class="flex items-center gap-1 text-sm">
						<span class="w-2 h-2 rounded-full"
							:class="connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'" />
						{{ connected ? 'Conectado' : 'Desconectado' }}
					</span>
					<UButton size="xs"
						:color="connected ? 'error' : 'success'"
						@click="connected ? disconnect() : connect()">
						{{ connected ? 'Desconectar' : 'Conectar' }}
					</UButton>
				</div>
			</div>
		</template>
		<template #body>
			<UPageGrid>
				<UPageCard v-for="(card, index) in cards"
					:key="`${index}-${card.title}`"
					v-bind="card">
					<template #footer>
						<div v-if="card.title === 'Memory'"
							class="text-2xl font-bold">
							<UProgress :modelValue="systemStats?.ram ? parseFloat(`${systemStats.ram.percent}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.ram.percent || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.ram.percent || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.ram ? formatStat('ram', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'CPU'"
							class="text-2xl font-bold">
							<UProgress :modelValue="systemStats?.cpu ? parseFloat(`${systemStats.cpu.usage}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.cpu?.usage || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.cpu?.usage || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.cpu ? formatStat('cpu', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'Disk'"
							class="text-2xl font-bold">
							<UProgress :modelValue="systemStats?.disk ? parseFloat(`${systemStats.disk[0]?.percent}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.disk[0]?.percent || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.disk[0]?.percent || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.disk ? formatStat('disk', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'Network'"
							class="text-2xl font-bold">
							{{ systemStats?.network ? formatStat('network', systemStats) : '' }}
						</div>
					</template>
				</UPageCard>
			</UPageGrid>
		</template>
	</UDashboardPanel>
	<UDialog v-model="tokenExpired"
		title="Sesión Expirada"
		description="Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar."
		:closable="false"
		:footer="[
			{
				label: 'Ir a Login',
				to: '/login',
				color: 'primary',
				size: 'md'
			}
		]" />
</template>
<style scoped></style>
