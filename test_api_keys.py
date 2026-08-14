#!/usr/bin/env python3
"""
Test script to verify Claude and OpenAI API keys are working
"""
import os
import sys
from pathlib import Path

# Add backend to path if needed
backend_path = Path(__file__).parent / "backend"
if backend_path.exists():
    sys.path.insert(0, str(backend_path))

def load_env_file(env_file):
    """Load environment variables from a file"""
    env_vars = {}
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    return env_vars

# Try to load environment variables from common locations
env_files = [
    Path(__file__).parent / "backend.env.production",
    Path(__file__).parent / "frontend" / "backend.env.production",
    Path(__file__).parent / ".env",
    Path(__file__).parent / "backend" / ".env",
]

env_vars = {}
for env_file in env_files:
    if env_file.exists():
        env_vars = load_env_file(env_file)
        print(f"Loaded environment from: {env_file}")
        break

# Get API keys from environment or env file
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", env_vars.get("ANTHROPIC_API_KEY", ""))
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", env_vars.get("OPENAI_API_KEY", ""))

def test_claude_api():
    """Test Claude API key"""
    print("\n" + "="*60)
    print("Testing Claude API Key...")
    print("="*60)
    
    if not ANTHROPIC_API_KEY:
        print("❌ ERROR: ANTHROPIC_API_KEY not found in environment variables")
        return False
    
    # Debug info
    key_len = len(ANTHROPIC_API_KEY)
    key_preview = f"{ANTHROPIC_API_KEY[:10]}...{ANTHROPIC_API_KEY[-10:]}" if key_len > 20 else ANTHROPIC_API_KEY
    print(f"Key length: {key_len} characters")
    print(f"Key preview: {key_preview}")
    print(f"Key starts with 'sk-ant-': {ANTHROPIC_API_KEY.startswith('sk-ant-')}")
    print(f"Key has whitespace: {ANTHROPIC_API_KEY != ANTHROPIC_API_KEY.strip()}")
    
    if not ANTHROPIC_API_KEY.startswith("sk-ant-"):
        print("⚠️  WARNING: API key format doesn't look correct (should start with 'sk-ant-')")
    
    # Clean the key (remove any whitespace)
    clean_key = ANTHROPIC_API_KEY.strip()
    
    try:
        from anthropic import Anthropic
        
        print(f"\nInitializing Claude client...")
        client = Anthropic(api_key=clean_key)
        print("✅ Client initialized successfully")
        
        # Try different models in order
        models_to_try = [
            "claude-sonnet-4-20250514",
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229"
        ]
        
        for model in models_to_try:
            try:
                print(f"\nTesting with model: {model}...")
                response = client.messages.create(
                    model=model,
                    max_tokens=50,
                    messages=[
                        {"role": "user", "content": "Say 'Hello, Claude API is working!' in one sentence."}
                    ]
                )
                
                result = response.content[0].text
                print(f"✅ SUCCESS: Claude API is working with {model}!")
                print(f"   Response: {result}")
                return True
            except Exception as model_error:
                error_str = str(model_error)
                print(f"   ❌ Failed with {model}: {error_str[:200]}")
                # If it's an authentication error, don't try other models
                if "401" in error_str or "authentication" in error_str.lower() or "invalid" in error_str.lower():
                    raise model_error
                continue
        
        print("❌ All model attempts failed")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: Claude API test failed")
        error_str = str(e)
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {error_str}")
        
        # Provide specific guidance based on error
        if "401" in error_str or "authentication" in error_str.lower():
            print("\n   🔍 DIAGNOSIS: Authentication failed")
            print("   Possible causes:")
            print("   - API key is invalid or expired")
            print("   - API key doesn't have access to the requested model")
            print("   - API key format is incorrect")
            print("   - Account billing issue")
        elif "404" in error_str:
            print("\n   🔍 DIAGNOSIS: Model not found")
            print("   - The model name might be incorrect")
            print("   - The API key might not have access to this model")
        elif "429" in error_str:
            print("\n   🔍 DIAGNOSIS: Rate limit exceeded")
            print("   - Too many requests")
        elif "500" in error_str or "503" in error_str:
            print("\n   🔍 DIAGNOSIS: Server error")
            print("   - Anthropic API might be experiencing issues")
        
        return False

