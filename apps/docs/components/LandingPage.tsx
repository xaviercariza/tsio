import React from 'react'

const shell: React.CSSProperties = {
  minHeight: '100vh',
  margin: '-4rem -2rem 0',
  padding: '5rem 2rem 3rem',
  color: '#e5eefc',
  background:
    'radial-gradient(circle at 15% 0%, rgba(71, 117, 255, 0.32), transparent 32rem), radial-gradient(circle at 85% 8%, rgba(34, 211, 238, 0.22), transparent 30rem), linear-gradient(135deg, #06111f 0%, #0a1324 45%, #0f172a 100%)',
}

const container: React.CSSProperties = {
  width: 'min(1120px, 100%)',
  margin: '0 auto',
}

const heroGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.05fr) minmax(320px, 0.95fr)',
  gap: '3rem',
  alignItems: 'center',
}

const badge: React.CSSProperties = {
  display: 'inline-flex',
  padding: '0.5rem 0.8rem',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  borderRadius: 999,
  background: 'rgba(15, 23, 42, 0.62)',
  color: '#b6c4db',
  fontSize: '0.86rem',
}

const eyebrow: React.CSSProperties = {
  margin: '1.25rem 0 0.75rem',
  color: '#67e8f9',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: '0.8rem',
}

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 'clamp(3.25rem, 8vw, 6.8rem)',
  lineHeight: 0.88,
  letterSpacing: '-0.08em',
  color: '#f8fbff',
}

const subtitle: React.CSSProperties = {
  maxWidth: 650,
  margin: '1.4rem 0 0',
  color: '#b7c6dc',
  fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
  lineHeight: 1.75,
}

const actions: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.9rem',
  marginTop: '2rem',
}

const primaryLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  padding: '0 1.2rem',
  borderRadius: 14,
  background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
  color: '#ffffff',
  fontWeight: 800,
  textDecoration: 'none',
  boxShadow: '0 16px 40px rgba(99, 102, 241, 0.35)',
}

const secondaryLink: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 48,
  padding: '0 1.2rem',
  borderRadius: 14,
  border: '1px solid rgba(148, 163, 184, 0.35)',
  background: 'rgba(15, 23, 42, 0.58)',
  color: '#e2e8f0',
  fontWeight: 750,
  textDecoration: 'none',
}

const panel: React.CSSProperties = {
  border: '1px solid rgba(148, 163, 184, 0.22)',
  borderRadius: 28,
  overflow: 'hidden',
  background: 'rgba(2, 6, 23, 0.78)',
  boxShadow: '0 30px 100px rgba(0, 0, 0, 0.38)',
}

const panelHeader: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  padding: '1rem',
  borderBottom: '1px solid rgba(148, 163, 184, 0.16)',
  background: 'rgba(15, 23, 42, 0.72)',
}

const dot = (color: string): React.CSSProperties => ({
  width: 11,
  height: 11,
  borderRadius: 999,
  background: color,
})

const codeBlock: React.CSSProperties = {
  margin: 0,
  padding: '1.3rem',
  color: '#dbeafe',
  fontSize: '0.82rem',
  lineHeight: 1.7,
  overflowX: 'auto',
}

const section: React.CSSProperties = {
  marginTop: '5.5rem',
}

const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: '#f8fafc',
  fontSize: 'clamp(2rem, 4vw, 3.1rem)',
  letterSpacing: '-0.055em',
  lineHeight: 1,
}

const sectionCopy: React.CSSProperties = {
  margin: '1rem 0 0',
  maxWidth: 760,
  color: '#aebdd2',
  lineHeight: 1.75,
  fontSize: '1.05rem',
}

const featureGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '1rem',
  marginTop: '1.8rem',
}

const featureCard: React.CSSProperties = {
  minHeight: 190,
  padding: '1.25rem',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  background:
    'linear-gradient(180deg, rgba(15, 23, 42, 0.76), rgba(15, 23, 42, 0.38))',
}

const cardIcon: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 38,
  height: 38,
  borderRadius: 12,
  background: 'rgba(56, 189, 248, 0.13)',
  color: '#67e8f9',
  fontWeight: 900,
}

const comparisonGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1rem',
  marginTop: '1.8rem',
}

const comparisonCard: React.CSSProperties = {
  padding: '1.4rem',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  borderRadius: 24,
  background: 'rgba(15, 23, 42, 0.55)',
}

const footer: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: '1rem',
  flexWrap: 'wrap',
  marginTop: '5rem',
  paddingTop: '2rem',
  borderTop: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#94a3b8',
}

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
    <main style={shell}>
      <div style={container}>
        <section style={heroGrid}>
          <div>
            <span style={badge}>Type-safe realtime protocols for TypeScript</span>
            <p style={eyebrow}>Contract-first actions and listeners</p>
            <h1 style={title}>Build socket APIs without stringly typed events.</h1>
            <p style={subtitle}>
              tsio lets you define a shared contract once and use it to type server handlers, client
              actions, client listeners, middleware context, and socket transport adapters.
            </p>
            <div style={actions}>
              <a href="/docs/getting-started" style={primaryLink}>
                Get started
              </a>
              <a href="/docs/introduction" style={secondaryLink}>
                Read the docs
              </a>
              <a href="https://github.com/xaviercariza/tsio" style={secondaryLink}>
                GitHub
              </a>
            </div>
          </div>

          <div style={panel}>
            <div style={panelHeader}>
              <span style={dot('#fb7185')} />
              <span style={dot('#facc15')} />
              <span style={dot('#34d399')} />
            </div>
            <pre style={codeBlock}>
              <code>{code}</code>
            </pre>
          </div>
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Built for bidirectional TypeScript apps.</h2>
          <p style={sectionCopy}>
            Use tsio when the client calls server actions and the server emits typed listener events
            back to connected clients. The contract keeps both directions in sync.
          </p>
          <div style={featureGrid}>
            {features.map(feature => (
              <article key={feature.title} style={featureCard}>
                <span style={cardIcon}>{feature.icon}</span>
                <h3 style={{ color: '#f8fafc', margin: '1rem 0 0.55rem', fontSize: '1.18rem' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#aebdd2', lineHeight: 1.65, margin: 0 }}>{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Use it when your API has a pulse.</h2>
          <p style={sectionCopy}>
            tsio is designed for live systems where connected clients need typed actions,
            acknowledgements, and server-pushed updates.
          </p>
          <div style={comparisonGrid}>
            <div style={comparisonCard}>
              <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Great fit</h3>
              <ul style={{ color: '#b7c6dc', lineHeight: 1.9, paddingLeft: '1.2rem' }}>
                <li>Realtime chat and presence</li>
                <li>Game rooms and multiplayer sessions</li>
                <li>Collaborative document updates</li>
                <li>Live dashboards and admin consoles</li>
              </ul>
            </div>
            <div style={comparisonCard}>
              <h3 style={{ color: '#f8fafc', marginTop: 0 }}>Not the first choice</h3>
              <ul style={{ color: '#b7c6dc', lineHeight: 1.9, paddingLeft: '1.2rem' }}>
                <li>Plain CRUD APIs that only need HTTP</li>
                <li>Static content delivery</li>
                <li>One-off form submissions without live updates</li>
                <li>Serverless-only flows with no socket connection</li>
              </ul>
            </div>
          </div>
        </section>

        <footer style={footer}>
          <span>Contract-first realtime for TypeScript.</span>
          <span>MIT · Socket.IO · ws · Zod</span>
        </footer>
      </div>
    </main>
  )
}
