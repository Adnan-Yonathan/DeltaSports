"use client";

type ModelSelectorProps = {
  model: string;
  onChange: (value: string) => void;
};

const models = [
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
];

export function ModelSelector({ model, onChange }: ModelSelectorProps) {
  return (
    <label className="flex flex-col text-xs text-slate-400">
      Model
      <select
        value={model}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
      >
        {models.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
