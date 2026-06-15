# tsio docs

This app contains the public landing page and documentation for `tsio`.

It is built with Next.js and Nextra.

## Development

From the repository root:

```bash
pnpm install
pnpm --filter @tsio/docs dev
```

The docs app runs on port `3001`.

## Production build

```bash
pnpm --filter @tsio/docs build
```

## Content structure

```txt
app                    # Nextra 4 App Router shell and MDX catch-all route
content/index.mdx      # landing page
content/docs           # product documentation
content/guides         # practical guides
content/reference      # API and package reference
components             # landing page and shared docs components
```

The documentation is written for developers using the library: it explains the supported core API, Socket.IO adapter, `ws` adapter, middleware model, runtime validation, and testing approach.
