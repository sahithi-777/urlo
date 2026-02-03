/* eslint-disable react/prop-types */
import {PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function App({stats = []}) {
  const deviceCount = stats.reduce((acc, item) => {
    const key = item.device || "desktop";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const result = Object.keys(deviceCount)
    .map((device) => ({
      device,
      count: deviceCount[device],
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div style={{width: "100%", height: 300}}>
      <ResponsiveContainer>
        <PieChart width={700} height={400}>
          <Pie
            data={result}
            labelLine={false}
            label={({device, percent}) =>
              `${device}: ${(percent * 100).toFixed(0)}%`
            }
            dataKey="count"
          >
            {result.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
