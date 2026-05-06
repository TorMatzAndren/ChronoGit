import { ChronoDropdown } from "../components/ChronoDropdown";
import type { LocalModel } from "../core/chronogitRuntimeTypes";

type Props = {
  beginnerMode: boolean;
  localModels: LocalModel[];
  llmEngine: string;
  llmModel: string;
  setLlmEngine: (engine: string) => void;
  setLlmModel: (model: string) => void;
  loadLocalModels: () => void;
  ui: (beginnerMode: boolean, beginner: string, pro: string) => string;
};

export function LocalLlmPanel({
  beginnerMode,
  localModels,
  llmEngine,
  llmModel,
  setLlmEngine,
  setLlmModel,
  loadLocalModels,
  ui,
}: Props) {
  const selectedModel = localModels.find((model) => model.name === llmModel);

  const modelOptions = localModels.length
    ? localModels.map((model) => ({
        value: model.name,
        title: model.name,
        subtitle: `${model.parameter_size} · ${model.quantization_level} · ${model.family}`,
      }))
    : [{
        value: llmModel,
        title: llmModel || "No models discovered",
        subtitle: "Run scan to refresh local model truth.",
      }];

  return (
    <div className="cg-panel-content cg-local-llm-panel">
      <label>Engine</label>
      <ChronoDropdown
        value={llmEngine}
        options={[{ value: "ollama", title: "Ollama", subtitle: "Local Ollama model registry" }]}
        onChange={setLlmEngine}
        label={beginnerMode ? "LLM engine" : "engine"}
        placeholder="Search engines..."
        className="cg-local-llm-panel__dropdown"
      />

      <label>Model</label>
      <ChronoDropdown
        value={llmModel}
        options={modelOptions}
        onChange={setLlmModel}
        label={beginnerMode ? "Local model" : "model"}
        placeholder="Search local models..."
        className="cg-local-llm-panel__dropdown"
      />

      <button onClick={loadLocalModels}>{ui(beginnerMode, "Scan installed models", "ollama list")}</button>
      <p>
        {selectedModel
          ? `${selectedModel.family} · ${selectedModel.parameter_size} · ${selectedModel.quantization_level} · ${(selectedModel.size / 1024 / 1024 / 1024).toFixed(1)} GB`
          : "Model metadata unavailable"}
      </p>
    </div>
  );
}
