"""
Anthropic Claude-based Prompt Generator
A Python module for generating high-quality prompts using Claude AI.
"""

import os
import logging
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import anthropic
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PromptConfig:
    """Configuration for prompt generation"""
    model: str = "claude-3-5-sonnet-20241022"
    max_tokens: int = 2048
    temperature: float = 0.7
    system_prompt: Optional[str] = None

class PromptGenerator:
    """Main class for generating prompts using Anthropic Claude"""
    
    def __init__(self, api_key: Optional[str] = None, config: Optional[PromptConfig] = None):
        """
        Initialize the prompt generator
        
        Args:
            api_key: Anthropic API key (if not provided, will use ANTHROPIC_API_KEY env var)
            config: Configuration for prompt generation
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is required. Set ANTHROPIC_API_KEY environment variable or pass api_key parameter.")
        
        self.config = config or PromptConfig()
        self.client = anthropic.Anthropic(api_key=self.api_key)
        
        logger.info(f"PromptGenerator initialized with model: {self.config.model}")
    
    def generate_prompt(
        self, 
        user_input: str, 
        context: Optional[str] = None,
        prompt_type: str = "general",
        custom_instructions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a prompt based on user input
        
        Args:
            user_input: The user's input or request
            context: Additional context for the prompt
            prompt_type: Type of prompt (general, creative, technical, etc.)
            custom_instructions: Custom instructions for prompt generation
            
        Returns:
            Dictionary containing the generated prompt and metadata
        """
        try:
            # Build the system prompt based on prompt type
            system_prompt = self._build_system_prompt(prompt_type, custom_instructions)
            
            # Build the user message
            user_message = self._build_user_message(user_input, context)
            
            # Make the API call
            response = self.client.messages.create(
                model=self.config.model,
                max_tokens=self.config.max_tokens,
                temperature=self.config.temperature,
                system=system_prompt,
                messages=[
                    {
                        "role": "user",
                        "content": user_message
                    }
                ]
            )
            
            # Extract the generated prompt
            generated_prompt = response.content[0].text if response.content else ""
            
            return {
                "success": True,
                "prompt": generated_prompt,
                "metadata": {
                    "model": self.config.model,
                    "prompt_type": prompt_type,
                    "tokens_used": response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else None,
                    "input_tokens": response.usage.input_tokens if hasattr(response, 'usage') else None,
                    "output_tokens": response.usage.output_tokens if hasattr(response, 'usage') else None
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating prompt: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "prompt": None,
                "metadata": None
            }
    
    def _build_system_prompt(self, prompt_type: str, custom_instructions: Optional[str] = None) -> str:
        """Build the system prompt based on the prompt type"""
        
        base_prompts = {
            "general": """You are an expert prompt engineer. Your task is to create clear, effective, and well-structured prompts based on the user's requirements. 

Focus on:
- Clarity and specificity
- Proper structure and formatting
- Including relevant context and constraints
- Making the prompt actionable and results-oriented""",
            
            "creative": """You are a creative prompt specialist. Your task is to generate imaginative and inspiring prompts that encourage creative thinking and artistic expression.

Focus on:
- Vivid imagery and descriptive language
- Emotional resonance and atmosphere
- Creative constraints that spark innovation
- Open-ended possibilities for exploration""",
            
            "technical": """You are a technical prompt engineer specializing in programming, development, and technical documentation prompts.

Focus on:
- Technical accuracy and precision
- Clear specifications and requirements
- Best practices and standards
- Actionable technical instructions""",
            
            "image": """You are an expert in creating prompts for AI image generation. Your task is to craft detailed, specific prompts that will produce high-quality visual results.

Focus on:
- Visual composition and style
- Lighting, color, and atmosphere
- Technical camera/art terminology
- Specific details about subjects and scenes"""
        }
        
        system_prompt = base_prompts.get(prompt_type, base_prompts["general"])
        
        if custom_instructions:
            system_prompt += f"\n\nAdditional instructions: {custom_instructions}"
        
        return system_prompt
    
    def _build_user_message(self, user_input: str, context: Optional[str] = None) -> str:
        """Build the user message with input and context"""
        message = f"Please create a prompt based on this request: {user_input}"
        
        if context:
            message += f"\n\nAdditional context: {context}"
        
        return message
    
    def analyze_image_for_prompt(self, image_path: str, analysis_type: str = "detailed") -> Dict[str, Any]:
        """
        Analyze an image and generate a descriptive prompt
        Note: This is a placeholder for image analysis functionality
        """
        # This would require image processing capabilities
        # For now, return a placeholder response
        return {
            "success": False,
            "error": "Image analysis not yet implemented",
            "prompt": None,
            "metadata": {"analysis_type": analysis_type}
        }

def main():
    """Example usage of the PromptGenerator"""
    try:
        # Initialize the generator
        generator = PromptGenerator()
        
        # Example 1: General prompt
        result = generator.generate_prompt(
            user_input="Create a prompt for writing a science fiction story about time travel",
            prompt_type="creative"
        )
        
        if result["success"]:
            print("Generated Prompt:")
            print(result["prompt"])
            print(f"\nTokens used: {result['metadata']['tokens_used']}")
        else:
            print(f"Error: {result['error']}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()