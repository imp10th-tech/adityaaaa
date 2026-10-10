import { Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  sectionName?: string;
}

interface State {
  hasError: boolean;
}

export class SectionErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`Section error${this.props.sectionName ? ` in ${this.props.sectionName}` : ''}:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="w-10 h-10 text-katana-crimson/40 mb-4" />
          <p className="font-display text-katana-silver/40 text-sm uppercase tracking-wider">
            Something broke here, miya
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 text-xs uppercase tracking-wider text-katana-crimson border border-katana-crimson/30 hover:bg-katana-crimson/10 transition-colors rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
