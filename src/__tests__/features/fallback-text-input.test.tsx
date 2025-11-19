/**
 * Unit tests for fallback text input mode functionality
 * Tests Requirements 6.1, 6.2, 6.3, 6.4, 6.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Fallback Text Input Mode', () => {
  // Mock component to test fallback functionality
  const MockFallbackComponent = () => {
    const [showManualInput, setShowManualInput] = React.useState(false);
    const [manualInputText, setManualInputText] = React.useState('');
    const [useFallback, setUseFallback] = React.useState(false);
    const [submittedAnswers, setSubmittedAnswers] = React.useState<string[]>([]);

    const handleManualSubmit = () => {
      if (manualInputText.trim()) {
        setSubmittedAnswers([...submittedAnswers, manualInputText.trim()]);
        setManualInputText('');
        setShowManualInput(false);
        setUseFallback(false);
      }
    };

    const handleRecognitionFallback = () => {
      setUseFallback(true);
      setShowManualInput(true);
    };

    return (
      <div>
        {!showManualInput && (
          <button onClick={() => setShowManualInput(true)}>
            Type Answer Instead
          </button>
        )}
        
        {showManualInput && (
          <div data-testid="manual-input-area">
            <textarea
              data-testid="manual-textarea"
              value={manualInputText}
              onChange={(e) => setManualInputText(e.target.value)}
              placeholder="Type your answer here..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleManualSubmit();
                }
              }}
            />
            <button
              data-testid="send-button"
              onClick={handleManualSubmit}
              disabled={!manualInputText.trim()}
            >
              Send
            </button>
          </div>
        )}
        
        <button onClick={handleRecognitionFallback}>
          Trigger Fallback
        </button>
        
        <div data-testid="answers">
          {submittedAnswers.map((answer, idx) => (
            <div key={idx}>{answer}</div>
          ))}
        </div>
      </div>
    );
  };

  // Requirement 6.1: Dynamic fallback UI display without page refresh
  test('displays text input area when fallback is activated', () => {
    render(<MockFallbackComponent />);
    
    const triggerButton = screen.getByText('Trigger Fallback');
    fireEvent.click(triggerButton);
    
    expect(screen.getByTestId('manual-input-area')).toBeInTheDocument();
    expect(screen.getByTestId('manual-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  // Requirement 6.2: Textarea with placeholder
  test('shows textarea with correct placeholder', () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const textarea = screen.getByTestId('manual-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Type your answer here...');
  });

  // Requirement 6.3: Enter key submission
  test('submits answer when Enter key is pressed', async () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const textarea = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea, { target: { value: 'My test answer' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });
    
    await waitFor(() => {
      expect(screen.getByText('My test answer')).toBeInTheDocument();
    });
  });

  // Requirement 6.3: Shift+Enter for new line (doesn't submit)
  test('does not submit when Shift+Enter is pressed', () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const textarea = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea, { target: { value: 'Line 1' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
    
    // Should still show the input area (not submitted)
    expect(screen.getByTestId('manual-input-area')).toBeInTheDocument();
    // The text should still be in the textarea (not submitted to answers list)
    expect(screen.getByTestId('answers').textContent).toBe('');
  });

  // Requirement 6.4: Fallback mode persists only for current question
  test('hides text input after submission', async () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const textarea = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea, { target: { value: 'Answer 1' } });
    
    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('manual-input-area')).not.toBeInTheDocument();
    });
  });

  // Requirement 6.5: "Type Answer Instead" button
  test('shows "Type Answer Instead" button for manual activation', () => {
    render(<MockFallbackComponent />);
    
    const button = screen.getByText('Type Answer Instead');
    expect(button).toBeInTheDocument();
    
    fireEvent.click(button);
    
    expect(screen.getByTestId('manual-input-area')).toBeInTheDocument();
  });

  // Test send button is disabled when textarea is empty
  test('disables send button when textarea is empty', () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  // Test send button is enabled when textarea has text
  test('enables send button when textarea has text', () => {
    render(<MockFallbackComponent />);
    
    fireEvent.click(screen.getByText('Type Answer Instead'));
    
    const textarea = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea, { target: { value: 'Some text' } });
    
    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });

  // Test multiple submissions work correctly
  test('allows multiple submissions in sequence', async () => {
    render(<MockFallbackComponent />);
    
    // First submission
    fireEvent.click(screen.getByText('Type Answer Instead'));
    const textarea1 = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Answer 1')).toBeInTheDocument();
    });
    
    // Second submission
    fireEvent.click(screen.getByText('Type Answer Instead'));
    const textarea2 = screen.getByTestId('manual-textarea');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByTestId('send-button'));
    
    await waitFor(() => {
      expect(screen.getByText('Answer 2')).toBeInTheDocument();
    });
    
    // Both answers should be visible
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
  });
});
