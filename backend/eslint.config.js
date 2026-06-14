import { defineConfig, globalIgnores } from "eslint/config";
import globals from 'globals'
import js from "@eslint/js";

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ["**/*.js"],
        plugins: {
            js,
        },
        extends: ["js/recommended"],
        rules: {
            "no-unused-vars": [
              "warn", { "varsIgnorePattern": "^_",
                        "argsIgnorePattern": "^_" }],
            "no-undef": "warn",
        },
        languageOptions: {
            globals: globals.node,
        },
    },
]);
