/**
 * Brand System extracted from Figma
 * Auto-generated - do not edit directly
 */

export const FIGMA_BRAND = {
  colors: {
    "primary": {},
    "secondary": {},
    "neutral": {},
    "gradients": {
      "gradient1": "linear-gradient(135deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
      "gradient2": "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0) 100%)",
      "gradient3": "radial-gradient(circle, rgba(62, 197, 255, 1) 41%, rgba(0, 0, 0, 0) 100%, rgba(45, 46, 50, 0) 100%)",
      "gradient4": "linear-gradient(135deg, rgba(62, 197, 255, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      "gradient5": "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(62, 197, 255, 1) 100%)",
      "gradient6": "linear-gradient(135deg, rgba(4, 15, 19, 1) 0%, rgba(24, 98, 105, 1) 22%, rgba(54, 220, 232, 1) 100%)",
      "gradient7": "linear-gradient(135deg, rgba(54, 220, 232, 1) 0%, rgba(4, 15, 19, 1) 100%)",
      "gradient8": "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(0, 0, 0, 1) 100%)",
      "gradient9": "linear-gradient(135deg, rgba(126, 246, 234, 1) 0%, rgba(42, 41, 204, 1) 46%, rgba(11, 0, 54, 1) 100%)",
      "gradient10": "linear-gradient(135deg, rgba(2, 3, 4, 1) 0%, rgba(41, 162, 194, 1) 100%)",
      "gradient11": "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(156, 156, 156, 1) 100%)",
      "gradient12": "radial-gradient(circle, rgba(11, 199, 255, 1) 0%, rgba(0, 0, 0, 0) 100%)",
      "gradient13": "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(63, 60, 60, 1) 100%)"
    }
  },
  typography: {
    "fontFamilies": [
      "Inter",
      "system-ui"
    ],
    "headings": {},
    "body": {},
    "special": {}
  },
  spacing: {
    "md": "12px",
    "lg": "24px",
    "xl": "32px",
    "4xl": "88px"
  },
  effects: {
    "shadowSm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "shadow": "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    "shadowLg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "glow": "0 0 20px rgba(0, 230, 228, 0.5)"
  },
  animations: {
    "fadeIn": "fadeIn 0.3s ease-in-out",
    "slideUp": "slideUp 0.3s ease-out",
    "glow": "glow 2s ease-in-out infinite alternate",
    "gradient": "gradient 3s ease infinite"
  }
}

// Animation keyframes (for reference - add these to your CSS file)
export const FIGMA_ANIMATIONS_CSS = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes glow {
  0% { box-shadow: 0 0 5px rgba(0, 230, 228, 0.5); }
  50% { box-shadow: 0 0 20px rgba(0, 230, 228, 0.8); }
  100% { box-shadow: 0 0 5px rgba(0, 230, 228, 0.5); }
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`
