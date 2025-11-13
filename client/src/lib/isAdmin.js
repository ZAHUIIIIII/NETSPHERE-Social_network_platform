// client/src/lib/isAdmin.js
// Central helper to detect admin user for UI badges and protections

export const ADMIN_EMAIL = 'leeminhuy47@gmail.com';
export const ADMIN_USERNAME = 'ZAHUII'; // fallback name used in UI
// You can also add ADMIN_ID if you know the admin MongoDB _id

export function isAdmin(user) {
  if (!user) return false;

  // If user object has email, check it
  if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) return true;

  // Check username fallback
  if (user.username && user.username === ADMIN_USERNAME) return true;

  // If user has an 'isAdmin' flag (future-proof), honor it
  if (user.isAdmin) return true;

  // If user has _id and ADMIN_ID env/config is set, we could check that.

  return false;
}
