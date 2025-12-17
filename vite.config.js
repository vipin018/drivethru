import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // This separates third-party libs (Three.js) from your own code
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    // Optional: Increase the warning limit to 1000kb (1MB) just to silence it
    chunkSizeWarningLimit: 1000,
  },
});
