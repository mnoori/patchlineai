"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Building,
  DollarSign,
  FileText,
  TrendingUp,
  Calculator,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES } from "@/lib/tax-categories"

export interface CategoryTotal {
  category: string
  amount: number
  count: number
  approved: number
  pending: number
  rejected: number
}

export interface BusinessSummary {
  businessType: 'media' | 'consulting'
  totalAmount: number
  totalExpenses: number
  categoryTotals: CategoryTotal[]
  targetBudget: number
}

interface CategorySidebarProps {
  businessSummaries: BusinessSummary[]
  scheduleCLineTotals: Record<string, number>
  overallSummary: {
    totalExpenses: number
    totalAmount: number
    pendingReview: number
    approved: number
    rejected: number
  }
  onCategoryClick?: (businessType: string, category: string) => void
  onExport?: () => void
}

export function CategorySidebar({
  businessSummaries,
  scheduleCLineTotals,
  overallSummary,
  onCategoryClick,
  onExport
}: CategorySidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPercentage = (amount: number, total: number) => {
    if (total === 0) return 0
    return Math.round((amount / total) * 100)
  }

  const getStatusColor = (status: 'approved' | 'pending' | 'rejected') => {
    switch (status) {
      case 'approved':
        return 'text-green-500'
      case 'rejected':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="glass-effect">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Tax Audit Summary
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Expenses</span>
              <span className="text-2xl font-bold">{formatCurrency(overallSummary.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{overallSummary.totalExpenses} transactions</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className={cn("h-4 w-4", getStatusColor('approved'))} />
                <span className="text-sm">Approved</span>
              </span>
              <span className="text-sm font-medium">{overallSummary.approved}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className={cn("h-4 w-4", getStatusColor('pending'))} />
                <span className="text-sm">Pending Review</span>
              </span>
              <span className="text-sm font-medium">{overallSummary.pendingReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <XCircle className={cn("h-4 w-4", getStatusColor('rejected'))} />
                <span className="text-sm">Rejected</span>
              </span>
              <span className="text-sm font-medium">{overallSummary.rejected}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Type Breakdowns */}
      <Accordion type="multiple" defaultValue={['media', 'consulting']} className="space-y-3">
        {businessSummaries.map((summary) => {
          const budgetUtilization = getPercentage(summary.totalAmount, summary.targetBudget)
          const businessName = summary.businessType === 'media' ? 'Media & Entertainment' : 'Consulting & Services'
          
          return (
            <AccordionItem
              key={summary.businessType}
              value={summary.businessType}
              className="glass-effect rounded-lg border"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5" />
                    <div className="text-left">
                      <h3 className="font-semibold">{businessName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {summary.totalExpenses} expenses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(summary.totalAmount)}</p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(summary.targetBudget)}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {/* Budget Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Budget Utilization</span>
                      <span className="font-medium">{budgetUtilization}%</span>
                    </div>
                    <Progress value={budgetUtilization} className="h-2" />
                  </div>

                  <Separator />

                  {/* Category Breakdown */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Category Breakdown</h4>
                    {summary.categoryTotals.map((catTotal) => {
                      const categoryConfig = TAX_CATEGORIES[catTotal.category]
                      const percentage = getPercentage(catTotal.amount, summary.totalAmount)
                      
                      return (
                        <button
                          key={catTotal.category}
                          onClick={() => onCategoryClick?.(summary.businessType, catTotal.category)}
                          className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                {catTotal.category.replace(/-/g, ' ').replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {categoryConfig?.line || 'Schedule C Line 27a'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">
                                {formatCurrency(catTotal.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {catTotal.count} items
                              </p>
                            </div>
                          </div>
                          
                          {/* Status indicators */}
                          <div className="flex gap-4 text-xs">
                            {catTotal.approved > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                {catTotal.approved}
                              </span>
                            )}
                            {catTotal.pending > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-yellow-500" />
                                {catTotal.pending}
                              </span>
                            )}
                            {catTotal.rejected > 0 && (
                              <span className="flex items-center gap-1">
                                <XCircle className="h-3 w-3 text-red-500" />
                                {catTotal.rejected}
                              </span>
                            )}
                          </div>
                          
                          {/* Progress bar */}
                          <Progress value={percentage} className="h-1 mt-2" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      {/* Schedule C Line Summary */}
      <Card className="glass-effect">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Schedule C Lines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(scheduleCLineTotals)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([line, amount]) => (
                <div key={line} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm">{line}</span>
                  <span className="font-semibold text-sm">{formatCurrency(amount)}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card className="glass-effect">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5" />
            Quick Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Average Expense</span>
              <span className="font-medium">
                {formatCurrency(overallSummary.totalAmount / (overallSummary.totalExpenses || 1))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Largest Category</span>
              <span className="font-medium text-sm">
                {(() => {
                  let largest = { category: '', amount: 0 }
                  businessSummaries.forEach(summary => {
                    summary.categoryTotals.forEach(cat => {
                      if (cat.amount > largest.amount) {
                        largest = { category: cat.category, amount: cat.amount }
                      }
                    })
                  })
                  return largest.category.replace(/-/g, ' ').replace(/_/g, ' ')
                })()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Review Progress</span>
              <span className="font-medium">
                {getPercentage(
                  overallSummary.approved + overallSummary.rejected,
                  overallSummary.totalExpenses
                )}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 