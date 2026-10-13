import React from 'react';

/**
 * Hand-drawn yellow noodle arrows and doodle flourishes
 * directly inspired by the editorial sketchbook aesthetic.
 */

// S-curve noodle arrow looping downwards (like in the reference image)
export function YellowNoodleArrowDown({ className = "w-24 h-24", label = "" }) {
  return (
    <div className={`relative inline-flex flex-col items-center select-none pointer-events-none ${className}`}>
      {label && (
        <span className="font-handwriting text-lg text-neutral-900 font-bold -rotate-3 mb-1">
          {label}
        </span>
      )}
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <path
          d="M 50 10 C 65 30, 80 50, 60 70 C 45 85, 30 90, 45 110"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 33 100 L 46 112 L 54 98"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle dark stroke outline to make it pop on white grid */}
        <path
          d="M 50 10 C 65 30, 80 50, 60 70 C 45 85, 30 90, 45 110"
          stroke="#000000"
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray="2 3"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

// Loopy curve noodle arrow (curving down and pointing right)
export function YellowNoodleArrowLoop({ className = "w-28 h-20", label = "" }) {
  return (
    <div className={`relative inline-flex flex-col items-center select-none pointer-events-none ${className}`}>
      {label && (
        <span className="font-handwriting text-base text-neutral-900 font-bold rotate-2 mb-0.5">
          {label}
        </span>
      )}
      <svg
        viewBox="0 0 140 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M 15 20 C 35 5, 65 15, 75 35 C 82 50, 68 65, 55 58 C 42 50, 50 30, 75 28 C 95 26, 115 38, 128 50"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 116 48 L 130 52 L 128 38"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Sweeping noodle arrow pointing left
export function YellowNoodleArrowLeft({ className = "w-24 h-20", label = "" }) {
  return (
    <div className={`relative inline-flex flex-col items-center select-none pointer-events-none ${className}`}>
      {label && (
        <span className="font-handwriting text-base text-neutral-900 font-bold -rotate-2 mb-0.5">
          {label}
        </span>
      )}
      <svg
        viewBox="0 0 120 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <path
          d="M 105 15 C 80 10, 50 25, 30 45 C 25 50, 20 54, 18 55"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 28 45 L 16 56 L 30 63"
          stroke="#FFE600"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Wavy hand-drawn underline for titles and highlights
export function YellowWavyLine({ className = "w-full h-3" }) {
  return (
    <svg viewBox="0 0 160 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} preserveAspectRatio="none">
      <path
        d="M 2 9 Q 20 2, 40 9 T 80 9 T 120 9 T 158 9"
        stroke="#FFE600"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Playful hand-drawn scribble doodle like the doodle circles & scribble cloud in the reference image
export function DoodleScribbleFriends({ className = "w-24 h-14" }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Yellow highlighter aura blob */}
      <div className="absolute inset-0 bg-[#FFE600] rounded-full blur-[2px] opacity-75 scale-90 -translate-y-0.5"></div>
      <svg viewBox="0 0 110 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
        {/* Left scribble ball */}
        <path
          d="M 20 30 C 15 20, 25 15, 30 25 C 35 35, 15 35, 20 25 C 25 15, 35 22, 28 32 C 22 40, 16 28, 25 24"
          stroke="#111827"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* Connection arms */}
        <path d="M 33 28 C 42 26, 48 26, 57 28" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        <circle cx="45" cy="27" r="2.5" fill="#111827" />

        {/* Right happy smiley circle */}
        <circle cx="70" cy="28" r="14" stroke="#111827" strokeWidth="2" fill="#ffffff" />
        {/* Eyes */}
        <circle cx="66" cy="26" r="1.5" fill="#111827" />
        <circle cx="74" cy="26" r="1.5" fill="#111827" />
        {/* Smile */}
        <path d="M 66 31 Q 70 35 74 31" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {/* Little legs */}
        <path d="M 66 42 L 66 48 M 74 42 L 74 48" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
        <path d="M 20 36 L 20 44 M 28 36 L 28 44" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Scribble cloud with yellow highlighter fill (like the thoughts cloud in the image)
export function DoodleScribbleCloud({ className = "w-20 h-16" }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {/* Yellow highlighter background oval */}
      <div className="absolute inset-1 bg-[#FFE600] rounded-full opacity-90"></div>
      <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full h-full">
        {/* Tangled chaotic scribble inside */}
        <path
          d="M 25 25 C 30 18, 50 15, 55 25 C 60 35, 45 42, 35 38 C 25 34, 30 20, 45 22 C 60 24, 55 38, 40 35 C 30 32, 28 42, 45 42 C 55 42, 62 30, 50 25 C 38 20, 22 28, 30 36"
          stroke="#111827"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="40" cy="30" r="18" stroke="#111827" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.4" />
      </svg>
    </div>
  );
}

// Editorial Page Number badge from the reference image (bottom right yellow circle with number)
export function EditorialPageBadge({ number = "2", className = "" }) {
  return (
    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#FFE600] border-2 border-[#111827] text-[#111827] font-black text-sm shadow-[2px_2px_0px_0px_#111827] ${className}`}>
      {number}
    </div>
  );
}

// Editorial "SWIPE <<<" or Pill badge from the reference image (bottom left pill)
export function EditorialPill({ text = "SWIPE <<<", className = "" }) {
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border-2 border-[#111827] bg-white text-[#111827] font-mono font-bold text-xs shadow-[2px_2px_0px_0px_#111827] uppercase tracking-wider ${className}`}>
      {text}
    </div>
  );
}
