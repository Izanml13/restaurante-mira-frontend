import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from "recharts";

const COLORS = ["#1a5c2e", "#c9a227", "#b44d3e", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"];

export function RevenueLineChart({ data, title }) {
  if (!data || data.length === 0) return <p className="vacio-texto">Sin datos</p>;
  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => ({ mes, facturacion: Math.round(d.facturacion * 100) / 100, comisiones: Math.round(d.comisiones * 100) / 100 }));

  return (
    <div className="dash-chart">
      <h3 className="dash-chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => `${v.toFixed(2)}\u20AC`} />
          <Legend />
          <Line type="monotone" dataKey="facturacion" stroke="#c9a227" strokeWidth={2} name="Facturación" />
          <Line type="monotone" dataKey="comisiones" stroke="#b44d3e" strokeWidth={2} name="Comisiones" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ReservationsPieChart({ completadas, canceladas, noShow, pendientes, title }) {
  const total = completadas + canceladas + noShow + pendientes;
  if (total === 0) return <p className="vacio-texto">Sin datos</p>;
  const chartData = [
    { name: "Completadas", value: completadas },
    { name: "Canceladas", value: canceladas },
    { name: "No Show", value: noShow },
    { name: "Pendientes", value: pendientes },
  ].filter(d => d.value > 0);

  return (
    <div className="dash-chart">
      <h3 className="dash-chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} innerRadius={45} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v) => `${v} reservas`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueBarChart({ data, title }) {
  if (!data || data.length === 0) return <p className="vacio-texto">Sin datos</p>;
  const chartData = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, d]) => ({ mes, tickets: d.tickets || 0 }));

  return (
    <div className="dash-chart">
      <h3 className="dash-chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="tickets" fill="#1a5c2e" radius={[4, 4, 0, 0]} name="Tickets" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RestaurantPerformanceChart({ data, title }) {
  if (!data || Object.keys(data).length === 0) return <p className="vacio-texto">Sin datos</p>;
  const chartData = Object.entries(data)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10)
    .map(([id, d]) => ({
      nombre: d.nombre || id.slice(0, 8),
      total: d.total,
      completadas: d.completadas,
      canceladas: d.canceladas,
      noShow: d.noShow,
    }));

  return (
    <div className="dash-chart">
      <h3 className="dash-chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completadas" stackId="a" fill="#1a5c2e" name="Completadas" />
          <Bar dataKey="canceladas" stackId="a" fill="#c9a227" name="Canceladas" />
          <Bar dataKey="noShow" stackId="a" fill="#b44d3e" name="No Show" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
