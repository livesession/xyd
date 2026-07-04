import {
  PageHeader,
  Segmented,
  StatGrid,
  type StatLineTone,
  StatTile,
} from "@apitoolchain/design-system";
import { useSearchParams } from "react-router";
import { getUsageSeries, type UsageRange } from "~/data";
import type { Route } from "./+types/usage";

export function meta() {
  return [{ title: "Usage — apitoolchain" }];
}

const RANGES: UsageRange[] = ["24h", "7d", "30d", "90d"];

export async function loader({ request }: Route.LoaderArgs) {
  const r = new URL(request.url).searchParams.get("range") as UsageRange | null;
  const range: UsageRange = r && RANGES.includes(r) ? r : "7d";
  return { range, series: await getUsageSeries(range) };
}

const LINE: StatLineTone[] = ["blue", "green", "pink", "orange"];

export default function UsageRoute({ loaderData }: Route.ComponentProps) {
  const { range, series } = loaderData;
  const [, setSearchParams] = useSearchParams();

  return (
    <>
      <PageHeader
        title="Usage"
        description="Requests, SDK downloads, MCP calls and docs views across your APIs."
        actions={
          <Segmented
            value={range}
            onChange={(v) => setSearchParams({ range: v })}
          />
        }
      />
      <StatGrid columns={2}>
        {series.map((s, i) => (
          <StatTile
            key={s.id}
            label={s.label}
            value={s.total.toLocaleString("en-US")}
            lineTone={LINE[i % LINE.length]}
            lineStyle={i % 2 === 1 ? "dashed" : "solid"}
          />
        ))}
      </StatGrid>
    </>
  );
}
