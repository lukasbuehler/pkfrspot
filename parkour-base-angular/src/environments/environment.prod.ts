import { prod_keys } from "./keys.prod";

export const environment = {
  name: "Production",
  production: true,
  keys: {
    ...prod_keys,
  },
};
