import nextCoreWebVitals from "eslint-config-next/core-web-vitals.js";
import nextTypeScript from "eslint-config-next/typescript.js";

const config = [...nextCoreWebVitals, ...nextTypeScript];

export default config;
