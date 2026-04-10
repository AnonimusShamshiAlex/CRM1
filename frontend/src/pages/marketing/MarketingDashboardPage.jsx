export default function MarketingDashboardPage() {
  const metrics = [
    { label: 'ROMI', value: '320%' },
    { label: 'CAC', value: '$42' },
    { label: 'CPL', value: '$6.8' },
    { label: 'Revenue Forecast', value: '$18,400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Marketing Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-2xl shadow p-4 border">
            <div className="text-sm opacity-70">{m.label}</div>
            <div className="text-2xl font-bold mt-2">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}