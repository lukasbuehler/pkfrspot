import { environment as default_environment } from "./environment.default";

export const environment = {
  name: "Development",
  production: false,
  keys: {
    ...default_environment?.keys,
  },
};
