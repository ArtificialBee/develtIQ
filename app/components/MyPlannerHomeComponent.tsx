import React from "react";
import CardType1 from "./CardType1";

export default function MyPlannerHomeComponent() {
  return (
    <div className="flex gap-4">
      <CardType1
        title="Čeka na odluku"
        description="Broj zadataka koje čekaju na odluku"
        value="24"
        onViewMore={() => {}}
      />
      <CardType1 title="Vaši zadaci" description="Moja lista posla" value="9" />
      <CardType1
        title="Za danas"
        description="Vaši zadaci predviđeni za danas"
        value="0"
      />
    </div>
  );
}
