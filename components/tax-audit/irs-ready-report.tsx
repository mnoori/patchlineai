"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  AlertCircle,
  CheckCircle2,
  Link2,
  Unlink,
  Search,
  Download,
  FileText,
  Receipt,
  DollarSign,
  Calendar as CalendarIcon,
  Building,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Eye,
} from "lucide-react"
import { format, differenceInDays, parseISO, isWithinInterval, addDays, subDays } from "date-fns"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES, getScheduleCLine } from "@/lib/tax-categories"
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
  rawText?: string // Raw text from Textract for better matching
}

interface MatchedExpense {
  bankExpense: TaxExpense
  receipt?: TaxExpense
  matchConfidence: number
  matchReason?: string
  isMatched: boolean
  matchDetails?: {
    amountMatch: boolean
    dateMatch: boolean
    vendorMatch: boolean
    orderNumberMatch: boolean
    dateDiff?: number
    amountDiff?: number
  }
}

interface IrsReadyReportProps {
  userId: string
}

export function IrsReadyReport({ userId }: IrsReadyReportProps) {
  const [expenses, setExpenses] = useState<TaxExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all") // all, matched, unmatched, review-needed
  const [selectedMatch, setSelectedMatch] = useState<MatchedExpense | null>(null)
  const [showMatchDialog, setShowMatchDialog] = useState(false)
  
  // Advanced filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [vendorFilter, setVendorFilter] = useState("")
  const [categoryFilter, setSelectedCategory] = useState("all")
  const [amountRange, setAmountRange] = useState<{ min?: number; max?: number }>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Fetch all expenses
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

  // Separate bank expenses and receipts with updated logic
  const bankExpenses = useMemo(() => 
    expenses.filter(exp => {
      // Bank accounts that contain actual transactions
      const bankAccounts = ['bilt', 'chase-freedom', 'chase-sapphire']
      return exp.bankAccount && bankAccounts.some(bank => exp.bankAccount!.includes(bank))
    }),
    [expenses]
  )
  
  const receipts = useMemo(() => 
    expenses.filter(exp => {
      // Receipt-type accounts or document types
      const receiptAccounts = ['gmail-receipts', 'amazon-receipts', 'creative-cloud-receipts', 'platform-receipts']
      return (
        (exp.bankAccount && receiptAccounts.some(receipt => exp.bankAccount!.includes(receipt))) ||
        exp.documentType?.includes('receipt') ||
        exp.bankAccount?.includes('receipt')
      )
    }),
    [expenses]
  )

  // Vendor normalization map for common variations
  const vendorNormalizationMap: Record<string, string[]> = {
    'apple': ['apple services', 'apple.com', 'itunes', 'app store', 'apple inc', 'mehdi.noori7'], // TEMPORARY FIX for email extraction issue
    'amazon': ['amazon.com', 'amzn', 'amazon marketplace', 'amazon web services', 'aws'],
    'google': ['google cloud', 'google ads', 'google workspace', 'youtube'],
    'meta': ['facebook', 'instagram', 'meta platforms', 'facebk'],
    'adobe': ['creative cloud', 'adobe systems', 'adobe inc'],
    'spotify': ['spotify usa', 'spotify ab', 'spotify technology'],
    'beatport': ['beatport llc', 'beatport.com'],
  }

  // Enhanced vendor matching function
  const vendorsMatch = (vendor1: string, vendor2: string): boolean => {
    const v1 = vendor1.toLowerCase().trim()
    const v2 = vendor2.toLowerCase().trim()
    
    // Direct match
    if (v1 === v2) return true
    
    // Check normalization map
    for (const [key, variations] of Object.entries(vendorNormalizationMap)) {
      const allVariations = [key, ...variations]
      const v1Matches = allVariations.some(v => v1.includes(v))
      const v2Matches = allVariations.some(v => v2.includes(v))
      if (v1Matches && v2Matches) return true
    }
    
    // Existing normalization logic
    const normalizeVendor = (v: string) => 
      v.replace(/[^a-z0-9]/g, '').replace(/inc|llc|corp|ltd|usa|ab/g, '')
    
    const normalized1 = normalizeVendor(v1)
    const normalized2 = normalizeVendor(v2)
    
    return normalized1 === normalized2 || 
           normalized1.includes(normalized2) || 
           normalized2.includes(normalized1)
  }

  // Enhanced matching algorithm
  const matchedExpenses = useMemo(() => {
    const matches: MatchedExpense[] = []
    const usedReceipts = new Set<string>()

    // Smart matching with improved algorithm
    bankExpenses.forEach(bankExpense => {
      let bestMatch: TaxExpense | undefined
      let highestConfidence = 0
      let matchReason = ""
      let matchDetails: MatchedExpense['matchDetails'] = {
        amountMatch: false,
        dateMatch: false,
        vendorMatch: false,
        orderNumberMatch: false
      }

      receipts.forEach(receipt => {
        if (usedReceipts.has(receipt.expenseId)) return

        let confidence = 0
        let reasons: string[] = []
        let currentMatchDetails = { ...matchDetails }

        // Enhanced amount matching
        const amountDiff = Math.abs(bankExpense.amount - receipt.amount)
        const amountPercent = amountDiff / bankExpense.amount
        
        if (amountDiff === 0) {
          confidence += 35
          reasons.push("exact amount")
          currentMatchDetails.amountMatch = true
        } else if (amountDiff <= 0.02) { // Within 2 cents
          confidence += 32
          reasons.push("amount ±$0.02")
          currentMatchDetails.amountMatch = true
        } else if (amountPercent <= 0.01) { // Within 1%
          confidence += 28
          reasons.push("amount ±1%")
          currentMatchDetails.amountMatch = true
        }
        currentMatchDetails.amountDiff = amountDiff

        // Enhanced date matching with ±1 day tolerance
        const bankDate = parseISO(bankExpense.transactionDate)
        const receiptDate = parseISO(receipt.transactionDate)
        const daysDiff = Math.abs(differenceInDays(bankDate, receiptDate))
        
        if (daysDiff === 0) {
          confidence += 25
          reasons.push("same date")
          currentMatchDetails.dateMatch = true
        } else if (daysDiff === 1) {
          confidence += 20
          reasons.push("±1 day")
          currentMatchDetails.dateMatch = true
          // Extra confidence if amounts match exactly with ±1 day
          if (amountDiff === 0) {
            confidence += 10
            reasons.push("strong match")
          }
        } else if (daysDiff <= 3) {
          confidence += 10
          reasons.push(`${daysDiff} days apart`)
        }
        currentMatchDetails.dateDiff = daysDiff

        // Enhanced vendor matching using our improved function
        if (vendorsMatch(bankExpense.vendor, receipt.vendor)) {
          confidence += 25
          reasons.push("vendor match")
          currentMatchDetails.vendorMatch = true
        }

        // Enhanced order/reference number matching
        const extractNumbers = (text: string) => {
          const patterns = [
            /\d{3}-\d{7}-\d{7}/g, // Amazon
            /\b\d{10,}\b/g, // Long numbers
            /[A-Z0-9]{8,}/g, // Alphanumeric IDs
            /\b[A-Z0-9]{17}\b/g, // PayPal transaction IDs (17 chars)
            /Transaction ID:?\s*([A-Z0-9]+)/gi, // Extract transaction IDs
          ]
          const numbers: string[] = []
          patterns.forEach(pattern => {
            const matches = text.match(pattern)
            if (matches) {
              // Clean up transaction ID matches
              const cleaned = matches.map(m => 
                m.replace(/Transaction ID:?\s*/i, '').trim()
              )
              numbers.push(...cleaned)
            }
          })
          return [...new Set(numbers)] // Remove duplicates
        }

        const bankNumbers = extractNumbers(bankExpense.description)
        const receiptNumbers = extractNumbers(receipt.description)
        
        const matchingNumbers = bankNumbers.filter(num => receiptNumbers.includes(num))
        if (matchingNumbers.length > 0) {
          confidence += 15
          reasons.push("reference match")
          currentMatchDetails.orderNumberMatch = true
        }

        // Special handling for recurring subscriptions
        const subscriptionVendors = ['apple', 'spotify', 'adobe', 'google', 'netflix', 'amazon prime']
        const bankVendorLower = bankExpense.vendor.toLowerCase()
        const receiptVendorLower = receipt.vendor.toLowerCase()
        const isSubscription = subscriptionVendors.some(v => 
          bankVendorLower.includes(v) || receiptVendorLower.includes(v)
        )

        if (isSubscription && Math.abs(daysDiff) <= 5) {
          // More lenient date matching for subscriptions
          confidence += 5
          reasons.push("subscription timing")
          
          // Check for recurring amounts
          const commonSubscriptionAmounts = [0.99, 1.29, 4.99, 9.99, 14.99, 19.99, 21.24, 99.99]
          if (commonSubscriptionAmounts.includes(bankExpense.amount) || 
              commonSubscriptionAmounts.includes(receipt.amount)) {
            confidence += 5
            reasons.push("subscription amount")
          }
        }

        // Use raw text if available for additional matching
        if (receipt.rawText && bankExpense.description) {
          const commonKeywords = ['invoice', 'order', 'payment', 'transaction']
          const matchedKeywords = commonKeywords.filter(keyword => 
            receipt.rawText!.toLowerCase().includes(keyword) && 
            bankExpense.description.toLowerCase().includes(keyword)
          )
          if (matchedKeywords.length > 0) {
            confidence += 5 * matchedKeywords.length
            reasons.push("keyword match")
          }
        }

        // Update best match if confidence is higher
        if (confidence > highestConfidence && confidence >= 40) { // Lowered threshold
          bestMatch = receipt
          highestConfidence = confidence
          matchReason = reasons.join(", ")
          matchDetails = currentMatchDetails
        }
      })

      // Create the matched expense entry
      if (bestMatch) {
        usedReceipts.add(bestMatch.expenseId)
        matches.push({
          bankExpense,
          receipt: bestMatch,
          matchConfidence: highestConfidence,
          matchReason,
          isMatched: true,
          matchDetails
        })
      } else {
        matches.push({
          bankExpense,
          matchConfidence: 0,
          isMatched: false
        })
      }
    })

    // Add unmatched receipts
    receipts.forEach(receipt => {
      if (!usedReceipts.has(receipt.expenseId)) {
        matches.push({
          bankExpense: receipt, // Use receipt as the primary expense
          receipt: undefined,
          matchConfidence: 0,
          matchReason: "Unmatched receipt",
          isMatched: false
        })
      }
    })

    return matches
  }, [bankExpenses, receipts])

  // Apply filters
  const filteredExpenses = useMemo(() => {
    return matchedExpenses.filter(match => {
      // Search filter
      const matchesSearch = 
        match.bankExpense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.bankExpense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        match.bankExpense.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (match.receipt && (
          match.receipt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          match.receipt.filename?.toLowerCase().includes(searchQuery.toLowerCase())
        ))

      // Status filter
      const matchesFilter = 
        filterType === "all" ||
        (filterType === "matched" && match.isMatched) ||
        (filterType === "unmatched" && !match.isMatched) ||
        (filterType === "review-needed" && match.isMatched && match.matchConfidence < 80)

      // Category filter
      const matchesCategory = 
        categoryFilter === "all" || 
        match.bankExpense.category === categoryFilter

      // Vendor filter
      const matchesVendor = 
        !vendorFilter || 
        match.bankExpense.vendor.toLowerCase().includes(vendorFilter.toLowerCase())

      // Date range filter
      let matchesDate = true
      if (dateRange?.from) {
        const expenseDate = parseISO(match.bankExpense.transactionDate)
        if (dateRange.to) {
          matchesDate = isWithinInterval(expenseDate, { start: dateRange.from, end: dateRange.to })
        } else {
          matchesDate = expenseDate >= dateRange.from
        }
      }

      // Amount range filter
      let matchesAmount = true
      if (amountRange.min !== undefined) {
        matchesAmount = match.bankExpense.amount >= amountRange.min
      }
      if (matchesAmount && amountRange.max !== undefined) {
        matchesAmount = match.bankExpense.amount <= amountRange.max
      }

      return matchesSearch && matchesFilter && matchesCategory && matchesVendor && matchesDate && matchesAmount
    })
  }, [matchedExpenses, searchQuery, filterType, categoryFilter, vendorFilter, dateRange, amountRange])

  // Pagination calculations
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, categoryFilter, vendorFilter, dateRange, amountRange])

  // Calculate statistics
  const stats = useMemo(() => ({
    totalTransactions: bankExpenses.length,
    totalReceipts: receipts.length,
    matched: matchedExpenses.filter(m => m.isMatched).length,
    unmatched: matchedExpenses.filter(m => !m.isMatched).length,
    highConfidence: matchedExpenses.filter(m => m.isMatched && m.matchConfidence >= 80).length,
    reviewNeeded: matchedExpenses.filter(m => m.isMatched && m.matchConfidence < 80).length,
    totalAmount: filteredExpenses.reduce((sum, m) => sum + m.bankExpense.amount, 0)
  }), [bankExpenses, receipts, matchedExpenses, filteredExpenses])

  const handleExport = () => {
    const workbook = XLSX.utils.book_new()
    
    // Create matched transactions sheet
    const matchedData = filteredExpenses.map(match => ({
      'Transaction Date': format(new Date(match.bankExpense.transactionDate), 'MM/dd/yyyy'),
      'Bank Description': match.bankExpense.description,
      'Bank Vendor': match.bankExpense.vendor,
      'Bank Amount': `$${match.bankExpense.amount.toFixed(2)}`,
      'Bank Source File': match.bankExpense.filename || 'Unknown',
      'Receipt Description': match.receipt?.description || 'No receipt',
      'Receipt Vendor': match.receipt?.vendor || '-',
      'Receipt Amount': match.receipt ? `$${match.receipt.amount.toFixed(2)}` : '-',
      'Receipt Source File': match.receipt?.filename || '-',
      'Match Confidence': match.isMatched ? `${match.matchConfidence}%` : 'Unmatched',
      'Match Reason': match.matchReason || '-',
      'Date Difference': match.matchDetails?.dateDiff !== undefined ? `${match.matchDetails.dateDiff} days` : '-',
      'Amount Difference': match.matchDetails?.amountDiff !== undefined ? `$${match.matchDetails.amountDiff.toFixed(2)}` : '-',
      'Category': match.bankExpense.category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      'Schedule C Line': match.bankExpense.scheduleCLine || getScheduleCLine(match.bankExpense.category),
      'Status': match.bankExpense.classificationStatus
    }))
    
    const worksheet = XLSX.utils.json_to_sheet(matchedData)
    XLSX.utils.book_append_sheet(workbook, worksheet, 'IRS Ready Report')
    
    // Create summary sheet
    const summaryData = [
      { Metric: 'Total Bank Transactions', Value: stats.totalTransactions },
      { Metric: 'Total Receipts', Value: stats.totalReceipts },
      { Metric: 'Matched Transactions', Value: stats.matched },
      { Metric: 'Unmatched Transactions', Value: stats.unmatched },
      { Metric: 'High Confidence Matches (≥80%)', Value: stats.highConfidence },
      { Metric: 'Review Needed (<80%)', Value: stats.reviewNeeded },
      { Metric: '', Value: '' },
      { Metric: 'Total Deductible Amount', Value: `$${stats.totalAmount.toFixed(2)}` }
    ]
    
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')
    
    const filename = `IRS_Ready_Report_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
    XLSX.writeFile(workbook, filename)
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">High Match</Badge>
    } else if (confidence >= 60) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Medium Match</Badge>
    } else if (confidence > 0) {
      return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50">Low Match</Badge>
    }
    return <Badge className="bg-red-500/20 text-red-400 border-red-500/50">No Match</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading IRS report data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Bank Transactions</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 mb-2">
            <Receipt className="h-4 w-4" />
            <span className="text-sm">Receipts</span>
          </div>
          <div className="text-2xl font-bold">{stats.totalReceipts}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Link2 className="h-4 w-4" />
            <span className="text-sm">Matched</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{stats.matched}</div>
          <div className="text-xs text-slate-400">{((stats.matched / stats.totalTransactions) * 100).toFixed(0)}% coverage</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Review Needed</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">{stats.reviewNeeded}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 backdrop-blur rounded-lg p-4 border border-slate-800">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search transactions, vendors, or filenames..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900/50 border-slate-800 text-white"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px] bg-slate-900/50 border-slate-800">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="matched">Matched Only</SelectItem>
                <SelectItem value="unmatched">Unmatched Only</SelectItem>
                <SelectItem value="review-needed">Review Needed</SelectItem>
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
            <Button onClick={handleExport} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export Report
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
                          "w-full justify-start text-left font-normal",
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

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Category</label>
                  <Select value={categoryFilter} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-800">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.keys(TAX_CATEGORIES).map(category => (
                        <SelectItem key={category} value={category}>
                          {category.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vendor Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Vendor</label>
                  <Input
                    placeholder="Filter by vendor..."
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                    className="bg-slate-900/50 border-slate-800 text-white"
                  />
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Amount Range</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={amountRange.min || ''}
                      onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="bg-slate-900/50 border-slate-800 text-white"
                    />
                    <span className="text-slate-400 self-center">to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={amountRange.max || ''}
                      onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="bg-slate-900/50 border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined)
                    setVendorFilter("")
                    setSelectedCategory("all")
                    setAmountRange({})
                  }}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Matched Expenses Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead>Date</TableHead>
              <TableHead>Bank Transaction</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Receipt Match</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExpenses.map((match) => (
              <TableRow 
                key={match.bankExpense.expenseId} 
                className={cn(
                  "border-slate-800 hover:bg-slate-800/50",
                  !match.isMatched && "bg-red-950/20"
                )}
              >
                <TableCell className="font-medium">
                  {format(new Date(match.bankExpense.transactionDate), 'MM/dd/yy')}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium line-clamp-2">{match.bankExpense.description}</div>
                    <div className="text-sm text-slate-400">
                      <span className="font-medium">{match.bankExpense.vendor}</span>
                      {match.bankExpense.filename && (
                        <>
                          <span className="mx-1">•</span>
                          <span className="text-xs" title={match.bankExpense.filename}>
                            {match.bankExpense.filename.length > 30 
                              ? `...${match.bankExpense.filename.slice(-30)}`
                              : match.bankExpense.filename
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ${match.bankExpense.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  {match.receipt ? (
                    <div className="space-y-1">
                      <div className="text-sm line-clamp-2">{match.receipt.description}</div>
                      <div className="text-xs text-slate-400">
                        <span>${match.receipt.amount.toFixed(2)}</span>
                        <span className="mx-1">•</span>
                        <span>{format(new Date(match.receipt.transactionDate), 'MM/dd/yy')}</span>
                        {match.receipt.filename && (
                          <>
                            <span className="mx-1">•</span>
                            <span title={match.receipt.filename}>
                              {match.receipt.filename.length > 25 
                                ? `...${match.receipt.filename.slice(-25)}`
                                : match.receipt.filename
                              }
                            </span>
                          </>
                        )}
                      </div>
                      {match.matchDetails && (
                        <div className="flex gap-1 mt-1">
                          {match.matchDetails.amountMatch && (
                            <Badge variant="outline" className="text-xs bg-green-950/50 border-green-800">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {match.matchDetails.amountDiff === 0 ? 'Exact' : `±$${match.matchDetails.amountDiff?.toFixed(2)}`}
                            </Badge>
                          )}
                          {match.matchDetails.dateMatch && (
                            <Badge variant="outline" className="text-xs bg-blue-950/50 border-blue-800">
                              <CalendarIcon className="h-3 w-3 mr-1" />
                              {match.matchDetails.dateDiff === 0 ? 'Same day' : `±${match.matchDetails.dateDiff}d`}
                            </Badge>
                          )}
                          {match.matchDetails.vendorMatch && (
                            <Badge variant="outline" className="text-xs bg-purple-950/50 border-purple-800">
                              <Building className="h-3 w-3 mr-1" />
                              Vendor
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-slate-500">No receipt found</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getConfidenceBadge(match.matchConfidence)}
                    {match.matchReason && (
                      <div className="text-xs text-slate-400" title={match.matchReason}>
                        {match.matchReason.length > 30 
                          ? `${match.matchReason.slice(0, 30)}...`
                          : match.matchReason
                        }
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {match.bankExpense.category.replace(/-/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMatch(match)
                      setShowMatchDialog(true)
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredExpenses.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-400">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredExpenses.length)} of {filteredExpenses.length} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {/* First page */}
              <Button
                variant={currentPage === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(1)}
                className="min-w-[2rem]"
              >
                1
              </Button>

              {/* Ellipsis if needed */}
              {currentPage > 3 && (
                <span className="px-2 text-slate-400">...</span>
              )}

              {/* Current page and neighbors */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page !== 1 && 
                  page !== totalPages && 
                  Math.abs(page - currentPage) <= 1
                )
                .map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[2rem]"
                  >
                    {page}
                  </Button>
                ))}

              {/* Ellipsis if needed */}
              {currentPage < totalPages - 2 && totalPages > 1 && (
                <span className="px-2 text-slate-400">...</span>
              )}

              {/* Last page */}
              {totalPages > 1 && (
                <Button
                  variant={currentPage === totalPages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  className="min-w-[2rem]"
                >
                  {totalPages}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Match Details Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Match Details</DialogTitle>
            <DialogDescription>
              Detailed view of the matched transaction and receipt
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6">
              {/* Bank Transaction */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Bank Transaction</h3>
                <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-slate-400">Date:</span>
                      <p className="font-medium">{format(new Date(selectedMatch.bankExpense.transactionDate), 'MMMM d, yyyy')}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Amount:</span>
                      <p className="font-medium">${selectedMatch.bankExpense.amount.toFixed(2)}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Description:</span>
                    <p className="font-medium">{selectedMatch.bankExpense.description}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Vendor:</span>
                    <p className="font-medium">{selectedMatch.bankExpense.vendor}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-400">Source File:</span>
                    <p className="font-medium text-xs">{selectedMatch.bankExpense.filename || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedMatch.receipt && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Matched Receipt</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-slate-400">Date:</span>
                        <p className="font-medium">{format(new Date(selectedMatch.receipt.transactionDate), 'MMMM d, yyyy')}</p>
                      </div>
                      <div>
                        <span className="text-sm text-slate-400">Amount:</span>
                        <p className="font-medium">${selectedMatch.receipt.amount.toFixed(2)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Description:</span>
                      <p className="font-medium">{selectedMatch.receipt.description}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Vendor:</span>
                      <p className="font-medium">{selectedMatch.receipt.vendor}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-400">Source File:</span>
                      <p className="font-medium text-xs">{selectedMatch.receipt.filename || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Analysis */}
              {selectedMatch.isMatched && selectedMatch.matchDetails && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Match Analysis</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-400">Overall Confidence</span>
                      {getConfidenceBadge(selectedMatch.matchConfidence)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Amount Match</span>
                        {selectedMatch.matchDetails.amountMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Date Match (±1 day)</span>
                        {selectedMatch.matchDetails.dateMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Vendor Match</span>
                        {selectedMatch.matchDetails.vendorMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      {selectedMatch.matchReason && (
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-sm text-slate-400">Match Criteria:</span>
                          <p className="text-sm">{selectedMatch.matchReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 