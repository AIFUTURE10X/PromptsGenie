"""
Flask Web API for Anthropic Claude Prompt Generator
Provides REST endpoints for prompt generation services.
"""

import os
import logging
from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
from prompt_generator import PromptGenerator, PromptConfig
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the prompt generator
try:
    generator = PromptGenerator()
    logger.info("Prompt generator initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize prompt generator: {e}")
    generator = None

# HTML template for the web interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Prompt Generator</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        textarea { width: 100%; height: 100px; margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        select, input { margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        .result { background: white; padding: 15px; border-radius: 4px; margin: 10px 0; border-left: 4px solid #007bff; }
        .error { border-left-color: #dc3545; background: #f8d7da; }
        .loading { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>🧞‍♂️ Claude Prompt Generator</h1>
    
    <div class="container">
        <h3>Generate AI Prompts</h3>
        <form id="promptForm">
            <div>
                <label for="userInput">Your Request:</label><br>
                <textarea id="userInput" placeholder="Describe what kind of prompt you need..." required></textarea>
            </div>
            
            <div>
                <label for="promptType">Prompt Type:</label>
                <select id="promptType">
                    <option value="general">General</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="image">Image Generation</option>
                </select>
            </div>
            
            <div>
                <label for="context">Additional Context (optional):</label><br>
                <textarea id="context" placeholder="Any additional context or requirements..."></textarea>
            </div>
            
            <div>
                <label for="customInstructions">Custom Instructions (optional):</label><br>
                <textarea id="customInstructions" placeholder="Specific instructions for the prompt generation..."></textarea>
            </div>
            
            <button type="submit">Generate Prompt</button>
        </form>
    </div>
    
    <div id="result"></div>
    
    <div class="container">
        <h3>API Endpoints</h3>
        <p><strong>POST /generate-prompt</strong> - Generate a prompt</p>
        <p><strong>GET /health</strong> - Check API health</p>
        <p><strong>GET /</strong> - This web interface</p>
    </div>

    <script>
        document.getElementById('promptForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="result loading">Generating prompt...</div>';
            
            const formData = {
                user_input: document.getElementById('userInput').value,
                prompt_type: document.getElementById('promptType').value,
                context: document.getElementById('context').value || null,
                custom_instructions: document.getElementById('customInstructions').value || null
            };
            
            try {
                const response = await fetch('/generate-prompt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (data.success) {
                    resultDiv.innerHTML = `
                        <div class="result">
                            <h4>Generated Prompt:</h4>
                            <p>${data.prompt.replace(/\\n/g, '<br>')}</p>
                            <small>Model: ${data.metadata.model} | Tokens: ${data.metadata.tokens_used}</small>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="result error">
                            <h4>Error:</h4>
                            <p>${data.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="result error">
                        <h4>Network Error:</h4>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        });
    </script>
</body>
</html>
"""

@app.route('/')
def index():
    """Serve the web interface"""
    return render_template_string(HTML_TEMPLATE)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    if generator is None:
        return jsonify({
            "status": "error",
            "message": "Prompt generator not initialized"
        }), 500
    
    return jsonify({
        "status": "healthy",
        "service": "Claude Prompt Generator",
        "version": "1.0.0"
    })

@app.route('/generate-prompt', methods=['POST'])
def generate_prompt_api():
    """Generate a prompt via API"""
    if generator is None:
        return jsonify({
            "success": False,
            "error": "Prompt generator not initialized. Check your API key."
        }), 500
    
    try:
        # Get request data
        data = request.get_json()
        
        if not data or 'user_input' not in data:
            return jsonify({
                "success": False,
                "error": "Missing required field: user_input"
            }), 400
        
        user_input = data['user_input']
        context = data.get('context')
        prompt_type = data.get('prompt_type', 'general')
        custom_instructions = data.get('custom_instructions')
        
        # Generate the prompt
        result = generator.generate_prompt(
            user_input=user_input,
            context=context,
            prompt_type=prompt_type,
            custom_instructions=custom_instructions
        )
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in generate_prompt_api: {str(e)}")
        return jsonify({
            "success": False,
            "error": f"Internal server error: {str(e)}"
        }), 500

@app.route('/prompt-types', methods=['GET'])
def get_prompt_types():
    """Get available prompt types"""
    return jsonify({
        "prompt_types": [
            {"value": "general", "label": "General Purpose"},
            {"value": "creative", "label": "Creative Writing"},
            {"value": "technical", "label": "Technical/Programming"},
            {"value": "image", "label": "Image Generation"}
        ]
    })

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    logger.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)