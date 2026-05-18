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

/** Full-viewport ad mount for social bar / interstitial overlays. */
export function mountFullscreenAd(container: HTMLElement, code: string): () => void {
  const trimmed = code.trim();
  if (!trimmed) return () => {};

  container.replaceChildren();

  if (/<script/i.test(trimmed)) {
    const iframe = document.createElement("iframe");
    iframe.title = "Advertisement";
    iframe.setAttribute("frameBorder", "0");
    iframe.setAttribute("scrolling", "auto");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
    );
    iframe.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;border:none;background:#000";

    container.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:auto;background:#000}</style>
</head><body>${trimmed}</body></html>`);
      doc.close();
    }

    return () => container.replaceChildren();
  }

  container.innerHTML = trimmed;
  runScripts(container);
  return () => container.replaceChildren();
}
