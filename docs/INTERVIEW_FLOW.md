# Interview Flow Documentation - Zerko Platform

## 📋 Overview

This document provides a comprehensive guide to the interview flow in the Zerko platform, from interview creation to completion and feedback generation.

## 🎯 Complete Interview Journey

### Phase 1: Interview Setup

```
User Dashboard → Create Interview → Upload Resume → Select Job Role → Generate Questions
```

#### 1.1 Interview Creation
- User navigates to dashboard
- Clicks "Create New Interview"
- Selects interview type (Technical, Behavioral, Mixed)
- Sets interview duration (5, 10, 15, or 30 minutes)

#### 1.2 Resume Upload
- User uploads PDF resume
- Resume is uploaded to Cloudinary
- PyMuPDF extracts text from PDF
- Resume data is stored in database

#### 1.3 Question Generation

**Backend Process** (`Question_generator_agent.py`):
```python
POST /api/generate-questions
- Input: resume_data, job_description, post, interview_type
- LangChain + Google Gemini 2.5 Pro generates 5-10 questions
- Questions are tailored to resume and job role
- Questions stored in database with interview record
```

**Question Types**:
- Technical: Coding, algorithms, system design
- Behavioral: Past experiences, problem-solving
- Mixed: Combination of both

### Phase 2: Interview Initialization

```
Start Interview → Browser Detection → Microphone Permission → First Question
```

#### 2.1 Browser Detection
```typescript
// Async browser detection with multiple methods
const browserInfo = await getBrowserInfo();
// Detects: Chrome, Firefox, Safari, Edge, Brave
// Special handling for Brave browser
```

**Brave Browser Detection**:
1. Official Brave API: `window.brave.isBrave()`
2. Fallback: User agent string check
3. Fallback: Navigator property check

#### 2.2 Microphone Permission
```typescript
// Request microphone with enhanced audio constraints
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    sampleRate: browserInfo.isBrave ? 16000 : undefined
  }
});
```

**Permission States**:
- ✅ Granted: Interview starts
- ❌ Denied: Show instructions, prevent start
- ⏳ Prompt: Wait for user decision

#### 2.3 Speech Recognition Initialization
```typescript
// Create browser-specific recognition instance
const recognition = recognitionManager.createInstance();

// Browser-specific configurations applied:
// - Brave: interimResults=false, sampleRate=16000
// - Chrome/Edge: interimResults=true
// - Firefox: interimResults=false
// - Safari: interimResults=true
```

#### 2.4 First Question
```typescript
POST /api/interview/next
Request: {
  post, job_description, resumeData, questions,
  messages: [], interview_type, time_left, force_next: false
}

Response: {
  AIResponse: "Hello! Let's begin...",
  question_id: 1,
  lastQuestion: false,
  endInterview: false
}
```

### Phase 3: Interview Loop

```
AI Asks Question → TTS Speaks → User Answers → Speech Recognition → Submit Answer → Next Question
```

#### 3.1 AI Question Flow

**Backend Logic** (`AI_interview_agent.py`):
```python
def interview_agent_auto_number():
    # Check time remaining
    if time_left <= 30000:  # 30 seconds
        return end_interview_response()
    
    if time_left <= 120000:  # 2 minutes
        lastQuestion = True
    
    # Handle "no answer detected"
    if last_message == "no answer detected.":
        return polite_skip_response()
    
    # Generate next question using LangChain
    next_question = generate_question(context)
    
    return {
        "AIResponse": next_question,
        "question_id": current_id + 1,
        "lastQuestion": lastQuestion
    }
```

**Question Sequencing**:
1. Questions asked in order from generated list
2. Question ID tracked for continuity
3. Context maintained across conversation
4. Time-based logic for final question

#### 3.2 Text-to-Speech (TTS)

```typescript
const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = browserInfo.isBrave ? 1.0 : 1.05;
  
  utterance.onend = () => {
    // Delay before starting recognition
    setTimeout(() => {
      startListening();
    }, browserInfo.isBrave ? 1200 : 800);
  };
  
  window.speechSynthesis.speak(utterance);
};
```

**TTS Delays**:
- Brave: 1200ms (prevents echo)
- Others: 800ms (standard delay)

#### 3.3 Speech Recognition

