import { firebase, firebaseui } from "firebaseui-angular";

export const environment = {
  production: true,
  firebaseUiAuthConfig: {
    signInFlow: "redirect",
    autoUpgradeAnonymousUsers: false,
    signInSuccessUrl: "/",
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      {
        requireDisplayName: true,
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      },
    ],
    tosUrl: "/terms_of_service",
    privacyPolicyUrl: "/privacy_policy",
    credentialHelper: firebaseui.auth.CredentialHelper.ACCOUNT_CHOOSER_COM,
  },
};
