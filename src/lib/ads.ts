/**
 * Ad integration placeholders — wire your ad network SDK here.
 */

export type RewardResult = {
  success: boolean;
  rewardAmount: number;
  placementId?: string;
};

const DEFAULT_REWARD = Number(process.env.REWARDED_AD_TOKENS || 5);
export const AD_PLACEMENTS = {
  bannerHome: "banner_home",
  bannerDownload: "banner_download",
  socialBar: "social_bar",
  rewardedEarn: "rewarded_earn",
} as const;

/** Called when a rewarded ad completes successfully (simulated or real SDK callback). */
export async function onRewardComplete(
  placementId: string = AD_PLACEMENTS.rewardedEarn
): Promise<RewardResult> {
  console.info("[ads] onRewardComplete", { placementId });
  return {
    success: true,
    rewardAmount: DEFAULT_REWARD,
    placementId,
  };
}

/** Banner slot mount hook */
export function onBannerMount(placementId: string, elementId: string): void {
  console.info("[ads] onBannerMount", { placementId, elementId });
}