**Start Listening**:
```typescript
const startListening = () => {
  // Reset state
  sessionTranscriptRef.current = "";
  lastSpokenAtRef.current = null;
  
  // Start recognition
  recognition.start();
  
  // Start silence checker
  silenceCheckerRef.current = setInterval(() => {
    checkSilence();
  }, 1000);
};
```

**Capture Speech**:
```typescript
recognition.onresult = (event) => {
  // Reset silence timer on ANY result
  lastSpokenAtRef.current = Date.now();
  
  // Process final results
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) {
      const transcript = event.results[i][0].transcript;
      sessionTranscriptRef.current += transcript + " ";
    }
  }
};
```

**Silence Detection**:
```typescript
const checkSilence = () => {
  const threshold = browserInfo.isBrave ? 10000 : 8000;
  const silenceDuration = Date.now() - lastSpokenAtRef.current;
  
  if (silenceDuration >= threshold) {
    explicitStopRef.current = true;
    recognition.stop();
  }
};
```

**Silence Thresholds**:
- Brave: 10 seconds
- Others: 8 seconds

#### 3.4 Submit Answer

```typescript
recognition.onend = () => {
  // Clear silence checker
  clearInterval(silenceCheckerRef.current);
  
  // Submit accumulated transcript
  const answer = sessionTranscriptRef.current.trim();
  if (answer) {
    handleAnswer(answer);
  }
};

const handleAnswer = async (userText: string) => {
  // Add to messages
  setMessages(prev => [...prev, {
    role: "candidate",
    content: userText
  }]);
  
  // Send to backend
  const response = await fetch('/api/interview/next', {
    method: 'POST',
    body: JSON.stringify({
      messages: [...messages, { role: "candidate", content: userText }],
      time_left: timeLeft,
      // ... other params
    })
  });
  
  const data = await response.json();
  
  // Add AI response
  setMessages(prev => [...prev, {
    role: "interviewer",
    content: data.AIResponse,
    question_id: data.question_id
  }]);
  
  // Speak next question
  speak(data.AIResponse);
};
```

### Phase 4: Error Handling

#### 4.1 Network Errors (Brave-Specific)

```typescript
recognition.onerror = (event) => {
  if (event.error === 'network') {
    networkErrorCount++;
    
    if (networkErrorCount < 3) {
      // Exponential backoff: 500ms, 1000ms, 1500ms
      const delay = 500 * networkErrorCount;
      
      setTimeout(() => {
        // Recreate and restart recognition
        const newRecognition = recognitionManager.createInstance();
        setupHandlers(newRecognition);
        newRecognition.start();
      }, delay);
    } else {
      // Switch to fallback mode
      handleRecognitionFallback();
    }
  }
};
```

**Retry Strategy**:
- Attempt 1: 500ms delay
- Attempt 2: 1000ms delay
- Attempt 3: 1500ms delay
- After 3 attempts: Automatic fallback to text input

#### 4.2 Permission Errors

```typescript
if (event.error === 'not-allowed') {
  const message = browserInfo.isBrave
    ? "Disable Brave Shields and allow microphone access"
    : "Allow microphone access in browser settings";
  
  toast.error(message, { duration: 7000 });
  setApiError(message);
}
```

#### 4.3 No-Speech Errors

```typescript
if (event.error === 'no-speech') {
  // Submit "no answer detected" to move forward
  handleAnswer("No answer detected.");
}
```

**Backend Handling**:
```python
if last_input == "no answer detected.":
    response = "I did not catch your answer, so let's move ahead.\n\n" + next_question
    return response_with_next_question()
```

#### 4.4 API Errors

```typescript
try {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const response = await fetch(url, { signal: controller.signal });
  
  if (!response.ok) {
    throw new Error(`Server error ${response.status}`);
  }
} catch (err) {
  if (err.name === 'AbortError') {
    setApiError('Request timed out after 30 seconds');
  } else {
    setApiError('Network error. Please check connection.');
  }
  
  // Show retry button
  setShowRetryButton(true);
  setLastFailedRequest({ userText, messages, timestamp });
}
```

#### 4.5 Fallback Mode

```typescript
const handleRecognitionFallback = () => {
  setUseFallback(true);
  setShowManualInput(true);
  
  toast.error('Voice recognition unavailable. Use text input.', {
    duration: 4000
  });
};

// Manual text input
<textarea
  value={manualInputText}
  onChange={(e) => setManualInputText(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleManualSubmit();
    }
  }}
  placeholder="Type your answer here..."
/>
```

