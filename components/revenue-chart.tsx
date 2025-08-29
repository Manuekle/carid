'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartContainer } from './ui/chart';

type DataPoint = {
  date: string;
  revenue: number;
};

interface RevenueChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  className?: string;
}

export function RevenueChart({ data, title, description, className }: RevenueChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    name: item.date,
    revenue: item.revenue,
  }));

  // Calculate percentage change (example: you can replace with real calculation)
  const percentageChange = 5.2;

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      payload: DataPoint;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      const value = payload[0].value as number;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-xs">
          <p className="font-medium text-foreground mb-1">{label}</p>
          <div className="flex items-center justify-between min-w-[120px]">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-primary mr-2" />
              <span className="text-muted-foreground">Ingresos</span>
            </div>
            <span className="font-medium text-foreground ml-4">
              ${value.toLocaleString('es-ES')}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader className="">
        <CardTitle className="text-xl font-semibold tracking-heading">{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            revenue: {
              label: 'Ingresos',
              color: 'hsl(var(--primary))',
            },
          }}
          className="aspect-auto h-[250px] w-full"
        >
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--muted))"
              vertical={true}
              horizontal={true}
              strokeOpacity={0.2}
            />
            <ReferenceLine y={0} stroke="hsl(var(--muted))" strokeWidth={1} strokeOpacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={true}
              tickMargin={4}
              tickFormatter={value => value}
            />
            <YAxis
              tickFormatter={value => `${value.toLocaleString()}`}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickLine={false}
              axisLine={true}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <div className="px-4 pt-4 border-t">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Tendencia:</span>
          <span className="flex items-center font-medium text-green-600">
            +{percentageChange}% <TrendingUp className="h-3 w-3 ml-0.5" />
          </span>
        </div>
      </div>
    </Card>
  );
}
