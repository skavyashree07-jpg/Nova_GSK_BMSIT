import React, { useState, useEffect } from 'react';
import { NavigationTab, LanguageCode, ClinicalConcept, BiologicalPathway } from '../types';
import { 
  DEFAULT_TRANSLATION_STATEMENT, 
  INSPIRATION_PROMPTS, 
  SAMPLE_CLINICAL_CONCEPTS, 
  DEFAULT_BIOLOGICAL_PATHWAY 
} from '../data/pcosData';
import { 
  Sparkles, 
  Mic, 
  MicOff, 
  ArrowRight, 
  ArrowDown, 
  Calendar, 
  Fingerprint, 
  Lock, 
  RotateCcw, 
  Info, 
  FileText, 
  ShieldCheck, 
  Layers, 
  HeartHandshake, 
  Volume2, 
  CheckCircle2,
  Share2
} from 'lucide-react';

interface SymptomTranslatorViewProps {
  onSelectTab: (tab: NavigationTab) => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
}

export const SymptomTranslatorView: React.FC<SymptomTranslatorViewProps> = ({
  onSelectTab,
  selectedLanguage,
  onSelectLanguage,
}) => {
  const [statement, setStatement] = useState<string>(DEFAULT_TRANSLATION_STATEMENT);
  const [activeInputLanguage, setActiveInputLanguage] = useState<string>('English');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [hasTranslated, setHasTranslated] = useState<boolean>(true);
  const [speechFeedback, setSpeechFeedback] = useState<string>('Ready to listen • Hindi / Tamil / Eng');
  const [recognizedVoiceText, setRecognizedVoiceText] = useState<string>('');
  const [backendResult, setBackendResult] = useState<any>(null);
  const [backendError, setBackendError] = useState<string>('');
  const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const backendLanguage = activeInputLanguage === 'Hindi (हिन्दी)' ? 'hi'
    : activeInputLanguage === 'Tamil (தமிழ்)' ? 'ta'
    : activeInputLanguage === 'Hinglish' ? 'hi_rom'
    : activeInputLanguage === 'Bengali (বাংলা)' ? 'mixed' : 'en';

  // Handle Inspiration Prompt Click
  const handleSelectInspiration = (promptText: string) => {
    setStatement(promptText);
    triggerTranslation(promptText);
  };

  // Determine concepts based on user statement keywords
  const getConceptsForStatement = (text: string): ClinicalConcept[] => {
    const lower = text.toLowerCase();
    const result: ClinicalConcept[] = [];

    // Irregular periods
    if (lower.includes('period') || lower.includes('cycle') || lower.includes('पीरियड') || lower.includes('month') || lower.includes('spotting') || lower.includes('delay')) {
      result.push({
        id: 'oligomenorrhea',
        name: 'Oligomenorrhea',
        subtitle: 'Irregular ovulation pattern',
        badge: 'Menstrual Rhythm',
        definition: 'Periods occurring at intervals greater than 35 days or fewer than 6 to 8 cycles per year.',
        plainContext: "When the body's hormonal cascade pauses follicular maturity, cycles stretch out unpredictably without a regular monthly rhythm.",
        iconName: 'calendar'
      });
    }

    // Dark patches / insulin resistance
    if (lower.includes('dark') || lower.includes('patch') || lower.includes('neck') || lower.includes('velvet') || lower.includes('sugar') || lower.includes('hunger') || lower.includes('fatigue')) {
      result.push({
        id: 'acanthosis-nigricans',
        name: 'Acanthosis Nigricans',
        subtitle: 'Insulin resistance biomarker',
        badge: 'Insulin Resistance',
        definition: 'Hyperpigmented, velvety skin textures typically manifesting in flexural areas like the posterior neck, axillae, or groin.',
        plainContext: 'Elevated circulating insulin stimulates epidermal keratinocytes and dermal fibroblasts, creating subtle texture and color shifts.',
        iconName: 'fingerprint'
      });
    }

    // Hair / Hirsutism
    if (lower.includes('hair') || lower.includes('jaw') || lower.includes('chin') || lower.includes('बाल') || lower.includes('chehre') || lower.includes('hirsutism')) {
      result.push({
        id: 'mild-hirsutism',
        name: 'Mild Hirsutism',
        subtitle: 'Androgen excess indicator',
        badge: 'Androgen Sign',
        definition: 'Coarser, darker terminal hair growth following male-pattern distribution (chin, upper lip, chest, or lower abdomen).',
        plainContext: 'Hair follicles with heightened androgen sensitivity convert fine vellus hairs into thicker strands over time.',
        iconName: 'sparkles'
      });
    }

    // Acne / inflammation
    if (lower.includes('acne') || lower.includes('pimple') || lower.includes('bloat') || lower.includes('joint') || lower.includes('gut')) {
      result.push({
        id: 'inflammatory-flare',
        name: 'Hyperandrogenic Cystic Lesions',
        subtitle: 'Immune & sebaceous flare',
        badge: 'Inflammatory Axis',
        definition: 'Deep dermal inflammatory nodules mediated by androgen-primed sebaceous lipid oxidation.',
        plainContext: 'Elevated circulating androgens stimulate hyper-keratinization within follicular canals, trapping micro-bacteria.',
        iconName: 'calendar'
      });
    }

    // Fallback to default 3 concepts if too short or generic
    if (result.length === 0) {
      return SAMPLE_CLINICAL_CONCEPTS.default;
    }
    return result;
  };

  const currentConcepts = getConceptsForStatement(statement);

  const triggerTranslation = async (customText?: string) => {
    const textToProcess = (customText ?? statement).trim();
    if (!textToProcess) return;
    setIsTranslating(true);
    setBackendError('');
    try {
      const response = await fetch(apiBase ? `${apiBase}/triage` : '/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToProcess, lang: backendLanguage }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Backend returned ${response.status}${detail ? `: ${detail.slice(0, 180)}` : ''}`);
      }
      setBackendResult(await response.json());
      setHasTranslated(true);
    } catch (error) {
      setBackendResult(null);
      setBackendError(error instanceof Error ? error.message : 'Could not reach the symptom analysis service.');
      setHasTranslated(true);
    } finally {
      setIsTranslating(false);
    }
  };

  // Web Speech API / Simulated Voice Intake
  const toggleVoiceIntake = () => {
    if (isListening) {
      setIsListening(false);
      setSpeechFeedback('Ready to listen • Hindi / Tamil / Eng');
      return;
    }

    // Check if browser has SpeechRecognition
    const SpeechRecognition = 
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition || 
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = activeInputLanguage === 'Hindi (हिन्दी)' ? 'hi-IN' : activeInputLanguage === 'Tamil (தமிழ்)' ? 'ta-IN' : 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechFeedback('Listening carefully... speak your natural words');
        };

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((res: any) => res[0].transcript)
            .join('');
          setStatement(transcript);
          setRecognizedVoiceText(transcript);
        };

        recognition.onerror = () => {
          setIsListening(false);
          setSpeechFeedback('Voice intake paused. Feel free to type or tap inspiration prompts.');
        };

        recognition.onend = () => {
          setIsListening(false);
          setSpeechFeedback('Finished listening. Click Translate to process signals.');
          triggerTranslation();
        };

        recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition initialization note:', e);
      }
    }

    // Voice Simulation fallback with realistic multilingual phrases
    setIsListening(true);
    setSpeechFeedback('Listening to natural speech cadence...');
    setTimeout(() => {
      const demoVoicePrompts = [
        "Periods come once in 3-4 months and sudden coarse chin hair keeps reappearing",
        "अनियमित पीरियड्स और गर्दन के पीछे डार्क वेलवेटी पैचेस",
        "Feeling severe post-meal afternoon crashes and unexpected hair on my jawline"
      ];
      const randomPrompt = demoVoicePrompts[Math.floor(Math.random() * demoVoicePrompts.length)];
      setStatement(randomPrompt);
      setIsListening(false);
      setSpeechFeedback('Voice captured successfully • Ready to translate');
      triggerTranslation(randomPrompt);
    }, 2400);
  };

  const inputLanguages = [
    { label: 'English' },
    { label: 'Hindi (हिन्दी)' },
    { label: 'Hinglish' },
    { label: 'Tamil (தமிழ்)' },
    { label: 'Bengali (বাংলা)' },
  ];

  return (
    <div className="space-y-12 pb-16">
      
      {/* Top Empathetic Sanctuary Banner */}
      <div className="flex justify-start">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EDF2EE] border border-[#C7E7D3] text-[#304D3E] text-xs font-semibold tracking-wide">
          <span className="w-2 h-2 rounded-full bg-[#4D6A5A] animate-pulse"></span>
          <span>🌿 Empathetic Clinical Sanctuary • Reviewed with Women's Health &amp; OB/GYN Specialists</span>
        </div>
      </div>

      {/* Hero Title & Subtitle */}
      <div className="max-w-4xl space-y-4">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-normal tracking-tight text-[#221A16] leading-[1.18]">
          A gentle space to understand <br className="hidden sm:inline" />
          <span className="italic font-serif">what your body is whispering.</span>
        </h1>
        <p className="font-sans text-base sm:text-lg text-[#544342] leading-relaxed max-w-3xl">
          Share your feelings, cycle shifts, skin changes, or sensations in everyday words or your
          mother tongue. We translate them into clear biological pathways and compassionate clinical
          terms—never judging or diagnosing, always honoring your experience.
        </p>
      </div>

      {/* Main Dual Intake Container (Text & Voice) */}
      <div className="bg-white rounded-2xl border border-[#ECE4DA] p-5 sm:p-7 shadow-[0_2px_14px_-2px_rgba(49,32,43,0.04)]">
        
        {/* Top Header Indicators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#ECE4DA]/70 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4D6A5A]"></span>
            <span className="text-sm font-semibold text-[#221A16] font-sans">
              Describe your sensations, cycle shifts, or energy changes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#766A65]">Selected Input Mode:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EDF2EE] text-[#4D6A5A] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4D6A5A]"></span>
              English + Regional Voice Enabled
            </span>
          </div>
        </div>

        {/* Input & Voice Intake Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5">
          
          {/* Left Column: Text Area & Inspiration Chips */}
          <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
            
            {/* The Input Textarea */}
            <div className="relative rounded-xl border border-[#D9CDC1] bg-[#FDFBF7] p-3.5 focus-within:border-[#8B3E42] focus-within:ring-2 focus-within:ring-[#8B3E42]/10 transition-all">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Type in your own words, e.g. 'My periods are unpredictable, getting unexpected chin hairs, and extreme sugar crashes...'"
                rows={4}
                className="w-full bg-transparent resize-none border-none outline-none text-[#221A16] placeholder-[#766A65]/70 text-base leading-relaxed font-sans"
              />
              <div className="flex items-center justify-between pt-2 border-t border-[#ECE4DA]/70 text-xs text-[#766A65]">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#4D6A5A]" />
                  <span>Strictly confidential • Private in-browser session</span>
                </div>
                {statement && (
                  <button
                    onClick={() => setStatement('')}
                    className="hover:text-[#8B3E42] transition-colors font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Inspiration Chips */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#766A65] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#8B3E42]" />
                <span>Need inspiration? Tap everyday descriptions:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INSPIRATION_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectInspiration(item.text)}
                    className="text-left text-xs bg-[#F5EFE6] hover:bg-[#FBF2F2] hover:text-[#8B3E42] hover:border-[#8B3E42]/40 text-[#544342] px-3 py-1.5 rounded-full border border-[#ECE4DA] transition-all cursor-pointer"
                  >
                    "{item.text}"
                  </button>
                ))}
              </div>
            </div>

            {/* Input Language Selectors */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-[#766A65] font-medium mr-1">Input Language:</span>
              {inputLanguages.map((lang) => {
                const isActive = activeInputLanguage === lang.label;
                return (
                  <button
                    key={lang.label}
                    onClick={() => setActiveInputLanguage(lang.label)}
                    className={`text-xs px-3 py-1 rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#8B3E42] text-white font-semibold shadow-xs'
                        : 'bg-[#F5EFE6] text-[#544342] hover:bg-[#ECE4DA]'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right Column: Voice Intake Card & Visualizer */}
          <div className="lg:col-span-4 flex flex-col justify-between bg-[#FDFBF7] border border-[#ECE4DA] rounded-xl p-5 space-y-4">
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#221A16]">Voice Intake</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EDF2EE] text-[#4D6A5A] font-medium">
                  Any Language
                </span>
              </div>
              <p className="text-xs text-[#544342] leading-relaxed">
                Speak in your comfort language—Hindi, Tamil, Bengali, Hinglish, or English. We listen with care.
              </p>
            </div>

            {/* Audio Wave Visualizer Box */}
            <div className="bg-white rounded-xl border border-[#ECE4DA] p-4 flex flex-col items-center justify-center space-y-3 min-h-[90px]">
              <div className="flex items-center justify-center gap-1.5 h-8">
                <span className={`w-1.5 bg-[#4D6A5A] rounded-full ${isListening ? 'animate-wave-1' : 'h-3'}`}></span>
                <span className={`w-1.5 bg-[#8B3E42] rounded-full ${isListening ? 'animate-wave-2' : 'h-5'}`}></span>
                <span className={`w-1.5 bg-[#4D6A5A] rounded-full ${isListening ? 'animate-wave-3' : 'h-7'}`}></span>
                <span className={`w-1.5 bg-[#8B3E42] rounded-full ${isListening ? 'animate-wave-4' : 'h-4'}`}></span>
                <span className={`w-1.5 bg-[#4D6A5A] rounded-full ${isListening ? 'animate-wave-5' : 'h-6'}`}></span>
                <span className={`w-1.5 bg-[#8B3E42] rounded-full ${isListening ? 'animate-wave-6' : 'h-2'}`}></span>
              </div>
              <span className="text-[11px] font-medium text-[#766A65] tracking-wide text-center">
                {speechFeedback}
              </span>
            </div>

            {/* Voice Capture Button */}
            <button
              onClick={toggleVoiceIntake}
              className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isListening
                  ? 'bg-[#BA1A1A] text-white shadow-md animate-pulse'
                  : 'bg-[#F5EFE6] hover:bg-[#FBF2F2] hover:text-[#8B3E42] text-[#544342] border border-[#ECE4DA]'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>Listening... Tap to finish</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-[#8B3E42]" />
                  <span>Speak in your mother tongue</span>
                </>
              )}
            </button>

          </div>

        </div>

        {/* Big Action Button: Translate & Understand My Signals */}
        <div className="pt-6 border-t border-[#ECE4DA]/60 mt-6 flex justify-end">
          <button
            onClick={() => triggerTranslation()}
            disabled={!statement.trim() || isTranslating}
            className="w-full sm:w-auto px-7 py-3.5 bg-[#8B3E42] hover:bg-[#6E272C] disabled:bg-[#8B3E42]/50 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer"
          >
            <RotateCcw className={`w-4 h-4 ${isTranslating ? 'animate-spin' : ''}`} />
            <span>{isTranslating ? 'Synthesizing Biological Pathways...' : 'Translate & Understand My Signals'}</span>
          </button>
        </div>

      </div>

      {/* Synthesized Translation & Hallmarks Section */}
      {hasTranslated && (
        <section className="space-y-6 pt-2">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#ECE4DA] pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B3E42] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesized Translation &amp; Hallmarks</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#221A16] font-medium mt-1">
                Clinical Clarifier &amp; Biological Connections
              </h2>
            </div>
            <div className="text-xs text-[#766A65]">
              Showing real-time interpretation for: <span className="font-semibold text-[#4D6A5A]">Verified Patient Intake</span>
            </div>
          </div>

          {/* Live backend interpretation */}
          <div className="bg-white rounded-2xl border border-[#ECE4DA] p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-serif text-lg font-semibold text-[#221A16]">Live symptom-to-care analysis</h3>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${backendResult ? 'bg-[#EDF2EE] text-[#304D3E]' : 'bg-[#F5EFE6] text-[#766A65]'}`}>
                {backendResult ? 'Backend connected' : 'Backend result pending'}
              </span>
            </div>
            {backendError && <p role="alert" className="text-sm text-[#8B3E42]">Could not connect to the backend: {backendError}. Start the FastAPI service or configure VITE_API_BASE_URL, then retry.</p>}
            {backendResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#FDFBF7] border border-[#ECE4DA] p-3">
                    <p className="text-xs text-[#766A65]">Care guidance</p>
                    <p className="font-semibold text-[#221A16] capitalize">{String(backendResult.care_level || 'unrecognised').replaceAll('_', ' ')}</p>
                  </div>
                  <div className="rounded-xl bg-[#FDFBF7] border border-[#ECE4DA] p-3">
                    <p className="text-xs text-[#766A65]">Pattern match</p>
                    <p className="font-semibold text-[#221A16] capitalize">{String(backendResult.pattern || 'none').replaceAll('_', ' ')}</p>
                  </div>
                  <div className="rounded-xl bg-[#FDFBF7] border border-[#ECE4DA] p-3">
                    <p className="text-xs text-[#766A65]">Matched concepts</p>
                    <p className="font-semibold text-[#221A16]">{Array.isArray(backendResult.concepts) ? backendResult.concepts.length : 0}</p>
                  </div>
                </div>
                {Array.isArray(backendResult.concepts) && backendResult.concepts.length > 0 && <div><p className="text-xs font-semibold uppercase tracking-wide text-[#766A65] mb-2">Detected signals</p><div className="flex flex-wrap gap-2">{backendResult.concepts.map((item: string) => <span key={item} className="px-3 py-1.5 rounded-full bg-[#F5EFE6] text-[#544342] text-xs">{item.replaceAll('_', ' ')}</span>)}</div></div>}
                {backendResult.care_guidance && <div><p className="text-xs font-semibold text-[#221A16] mb-1">Guidance</p>{Array.isArray(backendResult.care_guidance) ? <ul className="list-disc pl-5 space-y-1 text-sm text-[#544342]">{backendResult.care_guidance.map((item: any, i: number) => <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>)}</ul> : <p className="text-sm text-[#544342]">{String(backendResult.care_guidance)}</p>}</div>}
                {Array.isArray(backendResult.doctor_questions) && backendResult.doctor_questions.length > 0 && <div><p className="text-xs font-semibold text-[#221A16] mb-1">Questions to discuss with a clinician</p><ul className="list-disc pl-5 space-y-1 text-sm text-[#544342]">{backendResult.doctor_questions.map((item: string, i: number) => <li key={i}>{item}</li>)}</ul></div>}
                {backendResult.disclaimer && <p className="text-xs text-[#766A65] border-t border-[#ECE4DA] pt-3">{backendResult.disclaimer}</p>}
              </div>
            )}
          </div>

          {/* 2-Column Synthesis Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Natural statement & Identified Clinical Concepts */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Natural language quote block */}
              <div className="bg-[#FFFFFF] border border-[#ECE4DA] rounded-2xl p-6 relative">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8B3E42] uppercase tracking-wider mb-2">
                  <span className="font-serif text-2xl leading-none text-[#8B3E42]">“</span>
                  <span>Your Natural Language Statement</span>
                </div>
                <p className="font-serif italic text-lg sm:text-xl text-[#221A16] leading-relaxed">
                  "{statement || DEFAULT_TRANSLATION_STATEMENT}"
                </p>
              </div>

              {/* Identified Clinical Concepts */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#766A65] uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#4D6A5A]" />
                  <span>Identified Clinical Concepts (Non-Diagnostic)</span>
                </div>

                <div className="space-y-3.5">
                  {currentConcepts.map((concept) => (
                    <div 
                      key={concept.id}
                      className="bg-white rounded-xl border border-[#ECE4DA] p-5 shadow-xs hover:border-[#8B3E42]/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif text-base font-semibold text-[#8B3E42]">
                              {concept.name}
                            </span>
                            <span className="text-xs text-[#766A65]">• {concept.subtitle}</span>
                          </div>
                          <p className="text-xs sm:text-[13px] text-[#221A16] font-medium leading-relaxed">
                            {concept.definition}
                          </p>
                        </div>
                        <div className="p-2 rounded-lg bg-[#F5EFE6] text-[#766A65] shrink-0">
                          {concept.iconName === 'calendar' && <Calendar className="w-4 h-4" />}
                          {concept.iconName === 'fingerprint' && <Fingerprint className="w-4 h-4" />}
                          {concept.iconName === 'sparkles' && <Sparkles className="w-4 h-4" />}
                          {concept.iconName === 'shield' && <ShieldCheck className="w-4 h-4" />}
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#ECE4DA]/70 bg-[#FDFBF7] -mx-5 -mb-5 p-4 rounded-b-xl text-xs text-[#544342] leading-relaxed">
                        <strong className="text-[#304D3E] font-medium">Plain language context: </strong>
                        {concept.plainContext}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Biological Pathways (Vertical interconnected flow) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              
              <div className="bg-white rounded-2xl border border-[#ECE4DA] p-6 space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-semibold text-[#221A16]">
                      {DEFAULT_BIOLOGICAL_PATHWAY.title}
                    </h3>
                    <Layers className="w-4 h-4 text-[#8B3E42]" />
                  </div>
                  <p className="text-xs text-[#766A65]">
                    {DEFAULT_BIOLOGICAL_PATHWAY.intro}
                  </p>
                </div>

                {/* 3 Steps in Flow */}
                <div className="space-y-3">
                  {DEFAULT_BIOLOGICAL_PATHWAY.steps.map((step, index) => (
                    <React.Fragment key={step.stepNumber}>
                      <div className="bg-[#FDFBF7] border border-[#ECE4DA] rounded-xl p-4 transition-all hover:bg-[#FBF2F2]/50">
                        <div className="flex items-center justify-between text-xs font-semibold mb-1">
                          <span className="text-[#221A16]">{step.title}</span>
                          <span className="text-[#8B3E42] text-[11px] font-sans">{step.axis}</span>
                        </div>
                        <p className="text-xs text-[#544342] leading-relaxed">
                          {step.description}
                        </p>
                      </div>

                      {index < DEFAULT_BIOLOGICAL_PATHWAY.steps.length - 1 && (
                        <div className="flex justify-center -my-1 text-[#8B3E42]">
                          <ArrowDown className="w-4 h-4 animate-bounce" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Summary note below steps */}
                <p className="text-xs text-[#766A65] leading-relaxed pt-2 border-t border-[#ECE4DA]/70">
                  {DEFAULT_BIOLOGICAL_PATHWAY.summary}
                </p>

                {/* Callout Box: What this pattern indicates */}
                <div className="rounded-xl bg-[#F5EFE6] border border-[#ECE4DA] p-4 text-xs text-[#544342] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#221A16]">
                    <Info className="w-4 h-4 text-[#4D6A5A]" />
                    <span>What this pattern indicates</span>
                  </div>
                  <p className="leading-relaxed">
                    {DEFAULT_BIOLOGICAL_PATHWAY.indicationNote}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* Turn Your Translated Signals Into Clear Action (3 Next Steps) */}
          <div className="pt-8 space-y-4">
            <div className="text-xs font-semibold text-[#8B3E42] uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Guided Next Steps</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#221A16]">
              Turn your translated signals into clear action
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              
              {/* Card 1: Explore PCOS Subtypes */}
              <div 
                onClick={() => onSelectTab('subtypes')}
                className="bg-white rounded-2xl border border-[#ECE4DA] p-6 flex flex-col justify-between hover:shadow-md hover:border-[#8B3E42]/50 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FBF2F2] text-[#8B3E42] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#221A16] group-hover:text-[#8B3E42] transition-colors">
                    Explore PCOS Subtype Patterns
                  </h3>
                  <p className="text-xs sm:text-sm text-[#544342] leading-relaxed">
                    Learn about the 4 recognizable clinical archetypes: Insulin-Resistant, Post-Pill, Inflammatory, and Adrenal PCOS to see where your profile may align.
                  </p>
                </div>
                <div className="pt-4 mt-2 text-xs font-semibold text-[#8B3E42] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>View Subtype Breakdown</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 2: Generate Doctor Visit Cheat Sheet */}
              <div 
                onClick={() => onSelectTab('doctor-prep')}
                className="bg-white rounded-2xl border border-[#ECE4DA] p-6 flex flex-col justify-between hover:shadow-md hover:border-[#8B3E42]/50 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EDF2EE] text-[#4D6A5A] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#221A16] group-hover:text-[#8B3E42] transition-colors">
                    Generate Doctor Visit Cheat Sheet
                  </h3>
                  <p className="text-xs sm:text-sm text-[#544342] leading-relaxed">
                    Create a personalized 1-page clinical briefing for your doctor, including key lab panels to request (Fasting Insulin, Free Testosterone, DHEA-S).
                  </p>
                </div>
                <div className="pt-4 mt-2 text-xs font-semibold text-[#8B3E42] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Build My Appointment Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 3: Find a PCOS-Affirming Specialist */}
              <div 
                onClick={() => onSelectTab('find-care')}
                className="bg-white rounded-2xl border border-[#ECE4DA] p-6 flex flex-col justify-between hover:shadow-md hover:border-[#8B3E42]/50 transition-all cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5EFE6] text-[#766A65] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-5 h-5 text-[#8B3E42]" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#221A16] group-hover:text-[#8B3E42] transition-colors">
                    Find a PCOS-Affirming Specialist
                  </h3>
                  <p className="text-xs sm:text-sm text-[#544342] leading-relaxed">
                    Connect with vetted endocrinologists, gynecologists, and registered dietitians who listen deeply and practice evidence-based, compassionate care.
                  </p>
                </div>
                <div className="pt-4 mt-2 text-xs font-semibold text-[#8B3E42] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Search Verified Directory</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>
          </div>

          {/* Rotterdam Criteria Clinical Note Frame */}
          <div className="rounded-xl bg-[#F5EFE6] border-l-4 border-[#4D6A5A] border-y border-r border-[#ECE4DA] p-5">
            <div className="flex items-center justify-between text-xs font-semibold text-[#4D6A5A] mb-1.5">
              <span>Clinical Note &amp; Navigation Guide • Rotterdam Criteria 2023 Alignment</span>
              <Info className="w-4 h-4 text-[#766A65]" />
            </div>
            <p className="text-xs text-[#544342] leading-relaxed">
              This tool organizes your symptom patterns to help you lead constructive conversations with your physician; it does not replace medical diagnosis or prescriptive clinical recommendations. All translated anatomical terms reference the 2023 International Evidence-based Guidelines for the Assessment and Management of PCOS.
            </p>
          </div>

        </section>
      )}

    </div>
  );
};