**Keyboard Shortcuts**:
- Enter: Submit answer
- Shift+Enter: New line

### Phase 5: Interview Timing

#### 5.1 Timer Display

```typescript
const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Visual emphasis when < 2 minutes
<div className={timeLeft < 120000 ? 'text-red-500' : ''}>
  <Clock className="w-4 h-4" />
  {formatTime(timeLeft)}
</div>
```

#### 5.2 Time-Based Logic

```typescript
useEffect(() => {
  // Automatic end at 30 seconds
  if (timeLeft <= 30000 && !endPending) {
    setEndPending(true);
    recognition?.stop();
    window.speechSynthesis.cancel();
    
    toast.loading('Time limit reached. Ending interview...');
    
    setTimeout(() => {
      endInterview(true);
    }, 500);
  }
}, [timeLeft]);
```

**Time Thresholds**:
- 2 minutes: Mark as final question
- 30 seconds: Automatic interview end
- 0 seconds: Force end if not already ended

### Phase 6: Interview Completion

```
End Interview → Save Transcript → Generate Feedback → Save Feedback → Redirect to Dashboard
```

#### 6.1 Save Transcript

```typescript
const saveTranscript = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    await fetch(`/api/interview/${id}/update-transcript`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
  } catch (err) {
    console.error('Failed to save transcript:', err);
    // Retry logic or show error
  }
};
```

#### 6.2 Generate Feedback

```typescript
const generateFeedback = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(`/api/feedback/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages,
        post,
        job_description,
        interview_type
      }),
      signal: controller.signal
    });
    
    const data = await response.json();
    return data.feedback;
  } catch (err) {
    console.error('Failed to generate feedback:', err);
    throw err;
  }
};
```

**Backend Process** (`FeedBackReportAgent.py`):
```python
def generate_feedback(messages, post, job_description):
    # LangChain + Google Gemini analysis
    feedback = {
        "overall_rating": "8/10",
        "strengths": [
            "Clear communication",
            "Good technical knowledge"
        ],
        "improvements": [
            "Provide more specific examples",
            "Elaborate on problem-solving approach"
        ],
        "detailed_analysis": "...",
        "recommendations": "..."
    }
    
    return feedback
