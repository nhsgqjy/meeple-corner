import { env } from "cloudflare:workers";

export function isValidAdminKey(candidate: string | null | undefined) {
  const expected = env.ADMIN_KEY;
  if (!expected || !candidate || candidate.length !== expected.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ candidate.charCodeAt(index);
  }
  return mismatch === 0;
}
