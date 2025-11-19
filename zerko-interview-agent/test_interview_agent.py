"""
Tests for Interview Agent "no answer detected" handling
Validates Requirements 10.1, 10.2, 10.3, 10.4, 10.5
"""
import sys
import os

# Add parent directory to path to import the agent
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from AI_interview_agent import interview_agent_auto_number


def test_no_answer_detected_moves_to_next_question():
    """
    Test that when "no answer detected" is received, the agent:
    1. Recognizes it as a special case (Requirement 10.1)
    2. Responds with the polite message (Requirement 10.2)
    3. Presents the next question (Requirement 10.3)
    4. Maintains question ID integrity (Requirement 10.5)
    """
    questions = [
        {"id": 0, "question": "Tell me about yourself."},
        {"id": 1, "question": "What are your strengths?"},
        {"id": 2, "question": "Why do you want this job?"}
    ]
    
    # First question asked
    messages = [
        {"role": "interviewer", "content": "Tell me about yourself.", "question_id": 0}
    ]
    
    # Candidate didn't answer
    messages.append({"role": "candidate", "content": "No answer detected."})
    
    result = interview_agent_auto_number(
        Post="Software Engineer",
        JobDescription="We need a skilled developer",
        resume_data="Experienced developer with 5 years",
        questions_list=questions,
        messages=messages,
        time_left=10 * 60 * 1000  # 10 minutes
    )
    
    # Verify the response
    assert result["endInterview"] == False, "Interview should not end"
    assert "I did not catch your answer, so let's move ahead" in result["AIResponse"], \
        "Should include polite message"
    assert "What are your strengths?" in result["AIResponse"], \
        "Should include next question"
    assert result["question_id"] == 1, "Should move to question ID 1"
    
    print("✓ Test passed: No answer detected moves to next question")


def test_no_answer_detected_at_end_of_questions():
    """
    Test that when "no answer detected" is received and no more questions remain:
    1. Provides closing feedback (Requirement 10.4)
    2. Ends the interview
    """
    questions = [
        {"id": 0, "question": "Tell me about yourself."},
        {"id": 1, "question": "What are your strengths?"}
    ]
    
    # Both questions asked, last one not answered
    messages = [
        {"role": "interviewer", "content": "Tell me about yourself.", "question_id": 0},
        {"role": "candidate", "content": "I am a developer..."},
        {"role": "interviewer", "content": "What are your strengths?", "question_id": 1}
    ]
    
    # Candidate didn't answer the last question
    messages.append({"role": "candidate", "content": "No answer detected."})
    
    result = interview_agent_auto_number(
        Post="Software Engineer",
        JobDescription="We need a skilled developer",
        resume_data="Experienced developer with 5 years",
        questions_list=questions,
        messages=messages,
        time_left=10 * 60 * 1000  # 10 minutes
    )
    
    # Verify the response
    assert result["endInterview"] == True, "Interview should end"
    assert "Thank you" in result["AIResponse"], "Should include closing feedback"
    assert result["question_id"] is None, "No question ID when ending"
    
    print("✓ Test passed: No answer at end of questions ends interview")


def test_question_id_integrity_with_no_answers():
    """
    Test that question IDs maintain integrity even when multiple answers are missed
    (Requirement 10.5)
    """
    questions = [
        {"id": 0, "question": "Question 1"},
        {"id": 1, "question": "Question 2"},
        {"id": 2, "question": "Question 3"},
        {"id": 3, "question": "Question 4"}
    ]
    
    # First question asked and not answered
    messages = [
        {"role": "interviewer", "content": "Question 1", "question_id": 0},
        {"role": "candidate", "content": "No answer detected."}
    ]
    
    result1 = interview_agent_auto_number(
        Post="Software Engineer",
        JobDescription="Test",
        resume_data="Test",
        questions_list=questions,
        messages=messages,
        time_left=10 * 60 * 1000
    )
    
    assert result1["question_id"] == 1, "Should move to question 1"
    
    # Second question asked and not answered
    messages.append({"role": "interviewer", "content": result1["AIResponse"], "question_id": 1})
    messages.append({"role": "candidate", "content": "no answer detected"})
    
    result2 = interview_agent_auto_number(
        Post="Software Engineer",
        JobDescription="Test",
        resume_data="Test",
        questions_list=questions,
        messages=messages,
        time_left=10 * 60 * 1000
    )
    
    assert result2["question_id"] == 2, "Should move to question 2"
    
    print("✓ Test passed: Question ID integrity maintained with no answers")


def test_various_no_answer_patterns():
    """
    Test that various "no answer" patterns are recognized (Requirement 10.1)
    """
    questions = [
        {"id": 0, "question": "Test question 1"},
        {"id": 1, "question": "Test question 2"}
    ]
    
    no_answer_patterns = [
        "no answer detected.",
        "No Answer Detected",
        "NO ANSWER DETECTED",
        "sorry, could not hear any response.",
        "Sorry, Could Not Hear Any Response"
    ]
    
    for pattern in no_answer_patterns:
        messages = [
            {"role": "interviewer", "content": "Test question 1", "question_id": 0},
            {"role": "candidate", "content": pattern}
        ]
        
        result = interview_agent_auto_number(
            Post="Software Engineer",
            JobDescription="Test",
            resume_data="Test",
            questions_list=questions,
            messages=messages,
            time_left=10 * 60 * 1000
        )
        
        assert result["endInterview"] == False, f"Should not end for pattern: {pattern}"
        assert "I did not catch your answer" in result["AIResponse"], \
            f"Should include polite message for pattern: {pattern}"
        assert result["question_id"] == 1, f"Should move to next question for pattern: {pattern}"
    
    print("✓ Test passed: Various no answer patterns recognized")


def test_no_answer_with_time_constraints():
    """
    Test that no answer handling works correctly with time constraints
    """
    questions = [
        {"id": 0, "question": "Question 1"},
        {"id": 1, "question": "Question 2"}
    ]
    
    # No answer with less than 2 minutes remaining
    messages = [
        {"role": "interviewer", "content": "Question 1", "question_id": 0},
        {"role": "candidate", "content": "No answer detected."}
    ]
    
    result = interview_agent_auto_number(
        Post="Software Engineer",
        JobDescription="Test",
        resume_data="Test",
        questions_list=questions,
        messages=messages,
        time_left=90 * 1000  # 90 seconds (less than 2 minutes)
    )
    
    assert result["endInterview"] == False, "Should not end yet"
    assert result["lastQuestion"] == True, "Should mark as last question"
    assert "final question" in result["AIResponse"].lower(), "Should mention final question"
    
    print("✓ Test passed: No answer handling with time constraints")


if __name__ == "__main__":
    print("Running Interview Agent 'no answer detected' tests...\n")
    
    try:
        test_no_answer_detected_moves_to_next_question()
        test_no_answer_detected_at_end_of_questions()
        test_question_id_integrity_with_no_answers()
        test_various_no_answer_patterns()
        test_no_answer_with_time_constraints()
        
        print("\n✅ All tests passed!")
        print("\nValidated Requirements:")
        print("  - 10.1: Robust detection of 'no answer detected' patterns")
        print("  - 10.2: Polite response message")
        print("  - 10.3: Correct question sequencing after missed answers")
        print("  - 10.4: End-of-questions scenario with closing feedback")
        print("  - 10.5: Question ID integrity throughout interview")
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
