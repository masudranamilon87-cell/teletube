"use client";

import { useEffect, useRef } from "react";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  normalizeBannerCode,
} from "@/lib/banner-ad";

function mountInIframe(
  container: HTMLElement,
  code: string,
  width: number,
  height: number
) {
  container.replaceChildren();

  const iframe = document.createElement("iframe");
  iframe.title = "Advertisement";
  iframe.setAttribute("frameBorder", "0");
  iframe.setAttribute("scrolling", "no");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
  );
  iframe.width = String(width);
  iframe.height = String(height);
  iframe.style.width = `${width}px`;
  iframe.style.height = `${height}px`;
  iframe.style.border = "none";
  iframe.style.display = "block";
  iframe.style.overflow = "hidden";

  container.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${width},initial-scale=1"><style>
      html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden;background:transparent}
      iframe,img,a,div{display:block;max-width:100%}
    </style></head><body>${code}</body></html>`
  );
  doc.close();

  return () => {
    container.replaceChildren();
  };
}

function runScripts(container: HTMLElement) {
  container.querySelectorAll("script").forEach((oldScript) => {
    const script = document.createElement("script");
    for (const attr of oldScript.attributes) {
      script.setAttribute(attr.name, attr.value);
    }
    script.textContent = oldScript.textContent;
    oldScript.replaceWith(script);
  });
}

export function mountAdCode(
  container: HTMLElement,
  code: string,
  opts: { width: number; height: number }
): (() => void) | void {
  const trimmed = normalizeBannerCode(code);
  if (!trimmed) return;

  const { width, height } = opts;

  if (/<script/i.test(trimmed)) {
    return mountInIframe(container, trimmed, width, height);
  }

  container.innerHTML = trimmed;
  container.querySelectorAll("iframe").forEach((el) => {
    el.width = String(width);
    el.height = String(height);
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  });
  runScripts(container);
  return () => container.replaceChildren();
}

type Props = {
  code: string;
  className?: string;
  label?: string;
};

export function AdEmbed({ code, className = "", label }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !code.trim()) return;
    const cleanup = mountAdCode(el, code, {
      width: BANNER_WIDTH,
      height: BANNER_HEIGHT,
    });
    return () => {
      cleanup?.();
      el.replaceChildren();
    };
  }, [code]);

  if (!code.trim()) return null;

  return (
    <div
      className={`banner-ad-slot mx-auto w-full max-w-[320px] ${className}`}
      style={{ height: BANNER_HEIGHT }}
      data-ad-label={label}
      data-ad-size={`${BANNER_WIDTH}x${BANNER_HEIGHT}`}
    >
      <div
        ref={ref}
        className="banner-ad-slot__inner h-[50px] w-[320px] max-w-full overflow-hidden rounded-lg bg-[var(--tg-secondary)]/20"
      />
    </div>
  );
}
