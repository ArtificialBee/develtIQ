import Accordion from "~/components/Accordion";
import MyPlannerHomeComponent from "~/components/MyPlannerHomeComponent";

export default function Home() {
  return (
    <>
      <h1 className="ml-6 mt-4 text-3xl text-white/80">Dashboard</h1>
      <div className="p-6 flex  flex-col mt-10">
        <div className="flex justify-between">
          <div>
            <p className="text-5xl text-[#3B9DF8] font-bold">248</p>
            <p>Aktivni zaposlenici</p>
          </div>
          <div>
            <p className="text-5xl text-[#3B9DF8] font-bold">57</p>
            <p>Predmeti u obradi</p>
          </div>
          <div>
            <p className="text-5xl text-[#3B9DF8] font-bold">7</p>
            <p>Akti na čekanju potpisa</p>
          </div>
          <div>
            <p className="text-5xl text-[#3B9DF8] font-bold">23</p>
            <p>Aktivni radni nalozi</p>
          </div>
        </div>
        <div className="mt-8">
          <Accordion
            items={[
              {
                id: "moj-planer",
                title: "Moj planer",
                content: <MyPlannerHomeComponent />,
              },
            ]}
            defaultValue="moj-planer"
          />
        </div>
      </div>
    </>
  );
}
