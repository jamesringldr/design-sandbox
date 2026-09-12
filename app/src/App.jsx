import { useEffect, useState } from "react";
import BiblePanel from "./components/BiblePanel.jsx";
import ConfirmModal from "./components/ConfirmModal.jsx";
import NewProjectModal from "./components/NewProjectModal.jsx";
import ProjectSettings from "./components/ProjectSettings.jsx";
import StyleGuide from "./components/StyleGuide.jsx";
import Visualizer from "./components/Visualizer.jsx";
import { createProject, loadState, saveState } from "./storage.js";

const TABS = [
  { id: "styleguide", label: "Style Guide" },
  { id: "bible", label: "Design Bible" },
  { id: "visualizer", label: "Visualizer" },
  { id: "settings", label: "Project Settings" },
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab");
    return TABS.some((item) => item.id === wanted) ? wanted : "styleguide";
  });
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");

  const active = projects.find((project) => project.id === activeId) || null;

  useEffect(() => {
    let cancelled = false;
    loadState()
      .then((state) => {
        if (cancelled) return;
        setProjects(state.projects);
        setActiveId(state.activeId);
        setHydrated(true);
      })
      .catch((error) => {
        if (cancelled) return;
        setSaveStatus("error");
        setSaveError(error.message || "Load failed.");
        setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setSaveStatus("saving");
    const timer = setTimeout(() => {
      saveState({ projects, activeId })
        .then((result) => {
          if (result.projects) {
            setProjects((current) => {
              let changed = false;
              const next = current.map((project) => {
                const saved = result.projects.find((row) => row.id === project.id);
                if (saved?.slug && saved.slug !== project.slug) {
                  changed = true;
                  return { ...project, slug: saved.slug };
                }
                return project;
              });
              return changed ? next : current;
            });
          }
          setSaveStatus("saved");
          setSaveError("");
        })
        .catch((error) => {
          setSaveStatus("error");
          setSaveError(error.message || "Save failed.");
        });
    }, 500);
    return () => clearTimeout(timer);
  }, [projects, activeId, hydrated]);

  function updateProject(next) {
    setProjects((current) =>
      current.map((project) => (project.id === next.id ? next : project))
    );
  }

  function addProject(draft) {
    const project = createProject(draft);
    setProjects((current) => [...current, project]);
    setActiveId(project.id);
    setTab("settings");
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
          {!hydrated ? (
            <p className="muted" style={{ padding: "8px 10px" }}>
              Loading…
            </p>
          ) : projects.length === 0 ? (
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
          <p
            className={`save-status ${saveStatus === "error" ? "error" : ""}`}
            aria-live="polite"
          >
            {!hydrated
              ? "Loading…"
              : saveStatus === "saving"
                ? "Saving…"
                : saveStatus === "error"
                  ? saveError || "Save failed."
                  : saveStatus === "saved"
                    ? "Saved to disk"
                    : ""}
          </p>
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
              disabled={projects.length === 0 && item.id !== "styleguide"}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {!hydrated ? (
          <div className="page">
            <div className="empty">
              <div className="eyebrow">Playground</div>
              <h2>Loading projects from disk</h2>
              <p className="muted">Reading data/playground.json.</p>
            </div>
          </div>
        ) : !active ? (
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
        ) : tab === "bible" ? (
          <BiblePanel project={active} onUpdate={updateProject} />
        ) : tab === "visualizer" ? (
          <Visualizer project={active} onUpdate={updateProject} />
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
          body={`Remove ${pendingDelete.name}? This deletes it from the playground and from disk.`}
          confirmLabel="Remove"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => removeProject(pendingDelete.id)}
        />
      ) : null}
    </div>
  );
}
