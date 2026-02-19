<script setup lang="ts">
import type { AppConfig } from '~/types/config'

const { config, load, save, reset } = useConfig()
const toast = useToast()
const saving = ref(false)
const reseting = ref(false)

const form = reactive<AppConfig>({
	nginx: {
		sitesAvailable: '/etc/nginx/sites-available',
		sitesEnabled: '/etc/nginx/sites-enabled',
		configDir: '/etc/nginx',
		logDir: '/var/log/nginx'
	},
	stats: {
		source: 'host',
		interval: 2000
	},
	ui: {
		language: 'es',
		theme: 'system'
	}
})

// Sincronizar form con config cargada
watch(config, (val) => {
	if (val) Object.assign(form, val)
}, { deep: true, immediate: true })

async function handleSave() {
	saving.value = true
	try {
		await save(form)
		toast.add({ title: '✅ Configuración guardada', color: 'success' })
	} finally {
		saving.value = false
	}
}

async function handleReset() {
	if (!confirm('¿Restaurar configuración por defecto?')) return
	reseting.value = true
	try {
		await reset()
		toast.add({ title: '🔄 Configuración restaurada', color: 'warning' })
	} finally {
		reseting.value = false
	}
}

onMounted(load)
</script>

<template>
	<div class="p-6 space-y-8 max-w-3xl mx-auto">
		<!-- Header -->
		<div class="flex flex-col md:flex-row items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold">
					Configuración
				</h2>
				<p class="text-sm text-muted mt-1">
					Ajustes generales del panel
				</p>
			</div>
			<div class="flex gap-2">
				<UButton
					color="neutral"
					variant="ghost"
					icon="i-heroicons-arrow-path"
					:loading="reseting"
					@click="handleReset"
				>
					Restaurar
				</UButton>
				<UButton
					icon="i-heroicons-check"
					:loading="saving"
					@click="handleSave"
				>
					Guardar
				</UButton>
			</div>
		</div>

		<!-- Rutas Nginx -->
		<UPageCard
			title="Rutas Nginx"
			icon="i-heroicons-server"
			description="Directorios de configuración del servidor Nginx"
		>
			<template #description>
				<div class="space-y-4 mt-4">
					<UFormField label="Sites Available">
						<UInput
							v-model="form.nginx.sitesAvailable"
							font-mono
							icon="i-heroicons-folder"
							placeholder="/etc/nginx/sites-available"
						/>
					</UFormField>
					<UFormField label="Sites Enabled">
						<UInput
							v-model="form.nginx.sitesEnabled"
							icon="i-heroicons-folder-open"
							placeholder="/etc/nginx/sites-enabled"
						/>
					</UFormField>
					<UFormField label="Directorio de configuración">
						<UInput
							v-model="form.nginx.configDir"
							icon="i-heroicons-cog-6-tooth"
							placeholder="/etc/nginx"
						/>
					</UFormField>
					<UFormField label="Directorio de logs">
						<UInput
							v-model="form.nginx.logDir"
							icon="i-heroicons-document-text"
							placeholder="/var/log/nginx"
						/>
					</UFormField>
				</div>
			</template>
		</UPageCard>

		<!-- Fuente de estadísticas -->
		<UPageCard
			title="Fuente de estadísticas"
			icon="i-heroicons-chart-bar"
			description="Define desde dónde se obtienen las métricas del sistema"
		>
			<template #description>
				<div class="space-y-4 mt-4">
					<UFormField label="Fuente">
						<USelectMenu
							v-model="form.stats.source"
							:options="[
								{ label: 'Host (máquina física)', value: 'host' },
								{ label: 'Container (Docker)', value: 'container' }
							]"
							value-attribute="value"
							option-attribute="label"
						/>
					</UFormField>

					<UAlert
						v-if="form.stats.source === 'host'"
						color="primary"
						variant="soft"
						icon="i-heroicons-information-circle"
						title="Modo Host"
						description="Las estadísticas se obtienen directamente del sistema. Para Docker, asegúrate de montar /proc y /sys del host."
					/>

					<UAlert
						v-if="form.stats.source === 'container'"
						color="warning"
						variant="soft"
						icon="i-heroicons-exclamation-triangle"
						title="Modo Container"
						description="Las estadísticas mostrarán los recursos del contenedor, no del host. Los valores pueden no reflejar el estado real del servidor."
					/>

					<UFormField label="Intervalo de actualización (ms)">
						<UInput
							v-model.number="form.stats.interval"
							type="number"
							:min="500"
							:max="30000"
							:step="500"
							icon="i-heroicons-clock"
						/>
						<template #help>
							Mínimo 500ms — valores bajos aumentan el uso de CPU
						</template>
					</UFormField>
				</div>
			</template>
		</UPageCard>

		<!-- UI -->
		<UPageCard
			title="Interfaz"
			icon="i-heroicons-paint-brush"
			description="Preferencias de visualización"
		>
			<template #description>
				<div class="space-y-4 mt-4">
					<UFormField label="Idioma">
						<USelectMenu
							v-model="form.ui.language"
							:options="[
								{ label: 'Español', value: 'es' },
								{ label: 'English', value: 'en' }
							]"
							value-attribute="value"
							option-attribute="label"
						/>
					</UFormField>

					<UFormField label="Tema">
						<UColorModeButton />
						<!-- <USelectMenu v-model="form.ui.theme"
							:options="[
								{ label: 'Sistema (automático)', value: 'system' },
								{ label: 'Claro', value: 'light' },
								{ label: 'Oscuro', value: 'dark' },
							]"
							value-attribute="value"
							option-attribute="label" /> -->
					</UFormField>
				</div>
			</template>
		</UPageCard>
	</div>
</template>
