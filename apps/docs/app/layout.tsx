import type { Metadata } from 'next'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import 'nextra-theme-docs/style.css'
import './globals.css'
import type { ReactNode } from 'react'
import { Logo } from '../components/logo'

export const metadata: Metadata = {
  title: {
    default: 'tsio',
    template: '%s - tsio',
  },
  description:
    'tsio is a contract-first TypeScript library for type-safe realtime actions, events, clients, routers, and middleware.',
  openGraph: {
    title: 'tsio',
    description: 'Contract-first, type-safe actions and realtime events for TypeScript apps.',
  },
}

const navbar = <Navbar logo={<Logo />} projectLink="https://github.com/xaviercariza/tsio" />
const footer = <Footer>MIT - Contract-first realtime protocols for TypeScript</Footer>

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/xaviercariza/tsio/tree/main/apps/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
