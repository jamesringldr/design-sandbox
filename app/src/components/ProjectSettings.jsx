import { useEffect, useRef, useState } from "react";
import { parseGithubUrl } from "../github.js";
import { discoverTokens } from "../sync.js";
import { ELEMENT_LOCKS } from "../tokens.js";
import ComponentLibraryField from "./ComponentLibraryField.jsx";
import LockIcon from "./LockIcon.jsx";
import RepoSource from "./RepoSource.jsx";
import StringList from "./StringList.jsx";
import TokenFileField from "./TokenFileField.jsx";
import TokenGrid from "./TokenGrid.jsx";

function storedTokenPath(localPath, filePath) {
  const file = String(filePath || "");
  const root = String(localPath || "").replace(/\/+$/, "");
  if (root && (file === root || file.startsWith(`${root}/`))) {
    return file.slice(root.length + 1);
  }
  return file;
}

function keepLockedColors(current, incoming, locks) {
  const next = { ...(incoming || {}) };
  if (!current) return next;
  for (const [key, locked] of Object.entries(locks || {})) {
    if (locked && current[key] != null) next[key] = current[key];
  }
  return next;
}

export default function ProjectSettings({ project, onUpdate, onRemove }) {
  const [refreshing, setRefreshing] = useState(false);
  const prevRepo = useRef({
    id: project.id,
    path: project.localPath,
    url: project.githubUrl,
    kind: project.repoKind,
  });
  const canRefresh =
    (project.repoKind === "device" && Boolean(project.localPath)) ||
    (project.repoKind === "github" && Boolean(parseGithubUrl(project.githubUrl)));

  function patch(partial) {
    onUpdate({ ...project, ...partial });
  }

  async function runDiscover(opts, { keepLocks = false } = {}) {
    try {
      const result = await discoverTokens(opts);
      if (result.empty) {
        patch(
          keepLocks
            ? { tokenError: "No color token file found in the repo." }
            : {
                tokenFile: "",
                tokenSource: null,
                tokenError: "No color token file found. Add one.",
              }
        );
        return;
      }
      const theme = project.theme === "light" ? "light" : "dark";
      const locks = keepLocks ? project.tokenLocks : {};
      const colorsByTheme = {
        dark: keepLockedColors(
          project.colorsByTheme?.dark,
          result.themes?.dark,
          locks
        ),
        light: keepLockedColors(
          project.colorsByTheme?.light,
          result.themes?.light,
          locks
        ),
      };
      const tokenFile = storedTokenPath(project.localPath, result.path || opts.tokenFile);
      patch({
        tokenFile,
        tokenSource: tokenFile || null,
        tokenError: "",
        colorsByTheme,
        colors: colorsByTheme[theme] || colorsByTheme.dark,
      });
    } catch (error) {
      patch({ tokenError: error.message });
    }
  }

  async function refreshRepo() {
    if (!canRefresh || refreshing) return;
    setRefreshing(true);
    try {
      await runDiscover(
        {
          kind: project.repoKind,
          localPath: project.localPath,
          githubUrl: project.githubUrl,
          tokenFile: project.tokenFile || "",
        },
        { keepLocks: true }
      );
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const prev = prevRepo.current;
    const switchedProject = prev.id !== project.id;
    const changed =
      !switchedProject &&
      (prev.path !== project.localPath ||
        prev.url !== project.githubUrl ||
        prev.kind !== project.repoKind);
    prevRepo.current = {
      id: project.id,
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
        <div className="settings-title-row">
          <h2 className="guide-title">{project.name}</h2>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!canRefresh || refreshing}
            onClick={refreshRepo}
          >
            {refreshing ? "Refreshing…" : "Refresh repo"}
          </button>
        </div>
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
          sourcePath={project.sourcePath || ""}
          worktreeBranch={project.worktreeBranch || ""}
          worktreeBase={project.worktreeBase || ""}
          needsInstall={Boolean(project.needsInstall)}
          inputId="settings-github"
          onChange={({
            kind,
            githubUrl,
            localPath,
            sourcePath,
            worktreeBranch,
            worktreeBase,
          }) =>
            patch({
              repoKind: kind,
              githubUrl,
              localPath,
              sourcePath,
              worktreeBranch,
              worktreeBase,
            })
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
