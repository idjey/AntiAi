# @antiai/phash

Perceptual hashing utilities for AntiAI.me.

> [!WARNING]
> **SERVER-SIDE ONLY.** Do not import this package into any client or frontend code (e.g. `apps/web` or browser-side packages). This package relies on `sharp`, which is a native binary and will break frontend builds or bloat the bundle size significantly.

This package provides a shared implementation of perceptual hashing using `sharp` and `blockhash-core` to ensure identical hash computation across different server-side callers (e.g. the API and the provenance worker).
