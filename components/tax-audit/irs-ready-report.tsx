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
  AlertCircle,
  CheckCircle2,
  Link2,
  Unlink,
  Search,
  Download,
  FileText,
  Receipt,
  DollarSign,
  Calendar,
  Building,
} from "lucide-react"
import { format, differenceInDays, parseISO } from "date-fns"
import { cn } from "@/lib/utils"
import { TAX_CATEGORIES, getScheduleCLine } from "@/lib/tax-categories"
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
  documentType?: string
}

interface MatchedExpense {
  bankExpense: TaxExpense
  receipt?: TaxExpense
  matchConfidence: number
  matchReason?: string
  isMatched: boolean
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

  // Separate bank expenses and receipts
  const bankExpenses = expenses.filter(exp => 
    exp.bankAccount && !exp.bankAccount.includes('receipt')
  )
  
  const receipts = expenses.filter(exp => 
    exp.bankAccount?.includes('receipt') || exp.documentType?.includes('receipt')
  )

  // Match expenses with receipts
  const matchedExpenses = useMemo(() => {
    const matches: MatchedExpense[] = []
    const usedReceipts = new Set<string>()

    // For each bank expense, try to find a matching receipt
    bankExpenses.forEach(bankExpense => {
      let bestMatch: TaxExpense | undefined
      let highestConfidence = 0
      let matchReason = ""

      receipts.forEach(receipt => {
        if (usedReceipts.has(receipt.expenseId)) return

        let confidence = 0
        let reasons: string[] = []

        // Check amount match (exact or within 1%)
        const amountDiff = Math.abs(bankExpense.amount - receipt.amount)
        const amountPercent = amountDiff / bankExpense.amount
        
        if (amountDiff === 0) {
          confidence += 40
          reasons.push("exact amount match")
        } else if (amountPercent <= 0.01) {
          confidence += 35
          reasons.push("amount within 1%")
        } else if (amountPercent <= 0.05) {
          confidence += 25
          reasons.push("amount within 5%")
        }

        // Check date proximity
        const bankDate = parseISO(bankExpense.transactionDate)
        const receiptDate = parseISO(receipt.transactionDate)
        const daysDiff = Math.abs(differenceInDays(bankDate, receiptDate))
        
        if (daysDiff === 0) {
          confidence += 30
          reasons.push("same date")
        } else if (daysDiff <= 2) {
          confidence += 25
          reasons.push(`${daysDiff} day difference`)
        } else if (daysDiff <= 5) {
          confidence += 15
          reasons.push(`${daysDiff} day difference`)
        }

        // Check vendor match
        const bankVendor = bankExpense.vendor.toLowerCase()
        const receiptVendor = receipt.vendor.toLowerCase()
        
        if (bankVendor === receiptVendor) {
          confidence += 30
          reasons.push("exact vendor match")
        } else if (
          bankVendor.includes(receiptVendor) || 
          receiptVendor.includes(bankVendor) ||
          (bankVendor.includes('amazon') && receiptVendor.includes('amazon'))
        ) {
          confidence += 20
          reasons.push("partial vendor match")
        }

        // Check for order numbers in descriptions
        const orderNumberRegex = /\d{3}-\d{7}-\d{7}/g
        const bankOrderNumbers = bankExpense.description.match(orderNumberRegex) || []
        const receiptOrderNumbers = receipt.description.match(orderNumberRegex) || []
        
        if (bankOrderNumbers.length > 0 && receiptOrderNumbers.length > 0) {
          const matchingOrders = bankOrderNumbers.filter(num => 
            receiptOrderNumbers.includes(num)
          )
          if (matchingOrders.length > 0) {
            confidence += 20
            reasons.push("order number match")
          }
        }

        // If this is a better match than previous ones
        if (confidence > highestConfidence && confidence >= 50) {
          bestMatch = receipt
          highestConfidence = confidence
          matchReason = reasons.join(", ")
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
          isMatched: true
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

  // Filter matched expenses based on filter type
  const filteredExpenses = matchedExpenses.filter(match => {
    const matchesSearch = 
      match.bankExpense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.bankExpense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (match.receipt && match.receipt.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter = 
      filterType === "all" ||
      (filterType === "matched" && match.isMatched) ||
      (filterType === "unmatched" && !match.isMatched) ||
      (filterType === "review-needed" && match.isMatched && match.matchConfidence < 80)

    return matchesSearch && matchesFilter
  })

  // Calculate statistics
  const stats = {
    totalTransactions: bankExpenses.length,
    totalReceipts: receipts.length,
    matched: matchedExpenses.filter(m => m.isMatched).length,
    unmatched: matchedExpenses.filter(m => !m.isMatched).length,
    highConfidence: matchedExpenses.filter(m => m.isMatched && m.matchConfidence >= 80).length,
    reviewNeeded: matchedExpenses.filter(m => m.isMatched && m.matchConfidence < 80).length
  }

  const handleExport = () => {
    const workbook = XLSX.utils.book_new()
    
    // Create matched transactions sheet
    const matchedData = filteredExpenses.map(match => ({
      'Transaction Date': format(new Date(match.bankExpense.transactionDate), 'MM/dd/yyyy'),
      'Bank Description': match.bankExpense.description,
      'Bank Vendor': match.bankExpense.vendor,
      'Bank Amount': `$${match.bankExpense.amount.toFixed(2)}`,
      'Receipt Description': match.receipt?.description || 'No receipt',
      'Receipt Vendor': match.receipt?.vendor || '-',
      'Receipt Amount': match.receipt ? `$${match.receipt.amount.toFixed(2)}` : '-',
      'Match Confidence': match.isMatched ? `${match.matchConfidence}%` : 'Unmatched',
      'Match Reason': match.matchReason || '-',
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
      { Metric: 'Total Deductible Amount', Value: `$${filteredExpenses.reduce((sum, m) => sum + m.bankExpense.amount, 0).toFixed(2)}` }
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
    return <div className="flex justify-center p-8">Loading IRS report data...</div>
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
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transactions..."
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
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Matched Expenses Table */}
      <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800">
              <TableHead>Date</TableHead>
              <TableHead>Bank Transaction</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Receipt Match</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredExpenses.map((match) => (
              <TableRow 
                key={match.bankExpense.expenseId} 
                className={cn(
                  "border-slate-800 cursor-pointer hover:bg-slate-800/50",
                  !match.isMatched && "bg-red-950/20"
                )}
                onClick={() => {
                  setSelectedMatch(match)
                  setShowMatchDialog(true)
                }}
              >
                <TableCell className="font-medium">
                  {format(new Date(match.bankExpense.transactionDate), 'MM/dd')}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium line-clamp-1">{match.bankExpense.description}</div>
                    <div className="text-sm text-slate-400">{match.bankExpense.vendor}</div>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  ${match.bankExpense.amount.toFixed(2)}
                </TableCell>
                <TableCell>
                  {match.receipt ? (
                    <div>
                      <div className="text-sm line-clamp-1">{match.receipt.description}</div>
                      <div className="text-xs text-slate-400">
                        ${match.receipt.amount.toFixed(2)} on {format(new Date(match.receipt.transactionDate), 'MM/dd')}
                      </div>
                    </div>
                  ) : (
                    <span className="text-slate-500">No receipt found</span>
                  )}
                </TableCell>
                <TableCell>
                  {getConfidenceBadge(match.matchConfidence)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {match.bankExpense.category.replace(/-/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {match.bankExpense.classificationStatus === 'approved' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Match Details Dialog */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Match Details</DialogTitle>
            <DialogDescription>
              Review the match between bank transaction and receipt
            </DialogDescription>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4">
              {/* Bank Transaction */}
              <div className="border border-slate-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-blue-400" />
                  <h3 className="font-semibold">Bank Transaction</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Date:</span> {format(new Date(selectedMatch.bankExpense.transactionDate), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="text-slate-400">Amount:</span> ${selectedMatch.bankExpense.amount.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Description:</span> {selectedMatch.bankExpense.description}
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Vendor:</span> {selectedMatch.bankExpense.vendor}
                  </div>
                </div>
              </div>

              {/* Receipt */}
              {selectedMatch.receipt && (
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="h-4 w-4 text-green-400" />
                    <h3 className="font-semibold">Receipt</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-400">Date:</span> {format(new Date(selectedMatch.receipt.transactionDate), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="text-slate-400">Amount:</span> ${selectedMatch.receipt.amount.toFixed(2)}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Description:</span> {selectedMatch.receipt.description}
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Vendor:</span> {selectedMatch.receipt.vendor}
                    </div>
                  </div>
                </div>
              )}

              {/* Match Details */}
              {selectedMatch.isMatched && (
                <div className="border border-slate-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Match Analysis</h3>
                    {getConfidenceBadge(selectedMatch.matchConfidence)}
                  </div>
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="text-slate-400">Confidence Score:</span> {selectedMatch.matchConfidence}%
                    </div>
                    <div>
                      <span className="text-slate-400">Match Criteria:</span> {selectedMatch.matchReason}
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