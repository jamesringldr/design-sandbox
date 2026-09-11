import { useEffect, useMemo, useState } from "react";
import ConfirmModal from "./components/ConfirmModal.jsx";
import NewProjectModal from "./components/NewProjectModal.jsx";
import ProjectSettings from "./components/ProjectSettings.jsx";
import StyleGuide from "./components/StyleGuide.jsx";
import Visualizer from "./components/Visualizer.jsx";
import { createProject, loadState, saveState } from "./storage.js";

const TABS = [
  { id: "styleguide", label: "Style Guide" },
  { id: "visualizer", label: "Visualizer" },
  { id: "settings", label: "Project Settings" },
];

export default function App() {
  const initial = useMemo(() => loadState(), []);
  const [projects, setProjects] = useState(initial.projects);
  const [activeId, setActiveId] = useState(initial.activeId);
  const [tab, setTab] = useState("styleguide");
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const active = projects.find((project) => project.id === activeId) || null;

  useEffect(() => {
    saveState({ projects, activeId });
  }, [projects, activeId]);

  function updateProject(next) {
    setProjects((current) =>
      current.map((project) => (project.id === next.id ? next : project))
    );
  }

  function addProject(draft) {
    const project = createProject(draft);
    setProjects((current) => [...current, project]);
    setActiveId(project.id);
    setTab("styleguide");
    setCreating(false);
  }

  function removeProject(id) {
    setProjects((current) => {
      const next = current.filter((project) => project.id !== id);
      if (activeId === id) setActiveId(next[0]?.id ?? null);
      return next;
    });
    setPendingDelete(null);
    setTab("styleguide");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="eyebrow">Playground</div>
          <p className="sidebar-title">Projects</p>
        </div>
        <div className="project-list">
          {projects.length === 0 ? (
            <p className="muted" style={{ padding: "8px 10px" }}>
              No projects yet.
            </p>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className={`project-row ${project.id === activeId ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="project-select"
                  onClick={() => setActiveId(project.id)}
                >
                  {project.name || "Untitled"}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove ${project.name}`}
                  onClick={() => setPendingDelete(project)}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
        <div className="sidebar-foot">
          <button
            type="button"
            className="btn btn-primary btn-wide"
            onClick={() => setCreating(true)}
          >
            Add project
          </button>
        </div>
      </aside>

      <main className="main">
        <nav className="tab-bar" aria-label="Project views">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`tab ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
              disabled={!active && item.id !== "styleguide"}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {!active ? (
          <div className="page">
            <div className="empty">
              <div className="eyebrow">Get started</div>
              <h2>Add a project to render its style guide</h2>
              <p className="muted">
                Name it, optionally sync a GitHub repo for color tokens, lock what
                should stay put, then save.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setCreating(true)}
              >
                Add project
              </button>
            </div>
          </div>
        ) : tab === "styleguide" ? (
          <StyleGuide project={active} onUpdate={updateProject} />
        ) : tab === "visualizer" ? (
          <Visualizer project={active} />
        ) : (
          <ProjectSettings
            project={active}
            onUpdate={updateProject}
            onRemove={() => setPendingDelete(active)}
          />
        )}
      </main>

      {creating ? (
        <NewProjectModal onClose={() => setCreating(false)} onSave={addProject} />
      ) : null}

      {pendingDelete ? (
        <ConfirmModal
          title="Remove project"
          body={`Remove ${pendingDelete.name}? This only deletes it from the playground.`}
          confirmLabel="Remove"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => removeProject(pendingDelete.id)}
        />
      ) : null}
    </div>
  );
}
