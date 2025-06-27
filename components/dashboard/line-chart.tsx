"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import { CHART_COLORS } from "@/lib/brand"

interface DataPoint {
  name: string
  value: number
}

interface LineChartProps {
  title: string
  data?: DataPoint[]
  yAxisLabel?: string
  color?: string
}

export function RevenueLineChart({ title, data, yAxisLabel = "", color = "#00E6E4" }: LineChartProps) {
  const [chartData, setChartData] = useState<DataPoint[]>([])

  useEffect(() => {
    if (data) {
      setChartData(data)
    } else {
      // Default mock data if none provided
      setChartData([
        { name: "Jan", value: 2800 },
        { name: "Feb", value: 1600 },
        { name: "Mar", value: 4500 },
        { name: "Apr", value: 1800 },
        { name: "May", value: 1800 },
        { name: "Jun", value: 6000 },
      ])
    }
  }, [data])

  const formatYAxis = (value: number) => {
    return `$${value}`
  }

  // Convert CSS variable to actual color if needed
  const getActualColor = (colorValue: string) => {
    if (colorValue.startsWith('var(')) {
      // Map CSS variables to actual colors
      if (colorValue.includes('brand-cyan')) return '#00E6E4'
      if (colorValue.includes('brand-bright-blue')) return '#0068FF'
      if (colorValue.includes('brand-deep-blue')) return '#090030'
    }
    return colorValue
  }

  const actualColor = getActualColor(color)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={actualColor} stopOpacity={0.8} />
              <stop offset="95%" stopColor={actualColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            stroke="rgba(255, 255, 255, 0.5)" 
            fontSize={12} 
            tickLine={false} 
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }} 
          />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="rgba(255, 255, 255, 0.5)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft", style: { textAnchor: "middle", fill: "rgba(255, 255, 255, 0.5)" } }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-white/10 bg-black/80 backdrop-blur-sm p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {payload[0].payload.name}
                        </span>
                        <span className="font-bold text-white">${payload[0].value}</span>
                      </div>
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={actualColor}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: "#000814", stroke: actualColor }}
            activeDot={{ r: 6, strokeWidth: 0, fill: actualColor }}
            name="revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
