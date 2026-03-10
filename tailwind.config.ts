// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './src/**/*.{ts,tsx}',
    ],
    theme: { extend: {} },
    plugins: [],
}

export default config