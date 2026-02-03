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
  const countryCount = stats.reduce((acc, item) => {
    const key = item.country || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const countries = Object.entries(countryCount)
    .map(([country, count]) => ({country, count}))
    .filter((row) => row.country !== "Unknown")
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <div style={{width: "100%", height: 300}}>
      <ResponsiveContainer>
        <BarChart width={700} height={300} data={countries}>
          <XAxis dataKey="country" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
