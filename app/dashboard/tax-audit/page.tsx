"use client"

import { useState, useEffect } from "react"
import { ExpenseReviewTable } from "@/components/tax-audit/expense-review-table"
import { CategorySidebar } from "@/components/tax-audit/category-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import {
  Download,
  RefreshCw,
  FileSpreadsheet,
  Calculator,
  Loader2,
  Upload,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function TaxAuditPage() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("expenses")
  const [summary, setSummary] = useState<any>(null)
  const { toast } = useToast()

  // Load expenses on component mount
  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tax-audit/expenses?userId=default-user')
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error loading expenses:', error)
      toast({
        title: "Error",
        description: "Failed to load tax expenses",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/tax-audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'default-user',
          format: 'excel',
          includeRejected: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.downloadUrl) {
          // If API returns a download URL, open it
          window.open(data.downloadUrl, '_blank')
        } else {
          // Otherwise, client-side export will be handled by the component
          toast({
            title: "Success",
            description: "Export prepared successfully",
          })
        }
      } else {
        throw new Error('Failed to export data')
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      })
    }
  }

  const handleGenerateTaxPackage = async () => {
    try {
      toast({
        title: "Generating Tax Package",
        description: "Please wait while we prepare your tax package...",
      })
      
      const response = await fetch('/api/tax-audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'default-user',
          format: 'tax-package',
          includeRejected: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Success",
          description: data.message || "Tax package generated successfully",
        })
      } else {
        throw new Error('Failed to generate tax package')
      }
    } catch (error) {
      console.error('Error generating tax package:', error)
      toast({
        title: "Error",
        description: "Failed to generate tax package",
        variant: "destructive"
      })
    }
  }

  // Handle category click from sidebar to filter expenses
  const handleCategoryClick = (businessType: string, category: string) => {
    // This would be implemented to filter the expense table
    // For now, just show a toast
    toast({
      title: "Category Selected",
      description: `Filtering by ${businessType} / ${category}`,
    })
  }

  // Create business summaries for sidebar from expenses data
  const createBusinessSummaries = () => {
    if (!summary) return []
    
    // Helper function to create category totals
    const createCategoryTotals = (businessType: 'media' | 'consulting') => {
      const categories = expenses
        .filter(exp => exp.businessType === businessType)
        .reduce((acc: any, exp: any) => {
          if (!acc[exp.category]) {
            acc[exp.category] = {
              category: exp.category,
              amount: 0,
              count: 0,
              approved: 0,
              pending: 0,
              rejected: 0
            }
          }
          
          acc[exp.category].amount += exp.amount
          acc[exp.category].count += 1
          
          if (exp.classificationStatus === 'approved') {
            acc[exp.category].approved += 1
          } else if (exp.classificationStatus === 'rejected') {
            acc[exp.category].rejected += 1
          } else {
            acc[exp.category].pending += 1
          }
          
          return acc
        }, {})
      
      return Object.values(categories)
    }
    
    return [
      {
        businessType: 'media',
        totalAmount: summary.businessTypeTotals?.media || 0,
        totalExpenses: expenses.filter(exp => exp.businessType === 'media').length,
        categoryTotals: createCategoryTotals('media'),
        targetBudget: 105903 // From TAX_CATEGORIES
      },
      {
        businessType: 'consulting',
        totalAmount: summary.businessTypeTotals?.consulting || 0,
        totalExpenses: expenses.filter(exp => exp.businessType === 'consulting').length,
        categoryTotals: createCategoryTotals('consulting'),
        targetBudget: 44794 // From TAX_CATEGORIES
      }
    ]
  }

  // Create overall summary for sidebar
  const createOverallSummary = () => {
    if (!summary) {
      return {
        totalExpenses: 0,
        totalAmount: 0,
        pendingReview: 0,
        approved: 0,
        rejected: 0
      }
    }
    
    return {
      totalExpenses: summary.totalExpenses || 0,
      totalAmount: summary.totalAmount || 0,
      pendingReview: summary.pendingReview || 0,
      approved: summary.approved || 0,
      rejected: summary.rejected || 0
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tax Audit Dashboard</h1>
            <p className="text-muted-foreground">
              Manage, categorize, and export your business expenses for tax preparation
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadExpenses}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CategorySidebar
              businessSummaries={createBusinessSummaries()}
              scheduleCLineTotals={summary?.scheduleCLineTotals || {}}
              overallSummary={createOverallSummary()}
              onCategoryClick={handleCategoryClick}
              onExport={handleExport}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="glass-effect">
              <CardHeader className="pb-3">
                <CardTitle>Expense Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="upload">Upload Documents</TabsTrigger>
                    <TabsTrigger value="tax-package">Tax Package</TabsTrigger>
                  </TabsList>

                  <TabsContent value="expenses" className="mt-6">
                    <ExpenseReviewTable userId="default-user" />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-6">
                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                      <FileText className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Upload Bank Statements</h3>
                      <p className="text-slate-400 mb-6">
                        Upload bank statements and credit card statements to automatically extract expenses
                      </p>
                      <Button
                        onClick={() => window.location.href = '/dashboard/god-mode'}
                        className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Go to Document Upload
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="tax-package" className="mt-6">
                    <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                      <Calculator className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Generate Tax Package</h3>
                      <p className="text-slate-400 mb-6">
                        Create a comprehensive tax package with Schedule C line item totals and supporting documentation
                      </p>
                      <Button
                        onClick={handleGenerateTaxPackage}
                        className="bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-black font-semibold"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Generate Tax Package
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 