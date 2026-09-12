import { useEffect, useRef } from "react";
import { parseGithubUrl } from "../github.js";
import { discoverTokens } from "../sync.js";
import { ELEMENT_LOCKS } from "../tokens.js";
import ComponentLibraryField from "./ComponentLibraryField.jsx";
import LockIcon from "./LockIcon.jsx";
import RepoSource from "./RepoSource.jsx";
import StringList from "./StringList.jsx";
import TokenFileField from "./TokenFileField.jsx";
import TokenGrid from "./TokenGrid.jsx";

export default function ProjectSettings({ project, onUpdate, onRemove }) {
  const prevRepo = useRef({
    path: project.localPath,
    url: project.githubUrl,
    kind: project.repoKind,
  });

  function patch(partial) {
    onUpdate({ ...project, ...partial });
  }

  async function runDiscover(opts) {
    try {
      const result = await discoverTokens(opts);
      if (result.empty) {
        patch({
          tokenFile: "",
          tokenSource: null,
          tokenError: "No color token file found. Add one.",
        });
        return;
      }
      const theme = project.theme === "light" ? "light" : "dark";
      patch({
        tokenFile: result.path || "",
        tokenSource: result.path || null,
        tokenError: "",
        colorsByTheme: result.themes,
        colors: result.themes[theme] || result.themes.dark,
      });
    } catch (error) {
      patch({ tokenError: error.message });
    }
  }

  useEffect(() => {
    const prev = prevRepo.current;
    const changed =
      prev.path !== project.localPath ||
      prev.url !== project.githubUrl ||
      prev.kind !== project.repoKind;
    prevRepo.current = {
      path: project.localPath,
      url: project.githubUrl,
      kind: project.repoKind,
    };
    if (!changed) return;
    if (project.repoKind === "device" && project.localPath) {
      runDiscover({
        kind: "device",
        localPath: project.localPath,
        githubUrl: project.githubUrl,
        tokenFile: "",
      });
      return;
    }
    if (project.repoKind === "github" && parseGithubUrl(project.githubUrl)) {
      const timer = setTimeout(() => {
        runDiscover({
          kind: "github",
          githubUrl: project.githubUrl,
          localPath: project.localPath,
          tokenFile: "",
        });
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [project.localPath, project.githubUrl, project.repoKind]);

  function toggleElement(id) {
    patch({
      elementLocks: {
        ...project.elementLocks,
        [id]: !project.elementLocks[id],
      },
    });
  }

  return (
    <div className="page">
      <div>
        <div className="eyebrow">Project settings</div>
        <h2 style={{ margin: "6px 0 0", fontSize: "22px", letterSpacing: "-0.02em" }}>
          {project.name}
        </h2>
      </div>

      <div className="panel">
        <div className="field">
          <label htmlFor="settings-name">Name</label>
          <input
            id="settings-name"
            className="input"
            value={project.name}
            onChange={(event) => patch({ name: event.target.value })}
          />
        </div>
        <RepoSource
          kind={project.repoKind || "github"}
          githubUrl={project.githubUrl || ""}
          localPath={project.localPath || ""}
          inputId="settings-github"
          onChange={({ kind, githubUrl, localPath }) =>
            patch({ repoKind: kind, githubUrl, localPath })
          }
        />
        <TokenFileField
          value={project.tokenFile || ""}
          error={project.tokenError || ""}
          onPicked={(filePath) => {
            patch({ tokenFile: filePath });
            runDiscover({
              kind: project.repoKind,
              githubUrl: project.githubUrl,
              localPath: project.localPath,
              tokenFile: filePath,
            });
          }}
        />
        <ComponentLibraryField
          id="settings-library"
          value={project.componentLibrary || ""}
          onChange={(componentLibrary) => patch({ componentLibrary })}
        />
      </div>

      <div className="panel">
        <TokenGrid
          project={project}
          onThemeChange={(theme) =>
            patch({
              theme,
              colors: project.colorsByTheme?.[theme] || project.colors,
            })
          }
          onToggleLock={(key) =>
            patch({
              tokenLocks: {
                ...project.tokenLocks,
                [key]: !project.tokenLocks?.[key],
              },
            })
          }
        />
      </div>

      <div className="panel">
        <div className="eyebrow">Visualizer routes</div>
        <p className="muted">App pages to include on the Visualizer tab.</p>
        <StringList
          items={project.routes}
          onChange={(routes) => patch({ routes })}
          placeholder="/dashboard"
        />
      </div>

      <div className="panel">
        <div className="eyebrow">Locked design elements</div>
        <div className="chip-row">
          {ELEMENT_LOCKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lock-chip ${project.elementLocks[item.id] ? "on" : ""}`}
              aria-pressed={Boolean(project.elementLocks[item.id])}
              onClick={() => toggleElement(item.id)}
            >
              <LockIcon locked={Boolean(project.elementLocks[item.id])} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button type="button" className="btn btn-danger" onClick={onRemove}>
          Remove project
        </button>
      </div>
    </div>
  );
}
