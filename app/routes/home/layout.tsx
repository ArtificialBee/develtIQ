import { Outlet } from "react-router";

export default function HomeLayout() {
  // The app's sections (Dobrodošli, KPI) are in the side rail now, so the page gets
  // the whole height. Home and KPI fit it; nothing here scrolls.
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
