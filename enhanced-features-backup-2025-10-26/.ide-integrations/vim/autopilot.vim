
" Spec-to-Code Autopilot Integration for Vim/Neovim
" Add this to your .vimrc or init.vim

" Autopilot commands
command! -nargs=? AutopilotRun :call AutopilotRunWorkflow(<q-args>)
command! -nargs=1 AutopilotSpec :call AutopilotGenerateSpec(<q-args>)
command! AutopilotValidate :call AutopilotRunValidation()
command! AutopilotStatus :call AutopilotShowStatus()

" Autopilot functions
function! AutopilotRunWorkflow(args)
    let cmd = 'node scripts/autopilot-cli.mjs run'
    if a:args != ''
        let cmd .= ' --feature "' . a:args . '"'
    else
        let cmd .= ' --interactive'
    endif
    execute '!' . cmd
endfunction

function! AutopilotGenerateSpec(feature)
    let cmd = 'node scripts/autopilot-cli.mjs spec --feature "' . a:feature . '"'
    execute '!' . cmd
endfunction

function! AutopilotRunValidation()
    execute '!node scripts/autopilot-cli.mjs validate'
endfunction

function! AutopilotShowStatus()
    execute '!node scripts/autopilot-cli.mjs status'
endfunction

" Key mappings
nnoremap <leader>ar :AutopilotRun<CR>
nnoremap <leader>as :AutopilotSpec 
nnoremap <leader>av :AutopilotValidate<CR>
nnoremap <leader>at :AutopilotStatus<CR>

" Snippets (for UltiSnips)
" Create ~/.vim/UltiSnips/javascript.snippets or ~/.config/nvim/UltiSnips/javascript.snippets
" and add the following:

snippet autopilot-feature "Autopilot feature request template"
/**
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
 */
$0
endsnippet

echo "Autopilot integration loaded!"
echo "Commands: :AutopilotRun, :AutopilotSpec, :AutopilotValidate, :AutopilotStatus"
echo "Mappings: <leader>ar, <leader>as, <leader>av, <leader>at"
