"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Plus,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES, getAllCategories, getScheduleCLine, getCustomCategories, saveCustomCategory } from "@/lib/tax-categories"
import * as XLSX from 'xlsx'

interface TaxExpense {
  expenseId: string
  documentId: string
  userId: string
  transactionDate: string
  amount: number
  description: string
  vendor: string
  category: string
  scheduleCLine?: string
  classificationStatus: 'pending' | 'approved' | 'rejected'
  confidenceScore: number
  bankAccount?: string
  referenceNumber?: string
  createdAt: string
  updatedAt: string
}

interface ExpenseReviewTableProps {
  userId: string
}

const BANK_ACCOUNTS = [
  { value: 'all', label: 'All Accounts' },
  { value: 'bilt', label: 'Bilt' },
  { value: 'bofa', label: 'BofA' },
  { value: 'chase-checking', label: 'Chase Checking' },
  { value: 'chase-freedom', label: 'Chase Freedom' },
  { value: 'chase-sapphire', label: 'Chase Sapphire' }
]

export function ExpenseReviewTable({ userId }: ExpenseReviewTableProps) {
  const [expenses, setExpenses] = useState<TaxExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [selectedBankAccount, setSelectedBankAccount] = useState("all")
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)

  // Fetch expenses
  useEffect(() => {
    fetchExpenses()
    // Load custom categories
    const custom = getCustomCategories()
    setCustomCategories(custom)
  }, [userId])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tax-audit/expenses?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses || [])
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || expense.classificationStatus === statusFilter
    const matchesBank = selectedBankAccount === "all" || expense.bankAccount === selectedBankAccount
    
    return matchesSearch && matchesStatus && matchesBank
  })

  // Get counts by bank account
  const bankAccountCounts = expenses.reduce((acc, expense) => {
    const bank = expense.bankAccount || 'unknown'
    acc[bank] = (acc[bank] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleCategoryChange = async (expenseId: string, newCategory: string) => {
    try {
      const response = await fetch(`/api/tax-audit/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          updates: { 
            category: newCategory,
            scheduleCLine: getScheduleCLine(newCategory)
          }
        })
      })

      if (response.ok) {
        // Update local state immediately for better UX
        setExpenses(prev => prev.map(exp => 
          exp.expenseId === expenseId 
            ? { ...exp, category: newCategory, scheduleCLine: getScheduleCLine(newCategory) }
            : exp
        ))
      }
    } catch (error) {
      console.error('Error updating category:', error)
    }
  }

  const handleStatusUpdate = async (expenseId: string, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/tax-audit/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId,
          updates: { classificationStatus: status }
        })
      })

      if (response.ok) {
        // Update local state immediately
        setExpenses(prev => prev.map(exp => 
          exp.expenseId === expenseId 
            ? { ...exp, classificationStatus: status }
            : exp
        ))
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleBulkApprove = async () => {
    for (const expenseId of selectedExpenses) {
      await handleStatusUpdate(expenseId, 'approved')
    }
    setSelectedExpenses(new Set())
  }

  const handleBulkReject = async () => {
    for (const expenseId of selectedExpenses) {
      await handleStatusUpdate(expenseId, 'rejected')
    }
    setSelectedExpenses(new Set())
  }

  const handleAddCustomCategory = () => {
    if (newCategory && !getAllCategories().includes(newCategory) && !customCategories.includes(newCategory)) {
      saveCustomCategory(newCategory)
      setCustomCategories([...customCategories, newCategory])
      setNewCategory("")
      setShowNewCategory(false)
    }
  }

  const handleExport = () => {
    const workbook = XLSX.utils.book_new()
    
    if (filteredExpenses.length === 0) {
      alert('No expenses to export')
      return
    }
    
    // Group by category for separate tabs
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category || 'other-expenses'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(expense)
      return acc
    }, {} as Record<string, typeof filteredExpenses>)
    
    // Create summary sheet first
    const summaryData = Object.entries(expensesByCategory).map(([category, categoryExpenses]) => {
      const categoryInfo = TAX_CATEGORIES[category]
      return {
        Category: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        'Schedule C Line': categoryInfo?.line || 'Schedule C Line 27a',
        'Total Count': categoryExpenses.length,
        'Total Amount': `$${categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`,
        'Approved': categoryExpenses.filter(exp => exp.classificationStatus === 'approved').length,
        'Pending': categoryExpenses.filter(exp => exp.classificationStatus === 'pending').length,
        'Rejected': categoryExpenses.filter(exp => exp.classificationStatus === 'rejected').length
      }
    })
    
    // Add totals row
    summaryData.push({
      Category: 'TOTAL',
      'Schedule C Line': '',
      'Total Count': filteredExpenses.length,
      'Total Amount': `$${filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`,
      'Approved': filteredExpenses.filter(exp => exp.classificationStatus === 'approved').length,
      'Pending': filteredExpenses.filter(exp => exp.classificationStatus === 'pending').length,
      'Rejected': filteredExpenses.filter(exp => exp.classificationStatus === 'rejected').length
    })
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
    
    // Create main sheet with all expenses
    const mainData = filteredExpenses.map(expense => ({
      Date: expense.transactionDate,
      Description: expense.description,
      Vendor: expense.vendor,
      Amount: `$${expense.amount.toFixed(2)}`,
      Category: expense.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      'Schedule C Line': expense.scheduleCLine || getScheduleCLine(expense.category),
      'Bank Account': expense.bankAccount || 'Unknown',
      Status: expense.classificationStatus
    }))
    
    const mainWorksheet = XLSX.utils.json_to_sheet(mainData)
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'All Expenses')
    
    // Create a sheet for each category
    Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
      const categoryData = categoryExpenses.map(expense => ({
        Date: expense.transactionDate,
        Description: expense.description,
        Vendor: expense.vendor,
        Amount: `$${expense.amount.toFixed(2)}`,
        'Bank Account': expense.bankAccount || 'Unknown',
        Status: expense.classificationStatus
      }))
      
      const worksheet = XLSX.utils.json_to_sheet(categoryData)
      
      // Add total row
      const totalRow = {
        Date: 'TOTAL',
        Description: '',
        Vendor: '',
        Amount: `$${categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}`,
        'Bank Account': '',
        Status: ''
      }
      XLSX.utils.sheet_add_json(worksheet, [totalRow], { skipHeader: true, origin: -1 })
      
      // Format category name for sheet tab (max 31 chars for Excel)
      const sheetName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 31)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })
    
    // Generate filename with date
    const filename = `Tax_Expenses_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading expenses...</div>
  }

  const allCategories = [...getAllCategories(), ...customCategories]

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur rounded-lg p-6 border border-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Expense Review & Classification
            </h2>
            <p className="text-slate-400">
              Review and categorize expenses for your tax filing
            </p>
          </div>
          <div className="flex gap-2">
            {selectedExpenses.size > 0 && (
              <>
                <Button 
                  onClick={handleBulkApprove} 
                  variant="outline" 
                  className="gap-2 text-green-500 hover:text-green-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve ({selectedExpenses.size})
                </Button>
                <Button 
                  onClick={handleBulkReject} 
                  variant="outline" 
                  className="gap-2 text-red-500 hover:text-red-400"
                >
                  <XCircle className="h-4 w-4" />
                  Reject ({selectedExpenses.size})
                </Button>
              </>
            )}
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={selectedBankAccount} onValueChange={setSelectedBankAccount} className="w-full">
        <TabsList className="bg-slate-900/50 border border-slate-800">
          {BANK_ACCOUNTS.map(account => (
            <TabsTrigger key={account.value} value={account.value}>
              {account.label}
              {account.value === 'all' && expenses.length > 0 && (
                <span className="ml-2 text-xs">({expenses.length})</span>
              )}
              {account.value !== 'all' && bankAccountCounts[account.value] > 0 && (
                <span className="ml-2 text-xs">({bankAccountCounts[account.value]})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedBankAccount} className="mt-6">
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-900/50 border-slate-800 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expenses Table */}
            <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredExpenses.length > 0 && selectedExpenses.size === filteredExpenses.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedExpenses(new Set(filteredExpenses.map(e => e.expenseId)))
                          } else {
                            setSelectedExpenses(new Set())
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Schedule C</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map((expense) => (
                    <TableRow key={expense.expenseId} className="border-slate-800">
                      <TableCell>
                        <Checkbox
                          checked={selectedExpenses.has(expense.expenseId)}
                          onCheckedChange={(checked) => {
                            const newSelection = new Set(selectedExpenses)
                            if (checked) {
                              newSelection.add(expense.expenseId)
                            } else {
                              newSelection.delete(expense.expenseId)
                            }
                            setSelectedExpenses(newSelection)
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.transactionDate ? format(new Date(expense.transactionDate), 'MM/dd') : 'No date'}
                      </TableCell>
                      <TableCell>
                        <span className="line-clamp-2" title={expense.description}>
                          {expense.description}
                        </span>
                      </TableCell>
                      <TableCell>{expense.vendor}</TableCell>
                      <TableCell className="font-semibold">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={expense.category}
                          onValueChange={(value) => handleCategoryChange(expense.expenseId, value)}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 w-[180px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map(cat => {
                              const categoryInfo = TAX_CATEGORIES[cat]
                              return (
                                <SelectItem key={cat} value={cat}>
                                  <div className="flex flex-col">
                                    <span>{cat.replace(/-/g, ' ')}</span>
                                    {categoryInfo && (
                                      <span className="text-xs text-muted-foreground">
                                        {categoryInfo.line}
                                      </span>
                                    )}
                                  </div>
                                </SelectItem>
                              )
                            })}
                            {showNewCategory ? (
                              <div className="flex items-center gap-2 p-2">
                                <Input
                                  value={newCategory}
                                  onChange={(e) => setNewCategory(e.target.value)}
                                  placeholder="New category..."
                                  className="h-8"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddCustomCategory()
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={handleAddCustomCategory}
                                >
                                  Add
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full justify-start"
                                onClick={() => setShowNewCategory(true)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Custom Category
                              </Button>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {expense.scheduleCLine || getScheduleCLine(expense.category)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'cursor-pointer',
                            expense.classificationStatus === 'approved' && 'bg-green-500/10 text-green-500 border-green-500/20',
                            expense.classificationStatus === 'rejected' && 'bg-red-500/10 text-red-500 border-red-500/20',
                            expense.classificationStatus === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          )}
                        >
                          {getStatusIcon(expense.classificationStatus)}
                          <span className="ml-1">
                            {expense.classificationStatus.charAt(0).toUpperCase() + expense.classificationStatus.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          {expense.classificationStatus !== 'approved' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(expense.expenseId, 'approved')}
                              className="text-green-500 hover:text-green-400"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          {expense.classificationStatus !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusUpdate(expense.expenseId, 'rejected')}
                              className="text-red-500 hover:text-red-400"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredExpenses.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No expenses found matching your filters
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 