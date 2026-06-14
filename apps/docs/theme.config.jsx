import { Logo } from './components/logo'

export default {
  logo: <Logo />,
  project: {
    link: 'https://github.com/xaviercariza/tsio',
  },
  docsRepositoryBase: 'https://github.com/xaviercariza/tsio/tree/main/apps/docs',
  footer: {
    text: 'MIT · Contract-first realtime protocols for TypeScript',
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="tsio is a contract-first TypeScript library for type-safe realtime actions, events, clients, routers, and middleware."
      />
      <meta property="og:title" content="tsio" />
      <meta
        property="og:description"
        content="Contract-first, type-safe actions and realtime events for TypeScript apps."
      />
    </>
  ),
  navigation: {
    prev: true,
    next: true,
  },
  search: {
    placeholder: 'Search tsio docs...',
  },
  useNextSeoProps() {
    return {
      titleTemplate: '%s – tsio',
    }
  },
}
