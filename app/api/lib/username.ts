export const RESERVED_USERNAMES = [
  "explore",
  "api",
  "account",
  "post",
  "profile",
  "home",
  "search",
  "notifications",
  "messages",
  "settings",
  "logout",
  "login",
  "signup",
  "echoup",
  "page",
];

export function isReserved(username: string) {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}