"use client"

import { useState, useEffect, useMemo } from "react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowUpDown,
  Check,
  X,
  Edit2,
  Trash2,
  DollarSign,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  Download,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES, getBusinessCategories, getScheduleCLine } from "@/lib/tax-categories"
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
  businessType: string
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
  const [businessFilter, setBusinessFilter] = useState("all")
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [editingExpense, setEditingExpense] = useState<string | null>(null)
  const [selectedBankAccount, setSelectedBankAccount] = useState("all")
  const [editForm, setEditForm] = useState<Partial<TaxExpense>>({})

  // Fetch expenses
  useEffect(() => {
    fetchExpenses()
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
    const matchesBusiness = businessFilter === "all" || expense.businessType === businessFilter
    const matchesBank = selectedBankAccount === "all" || expense.bankAccount === selectedBankAccount
    
    return matchesSearch && matchesStatus && matchesBusiness && matchesBank
  })

  // Get counts by bank account
  const bankAccountCounts = expenses.reduce((acc, expense) => {
    const bank = expense.bankAccount || 'unknown'
    acc[bank] = (acc[bank] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const handleEdit = (expense: TaxExpense) => {
    setEditingExpense(expense.expenseId)
    setEditForm({
      vendor: expense.vendor,
      category: expense.category,
      businessType: expense.businessType,
      description: expense.description
    })
  }

  const handleSaveEdit = async () => {
    if (!editingExpense) return

    try {
      const response = await fetch(`/api/tax-audit/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenseId: editingExpense,
          updates: {
            description: editForm.description,
            vendor: editForm.vendor,
            category: editForm.category,
            businessType: editForm.businessType
          }
        })
      })

      if (response.ok) {
        await fetchExpenses()
        setEditingExpense(null)
        setEditForm({})
      }
    } catch (error) {
      console.error('Error updating expense:', error)
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
        await fetchExpenses()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleExport = () => {
    const workbook = XLSX.utils.book_new()
    
    // Export ALL expenses (not just approved) for review
    const allExpenses = filteredExpenses
    
    if (allExpenses.length === 0) {
      alert('No expenses to export')
      return
    }
    
    // Create main sheet with all expenses (similar to table view)
    const mainData = allExpenses.map(expense => ({
      Date: expense.transactionDate,
      Description: expense.description,
      Vendor: expense.vendor,
      Amount: expense.amount,
      Category: expense.category.replace(/-/g, ' '),
      Business: expense.businessType,
      'Bank Account': expense.bankAccount || 'Unknown',
      Status: expense.classificationStatus,
      'Schedule C Line': expense.businessType === 'media' || expense.businessType === 'consulting' 
        ? getScheduleCLine(expense.businessType, expense.category)
        : 'Schedule C Line 27'
    }))
    
    const mainWorksheet = XLSX.utils.json_to_sheet(mainData)
    XLSX.utils.book_append_sheet(workbook, mainWorksheet, 'All Expenses')
    
    // Group by category for separate tabs
    const expensesByCategory = allExpenses.reduce((acc, expense) => {
      const category = expense.category || 'other-expenses'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(expense)
      return acc
    }, {} as Record<string, typeof allExpenses>)
    
    // Create a sheet for each category
    Object.entries(expensesByCategory).forEach(([category, categoryExpenses]) => {
      const categoryData = categoryExpenses.map(expense => ({
        Date: expense.transactionDate,
        Description: expense.description,
        Vendor: expense.vendor,
        Amount: expense.amount,
        Business: expense.businessType,
        'Bank Account': expense.bankAccount || 'Unknown',
        Status: expense.classificationStatus
      }))
      
      const worksheet = XLSX.utils.json_to_sheet(categoryData)
      
      // Format category name for sheet tab (max 31 chars for Excel)
      const sheetName = category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).substring(0, 31)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    })
    
    // Create summary sheet
    const summaryData = Object.entries(expensesByCategory).map(([category, categoryExpenses]) => ({
      Category: category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      'Total Count': categoryExpenses.length,
      'Total Amount': categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0),
      'Pending': categoryExpenses.filter(exp => exp.classificationStatus === 'pending').length,
      'Approved': categoryExpenses.filter(exp => exp.classificationStatus === 'approved').length,
      'Rejected': categoryExpenses.filter(exp => exp.classificationStatus === 'rejected').length
    }))
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
    
    // Generate filename with date and time
    const filename = `Tax_Expenses_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`
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

  const getStatusBadge = (status: string) => {
    const validStatus = status || 'pending' // Default to pending if undefined
    const variants = {
      approved: 'bg-green-500/10 text-green-500 border-green-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    }

    return (
      <Badge variant="outline" className={cn('gap-1', variants[validStatus] || variants.pending)}>
        {getStatusIcon(validStatus)}
        {validStatus.charAt(0).toUpperCase() + validStatus.slice(1)}
      </Badge>
    )
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading expenses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur rounded-lg p-6 border border-slate-800">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Expense Review & Classification
            </h2>
            <p className="text-slate-400">
              Review, classify, and approve expenses for your tax audit
            </p>
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
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
              <Select value={businessFilter} onValueChange={setBusinessFilter}>
                <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800">
                  <SelectValue placeholder="All Businesses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Businesses</SelectItem>
                  <SelectItem value="media">Media Business</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
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
                    <TableHead>Date ↕</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount ↕</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Schedule C</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                        {expense.transactionDate ? (
                          (() => {
                            try {
                              const dateObj = new Date(expense.transactionDate)
                              // Check if date is valid
                              if (isNaN(dateObj.getTime())) {
                                return expense.transactionDate // Return raw string if invalid
                              }
                              return format(dateObj, 'MMM dd, yyyy')
                            } catch (error) {
                              console.error('Date formatting error:', error, 'for date:', expense.transactionDate)
                              return expense.transactionDate || 'Invalid date'
                            }
                          })()
                        ) : (
                          'No date'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingExpense === expense.expenseId ? (
                          <Input
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="bg-slate-800 border-slate-700"
                          />
                        ) : (
                          <span className="line-clamp-2">{expense.description}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingExpense === expense.expenseId ? (
                          <Input
                            value={editForm.vendor}
                            onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                            className="bg-slate-800 border-slate-700"
                          />
                        ) : (
                          expense.vendor
                        )}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {editingExpense === expense.expenseId ? (
                          <Select
                            value={editForm.category}
                            onValueChange={(value) => setEditForm({ ...editForm, category: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const businessType = editForm.businessType || expense.businessType
                                if (businessType === 'unknown') {
                                  // Show all categories for unknown business type
                                  const allCategories = Array.from(new Set([
                                    ...getBusinessCategories('media'),
                                    ...getBusinessCategories('consulting')
                                  ]))
                                  return allCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>
                                      {cat.replace(/-/g, ' ')}
                                    </SelectItem>
                                  ))
                                }
                                return getBusinessCategories(businessType as any).map(cat => (
                                  <SelectItem key={cat} value={cat}>
                                    {cat.replace(/-/g, ' ')}
                                  </SelectItem>
                                ))
                              })()}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">
                            {expense.category.replace(/-/g, ' ')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingExpense === expense.expenseId ? (
                          <Select
                            value={editForm.businessType}
                            onValueChange={(value) => setEditForm({ ...editForm, businessType: value })}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="media">Media</SelectItem>
                              <SelectItem value="consulting">Consulting</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline">
                            {expense.businessType}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {expense.businessType === 'media' || expense.businessType === 'consulting' 
                          ? getScheduleCLine(expense.businessType, expense.category)
                          : 'Schedule C Line 27'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(expense.classificationStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingExpense === expense.expenseId ? (
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingExpense(null)
                                setEditForm({})
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(expense)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(expense.expenseId, 'approved')}
                                className="text-green-600"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleStatusUpdate(expense.expenseId, 'rejected')}
                                className="text-red-600"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
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