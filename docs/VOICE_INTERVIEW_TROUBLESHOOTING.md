# Voice Interview System - Troubleshooting Guide

## 🎯 Quick Diagnosis

### Symptom Checker

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| "Microphone permission denied" | Browser blocked access | Allow mic in browser settings |
| Voice recognition not starting | Brave Shields enabled | Disable Shields for site |
| Network error in Brave | Shields blocking API | Disable Shields + refresh |
| AI not responding | Backend offline | Check FastAPI server status |
| Echo/feedback during interview | Audio settings | Use headphones |
| Recognition stops prematurely | Silence timeout | Speak continuously |
| "No answer detected" repeatedly | Mic not working | Check mic hardware/settings |
| Interview freezes | Network issue | Check internet connection |

## 🔧 Common Issues & Solutions

### 1. Brave Browser Issues

#### Issue: "Network error" during speech recognition
**Cause**: Brave Shields blocking Web Speech API

**Solution**:
```
1. Click Brave Shields icon (🛡️) in address bar
2. Select "Shields Down for this site"
3. Refresh the page (F5)
4. Allow microphone when prompted
```

**Alternative**: Use text input fallback
```
1. Click "Type Answer Instead" button
2. Type your response
3. Click "Send"
```

#### Issue: Microphone permission keeps getting denied
**Cause**: Brave's aggressive privacy settings

**Solution**:
```
1. Go to brave://settings/content/microphone
2. Find your site in "Blocked" list
3. Move it to "Allowed" list
4. Refresh the interview page
```

### 2. Speech Recognition Issues

#### Issue: Recognition stops after a few seconds
**Cause**: Browser's silence detection timeout

**Solution**:
- Speak continuously without long pauses
- If you need to think, say "Let me think..." to keep recognition active
- System will wait 8-10 seconds of silence before stopping

#### Issue: "No answer detected" even when speaking
**Cause**: Microphone not picking up audio

**Diagnosis**:
```javascript
// Test in browser console
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Microphone working!');
    stream.getTracks().forEach(track => track.stop());
  })
  .catch(err => console.error('Microphone error:', err));
```

**Solutions**:
1. Check if correct microphone is selected in browser
2. Increase microphone volume in system settings
3. Try different microphone/headset
4. Use text input as fallback

#### Issue: Recognition captures wrong words
**Cause**: Background noise or poor audio quality

**Solutions**:
- Use quiet environment
- Speak clearly and at normal pace
- Use headset with noise cancellation
- Position microphone 6-12 inches from mouth
- Avoid touching/moving microphone while speaking

### 3. Audio Quality Issues

#### Issue: Echo or feedback during interview
**Cause**: Speaker output feeding back into microphone

**Solutions**:
1. **Use headphones** (best solution)
2. Lower speaker volume
3. Increase distance between speaker and mic
4. Enable echo cancellation:
```typescript
// Already enabled in code
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true
}
```

#### Issue: AI voice is choppy or distorted
**Cause**: Browser speech synthesis issues

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Try different browser
4. Check system audio settings

### 4. Backend/API Issues

#### Issue: "Interview agent is not working"
**Cause**: FastAPI backend not running or unreachable

**Diagnosis**:
```bash
# Check if backend is running
curl http://localhost:8000/health

# Expected response:
# {"success": true, "health": "Working perfectly! API connected."}
```

**Solutions**:
1. Start FastAPI server:
```bash
cd zerko-interview-agent
uvicorn app:app --reload --port 8000
```

2. Check environment variables:
```bash
# Verify GOOGLE_API_KEY is set
echo $GOOGLE_API_KEY

# Verify NEXT_PUBLIC_AGENT_API_URL
echo $NEXT_PUBLIC_AGENT_API_URL
```

3. Check CORS settings in `app.py`

#### Issue: "Failed to generate feedback"
**Cause**: LangChain/Google AI API error

**Diagnosis**:
```bash
# Check FastAPI logs
# Look for errors like:
# - "LLM invocation failed"
# - "API key invalid"
# - "Rate limit exceeded"
```

**Solutions**:
1. Verify Google AI API key is valid
2. Check API quota/rate limits
3. Review FastAPI logs for specific error
4. Retry after a few minutes

### 5. Permission Issues

#### Issue: Microphone permission prompt doesn't appear
**Cause**: Browser already denied permission

**Solution for Chrome/Brave**:
```
1. Click lock icon (🔒) in address bar
2. Find "Microphone" setting
3. Change to "Allow"
4. Refresh page
```

**Solution for Firefox**:
```
1. Click lock icon in address bar
2. Click "Connection secure" > "More information"
3. Go to "Permissions" tab
4. Find "Use the Microphone"
5. Uncheck "Use default" and select "Allow"
6. Refresh page
```

**Solution for Safari**:
```
1. Safari > Settings > Websites
2. Select "Microphone"
3. Find your site and set to "Allow"
4. Refresh page
```

### 6. Network Issues

#### Issue: Interview disconnects or freezes
**Cause**: Unstable internet connection

**Solutions**:
1. Check internet connection stability
2. Close other bandwidth-heavy applications
3. Move closer to WiFi router
4. Use wired connection if possible
5. Refresh page to restart interview

#### Issue: Slow AI responses
**Cause**: High latency or server load

