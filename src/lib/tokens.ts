/** Admin always sees this balance; spend/grant does not change it. */
export const ADMIN_DISPLAY_BALANCE = 999999;

export const WELCOME_BONUS_TOKENS = Number(process.env.WELCOME_BONUS_TOKENS || 50);

export function displayTokenBalance(user: {
  isAdmin: boolean;
  tokenBalance: number;
}): number {
  return user.isAdmin ? ADMIN_DISPLAY_BALANCE : user.tokenBalance;
}
