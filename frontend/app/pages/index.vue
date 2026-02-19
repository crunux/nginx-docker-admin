<template>
	<div>
		<UPageHero
			description="The production-ready dashboard to handle domains,
  real-time logs, and SSL certificates instantly."
			:links="[{
				label: 'Go Dashboard',
				to: '/dashboard/sites',
				// target: '_blank',
				trailingIcon: 'i-lucide-monitor-cog',
				size: 'xl'
			}, {
				label: 'Go Logs',
				to: '/dashboard/logs',
				icon: 'i-lucide-cog',
				size: 'xl',
				color: 'neutral',
				variant: 'subtle'
			}]"
		>
			<template #title>
				<h1>'<span className="text-blue-600">SiteCore</span>'</h1>
			</template>
		</UPageHero>

		<UPageSection
			id="features"
			title="Everything you need to manage your server"
			description="Only deploy on server."
			:features="[
				{
					icon: 'i-lucide-server',
					title: 'Zero-Config Reverse Proxy',
					description: 'Create and manage Nginx server blocks through an intuitive interface. No more manual .conf editing or syntax errors—just clean, automated routing.'
				},
				{
					icon: 'i-lucide-container',
					title: 'Docker Lifecycle at a Glance',
					description: 'Monitor, start, stop, and restart containers directly from your dashboard. Complete visibility into your microservices without touching the CLI.'
				},
				{
					icon: 'i-lucide-shield-check',
					title: 'One-Click SSL Certificates',
					description: 'Automated Let’s Encrypt integration. Secure your domains with SSL in seconds and let our system handle the auto-renewals for you.'
				},
				{
					icon: 'i-lucide-terminal',
					title: 'Real-time Live Logs',
					description: 'Stream system and container logs via WebSockets. Debug issues instantly with a low-latency terminal view that brings SSH-level control to your browser.'
				},
				{
					icon: 'i-lucide-activity',
					title: 'Health & Status Monitoring',
					description: 'Get instant feedback on your infrastructure. Real-time status indicators for Nginx, Docker containers, and server resources to ensure 100% uptime.'
				},
				{
					icon: 'i-lucide-cpu',
					title: 'Production-Ready Architecture',
					description: 'Built for high-performance environments. Optimized for scale with audit logs, role-based access, and secure system-level integrations.'
				}
			]"
		/>

		<UPageSection>
			<UPageCTA
				title="Ready to deploy your next tools?"
				description="Join thousands of developers management with tools, easy nginx and docker orquetations. Get this tool and deploy."
				variant="subtle"
				:links="[{
					label: 'Start docs',
					to: 'https://crunux.me/docs/nginx-docker-admin',
					target: '_blank',
					trailingIcon: 'i-lucide-arrow-right',
					color: 'neutral'
				}, {
					label: 'View on GitHub',
					to: 'https://github.com/crunux/nginx-docker-admin',
					target: '_blank',
					icon: 'i-simple-icons-github',
					color: 'neutral',
					variant: 'outline'
				}]"
			/>
		</UPageSection>
	</div>
</template>