```

#### 6.3 Save Feedback

```typescript
const saveFeedback = async (feedback: any) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    await fetch(`/api/interview/${id}/save-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
  } catch (err) {
    console.error('Failed to save feedback:', err);
  }
};
```

#### 6.4 Resource Cleanup

```typescript
const cleanup = () => {
  // Stop speech recognition
  try {
    if (recognitionRef.current) {
      recognitionRef.current.abort?.();
      recognitionRef.current.stop();
    }
  } catch (e) {
    console.warn('Error stopping recognition:', e);
  }
  
  // Cancel TTS
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.warn('Error cancelling TTS:', e);
  }
  
  // Clear timers
  if (silenceTimerRef.current) {
    clearTimeout(silenceTimerRef.current);
    clearInterval(silenceTimerRef.current);
  }
  
  if (silenceCheckerRef.current) {
    clearInterval(silenceCheckerRef.current);
  }
  
  // Null references
  recognitionRef.current = null;
  lastSpokenAtRef.current = null;
  sessionTranscriptRef.current = "";
};

// Called on unmount and interview end
useEffect(() => {
  return () => cleanup();
}, []);
```

#### 6.5 Redirect to Dashboard

```typescript
const endInterview = async (autoEnd: boolean = false) => {
  setInterviewEnded(true);
  
  // Save transcript
  await saveTranscript();
  
  // Generate and save feedback
  const feedback = await generateFeedback();
  await saveFeedback(feedback);
  
  // Cleanup resources
  cleanup();
  
  // Redirect
  toast.success('Interview completed!');
  router.push('/dashboard');
};
```

## 🎨 UI Visual Feedback

### Status Indicators

```typescript
// Listening state
{isListening && (
  <div className="flex items-center gap-2">
    <Mic className="w-5 h-5 animate-pulse" />
    <span>Listening...</span>
  </div>
)}

// Processing state
{agentThinking && (
  <div className="flex items-center gap-2">
    <Spinner className="w-5 h-5" />
    <span>AI is processing...</span>
  </div>
)}

// Reconnecting state
{networkRetryCount > 0 && (
  <div className="flex items-center gap-2">
    <RefreshCw className="w-5 h-5 animate-spin" />
    <span>Reconnecting... ({networkRetryCount}/3)</span>
  </div>
)}

// Fallback mode
{useFallback && (
  <div className="flex items-center gap-2">
    <Keyboard className="w-5 h-5" />
    <span>Type your answer...</span>
  </div>
)}
```

### Avatar Styling

```typescript
// White border when microphone active
<div className={cn(
  "avatar-container",
  isMicOn && "ring-2 ring-white"
)}>
  <Bot className="w-8 h-8" />
</div>
```

### Message Display

```typescript
// Framer Motion animations
<AnimatePresence>
  {messages.map((msg, idx) => (
    <motion.div
      key={idx}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "message",
        msg.role === "interviewer" ? "bg-white" : "bg-gray-900 border"
      )}
    >
      {msg.role === "interviewer" ? <Bot /> : <User />}
      <p>{msg.content}</p>
    </motion.div>
  ))}
</AnimatePresence>
```

### Brave Browser Warnings

```typescript
// Shield badge in header
{browserInfo.isBrave && (
  <div className="flex items-center gap-2">
    <span>🛡️</span>
    <AlertCircle className="w-4 h-4" />
  </div>
)}

// Toast notification on page load
toast((t) => (
  <div className="space-y-2">
    <p className="font-semibold">🛡️ Brave Browser Detected</p>
    <p className="text-sm">For best experience:</p>
    <ul className="text-xs space-y-1 list-disc list-inside">
      <li>Disable Shields for this site</li>
      <li>Allow microphone permissions</li>
      <li>If voice fails, use text input</li>
    </ul>
  </div>
), { duration: 8000 });
```

## 📊 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERVIEW DATA FLOW                       │
└─────────────────────────────────────────────────────────────┘

1. SETUP
   User Input → Resume Upload → Cloudinary
   Resume Text → Question Generator → Database

2. INITIALIZATION
   Browser Detection → Microphone Permission → Speech Recognition Setup
   First Question Request → FastAPI → LangChain + Gemini → Response

3. INTERVIEW LOOP
   AI Question → TTS → User Speech → Recognition → Transcript
   Submit Answer → FastAPI → LangChain + Gemini → Next Question
   [Repeat until time expires or questions complete]

4. ERROR HANDLING
   Network Error → Retry (3x) → Fallback to Text
   Permission Error → Show Instructions
   No-Speech Error → Submit "No answer" → Next Question
   API Error → Show Retry Button → Preserve State

5. COMPLETION
   End Interview → Save Transcript → Database
   Generate Feedback → LangChain + Gemini → Feedback Object
   Save Feedback → Database → Cleanup → Redirect
```

## 🔧 Configuration Reference

### Browser-Specific Settings

| Browser | Interim Results | Sample Rate | Silence Threshold | TTS Delay |
|---------|----------------|-------------|-------------------|-----------|
| Chrome  | ✅ Enabled     | Default     | 8 seconds         | 800ms     |
| Edge    | ✅ Enabled     | Default     | 8 seconds         | 800ms     |
| Firefox | ❌ Disabled    | Default     | 8 seconds         | 800ms     |
| Safari  | ✅ Enabled     | Default     | 8 seconds         | 800ms     |
| Brave   | ❌ Disabled    | 16000 Hz    | 10 seconds        | 1200ms    |

### Timeout Configuration

| Operation | Timeout | Retry |
|-----------|---------|-------|
| Interview Init | 30s | No |
| Next Question | 30s | Yes (3x) |
| Save Transcript | 15s | Yes |
| Generate Feedback | 30s | Yes |
| Save Feedback | 15s | Yes |
| Network Error | - | Yes (3x with backoff) |

### Time Thresholds

| Event | Threshold | Action |
|-------|-----------|--------|
| Final Question | 2 minutes | Mark as last question |
| Auto End | 30 seconds | Force interview end |
| Silence (Standard) | 8 seconds | Stop recognition |
| Silence (Brave) | 10 seconds | Stop recognition |

---

**Last Updated**: November 2025  
**Maintained By**: Zerko Development Team
