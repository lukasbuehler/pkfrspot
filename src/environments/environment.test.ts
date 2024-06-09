import { test_keys } from "./keys.test";

export const environment = {
  name: "Test",
  production: false,
  keys: {
    ...test_keys,
  },
};
