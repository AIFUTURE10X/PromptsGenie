#!/usr/bin/env python3
"""
Command Line Interface for Claude Prompt Generator
Provides an interactive CLI for generating prompts.
"""

import argparse
import sys
import os
from typing import Optional
from prompt_generator import PromptGenerator, PromptConfig

def print_banner():
    """Print the CLI banner"""
    print("🧞‍♂️ Claude Prompt Generator CLI")
    print("=" * 40)

def interactive_mode():
    """Run the CLI in interactive mode"""
    print_banner()
    print("Interactive Mode - Type 'quit' to exit\n")
    
    try:
        generator = PromptGenerator()
    except Exception as e:
        print(f"❌ Error initializing generator: {e}")
        print("Make sure your ANTHROPIC_API_KEY is set in the .env file")
        return
    
    while True:
        try:
            print("\n" + "-" * 40)
            user_input = input("📝 Enter your prompt request (or 'quit'): ").strip()
            
            if user_input.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not user_input:
                print("⚠️  Please enter a valid request")
                continue
            
            # Get prompt type
            print("\n🎯 Select prompt type:")
            print("1. General")
            print("2. Creative")
            print("3. Technical")
            print("4. Image Generation")
            
            type_choice = input("Enter choice (1-4, default: 1): ").strip()
            prompt_types = {"1": "general", "2": "creative", "3": "technical", "4": "image"}
            prompt_type = prompt_types.get(type_choice, "general")
            
            # Get optional context
            context = input("📋 Additional context (optional): ").strip()
            context = context if context else None
            
            # Get custom instructions
            custom_instructions = input("⚙️  Custom instructions (optional): ").strip()
            custom_instructions = custom_instructions if custom_instructions else None
            
            print("\n🔄 Generating prompt...")
            
            # Generate the prompt
            result = generator.generate_prompt(
                user_input=user_input,
                context=context,
                prompt_type=prompt_type,
                custom_instructions=custom_instructions
            )
            
            if result["success"]:
                print("\n✅ Generated Prompt:")
                print("=" * 50)
                print(result["prompt"])
                print("=" * 50)
                
                if result["metadata"]:
                    print(f"\n📊 Metadata:")
                    print(f"   Model: {result['metadata']['model']}")
                    print(f"   Type: {result['metadata']['prompt_type']}")
                    if result['metadata']['tokens_used']:
                        print(f"   Tokens: {result['metadata']['tokens_used']}")
            else:
                print(f"\n❌ Error: {result['error']}")
                
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Unexpected error: {e}")

def single_prompt_mode(args):
    """Generate a single prompt from command line arguments"""
    try:
        generator = PromptGenerator()
    except Exception as e:
        print(f"❌ Error initializing generator: {e}")
        return 1
    
    result = generator.generate_prompt(
        user_input=args.input,
        context=args.context,
        prompt_type=args.type,
        custom_instructions=args.instructions
    )
    
    if result["success"]:
        print(result["prompt"])
        
        if args.verbose and result["metadata"]:
            print(f"\n# Model: {result['metadata']['model']}", file=sys.stderr)
            print(f"# Type: {result['metadata']['prompt_type']}", file=sys.stderr)
            if result['metadata']['tokens_used']:
                print(f"# Tokens: {result['metadata']['tokens_used']}", file=sys.stderr)
        
        return 0
    else:
        print(f"Error: {result['error']}", file=sys.stderr)
        return 1

def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Claude Prompt Generator CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s                                    # Interactive mode
  %(prog)s -i "Create a story prompt"         # Single prompt
  %(prog)s -i "Code review" -t technical      # Technical prompt
  %(prog)s -i "Art prompt" -t image -v        # Verbose output
        """
    )
    
    parser.add_argument(
        '-i', '--input',
        help='Input text for prompt generation'
    )
    
    parser.add_argument(
        '-t', '--type',
        choices=['general', 'creative', 'technical', 'image'],
        default='general',
        help='Type of prompt to generate (default: general)'
    )
    
    parser.add_argument(
        '-c', '--context',
        help='Additional context for the prompt'
    )
    
    parser.add_argument(
        '--instructions',
        help='Custom instructions for prompt generation'
    )
    
    parser.add_argument(
        '-v', '--verbose',
        action='store_true',
        help='Show additional metadata'
    )
    
    parser.add_argument(
        '--version',
        action='version',
        version='Claude Prompt Generator CLI 1.0.0'
    )
    
    args = parser.parse_args()
    
    # Check if API key is available
    if not os.getenv('ANTHROPIC_API_KEY'):
        print("❌ Error: ANTHROPIC_API_KEY not found")
        print("Please set your API key in the .env file")
        return 1
    
    # If input is provided, run single prompt mode
    if args.input:
        return single_prompt_mode(args)
    else:
        # Run interactive mode
        interactive_mode()
        return 0

if __name__ == '__main__':
    sys.exit(main())