import type { ReactNode } from "react";

type LocalModel = {
  name: string;
  engine: string;
  size: number;
  modified_at: string;
  family: string;
  parameter_size: string;
  quantization_level: string;
};

type Props = {
  llmEngine: string;
  setLlmEngine: (engine: string) => void;
  llmModel: string;
  setLlmModel: (model: string) => void;
  localModels: LocalModel[];
  selectedModel: LocalModel | undefined;
  loadLocalModels: () => void;
  beginnerTitle: (text: string) => string | undefined;
  actionHelp: ReactNode;
};

export function LocalLlmPanel({
  llmEngine,
  setLlmEngine,
  llmModel,
  setLlmModel,
  localModels,
  selectedModel,
  loadLocalModels,
  beginnerTitle,
  actionHelp,
}: Props) {
  return (
    <div className="llm-main-card">
      <div className="llm-main-card__title">Local LLM</div>
      <div className="llm-main-card__note">Local-only explain layer. No cloud API.</div>

      <div className="llm-main-card__controls">
        <label>
          Engine
          <select
            value={llmEngine}
            onChange={(event) => setLlmEngine(event.target.value)}
          >
            <option value="ollama">Ollama</option>
          </select>
        </label>

        <label>
          Model
          <select
            value={llmModel}
            onChange={(event) => setLlmModel(event.target.value)}
          >
            {localModels.length ? (
              localModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} · {model.parameter_size} · {model.quantization_level}
                </option>
              ))
            ) : (
              <option value={llmModel}>{llmModel || "No models discovered"}</option>
            )}
          </select>
        </label>
      </div>

      <div className="llm-main-card__meta">
        {selectedModel
          ? `${selectedModel.family} · ${selectedModel.parameter_size} · ${selectedModel.quantization_level} · ${(selectedModel.size / 1024 / 1024 / 1024).toFixed(1)} GB`
          : "Model metadata unavailable"}
      </div>

      <div className="button-with-help">
        <button
          className="status-refresh-button"
          title={beginnerTitle("Scan installed models\n\nAsks the selected local LLM engine which models are installed on this computer.")}
          onClick={loadLocalModels}
        >
          Scan installed models
        </button>
        {actionHelp}
      </div>
    </div>
  );
}
