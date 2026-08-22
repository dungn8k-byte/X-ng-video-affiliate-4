import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error || 'Unknown runtime error');
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary] Runtime error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', padding: 32, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ maxWidth: 760, margin: '48px auto', border: '1px solid #7f1d1d', background: '#450a0a55', borderRadius: 16, padding: 24 }}>
          <h1 style={{ fontSize: 22, margin: '0 0 12px' }}>Ứng dụng gặp lỗi khi hiển thị</h1>
          <p style={{ lineHeight: 1.6, margin: '0 0 16px' }}>
            Xưởng đã chặn lỗi để tránh màn hình trắng. Dữ liệu lưu trong trình duyệt không bị tự động xóa.
          </p>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', background: '#020617', padding: 12, borderRadius: 10, fontSize: 12 }}>
            {this.state.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: '' })}
            style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, border: 0, cursor: 'pointer', fontWeight: 700 }}
          >
            Thử hiển thị lại
          </button>
        </div>
      </div>
    );
  }
}
