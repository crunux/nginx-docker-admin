<script setup lang="ts">
	import type { Dependency } from '~/types/config'

	const props = defineProps<{
		name: string
		label: string
		icon: string
		dependency: Dependency | null
		loading: boolean
	}>()

	const emit = defineEmits<{
		install: [name: string]
	}>()
</script>

<template>
	<UPageCard :title="label"
		:icon="icon"
		:ui="{
			root: 'border',
			header: 'pb-0',
		}">
		<template #description>
			<div class="flex flex-col gap-3">

				<!-- Estado -->
				<div class="flex items-center gap-2">
					<UIcon :name="dependency?.installed
						? 'i-heroicons-check-circle'
						: 'i-heroicons-x-circle'"
						:class="dependency?.installed ? 'text-success' : 'text-error'"
						class="text-xl" />
					<span class="text-sm font-medium">
						{{ dependency?.installed ? 'Instalado' : 'No instalado' }}
					</span>
				</div>

				<!-- Versión -->
				<p v-if="dependency?.installed && dependency?.version"
					class="text-xs font-mono text-muted truncate">
					{{ dependency.version }}
				</p>

				<!-- Botón instalar -->
				<UButton v-if="!dependency?.installed"
					size="xs"
					color="primary"
					variant="soft"
					icon="i-heroicons-arrow-down-tray"
					:loading="loading"
					block
					@click="emit('install', name)">
					Instalar
				</UButton>
			</div>
		</template>
	</UPageCard>
</template>
