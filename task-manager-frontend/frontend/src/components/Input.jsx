export default function Input({ label, hint, error, ...props }) {
  return (
    <label className="field">
      {label && <div className="field-label">{label}</div>}
      <input className={`field-input${error ? ' has-error' : ''}`} {...props} />
      {hint && !error && <div className="field-hint">{hint}</div>}
      {error && <div className="field-error">{error}</div>}
    </label>
  )
}


