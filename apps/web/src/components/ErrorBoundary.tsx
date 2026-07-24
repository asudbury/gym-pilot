import { Component, type ErrorInfo, type ReactNode } from 'react'
import { InternalServerErrorPage } from '../pages/InternalServerErrorPage'

interface Props {
  children: ReactNode
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
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return <InternalServerErrorPage />
    }

    return this.props.children
  }
}

export default ErrorBoundary
