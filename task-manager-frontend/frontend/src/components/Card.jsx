export default function Card({ title, actions, children }) {
  return (
    <section className="card-block">
      {(title || actions) && (
        <div className="card-head">
          <h2 className="card-title">{title}</h2>
          <div className="card-actions">{actions}</div>
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  )
}


