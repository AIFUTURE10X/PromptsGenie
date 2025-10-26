" MCP Tools Integration for Vim
" Provides commands and functions for working with MCP protocols

if exists('g:loaded_mcp_tools')
  finish
endif
let g:loaded_mcp_tools = 1

" MCP Commands
command! MCPVerify call s:MCPVerify()
command! MCPVision call s:MCPVision()
command! MCPStatus call s:MCPStatus()

" Verify MCP configuration
function! s:MCPVerify()
  echo "Verifying MCP configuration..."
  let output = system('node .trae/verify-mcp.js')
  echo output
endfunction

" Start Vision Gemini tool
function! s:MCPVision()
  echo "Starting Vision Gemini tool..."
  let output = system('node tools/vision-gemini.js')
  echo output
endfunction

" Check MCP status
function! s:MCPStatus()
  echo "Checking MCP status..."
  if filereadable('.trae/mcp.json')
    echo "MCP configuration found"
    let config = json_decode(join(readfile('.trae/mcp.json'), "\n"))
    echo "Tools configured: " . len(config.tools)
  else
    echo "MCP configuration not found"
  endif
endfunction

" Key mappings
nnoremap <leader>mv :MCPVerify<CR>
nnoremap <leader>mg :MCPVision<CR>
nnoremap <leader>ms :MCPStatus<CR>

" Auto-completion for MCP files
augroup MCPFiles
  autocmd!
  autocmd BufRead,BufNewFile *.mcp.json setfiletype json
  autocmd BufRead,BufNewFile .trae/*.json setfiletype json
augroup END

echo "MCP Tools for Vim loaded. Use :MCPVerify, :MCPVision, :MCPStatus or <leader>mv, <leader>mg, <leader>ms"