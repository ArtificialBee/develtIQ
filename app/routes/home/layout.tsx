import { Outlet } from "react-router";

export default function HomeLayout() {
  // The app's screens are in the side rail now, so each page gets the whole height.
  // The home screens fit that height without scrolling.
  return (
    <div className="h-full w-full">
      <Outlet />
    </div>
  );
}
