import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import {
  LuBookCheck,
  LuCalendar,
  LuHouse,
  LuInbox,
  LuLayers,
  LuMessageCircle,
  LuSettings,
  LuTrendingUp,
  LuUser,
  LuUsers,
} from "react-icons/lu";

import type { Route } from "./+types/root";
import "./app.css";
import { VerticalDock, type RailSection } from "./components/VerticalDock";
import { Welcome } from "./home/welcome";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const sections: RailSection[] = [
  {
    id: "home",
    label: "Početna",
    icon: LuHouse,
    count: 12,
    url: "/home",
  },
  {
    id: "/moj-planer",
    label: "Moj planer",
    icon: LuUser,
    url: "/moj-planer",
  },
  {
    id: "/protokol",
    label: "Protkol",
    icon: LuBookCheck,
    url: "/protokol",
  },
  {
    id: "/ljudski-resursi",
    label: "Ljudski resursi",
    icon: LuUsers,
    count: 4,
    url: "/ljudski-resursi",
  },
];

export default function App() {
  return (
    <main className="flex items-center justify-center">
      {/* <div className="flex-1 flex flex-col items-center gap-16 min-h-0"> */}
      <header className="flex flex-col items-center gap-9"></header>
      <VerticalDock sections={sections} logo="D" eyebrow="Northwind" />
      {/* <Outlet /> */}
      {/* </div> */}
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
