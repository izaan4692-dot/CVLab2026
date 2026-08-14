#!/usr/bin/env python3
"""
Direct test script using the exact keys provided by user
"""
import sys

# Keys provided by user
CLAUDE_KEY = "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"
OPENAI_KEY = "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"

def test_claude_direct():
    """Test Claude API with direct key"""
    print("\n" + "="*60)
    print("Testing Claude API (Direct Key)")
    print("="*60)
    print(f"Key length: {len(CLAUDE_KEY)}")
    print(f"Key preview: {CLAUDE_KEY[:15]}...{CLAUDE_KEY[-15:]}")
    
    try:
        from anthropic import Anthropic
        
        client = Anthropic(api_key=CLAUDE_KEY)
        
        models = ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"]
        
        for model in models:
            try:
                print(f"\nTrying model: {model}...")
                response = client.messages.create(
                    model=model,
                    max_tokens=20,
                    messages=[{"role": "user", "content": "Say 'test'"}]
                )
                print(f"✅ SUCCESS with {model}!")
                print(f"   Response: {response.content[0].text}")
                return True
            except Exception as e:
                error_str = str(e)
                print(f"   ❌ {model}: {error_str[:150]}")
                if "401" in error_str or "authentication" in error_str.lower():
                    print(f"\n   Full error details:")
                    print(f"   {error_str}")
                    return False
        return False
    except Exception as e:
        print(f"❌ Failed: {str(e)}")
        return False

def test_openai_direct():
    """Test OpenAI API with direct key"""
    print("\n" + "="*60)
    print("Testing OpenAI API (Direct Key)")
    print("="*60)
    print(f"Key length: {len(OPENAI_KEY)}")
    print(f"Key preview: {OPENAI_KEY[:20]}...{OPENAI_KEY[-20:]}")
    
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=OPENAI_KEY)
        
        models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]
        
        for model in models:
            try:
                print(f"\nTrying model: {model}...")
                response = client.chat.completions.create(
                    model=model,
                    max_tokens=20,
                    messages=[{"role": "user", "content": "Say 'test'"}]
                )
                print(f"✅ SUCCESS with {model}!")
                print(f"   Response: {response.choices[0].message.content.strip()}")
                return True
            except Exception as e:
                error_str = str(e)
                print(f"   ❌ {model}: {error_str[:150]}")
                if "401" in error_str or "authentication" in error_str.lower() or "incorrect" in error_str.lower():
                    print(f"\n   Full error details:")
                    print(f"   {error_str}")
                    return False
        return False
    except Exception as e:
        print(f"❌ Failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("Direct API Key Test (Using Provided Keys)")
    print("="*60)
    
    claude_ok = test_claude_direct()
    openai_ok = test_openai_direct()
    
    print("\n" + "="*60)
    print("RESULTS")
    print("="*60)
    print(f"Claude:  {'✅ WORKING' if claude_ok else '❌ FAILED'}")
    print(f"OpenAI: {'✅ WORKING' if openai_ok else '❌ FAILED'}")
    print("="*60)
    
    sys.exit(0 if (claude_ok and openai_ok) else 1)

