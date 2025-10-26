# 🧞‍♂️ Claude Prompt Generator

A powerful Python-based prompt generator using Anthropic's Claude AI. This tool helps you create high-quality, structured prompts for various use cases including creative writing, technical documentation, image generation, and more.

## 🚀 Features

- **Multiple Interfaces**: Web API, CLI, and Python module
- **Prompt Types**: General, Creative, Technical, and Image Generation prompts
- **Flexible Configuration**: Customizable models, temperature, and token limits
- **Web Interface**: Beautiful HTML interface for easy prompt generation
- **REST API**: Full REST API for integration with other applications
- **CLI Tool**: Command-line interface for batch processing and automation

## 📋 Prerequisites

- Python 3.8 or higher
- Anthropic API key
- pip (Python package installer)

## 🛠️ Installation

### 1. Clone or Download

If you haven't already, navigate to the `python-prompt-generator` directory:

```bash
cd python-prompt-generator
```

### 2. Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\\Scripts\\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit the `.env` file and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```

## 🔑 Getting Your Anthropic API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to the API Keys section
4. Create a new API key
5. Copy the key and paste it into your `.env` file

**Important**: Keep your API key secure and never commit it to version control!

## 🎯 Usage

### Web Interface

Start the Flask web server:

```bash
python app.py
```

Then open your browser to `http://localhost:5000` to use the web interface.

### Command Line Interface

#### Interactive Mode
```bash
python cli.py
```

#### Single Prompt Generation
```bash
# Basic usage
python cli.py -i "Create a prompt for writing a sci-fi story"

# With specific type
python cli.py -i "Code review checklist" -t technical

# With context and verbose output
python cli.py -i "Art prompt" -t image -c "fantasy theme" -v
```

### Python Module

```python
from prompt_generator import PromptGenerator

# Initialize the generator
generator = PromptGenerator()

# Generate a prompt
result = generator.generate_prompt(
    user_input="Create a prompt for writing a mystery novel",
    prompt_type="creative",
    context="Set in Victorian London"
)

if result["success"]:
    print("Generated Prompt:")
    print(result["prompt"])
    print(f"Tokens used: {result['metadata']['tokens_used']}")
else:
    print(f"Error: {result['error']}")
```

## 🌐 API Endpoints

### POST /generate-prompt

Generate a new prompt.

**Request Body:**
```json
{
    "user_input": "Your prompt request",
    "prompt_type": "general|creative|technical|image",
    "context": "Optional additional context",
    "custom_instructions": "Optional custom instructions"
}
```

**Response:**
```json
{
    "success": true,
    "prompt": "Generated prompt text...",
    "metadata": {
        "model": "claude-3-5-sonnet-20241022",
        "prompt_type": "creative",
        "tokens_used": 150,
        "input_tokens": 50,
        "output_tokens": 100
    }
}
```

### GET /health

Check API health status.

### GET /prompt-types

Get available prompt types.

## ⚙️ Configuration

You can customize the behavior by modifying the `.env` file:

```env
# Model Configuration
DEFAULT_MODEL=claude-3-5-sonnet-20241022
MAX_TOKENS=2048
TEMPERATURE=0.7

# Application Configuration
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

### Available Models

- `claude-3-5-sonnet-20241022` (recommended)
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`

## 🎨 Prompt Types

### General
Best for general-purpose prompts, instructions, and everyday tasks.

### Creative
Optimized for creative writing, storytelling, and artistic prompts.

### Technical
Designed for programming, development, and technical documentation.

### Image
Specialized for AI image generation prompts with detailed visual descriptions.

## 📝 Examples

### Creative Writing Prompt
```bash
python cli.py -i "Fantasy adventure story" -t creative -c "Medieval setting with magic"
```

### Technical Documentation
```bash
python cli.py -i "API documentation template" -t technical -c "REST API with authentication"
```

### Image Generation
```bash
python cli.py -i "Portrait of a wizard" -t image -c "Photorealistic, dramatic lighting"
```

## 🔧 Troubleshooting

### Common Issues

1. **API Key Error**
   - Make sure your `ANTHROPIC_API_KEY` is set correctly in the `.env` file
   - Verify the key is valid and has sufficient credits

2. **Module Import Error**
   - Ensure you've activated your virtual environment
   - Install dependencies with `pip install -r requirements.txt`

3. **Port Already in Use**
   - Change the `PORT` in your `.env` file
   - Or kill the process using the port

### Error Messages

- `"Anthropic API key is required"` - Set your API key in the `.env` file
- `"Model not found"` - Check if the model name is correct in your configuration
- `"Rate limit exceeded"` - Wait a moment and try again, or check your API usage

## 📊 Token Usage

The tool tracks token usage for each request:
- **Input tokens**: Tokens used for your request
- **Output tokens**: Tokens used for the generated response
- **Total tokens**: Sum of input and output tokens

Monitor your usage to manage API costs effectively.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the [Anthropic API documentation](https://docs.anthropic.com/)
3. Create an issue in the repository

## 🔗 Useful Links

- [Anthropic Console](https://console.anthropic.com/)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Python SDK Documentation](https://github.com/anthropics/anthropic-sdk-python)

---

**Happy Prompting! 🎉**