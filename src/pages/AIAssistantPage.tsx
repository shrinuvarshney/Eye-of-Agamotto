/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Send,
  Calendar,
  BookOpen,
  BrainCircuit,
  GraduationCap,
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { EyeLogo } from '../components/common/EyeLogo';
import { Task, Note, LearningRoadmap, Priority, TaskCategory } from '../types';
import { storageService } from '../services/storageService';

interface AIAssistantPageProps {
  tasks: Task[];
  notes: Note[];
  roadmaps: LearningRoadmap[];
  onTasksChange?: () => void;
  onNotesChange?: () => void;
}

export interface ProposedTask {
  title: string;
  priority: Priority;
  category: TaskCategory;
  dueDate?: string;
  estimatedMinutes?: number;
}

interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  actionType?: 'plan_day' | 'explain_concept' | 'summarize_notes' | 'study_plan' | 'practice_questions' | 'chat';
  timestamp: string;
  proposedTasks?: ProposedTask[];
  tasksApproved?: boolean;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  tasks,
  notes,
  roadmaps,
  onTasksChange,
  onNotesChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'chat' | 'explain' | 'summarize' | 'study_plan' | 'practice' | 'plan_day'
  >('chat');

  // Chat conversation state
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      content:
        'Greetings, Harsh. I am the Eye of Agamotto Intelligence module powered by server-side Gemini. I have deep context on your tasks, learning roadmaps, projects, and engineering notes. Select a capability above or prompt me directly.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected tasks for permission approval
  const [selectedProposedTasks, setSelectedProposedTasks] = useState<Record<string, boolean>>({});

  // Real-time server-side Gemini status verification
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; model: string } | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/gemini/status')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted) {
          setGeminiStatus(data);
          setIsCheckingStatus(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setGeminiStatus({ configured: false, model: 'gemini-3.8-flash' });
          setIsCheckingStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Concept Explanations Form State
  const [conceptQuery, setConceptQuery] = useState('');
  const [conceptLevel, setConceptLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('advanced');

  // 2. Note Summarization Form State
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [customNoteContent, setCustomNoteContent] = useState('');

  // 3. Study Plan Form State
  const [studyTopic, setStudyTopic] = useState('GATE DA 2027: Linear Algebra & Matrix Decompositions');
  const [studyDurationWeeks, setStudyDurationWeeks] = useState(4);
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(3);
  const [studyProficiency, setStudyProficiency] = useState('intermediate');

  // 4. Practice Questions Form State
  const [practiceTopic, setPracticeTopic] = useState('Transformer Multi-Head Attention & KV-Cache Bounds');
  const [practiceCount, setPracticeCount] = useState(5);
  const [practiceDifficulty, setPracticeDifficulty] = useState('advanced');

  // 5. Daily Plan Form State
  const [dailyPreferences, setDailyPreferences] = useState(
    'Focus on deep cognitive math in the morning. LeetCode block in late afternoon. Anthropic application review in evening.'
  );

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to send chat message
  const handleSendChat = async (promptText: string, actionType: AssistantMessage['actionType'] = 'chat') => {
    if (!promptText.trim() || isProcessing) return;

    setRateLimitError(null);
    const userMsg: AssistantMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: promptText.trim(),
      actionType,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsProcessing(true);

    try {
      // Build lightweight workspace context
      const workspaceContext = {
        pendingTasks: tasks.filter((t) => t.status !== 'completed').slice(0, 15).map((t) => ({
          title: t.title,
          priority: t.priority,
          category: t.category,
          dueDate: t.dueDate,
        })),
        roadmaps: roadmaps.map((r) => ({
          title: r.title,
          modulesCount: r.modules.length,
        })),
        notesCount: notes.length,
      };

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText.trim(),
          history: messages.slice(-6).map((m) => ({ sender: m.sender, content: m.content })),
          workspaceContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setRateLimitError(data.error || 'Rate limit reached. Please wait a moment before trying again.');
        }
        throw new Error(data.error || 'Failed to communicate with Gemini server.');
      }

      const asstMsgId = `asst-${Date.now()}`;
      const proposed = Array.isArray(data.proposedTasks) ? data.proposedTasks : [];

      // Pre-select all proposed tasks for approval
      if (proposed.length > 0) {
        const initialMap: Record<string, boolean> = {};
        proposed.forEach((_: any, idx: number) => {
          initialMap[`${asstMsgId}-${idx}`] = true;
        });
        setSelectedProposedTasks((prev) => ({ ...prev, ...initialMap }));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: asstMsgId,
          sender: 'assistant',
          content: data.text || 'Analysis completed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          proposedTasks: proposed.length > 0 ? proposed : undefined,
          tasksApproved: false,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: `⚠️ Error: ${err.message || 'Unable to connect to the Gemini server.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Specific Feature Handlers
  const handleExplainConcept = async () => {
    if (!conceptQuery.trim() || isProcessing) return;
    setRateLimitError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: conceptQuery.trim(),
          level: conceptLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to explain concept.');

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: `Explain concept: "${conceptQuery}" (${conceptLevel} level)`,
          actionType: 'explain_concept',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: data.text,
          actionType: 'explain_concept',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setRateLimitError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarizeNote = async () => {
    let contentToSummarize = customNoteContent.trim();
    let noteTitle = 'Custom Note';
    let tags: string[] = [];

    if (!contentToSummarize && selectedNoteId) {
      const note = notes.find((n) => n.id === selectedNoteId);
      if (note) {
        contentToSummarize = note.content;
        noteTitle = note.title;
        tags = note.tags;
      }
    }

    if (!contentToSummarize || isProcessing) return;
    setRateLimitError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle,
          content: contentToSummarize,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to summarize note.');

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: `Summarize Note: "${noteTitle}"`,
          actionType: 'summarize_notes',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: data.text,
          actionType: 'summarize_notes',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setRateLimitError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateStudyPlan = async () => {
    if (!studyTopic.trim() || isProcessing) return;
    setRateLimitError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: studyTopic.trim(),
          durationWeeks: studyDurationWeeks,
          hoursPerDay: studyHoursPerDay,
          currentProficiency: studyProficiency,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate study plan.');

      const asstMsgId = `asst-${Date.now()}`;
      const proposed = Array.isArray(data.proposedTasks) ? data.proposedTasks : [];

      if (proposed.length > 0) {
        const initialMap: Record<string, boolean> = {};
        proposed.forEach((_: any, idx: number) => {
          initialMap[`${asstMsgId}-${idx}`] = true;
        });
        setSelectedProposedTasks((prev) => ({ ...prev, ...initialMap }));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: `Generate ${studyDurationWeeks}-week Study Plan for: "${studyTopic}" (${studyHoursPerDay} hrs/day)`,
          actionType: 'study_plan',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
        {
          id: asstMsgId,
          sender: 'assistant',
          content: data.text.replace(/```json:proposed_tasks\s*[\s\S]*?\s*```/, '').trim(),
          actionType: 'study_plan',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          proposedTasks: proposed.length > 0 ? proposed : undefined,
          tasksApproved: false,
        },
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setRateLimitError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePractice = async () => {
    if (!practiceTopic.trim() || isProcessing) return;
    setRateLimitError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/practice-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: practiceTopic.trim(),
          count: practiceCount,
          difficulty: practiceDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate practice questions.');

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: `Generate ${practiceCount} Practice Questions on: "${practiceTopic}" (${practiceDifficulty})`,
          actionType: 'practice_questions',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: data.text,
          actionType: 'practice_questions',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setRateLimitError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlanDay = async () => {
    setRateLimitError(null);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/gemini/plan-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.map((t) => ({
            title: t.title,
            priority: t.priority,
            category: t.category,
            dueDate: t.dueDate,
            dueTime: t.dueTime,
            status: t.status,
            estimatedMinutes: t.estimatedMinutes,
          })),
          preferences: dailyPreferences,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize daily plan.');

      const asstMsgId = `asst-${Date.now()}`;
      const proposed = Array.isArray(data.proposedTasks) ? data.proposedTasks : [];

      if (proposed.length > 0) {
        const initialMap: Record<string, boolean> = {};
        proposed.forEach((_: any, idx: number) => {
          initialMap[`${asstMsgId}-${idx}`] = true;
        });
        setSelectedProposedTasks((prev) => ({ ...prev, ...initialMap }));
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          content: 'Synthesize optimal daily schedule & deep work blocks',
          actionType: 'plan_day',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        },
        {
          id: asstMsgId,
          sender: 'assistant',
          content: data.text.replace(/```json:proposed_tasks\s*[\s\S]*?\s*```/, '').trim(),
          actionType: 'plan_day',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          proposedTasks: proposed.length > 0 ? proposed : undefined,
          tasksApproved: false,
        },
      ]);
      setActiveTab('chat');
    } catch (err: any) {
      setRateLimitError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Permission Approval: User explicitly grants permission to create proposed tasks
  const handleApproveTasks = (messageId: string, proposedList: ProposedTask[]) => {
    const today = new Date().toISOString().split('T')[0];
    let createdCount = 0;

    proposedList.forEach((pt, idx) => {
      const key = `${messageId}-${idx}`;
      if (selectedProposedTasks[key]) {
        storageService.addTask({
          title: pt.title,
          priority: pt.priority || 'high',
          category: pt.category || 'study',
          status: 'todo',
          dueDate: pt.dueDate || today,
          estimatedMinutes: pt.estimatedMinutes || 60,
          recurring: 'none',
          tags: ['AI-Plan'],
        });
        createdCount++;
      }
    });

    if (createdCount > 0 && onTasksChange) {
      onTasksChange();
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, tasksApproved: true } : m))
    );
  };

  // Discard proposed tasks
  const handleRejectTasks = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, tasksApproved: true, proposedTasks: [] } : m))
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#2DD4BF] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Secure Server-Side Gemini Intelligence</span>
            <span aria-hidden="true" className="text-[#64748B]">·</span>
            <span className="text-[#94A3B8]">Model: gemini-3.8-flash</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2">
            <span>Agamotto Intelligence Engine</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Concept explanations, note summaries, study plans, practice question generation, and permission-governed daily planning
          </p>
        </div>

        {/* Workspace Quick Status */}
        <div className="flex flex-wrap items-center gap-2">
          {isCheckingStatus ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101722] border border-[#263548] text-xs font-mono text-[#94A3B8]">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#94A3B8]" />
              <span>Checking AI Status...</span>
            </div>
          ) : geminiStatus?.configured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#082B2A] border border-[#0D9488] text-xs font-mono text-[#2DD4BF]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span>Gemini Engine Active ({geminiStatus.model})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs font-mono text-[#FBBF24]">
              <AlertCircle className="w-3.5 h-3.5 text-[#FBBF24]" />
              <span>AI Engine Offline (Missing Key)</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#101722] border border-[#263548] text-xs font-mono text-[#94A3B8]">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>Server-Side Secured</span>
          </div>
        </div>
      </div>

      {/* Unconfigured Alert Banner */}
      {!isCheckingStatus && !geminiStatus?.configured && (
        <div className="p-4 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/30 text-xs text-[#FBBF24] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#FBBF24] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#FBBF24]">Gemini Intelligence Engine is currently offline</p>
            <p className="text-[#CBD5E1]">
              The server could not detect a valid <code className="text-[#FBBF24] font-mono">GEMINI_API_KEY</code> in the environment. AI-assisted explanation, summarization, and planning will be activated once the key is attached. All task, roadmap, and local persistence features continue to operate normally.
            </p>
          </div>
        </div>
      )}

      {/* Feature Capabilities Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { id: 'chat', label: 'Terminal Chat', icon: Sparkles },
          { id: 'explain', label: 'Explain Concept', icon: BrainCircuit },
          { id: 'summarize', label: 'Summarize Notes', icon: FileText },
          { id: 'study_plan', label: 'Study Plans', icon: GraduationCap },
          { id: 'practice', label: 'Practice Drills', icon: HelpCircle },
          { id: 'plan_day', label: 'Plan My Day', icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                isActive
                  ? 'bg-[#082B2A] border-[#0D9488] text-[#2DD4BF] font-semibold shadow-sm'
                  : 'bg-[#101722] border-[#263548] text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
              }`}
            >
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-[#10B981]' : 'text-[#64748B]'}`} />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rate limit warning banner */}
      {rateLimitError && (
        <div className="p-3.5 rounded-xl bg-[#FB7185]/15 border border-[#FB7185]/30 text-xs text-[#FB7185] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#FB7185] shrink-0" />
            <span>{rateLimitError}</span>
          </div>
          <button
            onClick={() => setRateLimitError(null)}
            className="p-1 text-[#FB7185] hover:text-[#F1F5F9]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab Panels */}
      {activeTab === 'explain' && (
        <div className="p-5 rounded-xl bg-[#101722] border border-[#263548] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-[#10B981]" />
              <span>Deconstruct & Explain a Technical Concept</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">LaTeX & Systems Intuition</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                Concept, Algorithm, or Mathematical Theorem
              </label>
              <input
                type="text"
                value={conceptQuery}
                onChange={(e) => setConceptQuery(e.target.value)}
                placeholder="e.g. Geometric intuition of SVD and why singular values equal sqrt(eigenvalues of A^T*A)"
                className="w-full px-3.5 py-2.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#94A3B8]">Audience Depth:</span>
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConceptLevel(lvl)}
                    className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                      conceptLevel === lvl
                        ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                        : 'text-[#94A3B8] hover:text-[#F1F5F9] bg-[#0A1018] border border-[#263548]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExplainConcept}
                disabled={isProcessing || !conceptQuery.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explain Rigorously</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'summarize' && (
        <div className="p-5 rounded-xl bg-[#101722] border border-[#263548] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#10B981]" />
              <span>Synthesize Knowledge Vault Notes</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">Executive Synthesis & Flashcards</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                Select a Note from Your Knowledge Vault
              </label>
              <select
                value={selectedNoteId}
                onChange={(e) => {
                  setSelectedNoteId(e.target.value);
                  setCustomNoteContent('');
                }}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
              >
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title} ({n.tags.join(', ') || 'No tags'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                Or Paste Custom Content to Summarize
              </label>
              <textarea
                rows={4}
                value={customNoteContent}
                onChange={(e) => setCustomNoteContent(e.target.value)}
                placeholder="Optional: Paste architectural documents, research abstracts, or derivations..."
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs font-mono text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4] resize-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={handleSummarizeNote}
                disabled={isProcessing || (!selectedNoteId && !customNoteContent.trim())}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generate Executive Summary</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'study_plan' && (
        <div className="p-5 rounded-xl bg-[#101722] border border-[#263548] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[#10B981]" />
              <span>Architect an Intensive Study Plan</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">Milestone Curriculum</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Target Topic / Domain</label>
              <input
                type="text"
                value={studyTopic}
                onChange={(e) => setStudyTopic(e.target.value)}
                placeholder="e.g. GATE DA 2027: Linear Algebra & Matrix Decompositions"
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Duration (Weeks)</label>
              <select
                value={studyDurationWeeks}
                onChange={(e) => setStudyDurationWeeks(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none"
              >
                <option value={2}>2 Weeks (Sprint)</option>
                <option value={4}>4 Weeks (Standard)</option>
                <option value={8}>8 Weeks (Comprehensive)</option>
                <option value={12}>12 Weeks (Full Semester)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Hours / Day</label>
              <select
                value={studyHoursPerDay}
                onChange={(e) => setStudyHoursPerDay(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none"
              >
                <option value={1}>1 hour / day (Maintenance)</option>
                <option value={2}>2 hours / day (Steady)</option>
                <option value={3}>3 hours / day (Intensive)</option>
                <option value={5}>5 hours / day (Full-Time Deep Work)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Proficiency</label>
              <select
                value={studyProficiency}
                onChange={(e) => setStudyProficiency(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleGenerateStudyPlan}
              disabled={isProcessing || !studyTopic.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Generate Study Roadmap</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="p-5 rounded-xl bg-[#101722] border border-[#263548] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#10B981]" />
              <span>Generate Practice Exam & System Design Drills</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">Expandable Solutions</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Topic or Problem Area</label>
              <input
                type="text"
                value={practiceTopic}
                onChange={(e) => setPracticeTopic(e.target.value)}
                placeholder="e.g. Transformer KV-Cache memory complexity, or Raft leader election invariants"
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Question Count</label>
              <select
                value={practiceCount}
                onChange={(e) => setPracticeCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none"
              >
                <option value={3}>3 Questions (Quick Drill)</option>
                <option value={5}>5 Questions (Standard Exam)</option>
                <option value={8}>8 Questions (Full Problem Set)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Difficulty</label>
              <select
                value={practiceDifficulty}
                onChange={(e) => setPracticeDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none"
              >
                <option value="intermediate">GATE / Mid-Level</option>
                <option value="advanced">GATE Top-100 / Staff Level</option>
                <option value="competition">Olympiad / Extreme Systems</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleGeneratePractice}
              disabled={isProcessing || !practiceTopic.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Generate Practice Drills</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'plan_day' && (
        <div className="p-5 rounded-xl bg-[#101722] border border-[#263548] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#10B981]" />
              <span>Daily Focus & Deep Work Optimization</span>
            </h3>
            <span className="text-xs text-[#94A3B8] font-mono">
              {tasks.filter((t) => t.status !== 'completed').length} Pending Tasks
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                Energy Preferences & Context for Today
              </label>
              <textarea
                rows={3}
                value={dailyPreferences}
                onChange={(e) => setDailyPreferences(e.target.value)}
                placeholder="Mention times when you want deep work blocks, scheduled meetings, or low energy lulls..."
                className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs font-mono text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4] resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#94A3B8]">
                Tasks analyzed: {tasks.filter((t) => t.status !== 'completed').length} active items
              </span>

              <button
                onClick={handlePlanDay}
                disabled={isProcessing}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 rounded-lg shadow-sm transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Synthesize Today's Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversational Terminal Window */}
      <div className="rounded-xl bg-[#101722] border border-[#263548] flex flex-col h-[560px] shadow-xl overflow-hidden">
        {/* Terminal Header */}
        <div className="px-5 py-3 border-b border-[#1B2838] bg-[#0A1018] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <EyeLogo size={20} />
            <span className="text-xs font-bold text-[#F1F5F9] tracking-wide">
              Agamotto Intelligence Terminal
            </span>
            <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:inline">
              Secure Proxy Route /api/gemini/*
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono text-[#2DD4BF]">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Active & Synced</span>
          </div>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isUser = m.sender === 'user';
            return (
              <div
                key={m.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#082B2A] border border-[#0D9488] flex items-center justify-center text-[#2DD4BF] shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl space-y-3 ${
                    isUser
                      ? 'bg-[#172231] border border-[#263548] text-[#F1F5F9] font-medium rounded-br-sm shadow-sm'
                      : 'bg-[#0A1018] border border-[#263548] text-[#CBD5E1] rounded-bl-sm shadow-sm'
                  }`}
                >
                  {/* Content viewer */}
                  <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed">
                    {m.content}
                  </div>

                  {/* Proposed Tasks Permission Card (CRITICAL PERMISSION REQUIREMENT) */}
                  {!isUser && m.proposedTasks && m.proposedTasks.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#101722] border border-[#10B981]/40 space-y-3 mt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                          <span className="text-xs font-bold text-[#F1F5F9]">
                            Task Action Proposal — Permission Required
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/10 px-2 py-0.5 rounded border border-[#FBBF24]/30">
                          Awaiting Approval
                        </span>
                      </div>

                      <p className="text-[11px] text-[#94A3B8]">
                        The assistant proposes adding the following {m.proposedTasks.length} task(s) to your agenda. Grant permission to create them?
                      </p>

                      <div className="space-y-1.5 divide-y divide-[#1B2838]">
                        {m.proposedTasks.map((pt, idx) => {
                          const key = `${m.id}-${idx}`;
                          const isChecked = selectedProposedTasks[key] !== false;

                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                if (!m.tasksApproved) {
                                  setSelectedProposedTasks((prev) => ({
                                    ...prev,
                                    [key]: !isChecked,
                                  }));
                                }
                              }}
                              className={`pt-1.5 first:pt-0 flex items-start justify-between gap-3 text-xs cursor-pointer ${
                                m.tasksApproved ? 'opacity-70 pointer-events-none' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  readOnly
                                  className="mt-0.5 rounded text-[#10B981] bg-[#0A1018] border-[#263548]"
                                />
                                <div className="min-w-0">
                                  <div className="text-[#F1F5F9] font-medium truncate">{pt.title}</div>
                                  <div className="text-[10px] text-[#94A3B8] font-mono flex items-center gap-2 mt-0.5">
                                    <span className="capitalize">{pt.category}</span>
                                    <span>·</span>
                                    <span>{pt.priority} priority</span>
                                    {pt.estimatedMinutes && (
                                      <>
                                        <span>·</span>
                                        <span>{pt.estimatedMinutes}m</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#1B2838]">
                        {m.tasksApproved ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#34D399] font-mono">
                            <CheckCircle className="w-4 h-4" />
                            <span>Tasks processed & added to agenda</span>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleRejectTasks(m.id)}
                              className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                            >
                              Discard
                            </button>

                            <button
                              onClick={() => handleApproveTasks(m.id, m.proposedTasks!)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Create Tasks</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Message Footer Actions */}
                  <div className="flex items-center justify-between text-[10px] text-[#64748B] pt-1 border-t border-[#1B2838]">
                    <span>{m.timestamp}</span>

                    {!isUser && (
                      <button
                        onClick={() => handleCopy(m.content, m.id)}
                        className="flex items-center gap-1 text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                        title="Copy Response"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#10B981]" />
                            <span className="text-[#10B981]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-[#172231] border border-[#263548] flex items-center justify-center text-[#F1F5F9] font-bold shrink-0 mt-0.5">
                    HV
                  </div>
                )}
              </div>
            );
          })}

          {isProcessing && (
            <div className="flex items-center gap-2.5 text-xs text-[#94A3B8] font-mono p-3 bg-[#0A1018] rounded-xl border border-[#263548] w-fit">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Querying secure server-side Gemini 3.8 Flash endpoint...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="p-4 border-t border-[#1B2838] bg-[#0A1018]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat(inputPrompt);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about math, SVD, CUDA, study schedules, or ask to plan tasks..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-[#101722] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
            />
            <button
              type="submit"
              disabled={isProcessing || !inputPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
