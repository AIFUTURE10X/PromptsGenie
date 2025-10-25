import React from "react";

interface Props {
  prompt: string;
  source?: "gemini-mm" | "gemini-text" | "subject" | "scene" | "style" | "subject+scene" | "subject+style" | "scene+style" | "subject+scene+style";
  onCopy: () => void;
  onEdit: () => void;
  onClear: () => void;
  onRegenerate: () => void;
}

const CurrentPromptPanel: React.FC<Props> = ({ prompt, source, onCopy, onEdit, onClear, onRegenerate }) => {
  console.log("📋 CurrentPromptPanel render - prompt:", prompt ? `"${prompt.substring(0, 50)}..."` : "EMPTY", "source:", source);
  const getBadgeStyles = (source: string) => {
    switch (source) {
      case "gemini-mm":
        return "bg-indigo-200 text-indigo-900 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200";
      case "gemini-text":
        return "bg-yellow-200 text-yellow-900 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-200";
      case "subject":
        return "bg-purple-200 text-purple-900 border-purple-300 dark:bg-purple-900/40 dark:text-purple-200";
      case "scene":
        return "bg-teal-200 text-teal-900 border-teal-300 dark:bg-teal-900/40 dark:text-teal-200";
      case "style":
        return "bg-orange-200 text-orange-900 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200";
      case "subject+scene":
        return "bg-gradient-to-r from-purple-200 to-teal-200 text-gray-900 border-purple-300 dark:from-purple-900/40 dark:to-teal-900/40 dark:text-white";
      case "subject+style":
        return "bg-gradient-to-r from-purple-200 to-orange-200 text-gray-900 border-purple-300 dark:from-purple-900/40 dark:to-orange-900/40 dark:text-white";
      case "scene+style":
        return "bg-gradient-to-r from-teal-200 to-orange-200 text-gray-900 border-teal-300 dark:from-teal-900/40 dark:to-orange-900/40 dark:text-white";
      case "subject+scene+style":
        return "bg-gradient-to-r from-purple-200 via-teal-200 to-orange-200 text-gray-900 border-purple-300 dark:from-purple-900/40 dark:via-teal-900/40 dark:to-orange-900/40 dark:text-white";
      default:
        return "bg-gray-200 text-gray-900 border-gray-300 dark:bg-gray-900/40 dark:text-gray-200";
    }
  };

  const getBadgeLabel = (source: string) => {
    switch (source) {
      case "gemini-mm":
        return "Gemini (MM)";
      case "gemini-text":
        return "Gemini (Text)";
      case "subject":
        return "Subject Analysis";
      case "scene":
        return "Scene Analysis";
      case "style":
        return "Style Analysis";
      case "subject+scene":
        return "Subject + Scene";
      case "subject+style":
        return "Subject + Style";
      case "scene+style":
        return "Scene + Style";
      case "subject+scene+style":
        return "Subject + Scene + Style";
      default:
        return source;
    }
  };

  const getBadgeTitle = (source: string) => {
    switch (source) {
      case "gemini-mm":
        return "Gemini multimodal";
      case "gemini-text":
        return "Gemini text";
      case "subject":
        return "Generated from Subject Analysis";
      case "scene":
        return "Generated from Scene Analysis";
      case "style":
        return "Generated from Style Analysis";
      case "subject+scene":
        return "Generated from combined Subject and Scene Analysis";
      case "subject+style":
        return "Generated from combined Subject and Style Analysis";
      case "scene+style":
        return "Generated from combined Scene and Style Analysis";
      case "subject+scene+style":
        return "Generated from combined Subject, Scene, and Style Analysis";
      default:
        return source;
    }
  };

  const devBadge = source ? (
    <span
      className={`ml-2 inline-block px-2 py-0.5 text-xs rounded-full border ${getBadgeStyles(source)}`}
      title={getBadgeTitle(source)}
    >
      {getBadgeLabel(source)}
    </span>
  ) : null;

  return (
    <div className="bg-panel dark:bg-dark-panel rounded-xl border-2 border-border dark:border-dark-border h-full flex flex-col">
      <div className="border-b border-border dark:border-dark-border">
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
            Current Prompt
          </h2>
          <div className="flex items-center gap-1 flex-nowrap">
            <button className="btn-action" onClick={onCopy} disabled={!prompt}>Copy</button>
            <button className="btn-action" onClick={onEdit} disabled={!prompt}>Edit</button>
            <button className="btn-action" onClick={onRegenerate} disabled={!prompt} title="a better compensive Prompt" aria-label="Regenerate a better compensive Prompt">Regenerate</button>
            <button className="btn-danger" onClick={onClear}>Clear</button>
          </div>
        </div>
        {devBadge && (
          <div className="px-4 pb-1 -mt-2 flex justify-end">
            {devBadge}
          </div>
        )}
      </div>
      <div className="px-4 pb-4 pt-0 overflow-auto">
        {prompt ? (
          <p className="whitespace-pre-wrap text-xs text-text-primary dark:text-dark-text-primary m-0">{prompt}</p>
        ) : (
          <p className="text-xs text-text-secondary dark:text-dark-text-secondary m-0">No prompt yet. Generate one from the editor or drop images.</p>
        )}
      </div>
    </div>
  );
};

export default CurrentPromptPanel;