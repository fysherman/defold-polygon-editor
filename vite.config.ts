import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    base: "/defold-polygon-editor",
    plugins: [tailwindcss()]
});
