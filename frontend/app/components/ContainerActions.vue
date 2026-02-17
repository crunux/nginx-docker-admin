<script setup lang="ts">

	export interface ContainerActionsProps {
		id: string
		name: string
		image: string
		status: string
		state: 'running' | 'exited' | 'paused' | 'restarting' | 'dead'
		ports: string
		created: string
		project: string
	}

	const props = defineProps<ContainerActionsProps>()
	const emit = defineEmits(['refresh'])

	const { post, delete: del } = useApi()
	const toast = useToast()

	const LABELS: Record<string, string> = {
		start: '▶️ Contenedor iniciado',
		stop: '⏹️ Contenedor detenido',
		restart: '🔄 Contenedor reiniciado',
	}

	async function action(type: 'start' | 'stop' | 'restart') {
		await post(`/api/docker/containers/${props.id}/${type}`, {})
		toast.add({ title: LABELS[type], color: 'success' })
		emit('refresh')
	}

	async function remove() {
		if (!confirm(`¿Eliminar ${props.name}?`)) return
		await del(`/api/docker/containers/${props.id}`)
		toast.add({ title: '🗑️ Contenedor eliminado', color: 'warning' })
		emit('refresh')
	}
</script>
<template>
	<div class="flex gap-1">
		<UTooltip text="Iniciar">
			<UButton size="xs"
				color="success"
				variant="ghost"
				icon="i-heroicons-play"
				:disabled="state === 'running'"
				@click="action('start')" />
		</UTooltip>

		<UTooltip text="Reiniciar">
			<UButton size="xs"
				color="warning"
				variant="ghost"
				icon="i-heroicons-arrow-path"
				:disabled="state !== 'running'"
				@click="action('restart')" />
		</UTooltip>

		<UTooltip text="Detener">
			<UButton size="xs"
				color="error"
				variant="ghost"
				icon="i-heroicons-stop"
				:disabled="state !== 'running'"
				@click="action('stop')" />
		</UTooltip>

		<UTooltip text="Eliminar">
			<UButton size="xs"
				color="error"
				variant="ghost"
				icon="i-heroicons-trash"
				@click="remove" />
		</UTooltip>
	</div>
</template>
