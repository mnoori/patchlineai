"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts"
import { CHART_COLORS } from "@/lib/brand"

interface Campaign {
  date: string
  name: string
  type: string
}

interface RevenueChartProps {
  data: any[]
  campaigns: Campaign[]
}

export function RevenueChart({ data, campaigns }: RevenueChartProps) {
  const [hoveredCampaign, setHoveredCampaign] = useState<Campaign | null>(null)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/90 border border-border p-3 rounded-lg shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="capitalize text-sm">{entry.name}</span>
              </div>
              <span className="font-medium text-sm">{formatCurrency(entry.value)}</span>
            </div>
          ))}
          <div className="border-t border-border/50 mt-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total</span>
              <span className="font-bold text-sm">
                {formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
              </span>
            </div>
          </div>
          {data.find((item) => item.name === label)?.campaign && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <Badge variant="outline" className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20">
                {data.find((item) => item.name === label)?.campaign}
              </Badge>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="glass-effect hover:border-brand-cyan/30 hover:scale-[1.01] transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Revenue Trends</CardTitle>
        <div className="flex gap-2">
          {campaigns.map((campaign) => (
            <Badge
              key={campaign.name}
              variant="outline"
              className="bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20 cursor-pointer hover:bg-brand-cyan/20 transition-colors"
              onMouseEnter={() => setHoveredCampaign(campaign)}
              onMouseLeave={() => setHoveredCampaign(null)}
            >
              {campaign.type}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="spotify"
                stroke={CHART_COLORS.platforms.spotify}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="apple"
                stroke={CHART_COLORS.platforms.appleMusic}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="youtube"
                stroke={CHART_COLORS.platforms.youtube}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="amazon"
                stroke="#00A8E1"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="other"
                stroke={CHART_COLORS.platforms.soundcloud}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              {campaigns.map((campaign) => (
                <ReferenceLine
                  key={campaign.name}
                  x={campaign.date}
                  stroke={hoveredCampaign?.date === campaign.date ? CHART_COLORS.primary : `${CHART_COLORS.primary}80`}
                  strokeWidth={hoveredCampaign?.date === campaign.date ? 2 : 1}
                  strokeDasharray={hoveredCampaign?.date === campaign.date ? "3 0" : "3 3"}
                  label={{
                    value: hoveredCampaign?.date === campaign.date ? campaign.name : "",
                    position: "top",
                    fill: CHART_COLORS.primary,
                    fontSize: 12,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
