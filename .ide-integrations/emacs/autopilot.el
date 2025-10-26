
;;; autopilot.el --- Spec-to-Code Autopilot integration for Emacs

;;; Commentary:
;; This package provides integration with the Spec-to-Code Autopilot system.
;; Add (require 'autopilot) to your init.el to use.

;;; Code:

(defgroup autopilot nil
  "Spec-to-Code Autopilot integration."
  :group 'tools)

(defcustom autopilot-script-path "scripts/autopilot-cli.mjs"
  "Path to the autopilot CLI script."
  :type 'string
  :group 'autopilot)

(defun autopilot-run-workflow (&optional feature)
  "Run the complete autopilot workflow.
If FEATURE is provided, use it as the feature description."
  (interactive "sFeature description (optional): ")
  (let ((cmd (concat "node " autopilot-script-path " run")))
    (if (and feature (not (string-empty-p feature)))
        (setq cmd (concat cmd " --feature "" feature """))
      (setq cmd (concat cmd " --interactive")))
    (async-shell-command cmd "*Autopilot*")))

(defun autopilot-generate-spec (feature)
  "Generate specification for FEATURE."
  (interactive "sFeature description: ")
  (let ((cmd (concat "node " autopilot-script-path " spec --feature "" feature """)))
    (async-shell-command cmd "*Autopilot Spec*")))

(defun autopilot-run-validation ()
  "Run the validation pipeline."
  (interactive)
  (let ((cmd (concat "node " autopilot-script-path " validate")))
    (async-shell-command cmd "*Autopilot Validation*")))

(defun autopilot-show-status ()
  "Show autopilot status."
  (interactive)
  (let ((cmd (concat "node " autopilot-script-path " status")))
    (async-shell-command cmd "*Autopilot Status*")))

;; Key bindings
(define-prefix-command 'autopilot-map)
(global-set-key (kbd "C-c a") 'autopilot-map)
(define-key autopilot-map (kbd "r") 'autopilot-run-workflow)
(define-key autopilot-map (kbd "s") 'autopilot-generate-spec)
(define-key autopilot-map (kbd "v") 'autopilot-run-validation)
(define-key autopilot-map (kbd "t") 'autopilot-show-status)

;; Menu
(define-key-after global-map [menu-bar tools autopilot]
  (cons "Autopilot" (make-sparse-keymap "Autopilot"))
  'tools)

(define-key global-map [menu-bar tools autopilot run]
  '("Run Workflow" . autopilot-run-workflow))
(define-key global-map [menu-bar tools autopilot spec]
  '("Generate Spec" . autopilot-generate-spec))
(define-key global-map [menu-bar tools autopilot validate]
  '("Run Validation" . autopilot-run-validation))
(define-key global-map [menu-bar tools autopilot status]
  '("Show Status" . autopilot-show-status))

;; Snippets (for yasnippet)
(defun autopilot-setup-snippets ()
  "Set up autopilot snippets."
  (when (featurep 'yasnippet)
    (yas-define-snippets
     'js-mode
     '(("autopilot-feature" "/**
 * Feature Request for Spec-to-Code Autopilot
 * 
 * Title: ${1:Feature Title}
 * Type: ${2:feature}
 * Priority: ${3:medium}
 * 
 * Description:
 * ${4:Detailed description of the feature}
 * 
 * Acceptance Criteria:
 * - ${5:Given/When/Then criteria}
 * - ${6:Additional criteria}
 * 
 * Requirements:
 * - ${7:Functional requirements}
 * - ${8:Non-functional requirements}
 */" "Autopilot feature request template")))))

(add-hook 'js-mode-hook 'autopilot-setup-snippets)
(add-hook 'typescript-mode-hook 'autopilot-setup-snippets)

(provide 'autopilot)

;;; autopilot.el ends here
