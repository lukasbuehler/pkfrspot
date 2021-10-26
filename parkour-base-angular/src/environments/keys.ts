// Example keys file
// You have to create keys.prod.ts and keys.test.ts to build for test and
// production respectively. Both files can point to the same firebase instance
// Just duplicate this file and change the name of the object to test_keys
// and prod_keys respectively.

export const keys = {
  google_maps: "... Maps JavaScript API (Server key)",
  firebaseConfig: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
    measurementId: "",
  },
};
