import { environment as default_environment } from "./environment.default";

export const environment = {
  name: "Production",
  production: true,
  keys: {
    ...default_environment?.keys,
  },
};
