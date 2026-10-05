import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  route("/", "routes/index.tsx"),
  route("home", "routes/home/layout.tsx", [
    index("routes/home/index.tsx"), // /home
    route("kpi", "routes/home/kpi.tsx"), // /home/kpi
  ]),
  // Moj planer's calendar is built: today and tomorrow on the same day timeline as the home page.
  route("app/moj-prostor/kalendar", "routes/moj-planer/kalendar.tsx"),
  // Apps not built in edvin yet: /app/protocol, /app/protocol/arhiva, /app/protocol/arhiva/kutije, ...
  route("app/:appKey/:sectionKey?/:subKey?", "routes/app.tsx"),
] satisfies RouteConfig;
