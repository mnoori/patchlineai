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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Plus,
  Filter,
  CalendarIcon,
  X,
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES, getAllCategories, getScheduleCLine, getCustomCategories, saveCustomCategory } from "@/lib/tax-categories"
import * as XLSX from 'xlsx'
import { DateRange } from "react-day-picker"

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
  documentType?: string
  filename?: string
}

interface ExpenseReviewTableProps {
  userId: string
  irsReadyView?: boolean
}

const BANK_ACCOUNTS = [
  { value: 'all', label: 'All Accounts' },
  { value: 'bilt', label: 'Bilt' },
  { value: 'bofa', label: 'BofA' },
  { value: 'chase-checking', label: 'Chase Checking' },
  { value: 'chase-freedom', label: 'Chase Freedom' },
  { value: 'chase-sapphire', label: 'Chase Sapphire' }
]

export function ExpenseReviewTable({ userId, irsReadyView = false }: ExpenseReviewTableProps) {
  const [expenses, setExpenses] = useState<TaxExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set())
  const [selectedBankAccount, setSelectedBankAccount] = useState("all")
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [activeTab, setActiveTab] = useState<"expenses" | "receipts">("expenses")
  
  // Advanced filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [vendorFilter, setVendorFilter] = useState("")
  const [filenameFilter, setFilenameFilter] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

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
      console.log('Fetching expenses for user:', userId)
      const response = await fetch(`/api/tax-audit/expenses?userId=${userId}`)
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Loaded expenses:', data.expenses?.length || 0, 'items')
        console.log('First few expenses:', data.expenses?.slice(0, 3))
        setExpenses(data.expenses || [])
      } else {
        console.error('Failed to fetch expenses:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  // Separate expenses and receipts
  const bankExpenses = expenses.filter(exp => 
    exp.bankAccount && !exp.bankAccount.includes('receipt')
  )
  
  const receipts = expenses.filter(exp => 
    exp.bankAccount?.includes('receipt') || exp.documentType?.includes('receipt')
  )

  // Use the appropriate list based on active tab
  const currentExpenses = activeTab === "expenses" ? bankExpenses : receipts

  // Filter expenses
  const filteredExpenses = currentExpenses.filter(expense => {
    const matchesSearch = 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (expense.filename && expense.filename.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = statusFilter === "all" || expense.classificationStatus === statusFilter
    const matchesBank = selectedBankAccount === "all" || expense.bankAccount === selectedBankAccount
    
    // Advanced filters
    const matchesVendor = !vendorFilter || expense.vendor.toLowerCase().includes(vendorFilter.toLowerCase())
    const matchesFilename = !filenameFilter || (expense.filename && expense.filename.toLowerCase().includes(filenameFilter.toLowerCase()))
    
    // Date range filter
    let matchesDate = true
    if (dateRange?.from) {
      const expenseDate = new Date(expense.transactionDate)
      if (dateRange.to) {
        matchesDate = expenseDate >= dateRange.from && expenseDate <= dateRange.to
      } else {
        matchesDate = expenseDate >= dateRange.from
      }
    }
    
    return matchesSearch && matchesStatus && matchesBank && matchesVendor && matchesFilename && matchesDate
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, selectedBankAccount, vendorFilter, filenameFilter, dateRange, activeTab])

  // Get counts by bank account
  const bankAccountCounts = currentExpenses.reduce((acc, expense) => {
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

  // Get unique source files
  const uniqueSourceFiles = [...new Set(expenses.filter(e => e.filename).map(e => e.filename))]
  const totalSourceFiles = uniqueSourceFiles.length

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
            {totalSourceFiles > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Processed {totalSourceFiles} unique source files • {expenses.length} total transactions
              </p>
            )}
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

      {/* Main Tabs for Expenses and Receipts */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "expenses" | "receipts")} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="expenses" className="text-lg">
            Bank Expenses
            <span className="ml-2 text-sm text-muted-foreground">({bankExpenses.length})</span>
          </TabsTrigger>
          <TabsTrigger value="receipts" className="text-lg">
            Receipts
            <span className="ml-2 text-sm text-muted-foreground">({receipts.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Bank Account Tabs */}
          <Tabs value={selectedBankAccount} onValueChange={setSelectedBankAccount} className="w-full">
            <TabsList className="bg-slate-900/50 border border-slate-800">
              {BANK_ACCOUNTS.map(account => (
                <TabsTrigger key={account.value} value={account.value}>
                  {account.label}
                  {account.value === 'all' && currentExpenses.length > 0 && (
                    <span className="ml-2 text-xs">({currentExpenses.length})</span>
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
                      placeholder={`Search ${activeTab}...`}
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
                  <Button
                    variant="outline"
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className={cn(
                      "gap-2",
                      showAdvancedFilters && "bg-slate-800"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </Button>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Date Range</label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal bg-slate-900/50 border-slate-800",
                                !dateRange && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Vendor Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Vendor</label>
                        <Input
                          placeholder="Filter by vendor..."
                          value={vendorFilter}
                          onChange={(e) => setVendorFilter(e.target.value)}
                          className="bg-slate-900/50 border-slate-800"
                        />
                      </div>

                      {/* Filename Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Source File</label>
                        <Input
                          placeholder="Filter by filename..."
                          value={filenameFilter}
                          onChange={(e) => setFilenameFilter(e.target.value)}
                          className="bg-slate-900/50 border-slate-800"
                        />
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDateRange(undefined)
                          setVendorFilter("")
                          setFilenameFilter("")
                        }}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expenses Table */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="w-12">
                          <Checkbox
                            checked={paginatedExpenses.length > 0 && paginatedExpenses.every(exp => selectedExpenses.has(exp.expenseId))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newSelection = new Set(selectedExpenses)
                                paginatedExpenses.forEach(exp => newSelection.add(exp.expenseId))
                                setSelectedExpenses(newSelection)
                              } else {
                                const newSelection = new Set(selectedExpenses)
                                paginatedExpenses.forEach(exp => newSelection.delete(exp.expenseId))
                                setSelectedExpenses(newSelection)
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
                        <TableHead>Source File</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedExpenses.map((expense) => (
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
                            {expense.filename ? (
                              <span className="line-clamp-2" title={expense.filename}>
                                {expense.filename}
                              </span>
                            ) : (
                              'No file'
                            )}
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

                  {/* Pagination Controls */}
                  {filteredExpenses.length > 0 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-slate-400">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} entries
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          First
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            
                            if (pageNum < 1 || pageNum > totalPages) return null
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            )
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          Last
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  )
} 