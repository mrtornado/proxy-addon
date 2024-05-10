// unocss.config.js
import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  safelist:
    "bg-red-500 bg-blue-500 bg-green-500 bg-green-900 bg-yellow-500 bg-purple-500".split(
      " "
    ), // List all possible classes you use dynamically
});