**Solutions**:
1. Check internet speed (minimum 5 Mbps recommended)
2. Close unnecessary browser tabs
3. Wait a few seconds - AI is processing
4. If persistent, contact support

## 🔍 Advanced Debugging

### Enable Debug Mode

Add to browser console:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG_VOICE', 'true');

// Check speech recognition support
console.log('Speech Recognition:', 
  'SpeechRecognition' in window || 
  'webkitSpeechRecognition' in window
);

// Check browser info
console.log('User Agent:', navigator.userAgent);

// Test microphone
navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    const mics = devices.filter(d => d.kind === 'audioinput');
    console.log('Available microphones:', mics);
  });
```

### Check Recognition State

```javascript
// In browser console during interview
console.log('Recognition State:', {
  isListening: /* check UI indicator */,
  isMicOn: /* check UI indicator */,
  browserInfo: /* check for Brave badge */
});
```

### Monitor Network Requests

```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Watch for:
   - POST /api/interview/next
   - POST /api/feedback/{id}
   - POST /api/interview/{id}/update-transcript
5. Check response status and data
```

### Check Console Errors

```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors in red
4. Common errors:
   - "Recognition error: network"
   - "Failed to fetch"
   - "Microphone permission denied"
```

## 📊 Performance Optimization

### For Best Experience

#### Hardware
- ✅ Use quality headset with microphone
- ✅ Ensure stable internet (5+ Mbps)
- ✅ Close unnecessary applications
- ✅ Use modern computer (not required but helps)

#### Software
- ✅ Use latest browser version
- ✅ Clear browser cache regularly
- ✅ Disable unnecessary browser extensions
- ✅ Keep only interview tab open

#### Environment
- ✅ Quiet room with minimal background noise
- ✅ Good lighting (for video interviews in future)
- ✅ Comfortable seating
- ✅ Test setup before actual interview

### Browser Recommendations

| Browser | Recommendation | Notes |
|---------|---------------|-------|
| **Chrome** | ⭐⭐⭐⭐⭐ Best | Full support, best performance |
| **Brave** | ⭐⭐⭐⭐ Good | Requires Shields disabled |
| **Edge** | ⭐⭐⭐⭐⭐ Best | Chromium-based, full support |
| **Firefox** | ⭐⭐⭐⭐ Good | Good support, slightly slower |
| **Safari** | ⭐⭐⭐ OK | Limited on iOS, good on macOS |

## 🆘 Emergency Procedures

### If Voice Completely Fails

1. **Use Text Input**
   - Click "Type Answer Instead" button
   - Type your responses
   - Continue interview normally

2. **Restart Interview**
   - Click "End Interview"
   - Start new interview session
   - System will save progress

3. **Switch Browser**
   - Copy interview link
   - Open in Chrome or Edge
   - Continue from where you left off

### If Backend is Down

1. **Check Status**
```bash
curl http://localhost:8000/health
```

2. **Restart Backend**
```bash
cd zerko-interview-agent
uvicorn app:app --reload --port 8000
```

3. **Contact Support**
   - Email: abhi03085e@gmail.com
   - Include: Error message, browser, timestamp

## 📞 Getting Help

### Before Contacting Support

Collect this information:
1. Browser name and version
2. Operating system
3. Error message (screenshot if possible)
4. Steps to reproduce the issue
5. Console errors (F12 > Console tab)
6. Network tab errors (F12 > Network tab)

### Support Channels

- **Email**: abhi03085e@gmail.com
- **GitHub Issues**: [Create Issue](https://github.com/ABHI-Theq/zerko/issues)
- **Documentation**: Check VOICE_INTERVIEW_FIXES.md

### Response Time

- Critical issues: 24 hours
- Non-critical: 48-72 hours
- Feature requests: Varies

## ✅ Pre-Interview Checklist

Before starting your interview:

- [ ] Microphone is connected and working
- [ ] Browser is up to date
- [ ] Microphone permission granted
- [ ] Brave Shields disabled (if using Brave)
- [ ] Quiet environment secured
- [ ] Internet connection stable
- [ ] Headphones connected (recommended)
- [ ] Backend server running (for development)
- [ ] Test microphone in browser settings
- [ ] Close unnecessary applications

## 🔄 Known Issues & Workarounds

### Issue: Brave Network Errors
**Status**: Known issue with Brave's privacy features
**Workaround**: Disable Shields or use text input
**Fix**: Implemented automatic retry (3 attempts)

### Issue: Safari iOS Limitations
**Status**: iOS restricts Web Speech API
**Workaround**: Use desktop Safari or text input
**Fix**: Mobile app planned for future

### Issue: Firefox Interim Results
**Status**: Firefox handles interim results differently
**Workaround**: System adapted to handle both modes
**Fix**: Already implemented

## 📈 Future Improvements

Planned enhancements to reduce issues:

1. **WebRTC Integration**: Better audio quality and reliability
2. **Offline Mode**: Local speech recognition fallback
3. **Audio Visualization**: Real-time feedback on audio input
4. **Connection Monitor**: Automatic detection and recovery
5. **Mobile App**: Native apps for iOS and Android
6. **Multi-language**: Support for non-English interviews

---

**Last Updated**: November 2025
**Version**: 1.0.0
**Maintained By**: Zerko Development Team
