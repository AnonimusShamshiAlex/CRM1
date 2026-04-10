export default function ProfitabilityDashboardPage() {
  const cards = [
    ['Gross Revenue', '$42,000'],
    ['Expenses', '$12,500'],
    ['Net Profit', '$29,500'],
    ['Team Burn Rate', '$310/day'],
  ];
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map(([label, value]) => (
        <div key={label} className="border rounded-2xl p-4 shadow">
          <div className="text-sm opacity-70">{label}</div>
          <div className="text-2xl font-bold mt-2">{value}</div>
        </div>
      ))}
    </div>
  );
}