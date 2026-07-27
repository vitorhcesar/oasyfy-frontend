/**
 * Canvas único de auth — gradientes animados para o Liquid Glass refratar.
 * Respeita prefers-reduced-motion (blobs ficam estáticos).
 */
export function AuthAmbientBackground() {
  return (
    <div
      aria-hidden
      className="auth-ambient pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="auth-ambient-blob auth-ambient-blob--a" />
      <div className="auth-ambient-blob auth-ambient-blob--b" />
      <div className="auth-ambient-blob auth-ambient-blob--c" />
      <div className="auth-ambient-blob auth-ambient-blob--d" />
      <div className="auth-ambient-veil" />
      <div className="auth-ambient-grid" />
    </div>
  );
}
