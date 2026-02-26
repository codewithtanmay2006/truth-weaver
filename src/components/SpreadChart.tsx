import { SimStats } from '@/lib/simulation';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface SpreadChartProps {
  history: SimStats[];
}

export default function SpreadChart({ history }: SpreadChartProps) {
  return (
    <div className="bg-secondary rounded-lg border border-border p-4">
      <h3 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
        Spread Over Time
      </h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="tick"
              tick={{ fontSize: 10, fill: 'hsl(215,15%,50%)' }}
              axisLine={{ stroke: 'hsl(220,15%,18%)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(215,15%,50%)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220,18%,10%)',
                border: '1px solid hsl(220,15%,18%)',
                borderRadius: 8,
                fontSize: 12,
                fontFamily: 'JetBrains Mono',
              }}
              labelStyle={{ color: 'hsl(210,20%,90%)' }}
            />
            <Area type="monotone" dataKey="infected" stackId="1" stroke="#ef4444" fill="rgba(239,68,68,0.3)" />
            <Area type="monotone" dataKey="aware" stackId="1" stroke="#eab308" fill="rgba(234,179,8,0.2)" />
            <Area type="monotone" dataKey="recovered" stackId="1" stroke="#3b82f6" fill="rgba(59,130,246,0.2)" />
            <Area type="monotone" dataKey="healthy" stackId="1" stroke="#4ade80" fill="rgba(74,222,128,0.15)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
