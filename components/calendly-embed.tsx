"use client";

import { useEffect } from "react";

interface CalendlyEmbedProps {
  url: string;
  height?: number;
}

export function CalendlyEmbed({ url, height = 630 }: CalendlyEmbedProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div
      className="calendly-inline-widget rounded-lg overflow-hidden"
      data-url={url}
      style={{ minWidth: "280px", height: `${height}px` }}
    />
  );
}
