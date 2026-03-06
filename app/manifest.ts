import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mapa de Calcadas do Sul Fluminense",
    short_name: "Calcadas SF",
    description:
      "Aplicacao civica para mapear condicoes de calcadas e orientar priorizacao de cuidado urbano.",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3eb",
    theme_color: "#ffd400"
  };
}
