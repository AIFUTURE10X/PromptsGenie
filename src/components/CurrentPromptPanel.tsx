import React from "react";

interface Props {
  prompt: string;
  source?: "edge" | "gemini-mm" | "gemini-text";
  onCopy: () => void;
  onEdit: () => void;
  onClear: () => void;
  onRegenerate: () => void;
}

const CurrentPromptPanel: React.FC<Props> = ({ prompt, source, onCopy, onEdit, onClear, onRegenerate }) => {
  const devBadge = source && source !== "gemini-mm" ? (
    <span
      className={
        "ml-2 inline-block px-2 py-0.5 text-xs rounded-full border " +
        (source === "edge"
          ? "bg-green-200 text-green-900 border-green-300 dark:bg-green-900/40 dark:text-green-200"
          : "bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200")
      }
      title={source === "edge" ? "Supabase Edge function" : "Gemini text"}
    >
      {source === "edge" ? "Edge" : "Gemini (Text)"}
    </span>
  ) : null;

  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border dark:border-dark-border">
        <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary flex items-center">
          Current Prompt
          {devBadge}
        </h2>
        <div className="flex items-center gap-1 flex-nowrap">
          <button className="btn-action" onClick={onCopy} disabled={!prompt}>Copy</button>
          <button className="btn-action" onClick={onEdit} disabled={!prompt}>Edit</button>
          <button className="btn-action" onClick={onRegenerate} disabled={!prompt} title="a better compensive Prompt" aria-label="Regenerate a better compensive Prompt">Regenerate</button>
          <button className="btn-danger" onClick={onClear}>Clear</button>
        </div>
      </div>
      <div className="p-4 overflow-auto">
        {prompt ? (
          <p className="whitespace-pre-wrap text-text-primary dark:text-dark-text-primary">{prompt}</p>
        ) : (
          <p className="text-text-secondary dark:text-dark-text-secondary">No prompt yet. Generate one from the editor or drop images.</p>
        )}
      </div>
    </div>
  );
};

export default CurrentPromptPanel;