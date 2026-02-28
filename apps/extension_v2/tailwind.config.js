/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    darkMode: "class",
    content: ["./**/*.{ts,tsx}", "!./node_modules/**", "!./build/**", "!./.plasmo/**"],
    corePlugins: {
        preflight: false,
    },
    plugins: []
}
