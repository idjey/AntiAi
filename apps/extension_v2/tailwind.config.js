/** @type {import('tailwindcss').Config} */
module.exports = {
    mode: "jit",
    darkMode: "class",
    content: ["./**/*.{ts,tsx}", "!./node_modules/**", "!./build/**", "!./.plasmo/**"],
    corePlugins: {
        preflight: false,
    },
    theme: {
        extend: {
            colors: {
                primary: "#22c55e", // Using a vibrant green that maps to Tailwind's green-500 for the main theme
            }
        }
    },
    plugins: []
}
