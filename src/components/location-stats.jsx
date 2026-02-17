/* eslint-disable react/prop-types */
export default function Location({stats = []}) {
  const rows = stats.reduce((acc, item) => {
    const region =
      item.region && item.region !== "Unknown" ? item.region : "Unknown";
    const country =
      item.country && item.country !== "Unknown" ? item.country : "Unknown";
    const key = `${region}|${country}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const tableRows = Object.entries(rows)
    .map(([key, count]) => {
      const [region, country] = key.split("|");
      return {region, country, count};
    })
    .filter((row) => row.region !== "Unknown" || row.country !== "Unknown")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  if (!tableRows.length) {
    return <p className="text-sm text-gray-400">No location data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-400 border-b border-gray-700">
            <th className="py-2 pr-4">State</th>
            <th className="py-2 pr-4">Country</th>
            <th className="py-2 text-right">Clicks</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => (
            <tr key={`${row.region}-${row.country}`}>
              <td className="py-2 pr-4">{row.region}</td>
              <td className="py-2 pr-4">{row.country}</td>
              <td className="py-2 text-right">{row.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
