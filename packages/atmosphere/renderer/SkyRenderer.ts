/**
 * The upstream PR vendored a copy of the engine's SkyRenderer into this
 * package. Core's renderer has since become multi-instance aware — it sizes
 * the sky sphere from the owning view's engine setting and registers itself
 * per Scene3D through `EntityCollect.setSky` — so the package re-exports it
 * rather than forking engine internals that would drift on every release.
 */
export { SkyRenderer } from "@orillusion/core";
