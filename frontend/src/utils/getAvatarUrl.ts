import CryptoJS from 'crypto-js';

export function getUserAvatarUrl(userProfile?: Record<string, any>): string | null {
  if (!userProfile) return null;

  // Check for Google OAuth profile picture
  if (userProfile.picture) {
    return userProfile.picture;
  }

  // Fall back to Gravatar for regular Cognito email/password logins
  if (userProfile.email) {
    const cleanEmail = userProfile.email.trim().toLowerCase();
    const hash = CryptoJS.SHA256(cleanEmail).toString();
    
    // 'd=identicon' generates a random geometric avatar pattern unique to that email hash.
    return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=80`;
  }

  return null;
}