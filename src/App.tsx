/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, Component } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Download, Play, Pause, Info, X, ChevronUp, Share2, Github, Instagram, AlertCircle } from 'lucide-react';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Celestial Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] flex items-center justify-center p-6 text-center">
          <div className="glass-panel p-12 rounded-3xl max-w-md">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-light tracking-widest mb-4 uppercase">System Failure</h2>
            <p className="text-white/60 mb-8">The celestial mapping engine has encountered a critical error. Please refresh the observatory.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all uppercase tracking-widest text-sm"
            >
              Refresh Observatory
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Types ---
interface Star {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
}

interface ConstellationData {
  constellation_name: string;
  mythology: string;
  star_names: string[];
  culture_origin: string;
  scientific_classification: string;
  astrological_significance: string;
}

// --- Constants ---
const ACCENT_GOLD = '#d4af37';
const ACCENT_CYAN = '#4fd1ed';
const STAR_COLORS = ['#ffffff', '#fff4e6', '#e6f2ff', '#fff0f0', '#f0f8ff'];

export default function App() {
  const [stars, setStars] = useState<Star[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [story, setStory] = useState<ConstellationData | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeProfile, setActiveProfile] = useState<'aditya' | 'dhruv' | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const handleGlobalClick = () => setActiveProfile(null);
    window.addEventListener('click', handleGlobalClick);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // --- Audio Engine ---
  const initAudio = () => {
    if (audioContextRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioContextRef.current = ctx;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.05;
    masterGain.connect(ctx.destination);
    gainNodeRef.current = masterGain;

    const createPad = (freq: number, type: OscillatorType = 'sine') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.value = 0;
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05 + Math.random() * 0.05;
      lfoGain.gain.value = 0.01;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);
      lfo.start();

      return { osc, g };
    };

    const pads = [
      createPad(55),   // A1
      createPad(110),  // A2
      createPad(164.81), // E3
      createPad(220),  // A3
    ];

    pads.forEach(({ g }) => {
      g.gain.setTargetAtTime(0.03, ctx.currentTime, 3);
    });
  };

  const toggleAudio = () => {
    if (!audioContextRef.current) {
      initAudio();
      setIsPlaying(true);
    } else {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
        setIsPlaying(true);
      } else {
        audioContextRef.current.suspend();
        setIsPlaying(false);
      }
    }
  };

  // --- AI Integration ---
  const generateStory = async () => {
    if (stars.length < 5) return;
    setIsGenerating(true);
    setStory(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have mapped a new celestial pattern with ${stars.length} stars. 
        Coordinates: ${JSON.stringify(stars.map(s => ({ x: s.x.toFixed(2), y: s.y.toFixed(2) })))}. 
        Provide a sophisticated, scholarly, and poetic mythology for this constellation. 
        The tone should be like a mix of Carl Sagan and ancient Greek historians.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              constellation_name: { type: Type.STRING, description: "A sophisticated Latin or Greek-inspired name" },
              mythology: { type: Type.STRING, description: "A detailed mythology in 3-4 paragraphs" },
              star_names: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Individual star names (e.g., Alpha Centauri style)" },
              culture_origin: { type: Type.STRING, description: "The lost civilization that first mapped this" },
              scientific_classification: { type: Type.STRING, description: "A fictional astronomical classification (e.g., Type II Nebula Cluster)" },
              astrological_significance: { type: Type.STRING, description: "What it means for those born under its influence" }
            },
            required: ["constellation_name", "mythology", "star_names", "culture_origin", "scientific_classification", "astrological_significance"]
          }
        }
      });

      const data = JSON.parse(response.text);
      setStory(data);
      
      if (gainNodeRef.current && audioContextRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(0.15, audioContextRef.current.currentTime, 2);
      }

      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.7 },
        colors: [ACCENT_GOLD, ACCENT_CYAN, '#ffffff'],
        disableForReducedMotion: true
      });
    } catch (error) {
      console.error("Celestial mapping failed:", error);
      setError("The stars are clouded. Please try mapping again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Handlers ---
  const handleCanvasClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (story) return;
    
    // Auto-start audio
    if (!isPlaying && !audioContextRef.current) {
      initAudio();
      setIsPlaying(true);
    } else if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
      setIsPlaying(true);
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    const newStar: Star = {
      id: Math.random().toString(36).substr(2, 9),
      x,
      y,
      size: 2 + Math.random() * 4,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
    };

    setStars(prev => [...prev, newStar]);
    if (showInstructions) setShowInstructions(false);
  };

  const clearCanvas = () => {
    setStars([]);
    setStory(null);
    setShowInstructions(true);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(0.05, audioContextRef.current.currentTime, 2);
    }
  };

  const downloadConstellation = async () => {
    if (!canvasRef.current) return;
    try {
      const dataUrl = await toPng(canvasRef.current, { quality: 1.0 });
      const link = document.createElement('a');
      link.download = `${story?.constellation_name || 'celestial_map'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // --- Components ---
  const StarElement = ({ star }: { star: Star; key?: string }) => (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="absolute rounded-full star-glow"
      style={{
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: `${star.size}px`,
        height: `${star.size}px`,
        backgroundColor: star.color,
        boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        '--glow-color': star.color
      } as any}
    />
  );

  const TypewriterText = ({ text }: { text: string }) => {
    const words = text.split(' ');
    return (
      <>
        {words.map((word, i) => (
          <span
            key={i}
            className="typewriter-word"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            {word}&nbsp;
          </span>
        ))}
      </>
    );
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-cyan-500/30">
        {/* Toast Notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 glass-panel rounded-full border-red-500/50 flex items-center gap-3"
            >
              <AlertCircle size={16} className="text-red-400" />
              <span className="text-sm font-light tracking-wide">{error}</span>
              <button onClick={() => setError(null)} className="ml-2 hover:text-white/60">
                <X size={14} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 p-4 md:p-8 z-50 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] uppercase text-white/90">
            Celestial <span className="text-cyan-400 font-semibold">Mapper</span>
          </h1>
          <div className="h-[1px] w-full bg-gradient-to-r from-cyan-500/50 to-transparent mt-1" />
        </div>
        
        <div className="flex gap-2 md:gap-4">
          <button 
            onClick={toggleAudio}
            className="w-10 h-10 md:w-12 md:h-12 glass-card rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
            title={isPlaying ? "Mute Atmosphere" : "Unmute Atmosphere"}
          >
            {isPlaying ? <Pause size={18} className="text-cyan-400" /> : <Play size={18} />}
          </button>
          <button 
            onClick={() => setShowInstructions(true)}
            className="w-10 h-10 md:w-12 md:h-12 glass-card rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
          >
            <Info size={18} />
          </button>
        </div>
      </nav>

      {/* Main Sky Canvas */}
      <main 
        ref={canvasRef}
        className="relative w-full h-screen overflow-hidden bg-[#050508] cursor-crosshair touch-none"
        onClick={handleCanvasClick}
        onTouchStart={handleCanvasClick}
      >
        {/* Deep Space Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#101025_0%,#050508_100%)]" />
        <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

        {/* Background Twinkling Stars */}
        {[...Array(isMobile ? 50 : 150)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40 star-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 1.5 + 0.5}px`,
              height: `${Math.random() * 1.5 + 0.5}px`,
              '--duration': `${3 + Math.random() * 5}s`
            } as any}
          />
        ))}

        {/* Instructions Overlay */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-40 p-6"
            >
              <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-lg text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                <h2 className="text-2xl md:text-3xl font-light tracking-widest mb-6 uppercase">Map the Void</h2>
                <p className="text-white/60 leading-relaxed mb-8 font-light">
                  Touch the darkness to anchor new stars. Once five points are established, the engine will synthesize the lost mythologies of your pattern.
                </p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowInstructions(false); }}
                  className="px-8 py-3 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded-full transition-all uppercase tracking-widest text-sm"
                >
                  Begin Mapping
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Placed Stars */}
        {stars.map(star => (
          <StarElement key={star.id} star={star} />
        ))}

        {/* Constellation Lines */}
        {stars.length >= 5 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 3, ease: "easeInOut" }}
              d={`M ${stars.map(s => `${(s.x * window.innerWidth) / 100},${(s.y * window.innerHeight) / 100}`).join(' L ')} Z`}
              fill="none"
              stroke={ACCENT_CYAN}
              strokeWidth="0.5"
              strokeDasharray="4,8"
            />
          </svg>
        )}

        {/* Mapping Controls */}
        <div className="absolute bottom-12 left-0 right-0 z-50 flex flex-col items-center gap-6 px-6">
          <AnimatePresence>
            {stars.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-wrap justify-center gap-3"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); clearCanvas(); }}
                  className="h-12 px-6 glass-card rounded-full flex items-center gap-2 hover:bg-white/10 transition-all text-sm uppercase tracking-widest"
                >
                  <Trash2 size={16} className="text-red-400" />
                  Reset
                </button>

                {stars.length >= 5 && !story && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); generateStory(); }}
                    disabled={isGenerating}
                    className={`h-12 px-8 bg-cyan-500 text-black rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-semibold text-sm uppercase tracking-widest disabled:opacity-50 ${!isGenerating ? 'pulse-subtle' : ''}`}
                  >
                    {isGenerating ? (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Analyzing...
                      </div>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Synthesize Myth
                      </>
                    )}
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {stars.length > 0 && !story && (
            <div className="px-4 py-1.5 glass-card rounded-full text-[10px] uppercase tracking-[0.2em] text-white/40">
              {stars.length} Anchors • {stars.length < 5 ? `${5 - stars.length} more required` : 'Ready for synthesis'}
            </div>
          )}
        </div>

        {/* Professional Story Panel */}
        <AnimatePresence>
          {story && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 120 }}
              className="absolute bottom-0 left-0 right-0 h-[85vh] md:h-[75vh] z-[60]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full glass-panel rounded-t-[3rem] border-t border-white/20 overflow-hidden flex flex-col">
                {/* Drag Handle / Header */}
                <div className="p-6 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                      <Sparkles size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif italic tracking-wide">
                        {story.constellation_name}
                      </h2>
                      <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">
                        {story.scientific_classification}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={downloadConstellation} className="p-3 glass-card rounded-full hover:bg-white/10 transition-all">
                      <Download size={20} />
                    </button>
                    <button onClick={clearCanvas} className="p-3 glass-card rounded-full hover:bg-white/10 transition-all">
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12">
                  <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Story */}
                    <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-6 text-lg md:text-xl font-serif leading-relaxed text-white/80 italic">
                        <TypewriterText text={story.mythology} />
                      </div>
                      
                      <div className="pt-8 border-t border-white/5">
                        <h3 className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-4">Astrological Significance</h3>
                        <p className="text-white/60 font-light leading-relaxed">
                          {story.astrological_significance}
                        </p>
                      </div>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-8">
                      <div className="glass-card p-6 rounded-2xl space-y-6">
                        <div>
                          <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Discovery Origin</h3>
                          <p className="text-sm font-medium text-cyan-400">{story.culture_origin}</p>
                        </div>
                        
                        <div>
                          <h3 className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Stellar Nomenclature</h3>
                          <div className="flex flex-wrap gap-2">
                            {story.star_names.map((name, i) => (
                              <span key={i} className="px-3 py-1 bg-white/5 rounded-md text-[11px] border border-white/5">
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: story.constellation_name,
                              text: `I discovered the ${story.constellation_name} constellation.`,
                              url: window.location.href
                            });
                          }
                        }}
                        className="w-full py-4 glass-card rounded-xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all text-xs uppercase tracking-widest"
                      >
                        <Share2 size={16} />
                        Share Discovery
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-4 right-8 z-50">
        <div className="flex items-center gap-4">
          <div className="h-[1px] w-12 bg-white/20 hidden md:block" />
          <p className="text-[10px] uppercase tracking-[0.4em] font-light text-white/40">
            Built by{' '}
            <span 
              className={`cursor-pointer transition-colors ${activeProfile === 'aditya' ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              onClick={(e) => { e.stopPropagation(); setActiveProfile(activeProfile === 'aditya' ? null : 'aditya'); }}
            >
              Aditya
            </span>
            {' '}and{' '}
            <span 
              className={`cursor-pointer transition-colors ${activeProfile === 'dhruv' ? 'text-cyan-400' : 'hover:text-cyan-400'}`}
              onClick={(e) => { e.stopPropagation(); setActiveProfile(activeProfile === 'dhruv' ? null : 'dhruv'); }}
            >
              Dhruv
            </span>
          </p>
          
          <AnimatePresence>
            {activeProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute bottom-12 right-0 glass-panel p-4 rounded-2xl flex gap-6 border border-cyan-500/30"
                onClick={(e) => e.stopPropagation()}
              >
                {activeProfile === 'aditya' ? (
                  <>
                    <a href="https://github.com/adimestry" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all flex flex-col items-center gap-1">
                      <Github size={18} />
                      <span className="text-[8px] uppercase tracking-widest">GitHub</span>
                    </a>
                    <a href="https://www.instagram.com/aditya_mestry_x007/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-pink-400 transition-all flex flex-col items-center gap-1">
                      <Instagram size={18} />
                      <span className="text-[8px] uppercase tracking-widest">Insta</span>
                    </a>
                  </>
                ) : (
                  <>
                    <a href="https://github.com/dhruvkasar" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-all flex flex-col items-center gap-1">
                      <Github size={18} />
                      <span className="text-[8px] uppercase tracking-widest">GitHub</span>
                    </a>
                    <a href="https://www.instagram.com/dhruvvkasar/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-pink-400 transition-all flex flex-col items-center gap-1">
                      <Instagram size={18} />
                      <span className="text-[8px] uppercase tracking-widest">Insta</span>
                    </a>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
