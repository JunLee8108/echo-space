import { defineConfig, minimalPreset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: minimalPreset,
  images: ["public/logo.svg"], // 이미 logo.svg가 있으니 이것을 사용
  output: {
    path: "public",
    quality: 95,
    compressionLevel: 9,
  },
});
