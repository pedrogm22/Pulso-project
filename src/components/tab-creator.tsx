"use client";

import { useMemo, useState } from "react";

type TabDraft = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  numerator: number;
  denominator: number;
  pattern: string;
};

const draftsStorageKey = "pulso:tab-creator:drafts";

function isTabDraft(value: unknown): value is TabDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.id === "string" &&
    typeof draft.title === "string" &&
    typeof draft.artist === "string" &&
    typeof draft.bpm === "number" &&
    typeof draft.numerator === "number" &&
    typeof draft.denominator === "number" &&
    typeof draft.pattern === "string";
}

function readSavedDrafts(): TabDraft[] {
  const stored = localStorage.getItem(draftsStorageKey);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || !parsed.every(isTabDraft)) {
    throw new Error("Os rascunhos salvos estão em um formato inválido.");
  }
  return parsed;
}

export function TabCreatorStudio() {
  const [title, setTitle] = useState("Seven Nation Army");
  const [artist, setArtist] = useState("The White Stripes");
  const [bpm, setBpm] = useState(120);
  const [numerator, setNumerator] = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [pattern, setPattern] = useState("| X x X x | X x X x |\n| X - X - | X - X - |\n| BD SD BD SD | BD SD BD SD |");
  const [savedDrafts, setSavedDrafts] = useState<TabDraft[]>([]);
  const [message, setMessage] = useState("");

  const preview = useMemo(() => {
    const lines = pattern
      .split(/\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    return [
      `# ${title || "Nova tab"}`,
      `Artista: ${artist || "Artista"}`,
      `BPM: ${bpm || 120}`,
      `Compasso: ${numerator}/${denominator}`,
      "",
      ...lines,
    ].join("\n");
  }, [artist, bpm, denominator, numerator, pattern, title]);

  const validateBpm = () => {
    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 220) {
      setMessage("Informe um BPM inteiro entre 40 e 220.");
      return false;
    }
    if (!Number.isInteger(numerator) || numerator < 1 || numerator > 12) {
      setMessage("Informe um numerador de compasso entre 1 e 12.");
      return false;
    }
    return true;
  };

  const saveDraft = () => {
    if (!validateBpm()) return;
    try {
      const draft: TabDraft = { id: crypto.randomUUID(), title, artist, bpm, numerator, denominator, pattern };
      const nextDrafts = [draft, ...readSavedDrafts()];
      localStorage.setItem(draftsStorageKey, JSON.stringify(nextDrafts));
      setSavedDrafts(nextDrafts);
      setMessage("Rascunho salvo neste navegador.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o rascunho.");
    }
  };

  const showSavedDrafts = () => {
    try {
      setSavedDrafts(readSavedDrafts());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os rascunhos.");
    }
  };

  const loadDraft = (id: string) => {
    const draft = savedDrafts.find((item) => item.id === id);
    if (!draft) return;
    setTitle(draft.title);
    setArtist(draft.artist);
    setBpm(draft.bpm);
    setNumerator(draft.numerator);
    setDenominator(draft.denominator);
    setPattern(draft.pattern);
    setMessage("Rascunho carregado.");
  };

  const copyTab = async () => {
    if (!validateBpm()) return;
    try {
      await navigator.clipboard.writeText(preview);
      setMessage("Tab copiada para a área de transferência.");
    } catch {
      setMessage("Não foi possível copiar. Verifique a permissão da área de transferência.");
    }
  };

  const downloadTab = () => {
    if (!validateBpm()) return;
    const fileName = (title.trim() || "nova-tab").replace(/[<>:"/\\|?*\x00-\x1F]/g, "-");
    const url = URL.createObjectURL(new Blob([preview], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Arquivo .txt baixado.");
  };

  return (
    <section className="studio-layout" aria-labelledby="tab-creator-title">
      <div className="studio-panel">
        <p className="eyebrow">PULSO STUDIO</p>
        <h2 id="tab-creator-title">Criador de tabs gratuito</h2>
        <p className="lead">Crie um bloco de ritmo, defina o BPM e exporte o texto da sua ideia para praticar ou compartilhar. Tudo sem pagar.</p>

        <div className="studio-form">
          <label>
            Título da música
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Seven Nation Army" />
          </label>
          <label>
            Artista
            <input value={artist} onChange={(event) => setArtist(event.target.value)} placeholder="Ex.: The White Stripes" />
          </label>
          <label>
            BPM
            <input type="number" min={40} max={220} value={bpm} onChange={(event) => setBpm(Number(event.target.value))} />
          </label>
          <label>
            Numerador do compasso
            <input type="number" min={1} max={12} value={numerator} onChange={(event) => setNumerator(Number(event.target.value))} />
          </label>
          <label>
            Denominador do compasso
            <select value={denominator} onChange={(event) => setDenominator(Number(event.target.value))}>
              {[2, 4, 8, 16].map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="full-width">
            Blocos de tab
            <textarea value={pattern} onChange={(event) => setPattern(event.target.value)} rows={8} placeholder="Digite os compassos ou padrões" />
          </label>
        </div>
        <div className="editor-actions">
          <button type="button" className="button" onClick={saveDraft}>Salvar rascunho</button>
          <button type="button" className="button secondary" onClick={showSavedDrafts}>Ver rascunhos salvos</button>
          <button type="button" className="button secondary" onClick={copyTab}>Copiar tab</button>
          <button type="button" className="button secondary" onClick={downloadTab}>Baixar .txt</button>
        </div>
        {savedDrafts.length ? (
          <label className="saved-draft-picker">
            Carregar rascunho
            <select defaultValue="" onChange={(event) => loadDraft(event.target.value)}>
              <option value="" disabled>Escolha um rascunho</option>
              {savedDrafts.map((draft) => <option key={draft.id} value={draft.id}>{draft.title || "Nova tab"} — {draft.artist || "Artista"}</option>)}
            </select>
          </label>
        ) : null}
        {message ? <p role="status" aria-live="polite">{message}</p> : null}
      </div>

      <div className="studio-panel preview-panel">
        <p className="eyebrow">PREVIEW</p>
        <h3>Estrutura gerada</h3>
        <pre className="tab-preview">{preview}</pre>
      </div>
    </section>
  );
}
