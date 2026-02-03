/* eslint-disable react/prop-types */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Location({stats = []}) {
  const cityCount = stats.reduce((acc, item) => {
    const city = item.city || "Unknown";
    const region = item.region && item.region !== "Unknown" ? item.region : "";
    const country = item.country && item.country !== "Unknown" ? item.country : "";
    const cityRegion = region ? `${city}, ${region}` : city;
    const key = country ? `${cityRegion}, ${country}` : cityRegion;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const cities = Object.entries(cityCount)
    .map(([city, count]) => ({city, count}))
    .filter((row) => row.city && row.city !== "Unknown")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div style={{width: "100%", height: 320}}>
      <ResponsiveContainer>
        <BarChart width={700} height={320} data={cities}>
          <XAxis dataKey="city" interval={0} angle={-25} textAnchor="end" height={70} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#60a5fa" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
