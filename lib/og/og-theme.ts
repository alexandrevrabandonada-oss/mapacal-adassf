export const OG_THEME = {
    colors: {
        background: "#F9FAFB", // zinc-50
        foreground: "#18181B", // zinc-900
        primary: "#000000",
        white: "#FFFFFF",
        warning: {
            bg: "#FFFBEB", // amber-50
            text: "#B45309", // amber-700
            border: "#FEF3C7" // amber-100
        },
        danger: {
            bg: "#FEF2F2", // red-50
            text: "#B91C1C", // red-700
            border: "#FEE2E2" // red-100
        },
        success: {
            bg: "#F0FDF4", // green-50
            text: "#15803D", // green-700
            border: "#DCFCE7" // green-100
        },
        neutral: {
            bg: "#F4F4F5", // zinc-100
            text: "#3F3F46", // zinc-700
            border: "#E4E4E7" // zinc-200
        }
    },
    fonts: {
        // Para simplificar e evitar crashes de Edge Runtime com fontes externas,
        // usaremos as sans-serif nativas do sistema da Vercel Edge.
        sans: '"Inter", "Segoe UI", "Roboto", "Helvetica Neue", sans-serif'
    }
};
