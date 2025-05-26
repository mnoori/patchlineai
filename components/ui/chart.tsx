"use client"

import type * as React from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  ComposedChart,
} from "recharts"
import { cn } from "@/lib/utils"

// Common chart tooltip component
export function ChartTooltip({ active, payload, label, formatter, labelFormatter, className, ...props }: any) {
  if (!active || !payload?.length) return null

  return (
    <div className={cn("rounded-lg border bg-background p-2 shadow-md", className)} {...props}>
      {labelFormatter ? (
        <p className="text-xs font-medium">{labelFormatter(label, payload)}</p>
      ) : (
        <p className="text-xs font-medium">{label}</p>
      )}
      <div className="mt-1 space-y-0.5">
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center text-xs">
            <div className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}: </span>
            <span className="ml-1 font-medium">{formatter ? formatter(entry.value) : entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Common chart legend component
export function ChartLegend({ payload, className, onClick, ...props }: any) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)} {...props}>
      {payload.map((entry: any, index: number) => (
        <div
          key={`item-${index}`}
          className="flex cursor-pointer items-center text-xs"
          onClick={() => onClick && onClick(entry)}
        >
          <div className="mr-1 h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className={cn(entry.inactive && "text-muted-foreground line-through")}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

// Common chart grid component
export function ChartGrid({ className, ...props }: React.ComponentProps<typeof CartesianGrid>) {
  return <CartesianGrid className={cn("stroke-border stroke-[0.5px]", className)} {...props} />
}

// Common chart x-axis component
export function ChartXAxis({ className, ...props }: React.ComponentProps<typeof XAxis>) {
  return (
    <XAxis
      axisLine={false}
      tickLine={false}
      tick={{ fontSize: 12 }}
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

// Common chart y-axis component
export function ChartYAxis({ className, ...props }: React.ComponentProps<typeof YAxis>) {
  return (
    <YAxis
      axisLine={false}
      tickLine={false}
      tick={{ fontSize: 12 }}
      className={cn("text-muted-foreground", className)}
      width={40}
      {...props}
    />
  )
}

// Customizable area chart component
export function AreaChartComponent({
  data,
  areaProps,
  xAxisProps,
  yAxisProps,
  gridProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  areaProps?: React.ComponentProps<typeof Area>
  xAxisProps?: React.ComponentProps<typeof XAxis>
  yAxisProps?: React.ComponentProps<typeof YAxis>
  gridProps?: React.ComponentProps<typeof CartesianGrid>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof AreaChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} {...props}>
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <ChartGrid {...gridProps} />
          <ChartXAxis {...xAxisProps} />
          <ChartYAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#00F0FF"
            fillOpacity={1}
            fill="url(#colorGradient)"
            {...areaProps}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable bar chart component
export function BarChartComponent({
  data,
  barProps,
  xAxisProps,
  yAxisProps,
  gridProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  barProps?: React.ComponentProps<typeof Bar>
  xAxisProps?: React.ComponentProps<typeof XAxis>
  yAxisProps?: React.ComponentProps<typeof YAxis>
  gridProps?: React.ComponentProps<typeof CartesianGrid>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof BarChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} {...props}>
          <ChartGrid {...gridProps} />
          <ChartXAxis {...xAxisProps} />
          <ChartYAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          <Bar dataKey="value" fill="#00F0FF" radius={[4, 4, 0, 0]} {...barProps} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable line chart component
export function LineChartComponent({
  data,
  lineProps,
  xAxisProps,
  yAxisProps,
  gridProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  lineProps?: React.ComponentProps<typeof Line>
  xAxisProps?: React.ComponentProps<typeof XAxis>
  yAxisProps?: React.ComponentProps<typeof YAxis>
  gridProps?: React.ComponentProps<typeof CartesianGrid>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof LineChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} {...props}>
          <ChartGrid {...gridProps} />
          <ChartXAxis {...xAxisProps} />
          <ChartYAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#00F0FF"
            strokeWidth={2}
            dot={{ r: 4, fill: "#00F0FF", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#00F0FF", strokeWidth: 0 }}
            {...lineProps}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable pie chart component
export function PieChartComponent({
  data,
  pieProps,
  tooltipProps,
  height = 300,
  className,
  colors = ["#00F0FF", "#0070F3", "#6B46C1", "#10B981", "#F59E0B", "#EF4444"],
  ...props
}: {
  data: any[]
  pieProps?: React.ComponentProps<typeof Pie>
  tooltipProps?: any
  height?: number
  className?: string
  colors?: string[]
} & React.ComponentProps<typeof PieChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart {...props}>
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            {...pieProps}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable radar chart component
export function RadarChartComponent({
  data,
  radarProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  radarProps?: React.ComponentProps<typeof Radar>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof RadarChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data} {...props}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar name="Value" dataKey="value" stroke="#00F0FF" fill="#00F0FF" fillOpacity={0.6} {...radarProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable scatter chart component
export function ScatterChartComponent({
  data,
  scatterProps,
  xAxisProps,
  yAxisProps,
  gridProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  scatterProps?: React.ComponentProps<typeof Scatter>
  xAxisProps?: React.ComponentProps<typeof XAxis>
  yAxisProps?: React.ComponentProps<typeof YAxis>
  gridProps?: React.ComponentProps<typeof CartesianGrid>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof ScatterChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart {...props}>
          <ChartGrid {...gridProps} />
          <ChartXAxis {...xAxisProps} />
          <ChartYAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          <Scatter name="Values" data={data} fill="#00F0FF" {...scatterProps} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

// Customizable composed chart component
export function ComposedChartComponent({
  data,
  barProps,
  lineProps,
  areaProps,
  xAxisProps,
  yAxisProps,
  gridProps,
  tooltipProps,
  height = 300,
  className,
  ...props
}: {
  data: any[]
  barProps?: React.ComponentProps<typeof Bar>
  lineProps?: React.ComponentProps<typeof Line>
  areaProps?: React.ComponentProps<typeof Area>
  xAxisProps?: React.ComponentProps<typeof XAxis>
  yAxisProps?: React.ComponentProps<typeof YAxis>
  gridProps?: React.ComponentProps<typeof CartesianGrid>
  tooltipProps?: any
  height?: number
  className?: string
} & React.ComponentProps<typeof ComposedChart>) {
  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} {...props}>
          <ChartGrid {...gridProps} />
          <ChartXAxis {...xAxisProps} />
          <ChartYAxis {...yAxisProps} />
          <Tooltip content={<ChartTooltip {...tooltipProps} />} />
          {barProps && <Bar dataKey="bar" fill="#00F0FF" radius={[4, 4, 0, 0]} {...barProps} />}
          {lineProps && (
            <Line
              type="monotone"
              dataKey="line"
              stroke="#0070F3"
              strokeWidth={2}
              dot={{ r: 4, fill: "#0070F3", strokeWidth: 0 }}
              activeDot={{ r: 6, fill: "#0070F3", strokeWidth: 0 }}
              {...lineProps}
            />
          )}
          {areaProps && (
            <Area type="monotone" dataKey="area" stroke="#10B981" fill="#10B981" fillOpacity={0.3} {...areaProps} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
