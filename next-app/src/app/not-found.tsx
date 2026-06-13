import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="eh-mock-root login-page">
      <div className="login-glow" />
      <div className="login-card" style={{ textAlign: 'center' }}>
        <h1 className="login-title" style={{ fontSize: 28 }}>
          Page not found
        </h1>
        <p className="login-sub" style={{ marginBottom: 24 }}>
          Ye page exist nahi karta. Neeche se sahi link choose karein.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/login" className="btn-new login-btn">
            Login
          </Link>
          <Link href="/signup" className="btn-new login-btn">
            Sign Up
          </Link>
          <Link href="/reports" className="login-footer" style={{ marginTop: 8 }}>
            Dashboard (Reports)
          </Link>
        </div>
      </div>
    </div>
  );
}
