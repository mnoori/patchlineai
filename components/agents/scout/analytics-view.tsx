"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Filter, Calendar, TrendingUp, Music2, Globe } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { CHART_COLORS, getChartColor } from "@/lib/brand"

export function AnalyticsView() {
  // Sample data for charts
  const trendData = [
    { name: "Jan", Electronic: 40, HipHop: 24, Indie: 35 },
    { name: "Feb", Electronic: 30, HipHop: 25, Indie: 38 },
    { name: "Mar", Electronic: 20, HipHop: 27, Indie: 40 },
    { name: "Apr", Electronic: 27, HipHop: 30, Indie: 45 },
    { name: "May", Electronic: 35, HipHop: 35, Indie: 42 },
    { name: "Jun", Electronic: 45, HipHop: 40, Indie: 40 },
    { name: "Jul", Electronic: 55, HipHop: 45, Indie: 38 },
  ]

  const genreData = [
    { name: "Electronic", value: 35 },
    { name: "Hip Hop", value: 25 },
    { name: "Indie", value: 20 },
    { name: "Rock", value: 10 },
    { name: "Pop", value: 10 },
  ]

  const regionData = [
    { name: "North America", value: 45 },
    { name: "Europe", value: 30 },
    { name: "Asia", value: 15 },
    { name: "South America", value: 7 },
    { name: "Other", value: 3 },
  ]

  const platformData = [
    { name: "Spotify", value: 40 },
    { name: "TikTok", value: 25 },
    { name: "SoundCloud", value: 15 },
    { name: "YouTube", value: 12 },
    { name: "Instagram", value: 8 },
  ]

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Growth Analytics</CardTitle>
            <CardDescription>Trend analysis across genres and growth patterns.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Calendar className="h-4 w-4" /> Last 6 Months
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="trends">
          <TabsList className="mb-6">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="genres">Genres</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
          </TabsList>

          <TabsContent value="trends">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cosmic-teal" />
                <h3 className="text-lg font-medium">Genre Growth Trends</h3>
              </div>

              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid.line} />
                    <XAxis dataKey="name" stroke={CHART_COLORS.grid.text} />
                    <YAxis stroke={CHART_COLORS.grid.text} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: CHART_COLORS.tooltip.background,
                        borderColor: CHART_COLORS.grid.line,
                        color: CHART_COLORS.tooltip.text,
                      }}
                      labelStyle={{ color: CHART_COLORS.tooltip.text }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Electronic" stroke={CHART_COLORS.series[0]} activeDot={{ r: 8 }} strokeWidth={2} />
                    <Line type="monotone" dataKey="HipHop" stroke={CHART_COLORS.series[1]} strokeWidth={2} />
                    <Line type="monotone" dataKey="Indie" stroke={CHART_COLORS.series[2]} strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-cosmic-midnight/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Fastest Growing</p>
                        <p className="text-xl font-bold">Electronic</p>
                      </div>
                      <div className="text-cosmic-teal text-xl font-bold">+55%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-midnight/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Most Consistent</p>
                        <p className="text-xl font-bold">Hip Hop</p>
                      </div>
                      <div className="text-amber-500 text-xl font-bold">+45%</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-cosmic-midnight/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Emerging Trend</p>
                        <p className="text-xl font-bold">Indie</p>
                      </div>
                      <div className="text-purple-500 text-xl font-bold">+38%</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="genres">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-cosmic-teal" />
                <h3 className="text-lg font-medium">Genre Distribution</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genreData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid.line} />
                      <XAxis type="number" stroke={CHART_COLORS.grid.text} />
                      <YAxis dataKey="name" type="category" stroke={CHART_COLORS.grid.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS.series[0]} radius={[0, 4, 4, 0]}>
                        {genreData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-cosmic-midnight/50 p-4 rounded-lg border border-cosmic-teal/20">
                <h4 className="font-medium mb-2">AI Insights</h4>
                <p className="text-sm text-muted-foreground">
                  Electronic music has seen a 55% growth in the last quarter, with a significant increase in unsigned
                  talent. This trend aligns with your label's current roster, suggesting potential for expansion in this
                  genre.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regions">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-cosmic-teal" />
                <h3 className="text-lg font-medium">Regional Distribution</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid.line} />
                      <XAxis type="number" stroke={CHART_COLORS.grid.text} />
                      <YAxis dataKey="name" type="category" stroke={CHART_COLORS.grid.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS.series[0]} radius={[0, 4, 4, 0]}>
                        {regionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-cosmic-midnight/50 p-4 rounded-lg border border-cosmic-teal/20">
                <h4 className="font-medium mb-2">AI Insights</h4>
                <p className="text-sm text-muted-foreground">
                  While North America remains your primary market, there's significant growth potential in Europe and
                  Asia. Consider targeting these regions for your next artist signings to diversify your global
                  presence.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="platforms">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-cosmic-teal" />
                <h3 className="text-lg font-medium">Platform Distribution</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid.line} />
                      <XAxis type="number" stroke={CHART_COLORS.grid.text} />
                      <YAxis dataKey="name" type="category" stroke={CHART_COLORS.grid.text} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: CHART_COLORS.tooltip.background,
                          borderColor: CHART_COLORS.grid.line,
                          color: CHART_COLORS.tooltip.text,
                        }}
                        labelStyle={{ fill: CHART_COLORS.tooltip.text }}
                      />
                      <Bar dataKey="value" fill={CHART_COLORS.series[0]} radius={[0, 4, 4, 0]}>
                        {platformData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-cosmic-midnight/50 p-4 rounded-lg border border-cosmic-teal/20">
                <h4 className="font-medium mb-2">AI Insights</h4>
                <p className="text-sm text-muted-foreground">
                  TikTok is showing the fastest growth rate among platforms, with a 25% increase in music discovery.
                  Consider focusing your scouting efforts on TikTok trends to identify emerging artists earlier in their
                  growth cycle.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
