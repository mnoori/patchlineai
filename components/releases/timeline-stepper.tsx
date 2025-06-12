"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, FileText, Brush, Send, Megaphone, Check, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { TimelineStep } from "@/lib/mock/release"
import { cn } from "@/lib/utils"


const iconMap = {
  Upload,
  FileText,
  Brush,
  Send,
  Megaphone,
}

interface TimelineStepperProps {
  steps: TimelineStep[]
  onStepClick?: (stepId: string) => void
  onTaskComplete?: (taskId: string) => void
}

export function TimelineStepper({ steps, onStepClick, onTaskComplete }: TimelineStepperProps) {
  const [selectedStep, setSelectedStep] = useState<TimelineStep | null>(null)

  const handleStepClick = (step: TimelineStep) => {
    setSelectedStep(step)
    onStepClick?.(step.id)
  }

  return (
    <>
      <div className="flex items-center justify-between w-full">
        {steps.map((step, index) => {
          const Icon = iconMap[step.icon as keyof typeof iconMap] || Upload
          const isCompleted = step.completed
          const isCurrent = step.current
          const hasOverdueTasks = step.tasks.some((task) => task.overdue)

          return (
            <div key={step.id} className="flex items-center">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex flex-col items-center gap-2 p-2 h-auto"
                    onClick={() => handleStepClick(step)}
                  >
                    <motion.div
                      className={cn(
                        "relative w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all",
                        isCompleted
                          ? "border-cyan-400 bg-cyan-400/20"
                          : isCurrent
                            ? "border-cyan-400 bg-cyan-400/10"
                            : "border-gray-600 bg-gray-800",
                        hasOverdueTasks && "border-amber-500",
                      )}
                      animate={
                        isCompleted
                          ? {
                              boxShadow: ["0 0 0 0 rgba(34, 211, 238, 0.4)", "0 0 0 10px rgba(34, 211, 238, 0)"],
                            }
                          : {}
                      }
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 text-cyan-400" />
                      ) : (
                        <Icon className={cn("h-6 w-6", isCurrent ? "text-cyan-400" : "text-gray-400")} />
                      )}

                      {hasOverdueTasks && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full" />
                      )}
                    </motion.div>

                    <span
                      className={cn(
                        "text-xs font-medium",
                        isCompleted ? "text-cyan-400" : isCurrent ? "text-cyan-400" : "text-gray-400",
                      )}
                    >
                      {step.name}
                    </span>
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-96">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-cyan-400" />
                      {step.name}
                      {isCompleted && <Check className="h-4 w-4 text-green-500" />}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>
                          {Math.round((step.tasks.filter((t) => t.completed).length / step.tasks.length) * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={(step.tasks.filter((t) => t.completed).length / step.tasks.length) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium">Tasks</h4>
                      {step.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                task.completed ? "border-green-500 bg-green-500" : "border-gray-400",
                              )}
                            >
                              {task.completed && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{task.name}</p>
                              {task.overdue && (
                                <Badge variant="destructive" className="text-[10px] px-2 mt-1">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>

                          {!task.completed && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onTaskComplete?.(task.id)}
                              className="text-xs"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {step.id === "artwork" && !isCompleted && (
                      <div className="mt-6 p-3 bg-sky-900/60 border-l-2 border-cyan-500 rounded-r-md">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-300">Aria can help</span>
                        </div>
                        <p className="text-xs text-cyan-100 mb-3">Generate alternative artwork sizes automatically</p>
                        <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-black">
                          Generate ALT sizes
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {index < steps.length - 1 && (
                <div
                  className={cn("flex-1 h-0.5 mx-4 transition-colors", isCompleted ? "bg-cyan-400" : "bg-gray-600")}
                />
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
