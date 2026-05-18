/** Popup / interstitial ad mounting (not forced to 320×50 banner). */

export const POPUP_MODAL_WIDTH = 320;
export const POPUP_MODAL_HEIGHT = 480;

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

/** Run provider scripts on the real page (popunder / onclick popup). */
export function mountPopupScripts(root: HTMLElement, code: string): () => void {
  const trimmed = code.trim();
  if (!trimmed) return () => {};

  root.replaceChildren();
  const temp = document.createElement("div");
  temp.innerHTML = trimmed;

  const scripts: HTMLScriptElement[] = [];
  Array.from(temp.childNodes).forEach((node) => {
    if (node.nodeName === "SCRIPT") {
      const old = node as HTMLScriptElement;
      const script = document.createElement("script");
      for (const attr of old.attributes) {
        script.setAttribute(attr.name, attr.value);
      }
      script.textContent = old.textContent;
      scripts.push(script);
    } else {
      root.appendChild(node.cloneNode(true));
    }
  });

  scripts.forEach((s) => root.appendChild(s));

  return () => root.replaceChildren();
}

function mountInIframe(
  container: HTMLElement,
  code: string,
  width: number,
  height: number
): () => void {
  container.replaceChildren();

  const iframe = document.createElement("iframe");
  iframe.title = "Popup advertisement";
  iframe.setAttribute("frameBorder", "0");
  iframe.setAttribute("scrolling", "auto");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
  );
  iframe.style.cssText = `width:100%;max-width:${width}px;height:${height}px;border:none;display:block;margin:0 auto;background:transparent`;

  container.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return () => container.replaceChildren();

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;padding:0;overflow:auto;background:transparent}</style>
</head><body>${code}</body></html>`);
  doc.close();

  return () => container.replaceChildren();
}

/** Visible interstitial inside modal (iframe / HTML creatives). */
export function mountPopupInterstitial(
  container: HTMLElement,
  code: string
): () => void {
  const trimmed = code.trim();
  if (!trimmed) return () => {};

  if (/<script/i.test(trimmed)) {
    return mountInIframe(container, trimmed, POPUP_MODAL_WIDTH, POPUP_MODAL_HEIGHT);
  }

  container.innerHTML = trimmed;
  runScripts(container);
  return () => container.replaceChildren();
}

export function popupHasVisibleCreative(code: string): boolean {
  const t = code.trim();
  if (!t) return false;
  if (/<iframe|<img|<canvas/i.test(t)) return true;
  if (/<div[\s>]/i.test(t) && !/^<script/i.test(t)) return true;
  return false;
}
