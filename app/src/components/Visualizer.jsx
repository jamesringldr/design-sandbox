export default function Visualizer({ project }) {
  return (
    <div className="page">
      <div>
        <div className="eyebrow">Visualizer</div>
        <h2 style={{ margin: "6px 0 0", fontSize: "22px", letterSpacing: "-0.02em" }}>
          App views
        </h2>
        <p className="muted">
          Routes listed in Project Settings will render here. Token apply-to-page comes
          after the style guide.
        </p>
      </div>
      {project.routes.length === 0 ? (
        <div className="panel">
          <p className="muted">
            No routes yet. Add page routes in Project Settings to include them in this
            tab.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {project.routes.map((route) => (
            <div className="route-card" key={route}>
              <div className="eyebrow">Route</div>
              <code>{route}</code>
              <p className="muted" style={{ marginTop: 8 }}>
                Preview shell — HTML rendering of this view is not wired yet.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
