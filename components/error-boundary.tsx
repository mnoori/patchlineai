"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-eclipse/50 border border-light/10 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
            <p className="text-light/80">The component could not be displayed.</p>
          </div>
        )
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
