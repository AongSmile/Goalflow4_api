import { OAuth2Client } from "google-auth-library";

// Used by modules/auth/auth.service.ts -> googleLogin() to verify the ID
// token the client gets from Google Sign-In before trusting any of its
// contents.
export const OAuthClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
