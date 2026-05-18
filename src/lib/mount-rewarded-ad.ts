import { rewardedBridgeScript } from "@/lib/rewarded-ad-bridge";

/** Mount provider code fullscreen inside an iframe (scripts + bridge). */
export function mountRewardedAd(
  container: HTMLElement,
  code: string,
  sessionId: number
): () => void {
  container.replaceChildren();

  const iframe = document.createElement("iframe");
  iframe.title = "Rewarded advertisement";
  iframe.setAttribute("frameBorder", "0");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
  );
  iframe.style.cssText =
    "position:absolute;inset:0;width:100%;height:100%;border:none;background:#000";

  container.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return () => container.replaceChildren();

  const trimmed = code.trim();
  const bridge = rewardedBridgeScript(sessionId);

  doc.open();
  doc.write(`<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
html,body{margin:0;padding:0;width:100%;height:100%;overflow:hidden;background:#000}
</style>
</head><body>
${bridge}
${trimmed}
</body></html>`);
  doc.close();

  return () => container.replaceChildren();
}
