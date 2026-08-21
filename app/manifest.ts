import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "슬로우 트레인 태권도",
    short_name: "슬로우 트레인",
    description: "수업 예약·변경·보강·상담을 위한 슬로우 트레인 태권도 앱",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2ea",
    theme_color: "#d8752d",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
