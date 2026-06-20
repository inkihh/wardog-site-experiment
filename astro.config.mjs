// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Production runs on GitHub Pages under the custom domain dayzmodders.inkihh.de,
// which serves from the domain root — so no `base` / sub-path is needed.
const SITE = 'https://dayzmodders.inkihh.de';

// Source repository — drives the GitHub social link and per-page "Edit" links.
const REPO = 'https://github.com/inkihh/wardog-site-experiment';

// Open every external link in a new tab. A small client-side pass covers them
// all in one place — header social icons, hero buttons, per-page "Edit" links,
// footer links, and inline content links — regardless of which component
// rendered them. Same-origin links stay in the same tab.
const OPEN_EXTERNAL_IN_NEW_TAB = `
(() => {
	const fix = () => {
		for (const a of document.querySelectorAll('a[href]')) {
			let url;
			try { url = new URL(a.href, location.href); } catch (e) { continue; }
			if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
			if (url.hostname === location.hostname) continue;
			a.target = '_blank';
			const rel = new Set((a.getAttribute('rel') || '').split(/\\s+/).filter(Boolean));
			rel.add('noopener'); rel.add('noreferrer');
			a.setAttribute('rel', [...rel].join(' '));
		}
	};
	if (document.readyState !== 'loading') fix();
	else document.addEventListener('DOMContentLoaded', fix);
	document.addEventListener('astro:page-load', fix);
})();
`;

// https://astro.build/config
export default defineConfig({
	site: SITE,
	integrations: [
		starlight({
			title: 'DayZ Modders',
			description:
				'A community-maintained knowledge base for DayZ modding — scripting, asset work, tooling, and onboarding.',
			logo: {
				src: './src/assets/logo-split.svg',
				alt: 'DayZ Modders',
			},
			social: [
				{ icon: 'github', label: 'GitHub', href: REPO },
				{ icon: 'discord', label: 'Discord', href: 'https://discord.gg/EAMvFw9P93' },
			],
			editLink: {
				baseUrl: `${REPO}/edit/main/`,
			},
			lastUpdated: true,
			// Dark-only: force the dark theme and remove the theme switcher.
			components: {
				ThemeProvider: './src/components/ThemeProvider.astro',
				ThemeSelect: './src/components/ThemeSelect.astro',
				// Always-on draft notice pinned to the top of every page.
				Banner: './src/components/Banner.astro',
				// Default footer + site-wide legal / contact links.
				Footer: './src/components/Footer.astro',
			},
			// Open all external links in a new tab.
			head: [{ tag: 'script', content: OPEN_EXTERNAL_IN_NEW_TAB }],
			// Fonts are self-hosted via @fontsource (no external runtime dependency),
			// then the theme is layered on top.
			customCss: [
				'@fontsource-variable/inter',
				'@fontsource-variable/oswald',
				'./src/styles/theme.css',
			],
			// Discipline-based taxonomy. Each group autogenerates from its directory,
			// so contributors only add a Markdown file to extend the nav. Groups are
			// collapsed by default to keep the sidebar tidy as content grows.
			sidebar: [
				{
					label: 'Getting Started',
					collapsed: false,
					items: [{ autogenerate: { directory: 'getting-started' } }],
				},
				{
					label: 'Scripting',
					collapsed: true,
					items: [{ autogenerate: { directory: 'scripting' } }],
				},
				{
					label: 'Asset Work',
					collapsed: true,
					items: [{ autogenerate: { directory: 'asset-work' } }],
				},
				{
					label: 'Tooling & Setup',
					collapsed: true,
					items: [{ autogenerate: { directory: 'tooling-setup' } }],
				},
				{
					label: 'Contributing',
					collapsed: true,
					items: [{ autogenerate: { directory: 'contributing' } }],
				},
			],
		}),
	],
});
