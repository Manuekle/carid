'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
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
}

const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? new Date() : date;
};

export function RevenueChart({ data, title, description, className }: RevenueChartProps) {
  // Determine the time period based on the number of data points
  const timePeriod = data.length <= 24 ? 'day' : 
                    data.length <= 31 ? 'week' : 
                    data.length <= 12 ? 'month' : 'year';

  const chartData = data.map(item => {
    const date = parseDate(item.date);
    let name, fullDate;
    
    switch(timePeriod) {
      case 'day':
        name = format(date, 'HH:mm', { locale: es });
        fullDate = format(date, 'dd MMMM yyyy HH:mm', { locale: es });
        break;
      case 'week':
        name = format(date, 'EEE', { locale: es });
        fullDate = format(date, 'dd MMMM yyyy', { locale: es });
        break;
      case 'month':
        name = `Semana ${Math.ceil(date.getDate() / 7)}`;
        fullDate = format(date, 'MMMM yyyy', { locale: es });
        break;
      case 'year':
      default:
        name = format(date, 'MMM', { locale: es });
        fullDate = format(date, 'MMMM yyyy', { locale: es });
    }

    return {
      name,
      fullDate,
      revenue: item.revenue,
    };
  });

  const percentageChange = 5.2; // Replace with real calculation

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-heading">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={{ revenue: { label: 'Ingresos', color: 'var(--chart-1)' } }}
        >
          <LineChart data={chartData} margin={{ top: 20, left: 12, right: 12 }}>
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
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-background border border-border rounded-lg shadow-lg p-3 [&_.value]:text-base [&_.value]:font-semibold"
                  labelClassName="text-sm font-medium text-muted-foreground"
                />
              }
              formatter={(value: number, name: string, props: any) => {
                // Get the actual revenue value from the payload
                const payload = props?.payload;
                const revenue = payload?.revenue ?? value;
                const displayValue = revenue || 0; // Ensure we don't show undefined/NaN
                
                return [
                  <span key="value" className="text-foreground">
                    ${displayValue.toLocaleString('es-ES')}
                  </span>,
                  <span key="label" className="text-muted-foreground">
                    Ingresos totales
                  </span>,
                ];
              }}
              labelFormatter={(label, payload) => {
                return payload?.[0]?.payload?.fullDate || label || '';
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
                  return `$${numValue.toLocaleString('es-ES')}`;
                }}
              />
            </Line>
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Tendencia de {percentageChange}% <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Últimos {data.length} meses</div>
      </CardFooter>
    </Card>
  );
}
