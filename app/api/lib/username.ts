export const RESERVED_USERNAMES = [
  "explore",
  "settings",
  "login",
  "signup",
];

export function isReserved(username: string) {
  return RESERVED_USERNAMES.includes(username.toLowerCase());
}