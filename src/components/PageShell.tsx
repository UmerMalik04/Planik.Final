/**
 * PageShell — the placeholder shown while a lazy route chunk downloads.
 *
 * Mirrors the coarse layout of a typical screen (title + a few cards) so
 * navigation feels instant: the frame appears immediately and real content
 * swaps in without a jump. Deliberately static — no spinner, no animation
 * longer than a shimmer, per the app's zero-perceived-latency rule.
 */
export default function PageShell() {
  return (
    <div className="p-4 space-y-4" aria-hidden="true">
      <div className="h-7 w-40 rounded-md bg-muted animate-pulse" />
      <div className="h-24 rounded-xl bg-muted/70 animate-pulse" />
      <div className="h-24 rounded-xl bg-muted/60 animate-pulse" />
      <div className="h-24 rounded-xl bg-muted/50 animate-pulse" />
    </div>
  );
}
