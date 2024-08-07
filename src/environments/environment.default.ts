import { googleAPIKey } from "./keys";

export const environment = {
  name: "Default",
  production: false,
  keys: {
    firebaseConfig: {
      projectId: "parkour-base-project",
      appId: "1:294969617102:web:f9a2fcf843e8b288313e9f",
      databaseURL: "https://parkour-base-project.firebaseio.com",
      storageBucket: "parkour-base-project.appspot.com",
      locationId: "us-central1",
      authDomain: "parkour-base-project.firebaseapp.com",
      messagingSenderId: "294969617102",
      measurementId: "G-K7E4HFP8NM",
      apiKey: googleAPIKey,
    },
    typesense: {
      host: "XXX",
      apiKey: "XXX",
    },
  },
};
