/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calculator, 
  MessageSquare, 
  BookOpen, 
  Trophy, 
  Send, 
  ChevronRight, 
  Loader2, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Menu,
  X,
  History,
  Sparkles,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from './lib/utils';
import { Logo } from './components/Logo';

// --- Types ---

interface Message {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface Problem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

type Tab = 'dashboard' | 'tutor' | 'practice';

// --- Components ---

const MathRenderer = ({ content }: { content: string }) => {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [nickname, setNickname] = useState('');
  const [userAge, setUserAge] = useState('');
  const [hasOnboarded, setHasOnboarded] = useState(false);

  // Tutor State
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Practice State
  const [topic, setTopic] = useState('Algebra');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [problems, setProblems] = useState<Problem[]>([]);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isTyping) return;

    const newMessage: Message = { role: 'user', parts: [{ text: userInput }] };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput, history: chatHistory }),
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const reader = response.body?.getReader();
      if (!reader) return;

      let modelResponse = '';
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const { text } = JSON.parse(data);
              modelResponse += text;
              setChatHistory(prev => {
                const updated = [...prev];
                updated[updated.length - 1].parts[0].text = modelResponse;
                return updated;
              });
            } catch (e) {
              // Ignore empty or malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setChatHistory(prev => [...prev, { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please try again.' }] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateProblems = async () => {
    setIsLoadingProblems(true);
    setProblems([]);
    setCurrentProblemIndex(0);
    setSelectedOption(null);
    setIsSubmitted(false);

    try {
      const resp = await fetch('/api/generate-problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty }),
      });
      const data = await resp.json();
      setProblems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingProblems(false);
    }
  };

  const handlePracticeSubmit = () => {
    if (selectedOption === null) return;
    setIsSubmitted(true);
  };

  const nextProblem = () => {
    if (currentProblemIndex < problems.length - 1) {
      setCurrentProblemIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    }
  };

  // Get recommended topics based on age
  const getRecommendedTopics = (ageStr: string) => {
    const age = parseInt(ageStr) || 0;
    if (age <= 8) {
      return [
        { title: "Addition", sub: "Basic Math", color: "from-blue-600 to-indigo-700", topic: "Addition" },
        { title: "Subtraction", sub: "Basic Math", color: "from-purple-600 to-pink-700", topic: "Subtraction" },
        { title: "Fun Counting", sub: "Logic", color: "from-emerald-600 to-teal-700", topic: "Arithmetic" }
      ];
    } else if (age <= 11) {
      return [
        { title: "Multiplication", sub: "Arithmetic", color: "from-blue-600 to-indigo-700", topic: "Multiplication" },
        { title: "Division", sub: "Arithmetic", color: "from-purple-600 to-pink-700", topic: "Division" },
        { title: "Shapes", sub: "Geometry", color: "from-emerald-600 to-teal-700", topic: "Geometry" }
      ];
    } else if (age <= 14) {
      return [
        { title: "Variables", sub: "Algebra", color: "from-blue-600 to-indigo-700", topic: "Algebra" },
        { title: "Angles", sub: "Geometry", color: "from-purple-600 to-pink-700", topic: "Geometry" },
        { title: "Word Logic", sub: "Word Problems", color: "from-emerald-600 to-teal-700", topic: "Word Problems" }
      ];
    } else if (age <= 18) {
      return [
        { title: "Functions", sub: "Algebra", color: "from-blue-600 to-indigo-700", topic: "Algebra" },
        { title: "Sine & Cosine", sub: "Trigonometry", color: "from-purple-600 to-pink-700", topic: "Geometry" },
        { title: "Probabilities", sub: "Statistics", color: "from-emerald-600 to-teal-700", topic: "Statistics" }
      ];
    } else {
      return [
        { title: "Derivatives", sub: "Calculus", color: "from-blue-600 to-indigo-700", topic: "Calculus" },
        { title: "Integration", sub: "Calculus", color: "from-purple-600 to-pink-700", topic: "Calculus" },
        { title: "Complex Stats", sub: "Statistics", color: "from-emerald-600 to-teal-700", topic: "Statistics" }
      ];
    }
  };

  const recommendations = getRecommendedTopics(userAge);

  if (!hasOnboarded) {
    return (
      <div className="h-screen bg-brand-black flex items-center justify-center p-6 selection:bg-brand-blue/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-brand-blue/5 opacity-20 pointer-events-none" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-12 relative z-10 text-center"
        >
          <div className="space-y-6">
            <Logo className="w-24 h-24 mx-auto" />
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white font-display tracking-tight">Initialize Mentor</h1>
              <p className="text-slate-400">Welcome to the Quantum Calculus Core. <br />Identify yourself to begin synchronization.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 block">Identity Signature (Full Name)</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full bg-brand-dark border-2 border-slate-800 text-white rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all placeholder:text-slate-700"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 block">Callsign (Nickname)</label>
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter your nickname..."
                  className="w-full bg-brand-dark border-2 border-slate-800 text-white rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all placeholder:text-slate-700"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 block">Biological Age</label>
                <input 
                  type="number" 
                  value={userAge}
                  onChange={(e) => setUserAge(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && userName.trim() && nickname.trim() && userAge && setHasOnboarded(true)}
                  placeholder="Enter your age..."
                  className="w-full bg-brand-dark border-2 border-slate-800 text-white rounded-2xl px-6 py-4 text-base focus:outline-none focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <button 
              onClick={() => userName.trim() && nickname.trim() && userAge && setHasOnboarded(true)}
              disabled={!userName.trim() || !nickname.trim() || !userAge}
              className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white py-5 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-4 shadow-[0_0_30px_rgba(59,130,246,0.25)] disabled:opacity-20 group"
            >
              Access Dashboard
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-brand-black text-slate-300 font-sans selection:bg-brand-blue/30">
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-brand-dark/80 rounded-lg shadow-md border border-slate-800 backdrop-blur-md"
        id="sidebar-toggle"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        className={cn(
          "fixed md:relative inset-y-0 left-0 w-64 bg-brand-dark/40 border-r border-slate-800/50 z-50 flex flex-col transition-transform duration-300 transform md:translate-x-0 backdrop-blur-2xl",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-8 flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <h1 className="font-bold text-xl tracking-tight text-white font-display">MathMentor</h1>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 mt-2">
          <SidebarItem 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
            icon={<BookOpen size={18} />} 
            label="Dashboard" 
            id="nav-dashboard"
          />
          <SidebarItem 
            active={activeTab === 'tutor'} 
            onClick={() => { setActiveTab('tutor'); setIsSidebarOpen(false); }}
            icon={<Sparkles size={18} />} 
            label="AI Tutor" 
            id="nav-tutor"
          />
          <SidebarItem 
            active={activeTab === 'practice'} 
            onClick={() => { setActiveTab('practice'); setIsSidebarOpen(false); }}
            icon={<Calculator size={18} />} 
            label="Practice" 
            id="nav-practice"
          />
        </nav>

        <div className="p-6">
          <div className="bg-brand-blue/5 rounded-2xl p-5 border border-brand-blue/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Zap size={40} />
            </div>
            <h3 className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-3">Today's Progress</h3>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                className="h-full bg-brand-blue shadow-[0_0_10px_rgba(59,130,246,0.5)]"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-3 font-medium flex items-center gap-1.5">
              <span className="text-brand-blue font-bold">13/20</span> active targets reached
            </p>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 border-b border-slate-800/40 bg-brand-black/40 backdrop-blur-md flex items-center justify-between px-10 sticky top-0 z-30">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] font-display">
            {activeTab}
          </h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-3 py-1.5 rounded-full text-[10px] font-bold border border-brand-blue/20">
              <Trophy size={11} />
              <span className="tracking-widest">1,240 XP</span>
            </div>
            <div className="w-8 h-8 rounded-full border border-slate-800 overflow-hidden bg-brand-dark p-0.5">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`} alt="User" className="rounded-full" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="max-w-5xl mx-auto space-y-12"
              >
                <section>
                  <h1 className="text-4xl font-bold text-white mb-3 font-display">Welcome back, {nickname || userName}!</h1>
                  <p className="text-slate-400 text-lg">Your focus today is <span className="text-brand-blue font-medium italic">{recommendations[0].title}</span> for {userAge}-year-olds.</p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard label="Accuracy" value="94%" sub="Total avg" icon={<CheckCircle2 className="text-emerald-400" />} />
                  <StatCard label="Streak" value="12 Days" sub="Personal best" icon={<History className="text-orange-400" />} />
                  <StatCard label="Rank" value="#4" sub="In your class" icon={<Trophy className="text-amber-400" />} />
                </div>

                <section>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
                      <Sparkles size={20} className="text-brand-blue" />
                      Recommended for You
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendations.map((rec, i) => (
                      <TopicCard 
                        key={i}
                        title={rec.title} 
                        sub={rec.sub} 
                        color={rec.color} 
                        onClick={() => { setTopic(rec.topic); setActiveTab('practice'); }} 
                      />
                    ))}
                  </div>
                </section>

                <section className="bg-brand-dark rounded-[2.5rem] p-12 text-white relative overflow-hidden group border border-slate-800">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-[10px] font-bold border border-brand-blue/20 mb-6 uppercase tracking-widest">
                      Challenge Mode
                    </div>
                    <h2 className="text-3xl font-bold mb-4 font-display">Ready for the Finals?</h2>
                    <p className="text-slate-400 mb-8 max-w-sm text-base leading-relaxed">We've compiled 25 complex problems matching your recent study history.</p>
                    <button 
                      onClick={() => setActiveTab('practice')}
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                      id="challenge-btn"
                    >
                      Begin Assessment
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  <div className="absolute -right-16 -bottom-16 text-slate-800 opacity-20 group-hover:text-brand-blue group-hover:opacity-10 transition-all duration-700">
                    <Logo className="w-80 h-80" />
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === 'tutor' && (
              <motion.div 
                key="tutor"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full flex flex-col max-w-4xl mx-auto bg-brand-dark rounded-[2rem] border border-slate-800 overflow-hidden shadow-2xl"
              >
                <div className="p-6 border-b border-slate-800 bg-brand-dark/50 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue border border-brand-blue/20">
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white font-display text-lg tracking-tight">AI Math Mentor</h3>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Quantum Core Online</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                  {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40 p-12">
                      <div className="w-20 h-20 bg-brand-blue/5 rounded-full flex items-center justify-center border border-brand-blue/10">
                        <MessageSquare size={32} strokeWidth={1.5} className="text-brand-blue" />
                      </div>
                      <div className="max-w-sm space-y-2">
                        <h4 className="text-white font-bold text-xl font-display">Start a Conversation</h4>
                        <p className="text-sm">I can explain any math concept or help solve specific problems step-by-step.</p>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-center mt-4">
                        <QuickAction onClick={() => setUserInput("Explain Taylor Series")} label="Explain Taylor Series" />
                        <QuickAction onClick={() => setUserInput("Help me factor 2x² + 7x + 3")} label="Factor 2x² + 7x + 3" />
                      </div>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[80%] px-6 py-5 rounded-3xl",
                        msg.role === 'user' 
                          ? "bg-brand-blue text-white rounded-tr-none shadow-lg shadow-brand-blue/10 border border-brand-blue/20" 
                          : "bg-slate-800/40 text-slate-200 rounded-tl-none border border-slate-700/50 backdrop-blur-sm"
                      )}>
                        <MathRenderer content={msg.parts[0].text} />
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/40 px-6 py-5 rounded-3xl rounded-tl-none border border-slate-700/50 flex items-center gap-3">
                        <div className="flex gap-1">
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-blue" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mentor Processing</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-brand-black/40 backdrop-blur-xl border-t border-slate-800">
                  <div className="relative">
                    <textarea 
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Paste a problem or ask a question..."
                      className="w-full bg-slate-900/50 border border-slate-700 hover:border-slate-500 rounded-2xl px-6 py-5 pr-16 text-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/5 focus:border-brand-blue transition-all resize-none h-28 text-slate-100 placeholder:text-slate-600 shadow-inner no-scrollbar"
                      id="chat-input"
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={!userInput.trim() || isTyping}
                      className="absolute right-4 bottom-4 p-3.5 bg-brand-blue text-white rounded-xl hover:bg-brand-blue/90 disabled:opacity-30 disabled:grayscale transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      id="send-btn"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'practice' && (
              <motion.div 
                key="practice"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="max-w-4xl mx-auto"
              >
                {problems.length === 0 ? (
                  <div className="bg-brand-dark rounded-[2.5rem] p-16 border border-slate-800 shadow-2xl text-center space-y-10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-brand-blue/5 opacity-20 pointer-events-none" />
                    <div className="relative z-10 space-y-10">
                      <div className="w-24 h-24 bg-brand-black rounded-[2rem] border border-slate-800 flex items-center justify-center text-brand-blue mx-auto shadow-2xl">
                        <Calculator size={40} />
                      </div>
                      <div className="space-y-3">
                        <h2 className="text-4xl font-bold text-white font-display">Lab Practice</h2>
                        <p className="text-slate-400 text-lg max-w-sm mx-auto">Generate synthesized problem sets tailored to your skill level.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
                        <div className="text-left space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 mb-2 block">Discipline</label>
                          <select 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-brand-black border border-slate-700 text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/10 appearance-none cursor-pointer hover:border-brand-blue/50 transition-colors"
                          >
                            <option>Addition</option>
                            <option>Subtraction</option>
                            <option>Multiplication</option>
                            <option>Division</option>
                            <option>Word Problems</option>
                            <option>Algebra</option>
                            <option>Geometry</option>
                            <option>Calculus</option>
                            <option>Statistics</option>
                          </select>
                        </div>
                        <div className="text-left space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-4 mb-2 block">Complexity</label>
                          <select 
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            className="w-full bg-brand-black border border-slate-700 text-white rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand-blue/10 appearance-none cursor-pointer hover:border-brand-blue/50 transition-colors"
                          >
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={generateProblems}
                        disabled={isLoadingProblems}
                        className="bg-brand-blue hover:bg-brand-blue/90 text-white px-12 py-5 rounded-2xl font-bold text-base transition-all flex items-center gap-4 mx-auto shadow-[0_0_30px_rgba(59,130,246,0.25)] group"
                        id="generate-problems-btn"
                      >
                        {isLoadingProblems ? <Loader2 size={24} className="animate-spin" /> : <RefreshCcw size={22} className="group-hover:rotate-180 transition-transform duration-500" />}
                        {isLoadingProblems ? "Synthesizing Problems..." : "Initialize Practice Session"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between px-4">
                       <div className="flex items-center gap-4">
                         <div className="bg-brand-blue/10 px-4 py-1.5 rounded-full border border-brand-blue/20">
                           <span className="text-xs font-bold text-brand-blue tracking-[0.1em]">UNIT {currentProblemIndex + 1} / {problems.length}</span>
                         </div>
                       </div>
                       <button onClick={() => setProblems([])} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
                         <X size={12} />
                         Terminate Session
                       </button>
                    </div>

                    <motion.div 
                      key={currentProblemIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-brand-dark rounded-[2.5rem] p-10 border border-slate-800 shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue shadow-[0_0_15px_rgba(59,130,246,0.3)] opacity-50" />
                      
                      <div className="text-2xl font-medium text-white mb-10 p-8 bg-brand-black/60 rounded-3xl border border-slate-800 backdrop-blur-sm">
                        <MathRenderer content={problems[currentProblemIndex].question} />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {problems[currentProblemIndex].options.map((option, i) => (
                          <button
                            key={i}
                            onClick={() => !isSubmitted && setSelectedOption(i)}
                            className={cn(
                              "text-left px-7 py-5 rounded-2xl border-2 transition-all flex items-center justify-between group h-full",
                              selectedOption === i 
                                ? "border-brand-blue bg-brand-blue/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                                : "border-slate-800 hover:border-slate-700 bg-brand-black/40",
                              isSubmitted && i === problems[currentProblemIndex].correctIndex && "border-emerald-500 bg-emerald-500/5",
                              isSubmitted && selectedOption === i && i !== problems[currentProblemIndex].correctIndex && "border-rose-500 bg-rose-500/5"
                            )}
                          >
                            <span className={cn(
                              "text-sm font-semibold tracking-tight",
                              selectedOption === i ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                            )}>
                              {option}
                            </span>
                            
                            <div className={cn(
                              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-4",
                              selectedOption === i ? "border-brand-blue bg-brand-blue text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "border-slate-700 bg-brand-black"
                            )}>
                              {isSubmitted && i === problems[currentProblemIndex].correctIndex && <CheckCircle2 size={12} strokeWidth={3} />}
                              {isSubmitted && selectedOption === i && i !== problems[currentProblemIndex].correctIndex && <XCircle size={12} strokeWidth={3} />}
                              {!isSubmitted && selectedOption === i && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]" />}
                            </div>
                          </button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {isSubmitted && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            style={{ overflow: 'hidden' }}
                            className="mt-10 p-8 bg-brand-black rounded-3xl border border-slate-800"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className={cn(
                                "p-2 rounded-lg",
                                selectedOption === problems[currentProblemIndex].correctIndex ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                              )}>
                                {selectedOption === problems[currentProblemIndex].correctIndex ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                              </div>
                              <h4 className="text-xs font-bold uppercase tracking-[0.2em]">
                                {selectedOption === problems[currentProblemIndex].correctIndex ? (
                                  <span className="text-emerald-400">Target Neutralized</span>
                                ) : (
                                  <span className="text-rose-400">Deviation Detected</span>
                                )}
                              </h4>
                            </div>
                            <div className="text-sm text-slate-300 leading-relaxed border-l-2 border-slate-700 pl-6 py-2">
                              <MathRenderer content={problems[currentProblemIndex].explanation} />
                            </div>
                            
                            <button 
                              onClick={currentProblemIndex < problems.length - 1 ? nextProblem : () => setProblems([])}
                              className="w-full mt-8 bg-white text-brand-black py-4 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
                              id="next-btn"
                            >
                              {currentProblemIndex < problems.length - 1 ? "Advance Phase" : "Completion Protocol"}
                              <ChevronRight size={18} />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {!isSubmitted && (
                        <button
                          onClick={handlePracticeSubmit}
                          disabled={selectedOption === null}
                          className="w-full mt-10 bg-brand-blue text-white py-5 rounded-2xl font-bold text-base hover:bg-brand-blue/90 disabled:opacity-20 transition-all shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                          id="submit-practice-btn"
                        >
                          Submit Response
                        </button>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- Sub-components ---

function SidebarItem({ icon, label, active, onClick, id }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void, id: string }) {
  return (
    <button 
      onClick={onClick}
      id={id}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all group relative",
        active 
          ? "text-brand-blue bg-brand-blue/5 border border-brand-blue/10" 
          : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/20"
      )}
    >
      <span className={cn(
        "transition-colors",
        active ? "text-brand-blue" : "text-slate-600 group-hover:text-brand-blue"
      )}>{icon}</span>
      {label}
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-5 bg-brand-blue rounded-r-full shadow-[0_0_10px_rgba(59,130,246,0.8)]"
        />
      )}
    </button>
  );
}

function QuickAction({ onClick, label }: { onClick: () => void, label: string }) {
  return (
    <button 
      onClick={onClick} 
      className="text-[10px] font-bold text-slate-500 hover:text-brand-blue hover:bg-brand-blue/5 px-4 py-2 rounded-full transition-all border border-slate-800 hover:border-brand-blue/30 uppercase tracking-widest backdrop-blur-sm"
    >
      "{label}"
    </button>
  )
}

function StatCard({ label, value, sub, icon }: { label: string, value: string, sub: string, icon: React.ReactNode }) {
  return (
    <div className="bg-brand-dark p-8 rounded-[2rem] border border-slate-800 shadow-xl flex flex-col justify-between h-44 group hover:border-brand-blue/30 transition-all duration-500">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{label}</span>
        <div className="p-2.5 bg-brand-black rounded-xl border border-slate-800 group-hover:bg-brand-blue/10 group-hover:border-brand-blue/20 group-hover:text-brand-blue transition-all">
          {icon}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-white font-display tracking-tight">{value}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">{sub}</div>
      </div>
    </div>
  );
}

function TopicCard({ title, sub, color, onClick }: { title: string, sub: string, color: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "bg-brand-dark p-6 rounded-[2rem] border border-slate-800 shadow-xl text-left hover:border-brand-blue hover:shadow-brand-blue/5 transition-all group overflow-hidden relative"
      )}
    >
       <div className={cn("inline-flex w-12 h-12 rounded-2xl mb-6 items-center justify-center text-white bg-gradient-to-br shadow-lg", color)}>
         <BookOpen size={22} />
       </div>
       <h4 className="text-lg font-bold text-white group-hover:text-brand-blue transition-colors font-display tracking-tight">{title}</h4>
       <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>
       
       <div className="mt-8 flex items-center text-[10px] font-bold text-brand-blue gap-2 opacity-100 uppercase tracking-[0.2em]">
         Initialize <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
       </div>

       <div className={cn("absolute -right-4 -bottom-4 w-20 h-20 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity bg-gradient-to-br rounded-full", color)} />
    </button>
  );
}
