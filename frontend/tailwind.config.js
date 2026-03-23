/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Text"', '"Segoe UI"', 'sans-serif'],
      },
      colors: {
        app:       "#EDEFF2",
        surface:   "#F5F6F8",
        card:      "#F8F8F9",
        subtle:    "#DBDDE2",
        focus:     "#7676DB",
        link:      "#7576CA",
        "link-hover": "#6465B6",
        "txt-primary":   "#262A34",
        "txt-secondary": "#8D9098",
        "txt-tertiary":  "#A9ACB3",
        "txt-field":     "#444A55",
        placeholder:     "#A4A8AF",
        "btn-primary":      "#040404",
        "btn-primary-text": "#ECECEC",
        "btn-hover":        "#0F172A",
        "btn-sec-border":   "#DADCE1",
        "btn-sec-text":     "#5A5F68",
        "blob-blue":     "#2F79F7",
        "blob-soft":     "#AECBFA",
        "blob-light":    "#D7E8FF",
        "violet-edge":   "#5A2FD4",
        "success-text":  "#53B678",
        "success-bg":    "#E9F8EE",
        "error-text":    "#CC6667",
        "error-bg":      "#FCEEEE",
      },
      borderRadius: {
        xs: "6px",
        sm: "8px",
        md: "10px",
        lg: "14px",
        xl: "22px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,24,40,0.04), 0 12px 30px rgba(50,80,130,0.06)",
        toast: "0 8px 22px rgba(0,0,0,0.08)",
      },
      fontSize: {
        display: ["40px", { lineHeight: "1.1",  fontWeight: "700" }],
        h1:      ["42px", { lineHeight: "1.12", fontWeight: "700" }],
        h2:      ["23px", { lineHeight: "1.22", fontWeight: "700" }],
        h3:      ["18px", { lineHeight: "1.28", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "1.45", fontWeight: "400" }],
        "body-sm": ["12px", { lineHeight: "1.4",  fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "1.25", fontWeight: "700", letterSpacing: "0.04em" }],
        "btn-md":  ["14px", { lineHeight: "1",    fontWeight: "600" }],
        caption:   ["11px", { lineHeight: "1.3",  fontWeight: "500" }],
      },
      spacing: {
        4.5: "18px",
        7:   "28px",
      },
      transitionTimingFunction: {
        design: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        "blob-drift": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":      { transform: "translate(30px, -20px) scale(1.05)" },
          "66%":      { transform: "translate(-20px, 15px) scale(0.97)" },
        },
        "blob-drift-2": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%":      { transform: "translate(-25px, 25px) scale(1.04)" },
          "66%":      { transform: "translate(20px, -10px) scale(0.96)" },
        },
        "toast-in": {
          "0%":   { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "blob-drift":   "blob-drift 12s ease-in-out infinite",
        "blob-drift-2": "blob-drift-2 15s ease-in-out infinite",
        "toast-in":     "toast-in 220ms ease-out forwards",
      },
    },
  },
  plugins: [],
};
