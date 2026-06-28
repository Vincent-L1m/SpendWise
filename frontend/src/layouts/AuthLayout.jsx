import Logo from "../components/Logo";
export default function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo height={36} />
        </div>
        {children}
      </div>
    </div>
  );
}
