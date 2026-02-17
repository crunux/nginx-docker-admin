<script setup lang="ts">
	import type { NavigationMenuItem } from '@nuxt/ui';

	const route = useRoute();

	const menuItems = computed<NavigationMenuItem[]>(() => [
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
		// {
		// 	label: 'github',
		// 	icon: 'i-simple-icons-github',
		// 	to: 'https://github.com/crunux/nginx-docker-admin',
		// 	target: '_blank'
		// }
	])

</script>
<template>
	<UHeader mode="slideover"
		class="w-full"
		title="Ngnix Manager">
		<UNavigationMenu :items="menuItems" />
		<template #right>

			<UButton color="neutral"
				variant="ghost"
				to="https://github.com/crunux/nginx-docker-admin"
				target="_blank"
				icon="i-simple-icons-github"
				aria-label="GitHub" />
		</template>
		<template #body>
			<UNavigationMenu :items="menuItems"
				orientation="vertical"
				class="-mx-2.5" />
		</template>
	</UHeader>
	<!-- <UDashboardGroup>
		<UDashboardSidebar /> -->
	<UMain>
		<slot />
	</UMain>
	<!-- </UDashboardGroup> -->
	<UFooter>
	</UFooter>
</template>
