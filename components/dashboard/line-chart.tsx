"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

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

export function RevenueLineChart({ title, data, yAxisLabel = "", color = "#00E5FF" }: LineChartProps) {
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

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={{ stroke: "#333" }} />
          <YAxis
            tickFormatter={formatYAxis}
            stroke="#666"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: "#333" }}
            label={{ value: yAxisLabel, angle: -90, position: "insideLeft", style: { textAnchor: "middle" } }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {payload[0].payload.name}
                        </span>
                        <span className="font-bold text-muted-foreground">${payload[0].value}</span>
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
            stroke={color}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: "#111", stroke: color }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
            name="revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
