import React from 'react'
import styles from './LandingPage.module.css'

const code = `const contract = defineContract({
  chat: {
    sendMessage: {
      type: 'action',
      input: z.object({ text: z.string() }),
      response: MessageSchema,
    },
    onMessage: {
      type: 'listener',
      data: MessageSchema,
    },
  },
})

client.actions.chat.sendMessage({ text: 'hello' })

client.listeners.chat.onMessage(message => {
  message.id   // string
  message.text // string
})`

const features = [
  {
    icon: '01',
    title: 'One contract for both directions',
    body: 'Describe client-to-server actions and server-to-client listener events in a single Zod-powered contract.',
  },
  {
    icon: '02',
    title: 'Fully typed clients',
    body: 'Generate nested action and listener clients without manually duplicating event names or payload types.',
  },
  {
    icon: '03',
    title: 'Typed server handlers',
    body: 'Implement routers with inferred input, response, path, context, and strongly typed event emission.',
  },
  {
    icon: '04',
    title: 'Middleware context refinement',
    body: 'Auth middleware can turn nullable context into safe handler context, so protected handlers receive a non-null user.',
  },
  {
    icon: '05',
    title: 'Socket.IO and ws adapters',
    body: 'Use the same core contract with the Socket.IO or ws adapter depending on your runtime needs.',
  },
  {
    icon: '06',
    title: 'Runtime validation when needed',
    body: 'Opt into schema parsing for action input and successful response payloads at the transport boundary.',
  },
]

export function LandingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.badge}>Type-safe realtime protocols for TypeScript</span>
            <p className={styles.eyebrow}>Contract-first actions and listeners</p>
            <h1 className={styles.title}>Build socket APIs without stringly typed events.</h1>
            <p className={styles.subtitle}>
              tsio lets you define a shared contract once and use it to type server handlers, client
              actions, client listeners, middleware context, and socket transport adapters.
            </p>
            <div className={styles.actions}>
              <a href="/docs/getting-started" className={styles.primaryCta}>
                Get started
              </a>
              <a href="/docs/introduction" className={styles.secondaryCta}>
                Read the docs
              </a>
              <a href="https://github.com/xaviercariza/tsio" className={styles.secondaryCta}>
                GitHub
              </a>
            </div>
          </div>

          <div className={styles.terminal}>
            <div className={styles.terminalBar}>
              <span className={`${styles.dot} ${styles.dotRed}`} />
              <span className={`${styles.dot} ${styles.dotYellow}`} />
              <span className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <pre className={styles.code}>
              <code>{code}</code>
            </pre>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Built for bidirectional TypeScript apps.</h2>
          <p className={styles.sectionCopy}>
            Use tsio when the client calls server actions and the server emits typed listener events
            back to connected clients. The contract keeps both directions in sync.
          </p>
          <div className={styles.featureGrid}>
            {features.map(feature => (
              <article key={feature.title} className={styles.featureCard}>
                <span className={styles.cardIcon}>{feature.icon}</span>
                <h3 className={styles.cardTitle}>{feature.title}</h3>
                <p className={styles.cardBody}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Use it when your API has a pulse.</h2>
          <p className={styles.sectionCopy}>
            tsio is designed for live systems where connected clients need typed actions,
            acknowledgements, and server-pushed updates.
          </p>
          <div className={styles.comparisonGrid}>
            <div className={styles.comparisonCard}>
              <h3 className={styles.listTitle}>Great fit</h3>
              <ul className={styles.list}>
                <li>Realtime chat and presence</li>
                <li>Game rooms and multiplayer sessions</li>
                <li>Collaborative document updates</li>
                <li>Live dashboards and admin consoles</li>
              </ul>
            </div>
            <div className={styles.comparisonCard}>
              <h3 className={styles.listTitle}>Not the first choice</h3>
              <ul className={styles.list}>
                <li>Plain CRUD APIs that only need HTTP</li>
                <li>Static content delivery</li>
                <li>One-off form submissions without live updates</li>
                <li>Serverless-only flows with no socket connection</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className={styles.footer}>
          <span>Contract-first realtime for TypeScript.</span>
          <span>MIT · Socket.IO · ws · Zod</span>
        </footer>
      </div>
    </main>
  )
}
