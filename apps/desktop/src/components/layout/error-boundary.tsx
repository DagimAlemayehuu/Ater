import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    window.location.href = '/'
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/20 shadow-2xl shadow-destructive/10">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
              <CardTitle className="text-xl font-bold">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <p className="text-muted-foreground text-sm">
                A critical error occurred in the Life OS engine. The system has been paused to prevent data corruption.
              </p>
              
              <div className="bg-muted p-3 rounded-md text-left overflow-auto max-h-32">
                <code className="text-[10px] text-destructive break-all">
                  {this.state.error?.toString()}
                </code>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="default" className="w-full" onClick={this.handleReset}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart System
                </Button>
                <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
