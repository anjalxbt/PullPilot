"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const data = [
  { name: "Mon", prs: 2, issues: 5 },
  { name: "Tue", prs: 4, issues: 3 },
  { name: "Wed", prs: 3, issues: 6 },
  { name: "Thu", prs: 6, issues: 4 },
  { name: "Fri", prs: 5, issues: 2 },
  { name: "Sat", prs: 3, issues: 1 },
  { name: "Sun", prs: 4, issues: 2 },
];

export default function AnalyticsChart() {
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="prs" stroke="#6366F1" strokeWidth={2} />
          <Line type="monotone" dataKey="issues" stroke="#8B5CF6" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}