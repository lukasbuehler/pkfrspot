import { environment as default_environment } from "./environment.default";

export const environment = {
  name: "Staging",
  production: true,
  keys: {
    ...default_environment?.keys,
  },
};
