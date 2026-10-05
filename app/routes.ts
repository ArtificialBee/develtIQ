import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  route("/", "routes/index.tsx"),
  route("home", "routes/home/layout.tsx", [
    index("routes/home/index.tsx"), // /home
    route("kpi", "routes/home/kpi.tsx"), // /home/kpi
  ]),
] satisfies RouteConfig;
