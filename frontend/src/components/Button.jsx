export default function Button({ children, variant="primary", loading, fullWidth, style={}, type="button", onClick, disabled }) {
  const cls = {
    primary:   "btn-primary",
    secondary: "btn-secondary",
    danger:    "btn-danger",
    ghost:     "btn-ghost",
  }[variant] || "btn-primary";

  return (
    <button
      type={type}
      className={cls}
      disabled={loading || disabled}
      onClick={onClick}
      style={{ width: fullWidth ? "100%" : undefined, justifyContent:"center", opacity: (loading||disabled) ? 0.7 : 1, ...style }}
    >
      {loading ? "Memuat..." : children}
    </button>
  );
}
