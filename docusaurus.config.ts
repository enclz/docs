import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Enclz Docs',
  tagline: 'On-chain spend policy for AI agents on Solana',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.enclz.com',
  baseUrl: '/',

  organizationName: 'enclz',
  projectName: 'docs',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/enclz/docs/tree/main/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/enclz/docs/tree/main/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    metadata: [
      {name: 'theme-color', content: '#faf7f2'},
      {name: 'color-scheme', content: 'light dark'},
      {name: 'twitter:site', content: '@enclzai'},
    ],
    colorMode: {
      defaultMode: 'light',
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'Enclz',
      logo: {
        alt: 'Enclz logo',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          href: 'https://enclz.com',
          label: 'enclz.com',
          position: 'right',
        },
        {
          href: 'https://github.com/enclz',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      logo: {
        alt: 'Enclz',
        src: 'img/logo.png',
        href: 'https://enclz.com',
        width: 32,
      },
      links: [
        {
          title: 'Product',
          items: [
            {label: 'enclz.com', href: 'https://enclz.com'},
            {label: 'Launch App', href: 'https://enclz.com/signin'},
            {label: 'Demo', href: 'https://enclz.com/demo'},
          ],
        },
        {
          title: 'Docs',
          items: [
            {label: 'Get started', to: '/docs/intro'},
            {label: 'Blog', to: '/blog'},
          ],
        },
        {
          title: 'Open source',
          items: [
            {label: 'Anchor program', href: 'https://github.com/enclz/solana'},
            {label: 'Webapp', href: 'https://github.com/enclz/webapp'},
            {label: 'Org overview', href: 'https://github.com/enclz'},
          ],
        },
        {
          title: 'Community',
          items: [
            {label: 'X / Twitter', href: 'https://x.com/enclzai'},
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Enclz. Solana-native agent wallet infrastructure.`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['rust', 'toml', 'bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
