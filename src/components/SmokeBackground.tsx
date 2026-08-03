'use client'

/**
 * Site-wide ambient smoke background.
 *
 * Implementation notes (why a video instead of a GIF):
 * - A muted, looping <video> is decoded by the browser's hardware video
 *   pipeline and composited on the GPU, so it costs far less CPU/battery
 *   than an animated GIF (GIFs are decoded frame-by-frame on the CPU with
 *   no hardware acceleration) or a canvas/WebGL particle system (which
 *   requires a persistent JS render loop).
 * - The clip is ~340KB (webm) / ~1MB (mp4 fallback) for a 16s seamless
 *   loop - a GIF of comparable size/quality/duration would typically run
 *   10-20MB+, so this is also the cheaper option in plain file-size terms.
 * - It is `position: fixed`, sits behind all content (z-index below the
 *   page), and is purely decorative (aria-hidden) so it never affects
 *   layout, scrolling, or accessibility.
 * - Respects `prefers-reduced-motion`: motion-sensitive users get the
 *   static poster frame instead of an autoplaying video.
 */
export function SmokeBackground() {
  return (
    <div className="smoke-bg" aria-hidden="true">
      <video
        className="smoke-bg__video"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/media/smoke-bg-poster.jpg"
      >
        <source src="/media/smoke-bg.webm" type="video/webm" />
        <source src="/media/smoke-bg.mp4" type="video/mp4" />
      </video>
    </div>
  )
}
