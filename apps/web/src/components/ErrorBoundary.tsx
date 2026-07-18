import { Component } from 'react'
import { logger } from '@gym-pilot/shared'

export class ErrorBoundary extends Component<
  React.PropsWithChildren,
  { hasError: boolean }
> {
  state = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    logger.error('React Error Boundary', error)
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>
    }

    return this.props.children
  }
}
