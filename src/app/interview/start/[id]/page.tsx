    "use client";
    import { useEffect, useState, useRef } from "react";
    import toast from "react-hot-toast";
    import { Card, CardContent } from "@/components/ui/card";
    import { Bot, User, PhoneOff, Mic, Clock } from "lucide-react";
    import { Spinner } from "@/components/ui/spinner";
    import InterviewHeader from "@/components/InterviewHeader";
    import { useInterviewCon } from "@/context/InterviewContext";
    import { useParams, useRouter } from "next/navigation";
    import { motion, AnimatePresence } from "motion/react";

    declare global {
      interface Window { webkitSpeechRecognition: any; SpeechRecognition: any; }
    }

    export default function Page() {
      const { interview } = useInterviewCon();
      const router = useRouter();
      const params = useParams();
      const id = params.id;

      const [loading, setLoading] = useState(true);
      const [messages, setMessages] = useState<{ role: string; content: string; question_id?: number }[]>([]);
      const [isMicOn, setIsMicOn] = useState(false);
      const [isListening,setIsListening]=useState(false);
      const [apiError, setApiError] = useState<string | null>(null);
      const [agentThinking, setAgentThinking] = useState(false);
      const [endInterviewed, setEndInterviewed] = useState(false);

      const recognitionRef = useRef<any>(null);
      const silenceTimerRef = useRef<any>(null);
      const browserRestartRef = useRef(0);

      // New refs for robust silence handling & restart control
      const silenceCheckerRef = useRef<any>(null);
      const lastSpokenAtRef = useRef<number | null>(null);
      const explicitStopRef = useRef(false);

      // The full answer for the current mic turn, NOT yet sent to transcript while speaking
      const sessionTranscriptRef = useRef<string>("");

      const EndTime = Number(interview.duration?.replace("m", "") || 5) * 60 * 1000 + Date.now();
      const [timeLeft, setTimeLeft] = useState<number>(EndTime - Date.now());
      const [interviewEnded, setInterviewEnded] = useState(false);
      const [lastQuestionFlag, setLastQuestionFlag] = useState(false);
      const [endPending, setEndPending] = useState(false);

      const post = interview.post;
      const job_description = interview.jobDescription;
      const resumeData = interview.resumeData;
      const questions = interview.questionsList;
      const force_next = false;

      // --- TTS + Next Listening ---
      const speak = (text: string) => {
        const utter = new window.SpeechSynthesisUtterance(text);
        utter.lang = "en-US";
        utter.rate = 1.05;
        utter.onend = () => {
          if (!interviewEnded && !endPending) startListening();
        };
        window.speechSynthesis.speak(utter);
      };

      // --------- Initialization (Only On Truly Empty) ---------
      useEffect(() => {
        const initInterview = async () => {
          setAgentThinking(true);
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                post,
                job_description,
                resumeData,
                questions,
                messages: [],
                interview_type: interview.interviewType,
                time_left: timeLeft,
                force_next
              }),
            });
            if (!res.ok) throw new Error(`API returned ${res.status}`);
            const data = await res.json();
            setMessages(currMsgs =>
              currMsgs.length === 0
                ? [{
                    role: "interviewer",
                    content: data.data.AIResponse,
                    question_id: data.data.question_id
                  }]
                : [...currMsgs, {
                    role: "interviewer",
                    content: data.data.AIResponse,
                    question_id: data.data.question_id
                  }]
            );
            setLastQuestionFlag(!!data.data.lastQuestion);
            speak(data.data.AIResponse);
          } catch (err) {
            setApiError("Interview agent is not working.");
            setMessages([{ role: "interviewer", content: "Interview agent is not working." }]);
          } finally {
            setLoading(false);
            setAgentThinking(false);
          }
        };
        if (messages.length === 0) {
          initInterview();
        }
        return cleanup;
      },[]); // Dependency array intentionally []

      useEffect(() => {
        if (interviewEnded) return;
        if (timeLeft <= 0 && !agentThinking && !isMicOn) {
          if (!endPending) endInterview(true);
          return;
        }
        if (timeLeft <= 0 && (agentThinking || isMicOn)) {
          setEndPending(true);
        }
        const timer = setInterval(() => setTimeLeft((t) => t - 1000), 1000);
        return () => clearInterval(timer);
      }, [timeLeft, interviewEnded, agentThinking, isMicOn, endPending]);

      // ----------- MIC LOGIC: True one-message-per-answer plus silence robust auto-restart -----------
      const startListening = () => {
        if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
          alert("Speech Recognition not supported.");
          return;
        }

        // Reset state for new listening session
        browserRestartRef.current = 0;
        sessionTranscriptRef.current = "";
        lastSpokenAtRef.current = null;
        explicitStopRef.current = false;
        let hasSpokenSomething = false;

        // helper to create and wire a fresh Recognition instance
        const createRecognition = () => {
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.lang = "en-US";
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onstart = () => {
            setIsListening(true);
            setIsMicOn(true);
          };

          recognition.onresult = (event: any) => {
            // update last spoken timestamp on any result (interim or final)
            lastSpokenAtRef.current = Date.now();
            hasSpokenSomething = true;

            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
              }
            }

            if (finalTranscript) {
              sessionTranscriptRef.current += finalTranscript;
            }
          };

          recognition.onerror = (event: any) => {
            console.error("Recognition error:", event?.error);
            // recoverable errors should not immediately end the whole turn
            if (event?.error === "no-speech" || event?.error === "audio-capture") {
              // let silence checker handle stop/restart
              return;
            }
            // For other errors, stop and submit what we have (if any)
            explicitStopRef.current = true;
            try { recognition.stop(); } catch (e) { /* ignore */ }
          };

          recognition.onend = () => {
            // clear any current checker (we'll decide below)
            if (silenceCheckerRef.current) {
              clearInterval(silenceCheckerRef.current);
              silenceCheckerRef.current = null;
            }

            setIsListening(false);
            setIsMicOn(false);

            const now = Date.now();
            const wasTrueSilence = explicitStopRef.current || (lastSpokenAtRef.current !== null && (now - lastSpokenAtRef.current) >= 7000);

            if (wasTrueSilence) {
              // True end of turn -> submit once
              const finalAnswer = sessionTranscriptRef.current.trim();
              if (finalAnswer) {
                handleAnswer(finalAnswer);
              } else if (hasSpokenSomething) {
                handleAnswer("Could not process the answer clearly.");
              } else {
                handleAnswer("No answer detected.");
              }
              return;
            }

            // Otherwise, browser ended prematurely -> attempt restart up to 5 times
            if (browserRestartRef.current < 5) {
              browserRestartRef.current++;
              // create a fresh recognition instance and restart after a short delay
              setTimeout(() => {
                try {
                  const nextRec = createRecognition();
                  recognitionRef.current = nextRec;
                  nextRec.start();
                } catch (e) {
                  console.error("Failed to restart recognition:", e);
                  // fallback: submit what we have (do not leave user hanging)
                  const finalAnswer = sessionTranscriptRef.current.trim();
                  if (finalAnswer) handleAnswer(finalAnswer);
                  else if (hasSpokenSomething) handleAnswer("Could not process the answer clearly.");
                  else handleAnswer("No answer detected.");
                }
              }, 150);
              return;
            }

            // Max restarts reached -> submit what we have
            const finalAnswer = sessionTranscriptRef.current.trim();
            if (finalAnswer) {
              handleAnswer(finalAnswer);
            } else if (hasSpokenSomething) {
              handleAnswer("Could not process the answer clearly.");
            } else {
              handleAnswer("No answer detected.");
            }
          };

          return recognition;
        };

        // create and start the first recognition instance
        const recognition = createRecognition();
        recognitionRef.current = recognition;
        try {
          recognition.start();
        } catch (e) {
          console.error("Failed to start recognition:", e);
          setIsListening(false);
          setIsMicOn(false);
          handleAnswer("Failed to start speech recognition.");
          return;
        }

        // periodic checker: detect 7s of silence based on lastSpokenAtRef
        if (silenceCheckerRef.current) {
          clearInterval(silenceCheckerRef.current);
          silenceCheckerRef.current = null;
        }
        silenceCheckerRef.current = setInterval(() => {
          const last = lastSpokenAtRef.current;
          // If user has spoken and 7s passed since last speech -> explicit stop
          if (last && Date.now() - last >= 7000) {
            explicitStopRef.current = true;
            try {
              if (recognitionRef.current) recognitionRef.current.stop();
            } catch (e) {
              // ignore failures; onend will handle submission if necessary
            }
          }
          // If user hasn't spoken for an extended period AND we've never heard anything,
          // don't auto-submit repeatedly — we rely on hasSpokenSomething logic in onend.
        }, 500);
      };

      // ------------- MAIN INTERVIEW LOGIC: ALWAYS APPEND -------------
      const handleAnswer = async (userText: string) => {
        setAgentThinking(true);
        setMessages(prevMsgs => [...prevMsgs, { role: "candidate", content: userText }]);
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/interview/next`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              post, job_description, resumeData,
              questions,
              messages: [...messages, { role: "candidate", content: userText }],
              interview_type: interview.interviewType,
              time_left: EndTime - Date.now(),
              force_next,
              lastQuestionAnswered: lastQuestionFlag
            }),
          });
          if (!res.ok) throw new Error(`API returned ${res.status}`);
          const data = await res.json();
          const aiResponse = {
            role: "interviewer",
            content: data.data.AIResponse,
            question_id: data.data.question_id
          };
          setMessages(prevMsgs => [...prevMsgs, aiResponse]);
          setLastQuestionFlag(!!data.data.lastQuestion);

          if (data.data.endInterview) {
            const utterance = new SpeechSynthesisUtterance(data.data.AIResponse);
            utterance.onend = () => {
              toast.loading('Saving interview transcript...', { duration: 3000 });
              endInterview(true);
            };
            window.speechSynthesis.speak(utterance);
          } else {
            speak(data.data.AIResponse);
          }
        } catch (err) {
          setApiError("Interview agent is not working.");
        }
        setAgentThinking(false);
        setEndPending(false);
      };

      // --- CLEANUP ---
      const cleanup = () => {
        try {
          if (recognitionRef.current) recognitionRef.current.stop();
        } catch (e) { /* ignore */ }
        window.speechSynthesis.cancel();
        recognitionRef.current = null;
        // clear any timers/intervals used by the silence checker
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
        if (silenceCheckerRef.current) {
          clearInterval(silenceCheckerRef.current);
          silenceCheckerRef.current = null;
        }
        // reset helper refs
        lastSpokenAtRef.current = null;
        explicitStopRef.current = false;
      };

      const endInterview = async (auto = false) => {
        if (interviewEnded) return;
        setInterviewEnded(true);
        cleanup();

        const toastId = toast.loading('Saving interview transcript...');
        try {
          // Save transcript
          const transcriptRes = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}/update-transcript`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });

          if (!transcriptRes.ok) throw new Error('Failed to save transcript');
          
          // Generate and save feedback
          toast.loading('Generating interview feedback...', { id: toastId });
          const feedbackRes = await fetch(`${process.env.NEXT_PUBLIC_AGENT_API_URL}/api/feedback/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              post,
              jobDescription: interview.jobDescription,
              resume_data: interview.resumeData,
              transcript: messages,
              question_list: questions,
              interview_type: interview.interviewType
            }),
          });

          if (!feedbackRes.ok) throw new Error('Failed to generate feedback');
          const feedbackData = await feedbackRes.json();

          // Save feedback to database
          await fetch(`${process.env.NEXT_PUBLIC_URL}/api/interview/${id}/save-feedback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feedback: feedbackData.feedback }),
          });

          toast.success('Interview completed successfully!', { id: toastId });
          toast('Redirecting to dashboard...', { icon: '👋', duration: 2000 });
        } catch (err) {
          console.error(err);
          toast.error('Error completing interview', { id: toastId });
        }
        setTimeout(() => {
          router.push("/dashboard");
        }, auto ? 3000 : 500);
      };

      // Ref to the last message element for smooth scrolling
      const lastMessageRef = useRef<HTMLDivElement | null>(null);
      // Scroll to latest message smoothly whenever messages change
      useEffect(() => {
        if (messages.length === 0) return;
        // allow motion/layout to settle a tick
        const t = setTimeout(() => {
          lastMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
        return () => clearTimeout(t);
      }, [messages]);

      if (loading)
        return (
          <div className="flex h-screen items-center justify-center bg-black">
            <Spinner className="size-20 text-white" />
          </div>
        );

      return (
        <div className="flex flex-col h-screen bg-black text-white">
          {/* <InterviewHeader post={post as string} /> */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-col w-[380px] bg-zinc-950 border-r border-zinc-800 p-8 items-center justify-between">
              <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                  <div className={`w-40 h-40 rounded-full bg-zinc-900 border-2 flex items-center justify-center transition-all duration-300 ${
                    isMicOn ? 'border-white shadow-lg shadow-white/20 scale-105' : 'border-zinc-700'
                  }`}>
                    <User className="w-16 h-16 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  {isMicOn && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full shadow-lg">
                        <Mic className="w-4 h-4 animate-pulse" />
                        <span className="text-sm font-medium">Listening</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-3 max-w-xs">
                  <p className="text-base font-medium text-white">
                    {apiError
                      ? "System error occurred"
                      : endPending
                      ? "Finalizing interview..."
                      : isMicOn
                      ? "Speak clearly into your microphone"
                      : agentThinking
                      ? "AI is processing your response"
                      : "Your turn to respond"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {agentThinking ? "Please wait while the AI prepares the next question" : ""}
                  </p>
                </div>
              </div>
              <div className="w-full space-y-6">
                <div className="flex items-center justify-center gap-3 px-6 py-4 bg-zinc-900 rounded-xl border border-zinc-800">
                  <Clock className="w-5 h-5 text-zinc-400" />
                  <div className="text-center">
                    <div className="text-2xl font-bold tracking-tight">
                      {/* STOP AT 00:00, NEVER SHOW NEGATIVE */}
                    {String(Math.max(0, Math.floor(timeLeft / 60000))).padStart(1, '0')}:
                    {String(Math.max(0, Math.floor((timeLeft % 60000) / 1000))).padStart(2, '0')}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">Time Remaining</div>
                  </div>
                </div>
                <button
                  onClick={() => endInterview(false)}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white text-black rounded-xl font-medium hover:bg-zinc-200 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <PhoneOff className="w-5 h-5" />
                  End Interview
                </button>
              </div>
            </div>
            <div className="flex-1 flex flex-col bg-zinc-950">
              <div className="border-b border-zinc-800 px-8 py-6 bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <Bot className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">AI Interviewer</h2>
                    <p className="text-xs text-zinc-500">Powered by advanced AI technology</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isLast = idx === messages.length - 1;
                    return (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.16 }}
                        className={`flex ${msg.role === "candidate" ? "justify-end" : "justify-start"}`}
                        ref={isLast ? lastMessageRef : undefined}
                      >
                        <motion.div layout className={`max-w-[75%] rounded-2xl px-6 py-4 shadow-lg ${
                          msg.role === "interviewer"
                            ? "bg-white text-black"
                            : "bg-zinc-800 text-white border border-zinc-700"
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {msg.role === "interviewer" ? (
                              <Bot className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                            <span className="text-xs font-semibold uppercase tracking-wide opacity-70">
                              {msg.role === "interviewer" ? "AI Interviewer" : "You"}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {apiError && (
                  <div className="flex justify-center">
                    <div className="bg-red-950 border border-red-800 text-red-200 px-6 py-3 rounded-xl text-sm">
                      {apiError}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
