import {
  isRouteErrorResponse,
  Links,
  Meta,
  Scripts,
  Outlet,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { AppDock } from "./components/AppDock";
import { AppSidebar } from "./components/AppSidebar";
import { APPS, activeSection, activeSubItem, appForPath } from "./lib/apps";

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

/**
 * The shell: the open app's sidebar and its page in one window, and the dock for
 * moving between apps at the bottom. The shell itself never scrolls.
 */
export default function App() {
  const { pathname } = useLocation();
  if (pathname === "/login") {
    return <Outlet />;
  }

  const app = appForPath(pathname);
  const section = activeSection(app, pathname);

  return (
    <main className="flex h-dvh w-screen flex-col gap-2 overflow-hidden p-2">
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-900/5 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/40">
        <AppSidebar
          key={app.key}
          app={app}
          activeSectionUrl={section?.url}
          activeScreenUrl={activeSubItem(section, pathname)?.url}
        />
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
      <AppDock apps={APPS} activeKey={app.key} />
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
