"use client";

import { useEffect, useRef, useState } from "react";

// The promo plays muted in a loop, like a moving screenshot. Nothing downloads until the section is near the screen,
// and each device gets one file: the vertical cut on narrow screens, the wide one elsewhere.
const NARROW = "(max-width: 700px)";

export function PromoVideo() {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [tall, setTall] = useState(false);
  const [near, setNear] = useState(false);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const update = () => setTall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const visible = useRef(false);
  const userPaused = useRef(false);
  const reduced = useRef(false);
  const sync = () => {
    const v = video.current;
    if (!v || !v.currentSrc) return;
    if (visible.current && !userPaused.current && !reduced.current) v.play().catch(() => {});
    else v.pause();
  };

  // Load when the section gets close; play only while it is mostly on screen.
  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    userPaused.current = reduced.current;
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting) setNear(true);
        visible.current = e.intersectionRatio >= 0.4;
        sync();
      },
      { rootMargin: "300px 0px", threshold: [0, 0.4] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const name = tall ? "promo-9x16" : "promo-16x9";

  const toggleSound = () => {
    const v = video.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    if (!v.muted && v.paused) void v.play();
  };
  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    userPaused.current = !v.paused;
    if (v.paused) void v.play();
    else v.pause();
  };

  return (
    <section className="promo wrap" aria-label="Listing Lens in 40 seconds">
      <div ref={box} className="promo-frame">
        <video
          key={name}
          ref={video}
          className="promo-video"
          src={near ? `/video/${name}.mp4` : undefined}
          poster={`/video/${name}.webp`}
          muted
          loop
          playsInline
          preload={near ? "auto" : "none"}
          onLoadedData={sync}
          onClick={togglePlay}
          onPlay={() => setPaused(false)}
          onPause={() => setPaused(true)}
        />
        <div className="promo-controls">
          <button type="button" onClick={togglePlay} aria-label={paused ? "Play video" : "Pause video"}>
            {paused ? (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M8 5v14l11-7z" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M7 5h4v14H7zM13 5h4v14h-4z" /></svg>
            )}
          </button>
          <button type="button" onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
            {muted ? (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden><path d="M4 9v6h4l5 4V5L8 9zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
            <span>{muted ? "Sound on" : "Mute"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
