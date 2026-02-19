<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const titleDashboard = computed(() => {
	if (route.name?.toString() && route.name.toString().startsWith('dashboard-')) {
		const title = route.name.toString().split('-')[1]
		return `${Capitalize(title as string)}`
	}
	return 'Dashboard'
})

const menuItems = computed<NavigationMenuItem[][]>(() => [
	[
		{
			label: 'Home',
			icon: 'i-heroicons-home',
			to: '/dashboard',
			active: route.path.startsWith('/dashboard') && !route.path.startsWith('/dashboard/sites') && !route.path.startsWith('/dashboard/subdomains') && !route.path.startsWith('/dashboard/docker') && !route.path.startsWith('/dashboard/logs') && !route.path.startsWith('/dashboard/config')
		},
		{
			label: 'Sites',
			icon: 'i-heroicons-globe-alt',
			to: '/dashboard/sites',
			active: route.path.startsWith('/dashboard/sites')
		},
		{
			label: 'Subdomains',
			icon: 'i-heroicons-link',
			to: '/dashboard/subdomains',
			active: route.path.startsWith('/dashboard/subdomains')
		},
		{
			label: 'Docker',
			icon: 'i-heroicons-cube',
			to: '/dashboard/docker',
			active: route.path.startsWith('/dashboard/docker')
		},
		{
			label: 'Logs',
			icon: 'i-heroicons-document-text',
			to: '/dashboard/logs',
			active: route.path.startsWith('/dashboard/logs')
		},
		{
			label: 'Settings',
			icon: 'i-heroicons-cog-6-tooth',
			to: '/dashboard/config',
			active: route.path.startsWith('/dashboard/config')
		}
	],
	[
		{
			label: 'github',
			icon: 'i-simple-icons-github',
			to: 'https://github.com/crunux/nginx-docker-admin',
			target: '_blank'
		}
	]
])
</script>

<template>
	<UDashboardGroup>
		<UDashboardSidebar
			:open="true"
			toggle-side="right"
		>
			<template #header>
				<div class="flex items-center gap-2 px-4 py-3">
					<div class="w-6 h-6 bg-gray-500 rounded-full" />
					<span class="text-lg font-semibold">SiteCore</span>
				</div>
			</template>
			<template #default>
				<UNavigationMenu
					:items="menuItems[0]"
					orientation="vertical"
				/>
				<UNavigationMenu
					:items="menuItems[1]"
					orientation="vertical"
					class="mt-auto"
				/>
			</template>
			<template #footer>
				<div class="px-4 py-3">
					<span class="text-sm text-gray-500">© 2026 SiteCore</span>
				</div>
			</template>
		</UDashboardSidebar>
		<UDashboardPanel>
			<!-- <template #header> -->
			<UDashboardNavbar
				:title="titleDashboard"
			/>
			<!-- </template> -->
			<!-- <template #default> -->
			<slot />
			<!-- </template> -->
			<!-- <slot /> -->
		</UDashboardPanel>
	</UDashboardGroup>
	<!-- <UApp>
		<UHeader
			mode="slideover"
			class="w-full"
			title="SiteCore"
		>
			<UNavigationMenu :items="menuItems" />
			<template #right>
				<UButton
					color="neutral"
					variant="ghost"
					to="https://github.com/crunux/nginx-docker-admin"
					target="_blank"
					icon="i-simple-icons-github"
					aria-label="GitHub"
				/>
			</template>
			<template #body>
				<UNavigationMenu
					:items="menuItems"
					orientation="vertical"
					class="-mx-2.5"
				/>
			</template>
		</UHeader>
		<UMain>
			<slot />
		</UMain>
		<UFooter />
	</UApp> -->
</template>
