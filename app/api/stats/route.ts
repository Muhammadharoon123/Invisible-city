import { listIssues } from "@/lib/db";
import { cityOverview, contributors, neighborhoodStats, predictiveInsights } from "@/lib/insights";

export async function GET() {
  const issues = listIssues();
  return Response.json({
    overview: cityOverview(issues),
    neighborhoods: neighborhoodStats(issues),
    predictive: predictiveInsights(issues),
    leaderboard: contributors().slice(0, 10),
  });
}
