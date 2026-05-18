/** postMessage contract between rewarded ad iframe / SDK and TeleTube earn page */

export const REWARDED_MESSAGE_TYPE = "teletube-rewarded" as const;

export type RewardedAdEvent = "granted" | "dismissed" | "no_fill";

export type RewardedAdMessage = {
  type: typeof REWARDED_MESSAGE_TYPE;
  event: RewardedAdEvent;
  sessionId: number;
};

export function isRewardedAdMessage(data: unknown): data is RewardedAdMessage {
  if (!data || typeof data !== "object") return false;
  const m = data as Record<string, unknown>;
  return (
    m.type === REWARDED_MESSAGE_TYPE &&
    (m.event === "granted" || m.event === "dismissed" || m.event === "no_fill") &&
    typeof m.sessionId === "number"
  );
}

/** Injected into rewarded ad iframe — networks call TeleTubeRewarded.grant() etc. */
export function rewardedBridgeScript(sessionId: number): string {
  return `<script>
(function(){
  var sid=${sessionId};
  function post(ev){
    try{ parent.postMessage({type:"${REWARDED_MESSAGE_TYPE}",event:ev,sessionId:sid},"*"); }catch(e){}
  }
  window.TeleTubeRewarded={
    grant:function(){post("granted");},
    dismiss:function(){post("dismissed");},
    noFill:function(){post("no_fill");}
  };
})();
</script>`;
}

export const REWARDED_AD_INTEGRATION_HINT = `Call from your ad network reward callback:
TeleTubeRewarded.grant() — reward completed
TeleTubeRewarded.dismiss() — user closed early, no tokens
TeleTubeRewarded.noFill() — no ad inventory`;
