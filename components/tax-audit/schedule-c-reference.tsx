"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Info, ChevronDown, ChevronUp } from "lucide-react"
import { TAX_CATEGORIES } from "@/lib/tax-categories"
import { cn } from "@/lib/utils"

export function ScheduleCReference() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Card className="glass-effect">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Schedule C Tax Categories Reference
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className={cn(
        "transition-all duration-300 overflow-hidden",
        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 py-0"
      )}>
        <div className="space-y-4">
          {Object.entries(TAX_CATEGORIES).map(([key, category]) => (
            <div key={key} className="p-4 rounded-lg bg-muted/20 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm">
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.description}
                  </p>
                </div>
                <Badge variant="outline" className="ml-2">
                  {category.line}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                <div className="flex flex-wrap gap-1">
                  {category.examples.slice(0, 3).map((example, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {example}
                    </Badge>
                  ))}
                  {category.examples.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{category.examples.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Keywords:</p>
                <p className="text-xs text-muted-foreground">
                  {category.keywords.slice(0, 5).join(', ')}
                  {category.keywords.length > 5 && `, +${category.keywords.length - 5} more`}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-400">Important Notes</h4>
              <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                <li>• Line 27a (Other Expenses) is used for miscellaneous business expenses</li>
                <li>• Platform & API expenses are typically reported on Line 27a</li>
                <li>• Interest charged on business credit cards goes on Line 16</li>
                <li>• Equipment over $2,500 may qualify for Section 179 deduction (Line 13)</li>
                <li>• Keep all receipts and documentation for audit purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 