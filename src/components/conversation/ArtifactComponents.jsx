import { openHtmlPreviewWindow, downloadHtmlArtifact, downloadTextArtifact } from "../../utils.js";

export function HtmlArtifactCard({ artifact, compact = false }) {
  if (!artifact) return null;
  return (
    <div className={`html-artifact-card${compact ? " is-compact" : ""}`}>
      <div className="html-artifact-head">
        <div>
          <div className="html-artifact-kicker">Instância HTML</div>
          <div className="html-artifact-title">Preview executável</div>
        </div>
        <div className="html-artifact-actions">
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            onClick={() => openHtmlPreviewWindow(artifact.html, artifact.fileName || "Preview HTML")}
          >
            Abrir preview
          </button>
          <button
            className="btn btn-sm btn-ghost"
            type="button"
            onClick={() => downloadHtmlArtifact(artifact.html, artifact.fileName)}
          >
            Baixar .html
          </button>
        </div>
      </div>
      <div className="html-artifact-frame-shell">
        <iframe
          className="html-artifact-frame"
          title="Pré-visualização HTML"
          sandbox="allow-scripts"
          srcDoc={artifact.html}
        />
      </div>
    </div>
  );
}

export function GeneratedArtifactsPanel({ exec, compact = false }) {
  const artifacts = Array.isArray(exec?.generatedArtifacts) ? exec.generatedArtifacts : [];
  if (!artifacts.length) return null;

  const htmlArtifact = artifacts.find((artifact) => artifact.previewMode === "html");
  const otherArtifacts = artifacts.filter((artifact) => artifact !== htmlArtifact);

  return (
    <div className={`generated-artifacts-panel${compact ? " is-compact" : ""}`}>
      <div className="generated-artifacts-head">
        <div className="generated-artifacts-kicker">Artefatos gerados</div>
        <div className="generated-artifacts-sub">{artifacts.length} arquivo(s) real(is) nesta rodada</div>
      </div>
      <div className="generated-artifacts-list">
        {artifacts.map((artifact) => (
          <div className="generated-artifact-row" key={artifact.id}>
            <div className="generated-artifact-copy">
              <strong>{artifact.fileName}</strong>
              <span>{artifact.language?.toUpperCase() || artifact.extension?.toUpperCase() || "TXT"}</span>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              type="button"
              onClick={() => downloadTextArtifact(artifact.content, artifact.fileName, artifact.mimeType)}
            >
              Baixar
            </button>
          </div>
        ))}
      </div>
      {htmlArtifact ? (
        <HtmlArtifactCard
          artifact={{
            html: htmlArtifact.content,
            fileName: htmlArtifact.fileName,
          }}
          compact={compact}
        />
      ) : null}
      {!htmlArtifact && otherArtifacts.length ? (
        <div className="generated-artifacts-note">Os arquivos acima já podem ser baixados e usados fora do chat.</div>
      ) : null}
    </div>
  );
}
