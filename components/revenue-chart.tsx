'use client';

import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, CartesianGrid, LabelList } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';

type DataPoint = { date: string; revenue: number };

interface RevenueChartProps {
  data: DataPoint[];
  title: string;
  description?: string;
  className?: string;
  period?: 'week' | 'month' | 'year';
}

export function RevenueChart({
  data,
  title,
  description,
  className,
  period = 'week',
}: RevenueChartProps) {
  // Transform the data to include proper labels for display
  const chartData = data.map((item, index) => {
    return {
      name: item.date, // Use the label directly from API
      revenue: item.revenue || 0,
      displayLabel: item.date, // For tooltip display
    };
  });

  const percentageChange = 5.2; // Replace with real calculation

  const getPeriodText = () => {
    switch (period) {
      case 'week':
        return 'días';
      case 'month':
        return 'semanas';
      case 'year':
        return 'meses';
      default:
        return 'períodos';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-heading">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-[300px] w-full"
          config={{ revenue: { label: 'Ingresos', color: 'var(--chart-1)' } }}
        >
          <LineChart data={chartData} margin={{ top: 24, left: 24, right: 24, bottom: 24 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fontSize: 12 }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                  <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-xs font-medium">
                      ${(payload[0].value || 0).toLocaleString('es-ES')}
                    </p>
                    <p className="text-xs text-muted-foreground">Ingresos totales</p>
                  </div>
                );
              }}
            />
            <Line
              dataKey="revenue"
              type="natural"
              stroke="#000"
              strokeWidth={2}
              dot={{ fill: '#000', strokeWidth: 2, r: 4, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
            >
              <LabelList
                dataKey="revenue"
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
                formatter={(value: React.ReactNode) => {
                  const numValue = typeof value === 'number' ? value : 0;
                  return numValue > 0 ? `$${numValue.toLocaleString('es-ES')}` : '';
                }}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-xs">
        <div className="flex gap-2 leading-none font-medium">
          Tendencia de {percentageChange}% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Últimos {data.length} {getPeriodText()}
        </div>
      </CardFooter>
    </Card>
  );
}
