export default function Input({ label, name, type="text", value, onChange, placeholder, required, style={} }) {
  return (
    <div className="form-group" style={style}>
      {label && <label className="sw-label">{label}</label>}
      <input
        className="sw-input"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}
