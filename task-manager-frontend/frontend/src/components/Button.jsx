export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseCls = variant === 'ghost' ? 'btn ghost' : variant === 'secondary' ? 'btn secondary' : 'btn'
  const cls = className ? `${baseCls} ${className}` : baseCls
  return (
    <button className={cls} {...props}>{children}</button>
  )
}


