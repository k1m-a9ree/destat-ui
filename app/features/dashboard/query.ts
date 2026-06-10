import { sum } from "drizzle-orm";
import type { StringUnitLength } from "luxon";
import { supabase } from "~/postgres/supaclient";

export const getNumberData = async (
  lastStart: string,
  thisStart: string,
  End: string,
) => {
  const { data: lastWeek } = await supabase
    .from("daily_visitor")
    .select("count")
    .lt("day_start", thisStart)
    .gte("day_start", lastStart);
  const { data: thisWeek } = await supabase
    .from("daily_visitor")
    .select("count")
    .lt("day_start", End)
    .gte("day_start", thisStart);
  if (lastWeek && thisWeek) {
    const lastWeekCount = lastWeek.reduce((sum, value) => sum + value.count, 0);
    const thisWeekCount = thisWeek.reduce((sum, value) => sum + value.count, 0);
    return {
      value: thisWeekCount.toString(),
      trendValue: Math.round(
        (thisWeekCount / (lastWeekCount || 1)) * 100,
      ).toString(),
      upAndDown: thisWeekCount > lastWeekCount,
    };
  } else {
    return { value: "0", trendValue: "0", upAndDown: false };
  }
};

export const getLiveSurveyData = async (
  lastStart: string,
  thisStart: string,
  End: string,
) => {
  const { data: lastSixMonth } = await supabase
    .from("daily_live_survey")
    .select("count")
    .lt("created_at", thisStart)
    .gte("created_at", lastStart);
  const { data: thisSixMonth } = await supabase
    .from("daily_live_survey")
    .select("count")
    .lt("created_at", End)
    .gte("created_at", thisStart);
  if (lastSixMonth && thisSixMonth) {
    const lastWeekCount = lastSixMonth.reduce(
      (sum, value) => sum + value.count,
      0,
    );
    const thisWeekCount = thisSixMonth.reduce(
      (sum, value) => sum + value.count,
      0,
    );
    return {
      lsvalue: thisWeekCount.toString(),
      lstrendValue: Math.round(
        (thisWeekCount / (lastWeekCount || 1)) * 100,
      ).toString(),
      lsupAndDown: thisWeekCount > lastWeekCount,
    };
  } else {
    return { lsvalue: "0", lstrendValue: "0", lsupAndDown: false };
  }
};
