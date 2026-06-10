import { supabase } from "~/postgres/supaclient";
import TrendCard from "../components/trend-card";
import { TrendCharts } from "../components/trend-chart";
import type { Route } from "./+types/dashboard";
import { DateTime } from "luxon";
import { getLiveSurveyData, getNumberData } from "../query";

const data = [
  { date: "2025-10-01", data: 186 },
  { date: "2025-10-02", data: 190 },
  { date: "2025-10-03", data: 178 },
  { date: "2025-10-04", data: 192 },
  { date: "2025-10-05", data: 184 },
  { date: "2025-10-06", data: 189 },
  { date: "2025-10-07", data: 181 },
  { date: "2025-10-08", data: 195 },
  { date: "2025-10-09", data: 188 },
  { date: "2025-10-10", data: 191 },
  { date: "2025-10-11", data: 183 },
  { date: "2025-10-12", data: 197 },
  { date: "2025-10-13", data: 185 },
  { date: "2025-10-14", data: 193 },
];
export const loader = async ({ request }: Route.LoaderArgs) => {
  const { data, error } = await supabase.rpc("increment_daily_visitor", {
    day: DateTime.now().startOf("day").toISO({ includeOffset: false }),
  });
  const thisWeekStart = DateTime.now()
    .startOf("week")
    .toISO({ includeOffset: false });
  const thisWeekEnd = DateTime.now().toISO({ includeOffset: false });
  const lastWeekStart = DateTime.now()
    .startOf("week")
    .minus({ week: 1 })
    .toISO({ includeOffset: false });

  const thisSixMonthStart = DateTime.now()
    .startOf("month")
    .minus({ month: 6 })
    .toISO({ includeOffset: false });
  const thisSixMonthEnd = DateTime.now().toISO({ includeOffset: false });
  const lastSixMonthStart = DateTime.now()
    .startOf("month")
    .minus({ month: 12 })
    .toISO({ includeOffset: false });
  const { data: liveSurveyCount } = await supabase
    .from("daily_live_survey")
    .select("count, created_at")
    .order("created_at");
  let formedLivedSurveyCount = [{ date: "", data: 0 }];
  if (liveSurveyCount) {
    formedLivedSurveyCount = liveSurveyCount.map((c) => {
      return {
        date: c.created_at,
        data: c.count,
      };
    });
  }
  const numberCard = await getNumberData(
    lastWeekStart,
    thisWeekStart,
    thisWeekEnd,
  );
  const numberLiveSurveyCard = await getLiveSurveyData(
    lastSixMonthStart,
    thisSixMonthStart,
    thisSixMonthEnd,
  );
  return {
    ...numberLiveSurveyCard,
    ...numberCard,
    formedLivedSurveyCount,
  };
};

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="grid grid-cols-3 mt-10 gap-5 w-full">
        <TrendCard
          title={"Total Visitors"}
          value={loaderData.value}
          trendValue={loaderData.trendValue + "%"}
          trendMessage={loaderData.upAndDown ? "Trending up" : "Trending down"}
          periodMessage={"last 7 days"}
          check={loaderData.upAndDown}
        />
        <TrendCard
          title={"Live Surveys"}
          value={loaderData.lsvalue}
          trendValue={loaderData.lstrendValue + "%"}
          trendMessage={
            loaderData.lsupAndDown ? "Trending up" : "Trending down"
          }
          periodMessage={"last 6 months"}
          check={loaderData.lsupAndDown}
        />
        <TrendCard
          title={"Archived Surveys"}
          value={"123,123"}
          trendValue={"200%"}
          trendMessage={"Trending up"}
          periodMessage={"last 6 months"}
          check={loaderData.upAndDown}
        />
      </div>
      <div className="grid grid-cols-2 mt-5 gap-5 w-full">
        <TrendCharts
          title={"Live Surveys"}
          description={"daily live survey count"}
          trendMessage={""}
          periodMessage={""}
          chartData={loaderData.formedLivedSurveyCount}
        />
        <TrendCharts
          title={"Archived Surveys"}
          description={"daily archived survey count"}
          trendMessage={""}
          periodMessage={""}
          chartData={data}
        />
      </div>
    </div>
  );
}
