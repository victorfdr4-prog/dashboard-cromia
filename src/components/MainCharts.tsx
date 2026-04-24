import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { DailyData } from '../types';

interface MainChartsProps {
  data: DailyData[];
}

function ChartCard({
  title,
  dataKey,
  stroke,
  data,
}: {
  title: string;
  dataKey: keyof DailyData;
  stroke: string;
  data: DailyData[];
}) {
  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10 backdrop-blur-md">
      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">{title}</h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="data"
              tick={{ fontSize: 9, fill: '#64748b' }}
              tickFormatter={(value) => value.split('-').slice(2).join('/')}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
              itemStyle={{ fontSize: '10px' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={stroke}
              strokeWidth={3}
              dot={{ fill: stroke, strokeWidth: 2, r: 0 }}
              activeDot={{ r: 6, fill: stroke, stroke: '#fff', strokeWidth: 2 }}
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export const MainCharts: React.FC<MainChartsProps> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <ChartCard title="Cliques Diários" dataKey="cliques" stroke="#3b82f6" data={data} />
      <ChartCard title="Alcance Diário" dataKey="alcance" stroke="#8b5cf6" data={data} />
      <ChartCard title="Impressões Diárias" dataKey="impressoes" stroke="#ec4899" data={data} />
    </div>
  );
};

