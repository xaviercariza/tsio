# @tsio/socketio

## 0.1.0

### Minor Changes

- b7b956e: Release the accumulated library work since `@tsio/*@0.0.3`.

  This is a minor release for the pre-1.0 packages. It includes public API cleanup, type-system fixes, adapter fixes, documentation updates, playground simplification, and the dependency/security modernization work.

  ### Core API and types
  - Refactored the core contract, action, router, client, middleware, emitter, and adapter types around a smaller contract-first API surface.
  - Preserved compatibility exports where possible while moving the legacy implementation out of the active typecheck path.
  - Improved typed client generation, router/action builders, middleware context refinement, and response inference.
  - Exposed action paths to resolvers and handlers.
  - Exported response helper types for application and adapter type tests.
  - Fixed declaration build issues around piped middleware arrays.
  - Added broader runtime and type-level coverage for routers, validation, clients, emitters, and middleware context refinement.

  ### Zod compatibility
  - Updated `@tsio/core` to support both Zod 3 and Zod 4 consumers through the peer range `^3.22.4 || ^4.0.0`.
  - Switched the repository dev/test dependency to Zod 4 and added type tests proving the public surface remains structurally compatible.

  ### Socket.IO and WS adapters
  - Updated Socket.IO and WS peer ranges to current compatible major lines.
  - Fixed Socket.IO `emitTo` so it targets the requested socket id.
  - Fixed the WS client adapter to use listener dot paths consistently.
  - Replaced `uuid` usage with `node:crypto.randomUUID()` so the packages keep CJS output without depending on the latest ESM-only UUID package.

  ### Packaging and runtime baseline
  - Preserved CJS and ESM package outputs for the core, Socket.IO, and WS packages.
  - Added explicit `exports` metadata for `@tsio/core`.
  - Cleaned npm package contents so published tarballs include only `dist`, changelogs, license, and package metadata.
  - Moved repository development to Node 24 and pnpm 11.
  - Modernized direct tooling and framework dependencies, including Turbo 2, Biome 2, TypeScript 6, Vitest 4, React 19, Next 16, Nextra 4, Tailwind 4, Express 5, and bcrypt 6.
  - Updated CI to the new Node/pnpm baseline and fixed clean-checkout typecheck ordering so dependency package declarations are built before dependent packages run `tsc`.

  ### Docs and playground
  - Replaced the placeholder docs with production documentation for introduction, getting started, contracts, routers, clients, middleware, validation, transports, testing, guides, and API reference pages.
  - Migrated the docs app to Nextra 4 App Router structure and Tailwind 4.
  - Removed old placeholder docs routes for About, Core/Contract, and Core/Server.
  - Reworked the playground around an in-memory store, removed stale Prisma files, simplified the demo UI, and migrated the playground Vite/Tailwind setup.

## 0.0.3

### Patch Changes

- 279545b:
- Updated dependencies [279545b]
  - @tsio/core@0.0.3

## 0.0.2

### Patch Changes

- 14010d5: Allow nested routers
- 990da5f: Allow nested routers
- Updated dependencies [14010d5]
- Updated dependencies [990da5f]
  - @tsio/core@0.0.2

## 0.0.1

### Patch Changes

- 284d174: First release
- Updated dependencies [284d174]
  - @tsio/core@0.0.1
