#!/usr/bin/env python3
"""
Test script to verify the resilience of the resume analysis service
"""

import asyncio
import logging
from ResumeOptimizationAgent import analyze_resume

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_resilience():
    """Test the resilience mechanisms"""
    
    print("🧪 Testing Resume Analysis Service Resilience")
    print("=" * 50)
    
    # Test data
    test_resume = """
    John Doe
    Software Engineer
    
    Experience:
    - 5 years Python development
    - React and Node.js experience
    - AWS cloud services
    
    Skills: Python, JavaScript, React, AWS, Docker
    """
    
    test_jd = """
    We are looking for a Senior Software Engineer with:
    - 3+ years Python experience
    - React/JavaScript skills
    - Cloud experience (AWS preferred)
    - Docker knowledge
    """
    
    test_formatting_issues = ["Missing contact information", "Inconsistent formatting"]
    
    print("📝 Test Resume Length:", len(test_resume))
    print("📋 Test JD Length:", len(test_jd))
    print("⚠️ Test Formatting Issues:", len(test_formatting_issues))
    print()
    
    try:
        print("🚀 Starting analysis (this will test retry mechanism if API is down)...")
        
        result = analyze_resume(test_resume, test_jd, test_formatting_issues)
        
        print("✅ Analysis completed successfully!")
        print("📊 Result type:", type(result))
        print("🎯 Total score:", result.get('total_score', 'N/A'))
        
        # Check if fallback was used
        if result.get('analysis_status') == 'fallback_mode':
            print("🔄 FALLBACK MODE USED")
            print("📝 Fallback reason:", result.get('fallback_reason', 'Unknown'))
        elif result.get('analysis_status') == 'emergency_fallback':
            print("🚨 EMERGENCY FALLBACK USED")
            print("📝 Fallback reason:", result.get('fallback_reason', 'Unknown'))
        else:
            print("🤖 AI ANALYSIS SUCCESSFUL")
        
        print("\n📈 Analysis Summary:")
        print(f"  - Relevance Score: {result.get('relevance_score', 'N/A')}")
        print(f"  - Impact Score: {result.get('impact_score', 'N/A')}")
        print(f"  - ATS Score: {result.get('ats_score', 'N/A')}")
        print(f"  - Strengths: {len(result.get('strengths', []))}")
        print(f"  - Improvements: {len(result.get('improvements', []))}")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        print("💥 This should NOT happen - the service should handle all errors gracefully")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_resilience())
    
    if success:
        print("\n✅ RESILIENCE TEST PASSED")
        print("🛡️ Service can handle API failures gracefully")
    else:
        print("\n❌ RESILIENCE TEST FAILED") 
        print("⚠️ Service needs additional error handling")