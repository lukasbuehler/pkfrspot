import { defineSecret } from "firebase-functions/params";

// get the google API Key from the secret manager
export const googleAPIKey = defineSecret("GOOGLE_API_KEY");
