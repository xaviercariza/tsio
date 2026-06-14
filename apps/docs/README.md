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
pages/index.mdx        # landing page
pages/docs             # product documentation
pages/guides           # practical guides
pages/reference        # API and package reference
components             # landing page and shared docs components
```

The documentation is intentionally written for a pre-1.0 library: stable Socket.IO and `ws` usage is documented, while future adapter ideas are clearly marked as future directions.
