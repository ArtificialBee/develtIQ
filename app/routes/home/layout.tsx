import { Outlet } from "react-router";
import { BasicNavbar, type NavLink } from "~/components/BasicNavbar";

const navLinks: NavLink[] = [
  {
    label: "Dobrodošli",
    href: "/home",
  },
  {
    label: "KPI - Praćenje performansi",
    href: "/home/kpi",
  },
];

export default function HomeLayout() {
  return (
    <div className="w-full">
      <BasicNavbar links={navLinks} />
      <Outlet />
    </div>
  );
}