def test_openai_api():
    """Test OpenAI API key"""
    print("\n" + "="*60)
    print("Testing OpenAI API Key...")
    print("="*60)
    
    if not OPENAI_API_KEY:
        print("❌ ERROR: OPENAI_API_KEY not found in environment variables")
        return False
    
    # Debug info
    key_len = len(OPENAI_API_KEY)
    key_preview = f"{OPENAI_API_KEY[:15]}...{OPENAI_API_KEY[-15:]}" if key_len > 30 else OPENAI_API_KEY
    print(f"Key length: {key_len} characters")
    print(f"Key preview: {key_preview}")
    print(f"Key starts with 'sk-': {OPENAI_API_KEY.startswith('sk-')}")
    print(f"Key starts with 'sk-proj-': {OPENAI_API_KEY.startswith('sk-proj-')}")
    print(f"Key has whitespace: {OPENAI_API_KEY != OPENAI_API_KEY.strip()}")
    
    if not (OPENAI_API_KEY.startswith("sk-") or OPENAI_API_KEY.startswith("sk-proj-")):
        print("⚠️  WARNING: API key format doesn't look correct (should start with 'sk-' or 'sk-proj-')")
    
    # Clean the key (remove any whitespace)
    clean_key = OPENAI_API_KEY.strip()
    
    try:
        from openai import OpenAI
        
        print(f"\nInitializing OpenAI client...")
        client = OpenAI(api_key=clean_key)
        print("✅ Client initialized successfully")
        
        # Try different models in order
        models_to_try = [
            "gpt-4o",
            "gpt-4o-mini",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ]
        
        for model in models_to_try:
            try:
                print(f"\nTesting with model: {model}...")
                response = client.chat.completions.create(
                    model=model,
                    max_tokens=50,
                    messages=[
                        {"role": "user", "content": "Say 'Hello, OpenAI API is working!' in one sentence."}
                    ]
                )
                
                result = response.choices[0].message.content.strip()
                print(f"✅ SUCCESS: OpenAI API is working with {model}!")
                print(f"   Response: {result}")
                return True
            except Exception as model_error:
                error_str = str(model_error)
                print(f"   ❌ Failed with {model}: {error_str[:200]}")
                # If it's an authentication error, don't try other models
                if "401" in error_str or "authentication" in error_str.lower() or "invalid" in error_str.lower() or "incorrect" in error_str.lower():
                    raise model_error
                continue
        
        print("❌ All model attempts failed")
        return False
        
    except Exception as e:
        print(f"\n❌ ERROR: OpenAI API test failed")
        error_str = str(e)
        print(f"   Error type: {type(e).__name__}")
        print(f"   Error message: {error_str}")
        
        # Provide specific guidance based on error
        if "401" in error_str or "authentication" in error_str.lower() or "invalid" in error_str.lower() or "incorrect" in error_str.lower():
            print("\n   🔍 DIAGNOSIS: Authentication failed")
            print("   Possible causes:")
            print("   - API key is invalid or expired")
            print("   - API key doesn't have access to the requested model")
            print("   - API key format is incorrect")
            print("   - Account billing issue or insufficient credits")
            print("   - API key was revoked or deleted")
        elif "404" in error_str:
            print("\n   🔍 DIAGNOSIS: Model not found")
            print("   - The model name might be incorrect")
            print("   - The API key might not have access to this model")
        elif "429" in error_str:
            print("\n   🔍 DIAGNOSIS: Rate limit exceeded")
            print("   - Too many requests")
            print("   - Check your usage limits")
        elif "500" in error_str or "503" in error_str:
            print("\n   🔍 DIAGNOSIS: Server error")
            print("   - OpenAI API might be experiencing issues")
        elif "insufficient_quota" in error_str.lower() or "quota" in error_str.lower():
            print("\n   🔍 DIAGNOSIS: Insufficient quota")
            print("   - Your account has run out of credits")
            print("   - Add payment method or top up credits")
        
        return False

def main():
    """Main test function"""
    print("="*60)
    print("API Key Validation Test")
    print("="*60)
    
    # Check if keys are present
    print(f"\nClaude API Key: {'Present' if ANTHROPIC_API_KEY else 'Missing'}")
    print(f"OpenAI API Key: {'Present' if OPENAI_API_KEY else 'Missing'}")
    
    # Also test with keys provided directly by user
    user_claude_key = "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"
    user_openai_key = "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"
    
    # Compare keys
    print("\n" + "="*60)
    print("Key Comparison")
    print("="*60)
    print(f"Claude key matches user-provided: {ANTHROPIC_API_KEY == user_claude_key}")
    print(f"OpenAI key matches user-provided: {OPENAI_API_KEY == user_openai_key}")
    
    if ANTHROPIC_API_KEY != user_claude_key:
        print(f"\n⚠️  Claude key mismatch detected!")
        print(f"   Env file key length: {len(ANTHROPIC_API_KEY)}")
        print(f"   User key length: {len(user_claude_key)}")
        print(f"   First 20 chars match: {ANTHROPIC_API_KEY[:20] == user_claude_key[:20]}")
        print(f"   Last 20 chars match: {ANTHROPIC_API_KEY[-20:] == user_claude_key[-20:]}")
    
    if OPENAI_API_KEY != user_openai_key:
        print(f"\n⚠️  OpenAI key mismatch detected!")
        print(f"   Env file key length: {len(OPENAI_API_KEY)}")
        print(f"   User key length: {len(user_openai_key)}")
        print(f"   First 20 chars match: {OPENAI_API_KEY[:20] == user_openai_key[:20]}")
        print(f"   Last 20 chars match: {OPENAI_API_KEY[-20:] == user_openai_key[-20:]}")
    
    # Test both APIs
    claude_result = test_claude_api()
    openai_result = test_openai_api()
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Claude API:  {'✅ WORKING' if claude_result else '❌ FAILED'}")
    print(f"OpenAI API: {'✅ WORKING' if openai_result else '❌ FAILED'}")
    print("="*60)
    
    # Exit code
    if claude_result and openai_result:
        print("\n✅ All API keys are working correctly!")
        return 0
    else:
        print("\n❌ Some API keys are not working. Please check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

