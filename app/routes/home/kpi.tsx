import { useState } from "react";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";
import Accordion from "~/components/Accordion";
import { Dropdown } from "~/components/DropDown";
import MyPlannerHomeComponent from "~/components/MyPlannerHomeComponent";
import { PieChart } from "~/components/PieChart";
import { RevenueBars, type BarSeries } from "~/components/RevenueBars";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Maj",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dec",
];

const revenue: BarSeries[] = [
  {
    label: "2025",
    values: [
      85.0, 86.2, 87.5, 86.4, 88.5, 89.4, 88.8, 90.1, 91.4, 90.8, 92.4, 94.8,
    ],
  },
  {
    label: "2026",
    values: [
      88.0, 89.3, 90.9, 90.0, 92.7, 93.9, 93.1, 95.1, 96.7, 95.7, 97.7, 90,
    ],
  },
];

const pieChartFirst = [
  {
    name: "Ostvareno",
    value: 517,
  },
  {
    name: "Nije ostvareno",
    value: 29,
  },
];

const pieChartSecond = [
  {
    name: "Ostvareno",
    value: 229,
  },
  {
    name: "Nije ostvareno",
    value: 111,
  },
];

const pieChartThird = [
  {
    name: "Ostvareno",
    value: 356,
  },
  {
    name: "Nije ostvareno",
    value: 144,
  },
];

const modules: string[] = [
  "Obrađeni predmeti",
  "Obrađeni kadrovski zahtjevi",
  "Obrađene fakture",
];

export default function KPI() {
  const [selectedModule, setSelectedModule] = useState(modules[0]);

  const renderFirst = () => {
    return (
      <div className="mt-6 flex gap-12">
        <div>
          <h2 className="text-5xl font-bold">517</h2>
          <p>Mjesečni cilj</p>
        </div>
        <div>
          <h2 className="text-5xl font-bold">488</h2>
          <p>Ostvareno</p>
        </div>
        <PieChart data={pieChartFirst} />
      </div>
    );
  };

  const renderSecond = () => {
    return (
      <div className="mt-6 flex gap-12">
        <div>
          <h2 className="text-5xl font-bold">229</h2>
          <p>Mjesečni cilj</p>
        </div>
        <div>
          <h2 className="text-5xl font-bold">118</h2>
          <p>Ostvareno</p>
        </div>
        <PieChart data={pieChartSecond} />
      </div>
    );
  };

  const renderThird = () => {
    return (
      <div className="mt-6 flex gap-12">
        <div>
          <h2 className="text-5xl font-bold">356</h2>
          <p>Mjesečni cilj</p>
        </div>
        <div>
          <h2 className="text-5xl font-bold">212</h2>
          <p>Ostvareno</p>
        </div>
        <PieChart data={pieChartThird} />
      </div>
    );
  };

  return (
    <>
      <h1 className="ml-6 mt-4 text-3xl text-white/80">Praćenje preformansi</h1>
      <div className="p-6 flex  flex-col mt-10">
        <div className="flex justify-between">
          <div>
            <div className="flex gap-2 items-center">
              <p className="text-5xl text-amber-300 font-bold">90</p>
              <LuArrowDown size={30} className="text-amber-300" />
            </div>
            <p>Index poslovnih performansi</p>
            <p className="text-white/60 text-xs mt-1">Cilj: 100</p>
          </div>
          <div>
            <div className="flex gap-2 items-center">
              <p className="text-5xl text-emerald-300 font-bold">6/20</p>
              <LuArrowUp size={30} className="text-emerald-300" />
            </div>
            <p>KPI-evi u planu</p>
            <p className="text-white/60 text-xs mt-1">Iza plana: 14</p>
          </div>
          <div>
            <div className="flex gap-2 items-center">
              <p className="text-5xl text-amber-300 font-bold">14/20</p>
              <LuArrowDown size={30} className="text-amber-300" />
            </div>
            <p>KPI-evi iza plana</p>
            <p className="text-white/60 text-xs mt-1">U planu: 6</p>
          </div>
          <div>
            <div className="flex gap-2 items-center">
              <p className="text-5xl text-red-400 font-bold">3</p>
              <LuArrowDown size={30} className="text-red-400" />
            </div>
            <p>Najveće odstupanje</p>
            <p className="text-white/60 text-xs mt-1">Cilj: 2/mjesec</p>
          </div>
        </div>
        <div className="mt-8">
          <RevenueBars
            categories={months}
            series={revenue}
            ticks={[0, 20, 40, 60, 80, 100]}
            title="Složeni indeks kroz godinu, naspram cilja od 100"
            showValue={false}
            className="max-w-250"
          />
        </div>
        <div className="mt-8  flex gap-4 items-center">
          <h3 className="text-3xl">Obim obrade po modulu</h3>
          <Dropdown options={modules} onChange={setSelectedModule} />
        </div>
        {selectedModule === modules[0] && renderFirst()}
        {selectedModule === modules[1] && renderSecond()}
        {selectedModule === modules[2] && renderThird()}
      </div>
    </>
  );
}
