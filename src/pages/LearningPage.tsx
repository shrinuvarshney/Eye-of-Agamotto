/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Cpu,
  Code2,
  Cloud,
  CheckCircle2,
  Circle,
  BookOpen,
  HelpCircle,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Clock,
  X,
  Check,
  AlertTriangle,
  Layers,
  FolderPlus,
  Compass,
  Filter,
} from 'lucide-react';
import {
  LearningRoadmap,
  LearningModule,
  LearningTopic,
  LearningSubtopic,
  LearningResource,
  NavigationItem,
} from '../types';
import { storageService } from '../services/storageService';

interface LearningPageProps {
  roadmaps: LearningRoadmap[];
  onRoadmapsChange: () => void;
  onNavigate?: (nav: NavigationItem) => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({
  roadmaps,
  onRoadmapsChange,
}) => {
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string>(
    roadmaps[0]?.id || 'roadmap-gate-da'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'completed'>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({});

  // Roadmap Modal state (Add / Edit)
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
  const [roadmapFormTitle, setRoadmapFormTitle] = useState('');
  const [roadmapFormShortCode, setRoadmapFormShortCode] = useState('');
  const [roadmapFormBadge, setRoadmapFormBadge] = useState('');
  const [roadmapFormTargetYear, setRoadmapFormTargetYear] = useState('2026');
  const [roadmapFormSummary, setRoadmapFormSummary] = useState('');
  const [roadmapFormIcon, setRoadmapFormIcon] = useState('GraduationCap');
  const [roadmapFormColor, setRoadmapFormColor] = useState('emerald');

  // Module Modal state (Add / Edit)
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<{ roadmapId: string; module?: LearningModule } | null>(null);
  const [moduleFormTitle, setModuleFormTitle] = useState('');
  const [moduleFormHours, setModuleFormHours] = useState(20);

  // Topic Modal state (Add / Edit)
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<{
    roadmapId: string;
    moduleId: string;
    topic?: LearningTopic;
  } | null>(null);
  const [topicFormTitle, setTopicFormTitle] = useState('');
  const [topicFormDescription, setTopicFormDescription] = useState('');
  const [topicFormNotes, setTopicFormNotes] = useState('');

  // Subtopic Inline Add state
  const [isAddingSubtopic, setIsAddingSubtopic] = useState<Record<string, boolean>>({});
  const [newSubtopicTitle, setNewSubtopicTitle] = useState<Record<string, string>>({});

  // Delete confirmations
  const [roadmapToDelete, setRoadmapToDelete] = useState<LearningRoadmap | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<{ roadmapId: string; moduleId: string; title: string } | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<{
    roadmapId: string;
    moduleId: string;
    topicId: string;
    title: string;
  } | null>(null);

  const currentRoadmap = useMemo(() => {
    return roadmaps.find((r) => r.id === selectedRoadmapId) || roadmaps[0];
  }, [roadmaps, selectedRoadmapId]);

  // Compute exact roadmap metrics calculated from actual completed items
  const computeRoadmapStats = (r: LearningRoadmap) => {
    let totalItems = 0;
    let completedItems = 0;
    let totalHours = 0;
    let completedHours = 0;

    r.modules.forEach((m) => {
      totalHours += m.estimatedHours;
      let mTotal = 0;
      let mCompleted = 0;

      m.topics.forEach((t) => {
        if (t.subtopics.length > 0) {
          t.subtopics.forEach((st) => {
            totalItems++;
            mTotal++;
            if (st.completed) {
              completedItems++;
              mCompleted++;
            }
          });
        } else {
          totalItems++;
          mTotal++;
          if (t.completed) {
            completedItems++;
            mCompleted++;
          }
        }
      });

      if (mTotal > 0) {
        completedHours += Math.round((mCompleted / mTotal) * m.estimatedHours);
      }
    });

    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    return { totalItems, completedItems, percent, totalHours, completedHours };
  };

  const currentStats = useMemo(() => {
    if (!currentRoadmap) {
      return { totalItems: 0, completedItems: 0, percent: 0, totalHours: 0, completedHours: 0 };
    }
    return computeRoadmapStats(currentRoadmap);
  }, [currentRoadmap]);

  // Module stats calculation
  const computeModuleStats = (m: LearningModule) => {
    let mTotal = 0;
    let mCompleted = 0;

    m.topics.forEach((t) => {
      if (t.subtopics.length > 0) {
        t.subtopics.forEach((st) => {
          mTotal++;
          if (st.completed) mCompleted++;
        });
      } else {
        mTotal++;
        if (t.completed) mCompleted++;
      }
    });

    const percent = mTotal > 0 ? Math.round((mCompleted / mTotal) * 100) : 0;
    return { mTotal, mCompleted, percent };
  };

  // Check if a topic is completed based on its actual subtopics
  const isTopicDone = (t: LearningTopic) => {
    if (t.subtopics.length > 0) {
      return t.subtopics.every((st) => st.completed);
    }
    return t.completed;
  };

  // Toggling subtopic
  const handleToggleSubtopic = (topicId: string, subtopicId: string) => {
    if (!currentRoadmap) return;
    storageService.toggleSubtopic(currentRoadmap.id, topicId, subtopicId);
    onRoadmapsChange();
  };

  // Toggling topic
  const handleToggleTopic = (topicId: string) => {
    if (!currentRoadmap) return;
    storageService.toggleTopic(currentRoadmap.id, topicId);
    onRoadmapsChange();
  };

  // Answer reveal toggle
  const toggleRevealAnswer = (questionId: string) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  // Subtopic inline creation
  const handleAddSubtopic = (topicId: string) => {
    if (!currentRoadmap) return;
    const title = newSubtopicTitle[topicId]?.trim();
    if (!title) return;

    storageService.addSubtopic(currentRoadmap.id, topicId, title);
    setNewSubtopicTitle((prev) => ({ ...prev, [topicId]: '' }));
    setIsAddingSubtopic((prev) => ({ ...prev, [topicId]: false }));
    onRoadmapsChange();
  };

  const handleDeleteSubtopic = (topicId: string, subtopicId: string) => {
    if (!currentRoadmap) return;
    storageService.deleteSubtopic(currentRoadmap.id, topicId, subtopicId);
    onRoadmapsChange();
  };

  // --- Roadmap Modal Openers ---
  const handleOpenCreateRoadmap = () => {
    setEditingRoadmapId(null);
    setRoadmapFormTitle('');
    setRoadmapFormShortCode('');
    setRoadmapFormBadge('Core Track');
    setRoadmapFormTargetYear('2026');
    setRoadmapFormSummary('');
    setRoadmapFormIcon('GraduationCap');
    setRoadmapFormColor('emerald');
    setIsRoadmapModalOpen(true);
  };

  const handleOpenEditRoadmap = (r: LearningRoadmap) => {
    setEditingRoadmapId(r.id);
    setRoadmapFormTitle(r.title);
    setRoadmapFormShortCode(r.shortCode);
    setRoadmapFormBadge(r.badge);
    setRoadmapFormTargetYear(r.targetYear || '2026');
    setRoadmapFormSummary(r.summary);
    setRoadmapFormIcon(r.iconName);
    setRoadmapFormColor(r.colorAccent);
    setIsRoadmapModalOpen(true);
  };

  const handleSaveRoadmap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roadmapFormTitle.trim()) return;

    if (editingRoadmapId) {
      const existing = roadmaps.find((r) => r.id === editingRoadmapId);
      if (existing) {
        storageService.updateRoadmap({
          ...existing,
          title: roadmapFormTitle.trim(),
          shortCode: roadmapFormShortCode.trim() || 'TRACK',
          badge: roadmapFormBadge.trim(),
          targetYear: roadmapFormTargetYear.trim(),
          summary: roadmapFormSummary.trim(),
          iconName: roadmapFormIcon,
          colorAccent: roadmapFormColor,
        });
      }
    } else {
      const newR = storageService.addRoadmap({
        title: roadmapFormTitle.trim(),
        shortCode: roadmapFormShortCode.trim() || 'TRACK',
        badge: roadmapFormBadge.trim() || 'Custom Curriculum',
        targetYear: roadmapFormTargetYear.trim(),
        summary: roadmapFormSummary.trim(),
        iconName: roadmapFormIcon,
        colorAccent: roadmapFormColor,
        modules: [
          {
            id: `mod-${Date.now()}-1`,
            title: 'Foundations & Core Principles',
            estimatedHours: 25,
            topics: [
              {
                id: `top-${Date.now()}-1`,
                title: 'Core Fundamentals & Architecture',
                description: 'Initial fundamentals and overview concepts',
                completed: false,
                subtopics: [
                  { id: `sub-${Date.now()}-1`, title: 'Prerequisites review', completed: false },
                  { id: `sub-${Date.now()}-2`, title: 'Core theory & specifications', completed: false },
                ],
                resources: [],
              },
            ],
          },
        ],
      });
      setSelectedRoadmapId(newR.id);
    }

    setIsRoadmapModalOpen(false);
    onRoadmapsChange();
  };

  const handleConfirmDeleteRoadmap = () => {
    if (!roadmapToDelete) return;
    storageService.deleteRoadmap(roadmapToDelete.id);
    const remaining = roadmaps.filter((r) => r.id !== roadmapToDelete.id);
    if (remaining.length > 0) {
      setSelectedRoadmapId(remaining[0].id);
    }
    setRoadmapToDelete(null);
    onRoadmapsChange();
  };

  // --- Module Modal Openers ---
  const handleOpenAddModule = () => {
    if (!currentRoadmap) return;
    setEditingModule({ roadmapId: currentRoadmap.id });
    setModuleFormTitle('');
    setModuleFormHours(20);
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (m: LearningModule) => {
    if (!currentRoadmap) return;
    setEditingModule({ roadmapId: currentRoadmap.id, module: m });
    setModuleFormTitle(m.title);
    setModuleFormHours(m.estimatedHours);
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModule || !moduleFormTitle.trim()) return;

    if (editingModule.module) {
      storageService.updateModule(editingModule.roadmapId, {
        ...editingModule.module,
        title: moduleFormTitle.trim(),
        estimatedHours: Number(moduleFormHours) || 10,
      });
    } else {
      storageService.addModule(editingModule.roadmapId, {
        title: moduleFormTitle.trim(),
        estimatedHours: Number(moduleFormHours) || 10,
        topics: [],
      });
    }

    setIsModuleModalOpen(false);
    onRoadmapsChange();
  };

  const handleConfirmDeleteModule = () => {
    if (!moduleToDelete) return;
    storageService.deleteModule(moduleToDelete.roadmapId, moduleToDelete.moduleId);
    setModuleToDelete(null);
    onRoadmapsChange();
  };

  // --- Topic Modal Openers ---
  const handleOpenAddTopic = (moduleId: string) => {
    if (!currentRoadmap) return;
    setEditingTopic({ roadmapId: currentRoadmap.id, moduleId });
    setTopicFormTitle('');
    setTopicFormDescription('');
    setTopicFormNotes('');
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (moduleId: string, t: LearningTopic) => {
    if (!currentRoadmap) return;
    setEditingTopic({ roadmapId: currentRoadmap.id, moduleId, topic: t });
    setTopicFormTitle(t.title);
    setTopicFormDescription(t.description);
    setTopicFormNotes(t.notes || '');
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic || !topicFormTitle.trim()) return;

    if (editingTopic.topic) {
      storageService.updateTopic(editingTopic.roadmapId, editingTopic.moduleId, {
        ...editingTopic.topic,
        title: topicFormTitle.trim(),
        description: topicFormDescription.trim(),
        notes: topicFormNotes.trim() || undefined,
      });
    } else {
      storageService.addTopic(editingTopic.roadmapId, editingTopic.moduleId, {
        title: topicFormTitle.trim(),
        description: topicFormDescription.trim(),
        completed: false,
        subtopics: [],
        resources: [],
        notes: topicFormNotes.trim() || undefined,
      });
    }

    setIsTopicModalOpen(false);
    onRoadmapsChange();
  };

  const handleConfirmDeleteTopic = () => {
    if (!topicToDelete) return;
    storageService.deleteTopic(
      topicToDelete.roadmapId,
      topicToDelete.moduleId,
      topicToDelete.topicId
    );
    setTopicToDelete(null);
    onRoadmapsChange();
  };

  const getRoadmapIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return GraduationCap;
      case 'Cpu':
        return Cpu;
      case 'Code2':
        return Code2;
      case 'Cloud':
        return Cloud;
      case 'Compass':
        return Compass;
      default:
        return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            Curriculum & Learning Roadmaps
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured mastery pipelines with editable roadmaps, modules, topics, subtopics, and actual item progress tracking
          </p>
        </div>

        <button
          onClick={handleOpenCreateRoadmap}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-xl shadow-sm transition-all active:scale-95 shrink-0 focus-visible:ring-1 focus-visible:ring-[#5EEAD4]"
        >
          <Plus className="w-4 h-4" />
          <span>New Roadmap</span>
        </button>
      </div>

      {/* Roadmap Navigation Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {roadmaps.map((r) => {
          const Icon = getRoadmapIcon(r.iconName);
          const isSelected = r.id === selectedRoadmapId;
          const rStats = computeRoadmapStats(r);

          return (
            <div
              key={r.id}
              onClick={() => setSelectedRoadmapId(r.id)}
              className={`group relative p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between shadow-sm ${
                isSelected
                  ? 'bg-[#172231] border-[#0D9488] ring-1 ring-[#0D9488]/40'
                  : 'bg-[#101722] border-[#263548] hover:border-[#334963] hover:bg-[#1C2A3B]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg border ${
                      isSelected
                        ? 'bg-[#082B2A] text-[#2DD4BF] border-[#0D9488]'
                        : 'bg-[#0A1018] text-[#94A3B8] border-[#263548]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <span className="text-[10px] font-mono font-medium text-[#60A5FA]">
                    {r.badge}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-[#F1F5F9] line-clamp-1">{r.title}</h3>
                <p className="text-[11px] text-[#94A3B8] mt-1 line-clamp-2 leading-relaxed">
                  {r.summary}
                </p>
              </div>

              {/* Progress Bar & Ratio */}
              <div className="mt-4 pt-3 border-t border-[#1B2838] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[#94A3B8]">
                    {rStats.completedItems}/{rStats.totalItems} items
                  </span>
                  <span className="font-mono font-bold text-[#10B981]">{rStats.percent}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#0A1018] overflow-hidden border border-[#263548]/40">
                  <div
                    className="h-full bg-gradient-to-r from-[#0D9488] to-[#10B981] rounded-full transition-all duration-300"
                    style={{ width: `${rStats.percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Roadmap Banner & Controls */}
      {currentRoadmap && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[#101722] border border-[#263548] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] uppercase">
                  {currentRoadmap.shortCode}
                </span>
                {currentRoadmap.targetYear && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#172231] text-[#94A3B8] border border-[#263548]">
                    Target: {currentRoadmap.targetYear}
                  </span>
                )}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#082B2A]/60 text-[#2DD4BF] border border-[#0D9488]/40">
                  {currentRoadmap.badge}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-[#F1F5F9] tracking-tight">
                {currentRoadmap.title}
              </h2>
              <p className="text-xs text-[#CBD5E1] max-w-3xl leading-relaxed">
                {currentRoadmap.summary}
              </p>
            </div>

            {/* Edit / Delete Roadmap Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleOpenAddModule}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#CBD5E1] bg-[#172231] hover:bg-[#1C2A3B] border border-[#263548] rounded-xl transition-colors cursor-pointer"
                title="Add a new syllabus module"
              >
                <Plus className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Add Module</span>
              </button>

              <button
                onClick={() => handleOpenEditRoadmap(currentRoadmap)}
                className="p-2 text-[#94A3B8] hover:text-[#10B981] hover:bg-[#1C2A3B] rounded-xl transition-colors cursor-pointer"
                title="Edit Roadmap Details"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              {roadmaps.length > 1 && (
                <button
                  onClick={() => setRoadmapToDelete(currentRoadmap)}
                  className="p-2 text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#1C2A3B] rounded-xl transition-colors cursor-pointer"
                  title="Delete Roadmap"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Detailed Progress Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548]">
              <p className="text-[10px] font-medium text-[#94A3B8] uppercase">Calculated Mastery</p>
              <p className="text-base font-bold text-[#10B981] mt-0.5">{currentStats.percent}%</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548]">
              <p className="text-[10px] font-medium text-[#94A3B8] uppercase">Topics / Drills</p>
              <p className="text-base font-bold text-[#F1F5F9] mt-0.5">
                {currentStats.completedItems}{' '}
                <span className="text-xs text-[#64748B] font-normal">/ {currentStats.totalItems}</span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548]">
              <p className="text-[10px] font-medium text-[#94A3B8] uppercase">Syllabus Modules</p>
              <p className="text-base font-bold text-[#F1F5F9] mt-0.5">{currentRoadmap.modules.length}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548]">
              <p className="text-[10px] font-medium text-[#94A3B8] uppercase">Estimated Hours</p>
              <p className="text-base font-bold text-[#2DD4BF] mt-0.5">
                ~{currentStats.completedHours}{' '}
                <span className="text-xs text-[#64748B] font-normal">/ {currentStats.totalHours} hrs</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#101722] border border-[#263548]">
        <div className="flex items-center gap-1.5">
          {(['all', 'in_progress', 'completed'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all cursor-pointer ${
                filterMode === mode
                  ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B]'
              }`}
            >
              {mode === 'all' ? 'All Topics' : mode.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#64748B]" />
          <input
            type="text"
            placeholder="Search syllabus, drills, topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] transition-colors"
          />
        </div>
      </div>

      {/* Modules and Topics Accordion */}
      {currentRoadmap && currentRoadmap.modules.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#101722] border border-[#263548] space-y-3">
          <Layers className="w-10 h-10 text-[#64748B] mx-auto" />
          <h3 className="text-sm font-semibold text-[#F1F5F9]">No modules in this roadmap</h3>
          <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
            Click &quot;Add Module&quot; to begin building your curriculum chapters and study drills.
          </p>
          <button
            onClick={handleOpenAddModule}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-xl cursor-pointer transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Module</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {currentRoadmap?.modules.map((m, mIdx) => {
            const mStats = computeModuleStats(m);

            // Filter topics in this module based on search and status
            const filteredTopics = m.topics.filter((t) => {
              const done = isTopicDone(t);
              if (filterMode === 'completed' && !done) return false;
              if (filterMode === 'in_progress' && done) return false;
              if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = t.title.toLowerCase().includes(q);
                const matchDesc = t.description.toLowerCase().includes(q);
                const matchSubs = t.subtopics.some((st) => st.title.toLowerCase().includes(q));
                const matchDrills = t.practiceQuestions?.some((pq) =>
                  pq.question.toLowerCase().includes(q)
                );
                if (!matchTitle && !matchDesc && !matchSubs && !matchDrills) return false;
              }
              return true;
            });

            return (
              <div
                key={m.id}
                className="rounded-2xl bg-[#101722] border border-[#263548] hover:border-[#263548]/90 transition-all overflow-hidden shadow-sm"
              >
                {/* Module Bar */}
                <div className="p-4 sm:p-5 bg-[#0A1018] border-b border-[#263548] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold bg-[#172231] text-[#94A3B8] border border-[#263548]">
                        Module {mIdx + 1}
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#64748B]" />
                        <span>~{m.estimatedHours} hrs</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#10B981] font-semibold">
                        ({mStats.mCompleted}/{mStats.mTotal} items • {mStats.percent}%)
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#F1F5F9] tracking-tight">
                      {m.title}
                    </h3>
                  </div>

                  {/* Module Actions & Progress Bar */}
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:block w-32 h-2 rounded-full bg-[#172231] overflow-hidden border border-[#263548]/50">
                      <div
                        className="h-full bg-[#10B981] rounded-full transition-all"
                        style={{ width: `${mStats.percent}%` }}
                      />
                    </div>

                    <button
                      onClick={() => handleOpenAddTopic(m.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#10B981] hover:bg-[#082B2A] rounded-xl transition-colors cursor-pointer"
                      title="Add a topic to this module"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Topic</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModule(m)}
                      className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] rounded-xl hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                      title="Edit Module"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        setModuleToDelete({
                          roadmapId: currentRoadmap.id,
                          moduleId: m.id,
                          title: m.title,
                        })
                      }
                      className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] rounded-xl hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                      title="Delete Module"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Topics in Module */}
                <div className="p-4 sm:p-5 space-y-3">
                  {filteredTopics.length === 0 ? (
                    <p className="text-xs text-[#64748B] italic py-2">
                      {searchQuery || filterMode !== 'all'
                        ? 'No topics in this module match your search/filter.'
                        : 'No topics in this module yet. Click "+ Topic" to add one.'}
                    </p>
                  ) : (
                    filteredTopics.map((topic) => {
                      const done = isTopicDone(topic);
                      const isExpanded = expandedTopicId === topic.id;
                      const hasSubtopics = topic.subtopics.length > 0;
                      const completedSubs = topic.subtopics.filter((s) => s.completed).length;

                      return (
                        <div
                          key={topic.id}
                          className={`rounded-xl border transition-all ${
                            done
                              ? 'bg-[#0A1018]/60 border-[#10B981]/20'
                              : 'bg-[#0A1018] border-[#263548] hover:border-[#263548]/80'
                          }`}
                        >
                          {/* Topic Headline */}
                          <div className="p-3.5 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <button
                                onClick={() => handleToggleTopic(topic.id)}
                                className="mt-0.5 text-[#64748B] hover:text-[#10B981] transition-colors shrink-0"
                                title={done ? 'Mark as incomplete' : 'Mark as complete'}
                              >
                                {done ? (
                                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[#64748B]" />
                                )}
                              </button>

                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4
                                    className={`text-xs sm:text-sm font-semibold truncate ${
                                      done ? 'line-through text-[#64748B]' : 'text-[#F1F5F9]'
                                    }`}
                                  >
                                    {topic.title}
                                  </h4>

                                  {hasSubtopics && (
                                    <span className="text-[10px] font-mono text-[#94A3B8] bg-[#172231] px-1.5 py-0.2 rounded border border-[#263548] shrink-0">
                                      {completedSubs}/{topic.subtopics.length} subs
                                    </span>
                                  )}

                                  {topic.practiceQuestions && topic.practiceQuestions.length > 0 && (
                                    <span className="text-[10px] font-mono text-[#2DD4BF] bg-[#082B2A] px-1.5 py-0.2 rounded border border-[#0D9488]/40 shrink-0">
                                      {topic.practiceQuestions.length} drills
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[#94A3B8] leading-relaxed">
                                  {topic.description}
                                </p>
                              </div>
                            </div>

                            {/* Actions & Expand Chevron */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditTopic(m.id, topic)}
                                className="p-1.5 text-[#94A3B8] hover:text-[#10B981] rounded-xl hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                                title="Edit Topic"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setTopicToDelete({
                                    roadmapId: currentRoadmap.id,
                                    moduleId: m.id,
                                    topicId: topic.id,
                                    title: topic.title,
                                  })
                                }
                                className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] rounded-xl hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                                title="Delete Topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() =>
                                  setExpandedTopicId((prev) => (prev === topic.id ? null : topic.id))
                                }
                                className="p-1.5 text-[#94A3B8] hover:text-[#F1F5F9] rounded-xl hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                                title={isExpanded ? 'Collapse topic details' : 'Expand topic details'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-4 h-4 text-[#10B981]" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded Details: Subtopics, Resources, Practice Questions */}
                          {isExpanded && (
                            <div className="border-t border-[#263548] bg-[#080C12]/50 p-4 space-y-4 animate-in fade-in duration-150">
                              {/* Subtopics Checklist */}
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider">
                                    Subtopics & Breakdown Checklist
                                  </span>

                                  <button
                                    onClick={() =>
                                      setIsAddingSubtopic((prev) => ({
                                        ...prev,
                                        [topic.id]: !prev[topic.id],
                                      }))
                                    }
                                    className="flex items-center gap-1 text-[11px] font-semibold text-[#10B981] hover:text-[#2DD4BF] cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Add Subtopic</span>
                                  </button>
                                </div>

                                {isAddingSubtopic[topic.id] && (
                                  <div className="flex items-center gap-2 p-2 rounded-xl bg-[#101722] border border-[#263548]">
                                    <input
                                      type="text"
                                      placeholder="Subtopic title..."
                                      value={newSubtopicTitle[topic.id] || ''}
                                      onChange={(e) =>
                                        setNewSubtopicTitle((prev) => ({
                                          ...prev,
                                          [topic.id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 px-2.5 py-1 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                                    />
                                    <button
                                      onClick={() => handleAddSubtopic(topic.id)}
                                      className="px-2.5 py-1 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() =>
                                        setIsAddingSubtopic((prev) => ({ ...prev, [topic.id]: false }))
                                      }
                                      className="p-1 text-[#94A3B8] hover:text-[#F1F5F9]"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}

                                {topic.subtopics.length === 0 ? (
                                  <p className="text-xs text-[#64748B] italic">
                                    No subtopics listed yet.
                                  </p>
                                ) : (
                                  <div className="space-y-1">
                                    {topic.subtopics.map((st) => (
                                      <div
                                        key={st.id}
                                        className="group flex items-center justify-between p-2 rounded-xl bg-[#101722] border border-[#263548] text-xs"
                                      >
                                        <div
                                          onClick={() => handleToggleSubtopic(topic.id, st.id)}
                                          className="flex items-center gap-2 cursor-pointer flex-1 min-w-0"
                                        >
                                          {st.completed ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                                          ) : (
                                            <Circle className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#10B981] shrink-0" />
                                          )}
                                          <span
                                            className={`truncate ${
                                              st.completed
                                                ? 'line-through text-[#64748B]'
                                                : 'text-[#CBD5E1]'
                                            }`}
                                          >
                                            {st.title}
                                          </span>
                                        </div>

                                        <button
                                          onClick={() => handleDeleteSubtopic(topic.id, st.id)}
                                          className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-[#FB7185] transition-opacity"
                                          title="Delete subtopic"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Study Resources */}
                              {topic.resources.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[11px] font-bold text-[#CBD5E1] uppercase tracking-wider">
                                    Curriculum Resources & References
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {topic.resources.map((res, rIdx) => (
                                      <a
                                        key={rIdx}
                                        href={res.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#101722] border border-[#263548] hover:border-[#10B981]/50 text-xs text-[#CBD5E1] group transition-colors"
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <BookOpen className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                                          <span className="truncate group-hover:text-[#2DD4BF]">
                                            {res.title}
                                          </span>
                                        </div>
                                        <ExternalLink className="w-3 h-3 text-[#64748B] group-hover:text-[#10B981] shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Practice Questions / Drills */}
                              {topic.practiceQuestions && topic.practiceQuestions.length > 0 && (
                                <div className="space-y-2 pt-1">
                                  <span className="text-[11px] font-bold text-[#2DD4BF] uppercase tracking-wider">
                                    Active Recall Drills ({topic.practiceQuestions.length})
                                  </span>
                                  <div className="space-y-2">
                                    {topic.practiceQuestions.map((pq) => {
                                      const isAnswerVisible = revealedAnswers[pq.id];

                                      return (
                                        <div
                                          key={pq.id}
                                          className="p-3 rounded-xl bg-[#101722] border border-[#263548] space-y-2 text-xs"
                                        >
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-[#F1F5F9] leading-relaxed">
                                              {pq.question}
                                            </p>
                                            <span
                                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase shrink-0 ${
                                                pq.difficulty === 'Hard'
                                                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                                                  : pq.difficulty === 'Medium'
                                                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40'
                                                  : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                                              }`}
                                            >
                                              {pq.difficulty}
                                            </span>
                                          </div>

                                          {pq.options && (
                                            <ul className="space-y-1 pl-1 text-[11px] text-slate-400">
                                              {pq.options.map((opt, oIdx) => (
                                                <li key={oIdx} className="flex items-center gap-1.5">
                                                  <span className="font-mono text-slate-500">
                                                    {String.fromCharCode(65 + oIdx)}.
                                                  </span>
                                                  <span>{opt}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          )}

                                          <div className="pt-1 flex items-center justify-between border-t border-slate-800/80">
                                            <button
                                              onClick={() => toggleRevealAnswer(pq.id)}
                                              className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                                            >
                                              <HelpCircle className="w-3 h-3" />
                                              <span>{isAnswerVisible ? 'Hide Solution' : 'Reveal Solution'}</span>
                                            </button>

                                            {isAnswerVisible && (
                                              <span className="text-[11px] font-bold text-emerald-400">
                                                Answer: {pq.answer}
                                              </span>
                                            )}
                                          </div>

                                          {isAnswerVisible && pq.explanation && (
                                            <p className="p-2 rounded bg-slate-950 text-[11px] text-slate-300 border border-slate-800 leading-relaxed">
                                              {pq.explanation}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Topic Notes */}
                              {topic.notes && (
                                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                                  <span className="font-semibold text-slate-300">Notes: </span>
                                  {topic.notes}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ROADMAP ADD / EDIT MODAL */}
      {isRoadmapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-[#101722] border border-[#263548] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#263548]">
              <h3 className="text-base font-bold text-[#F1F5F9] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#10B981]" />
                <span>{editingRoadmapId ? 'Edit Learning Roadmap' : 'New Learning Roadmap'}</span>
              </h3>
              <button
                onClick={() => setIsRoadmapModalOpen(false)}
                className="p-1 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoadmap} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Roadmap Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems & High-Throughput Engines"
                  value={roadmapFormTitle}
                  onChange={(e) => setRoadmapFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Short Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIST-SYS"
                    value={roadmapFormShortCode}
                    onChange={(e) => setRoadmapFormShortCode(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Badge Label
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Mastery"
                    value={roadmapFormBadge}
                    onChange={(e) => setRoadmapFormBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Target Year / Period
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={roadmapFormTargetYear}
                    onChange={(e) => setRoadmapFormTargetYear(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Icon Theme
                  </label>
                  <select
                    value={roadmapFormIcon}
                    onChange={(e) => setRoadmapFormIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  >
                    <option value="GraduationCap">Graduation Cap</option>
                    <option value="Cpu">CPU / Systems</option>
                    <option value="Code2">Code / Full-Stack</option>
                    <option value="Cloud">Cloud / Infrastructure</option>
                    <option value="Compass">Compass / Discovery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Executive Summary *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summary of skills, outcomes, and syllabus focus..."
                  value={roadmapFormSummary}
                  onChange={(e) => setRoadmapFormSummary(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#263548]">
                <button
                  type="button"
                  onClick={() => setIsRoadmapModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors shadow-sm cursor-pointer"
                >
                  {editingRoadmapId ? 'Save Roadmap' : 'Create Roadmap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODULE ADD / EDIT MODAL */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-[#263548] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263548]">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#10B981]" />
                <span>{editingModule?.module ? 'Edit Module' : 'Add Module'}</span>
              </h3>
              <button
                onClick={() => setIsModuleModalOpen(false)}
                className="p-1 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Concurrency Models & Lockless Algorithms"
                  value={moduleFormTitle}
                  onChange={(e) => setModuleFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Estimated Study Hours
                </label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={moduleFormHours}
                  onChange={(e) => setModuleFormHours(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors shadow-sm cursor-pointer"
                >
                  Save Module
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOPIC ADD / EDIT MODAL */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-[#263548] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#263548]">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#10B981]" />
                <span>{editingTopic?.topic ? 'Edit Topic' : 'Add Topic'}</span>
              </h3>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1 rounded-xl text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Topic Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Actor Model vs CSP"
                  value={topicFormTitle}
                  onChange={(e) => setTopicFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Concepts covered, mathematical foundations, or key takeaways..."
                  value={topicFormDescription}
                  onChange={(e) => setTopicFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Personal Study Notes (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Quick tips, memory hooks, or pointers..."
                  value={topicFormNotes}
                  onChange={(e) => setTopicFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-xl text-xs text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#5EEAD4] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] transition-colors shadow-sm cursor-pointer"
                >
                  Save Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ROADMAP CONFIRMATION MODAL */}
      {roadmapToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-rose-950/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Delete Roadmap?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">&quot;{roadmapToDelete.title}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              This will remove this curriculum track and all its modules, topics, and subtopics. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
              <button
                type="button"
                onClick={() => setRoadmapToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoadmap}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete Roadmap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODULE CONFIRMATION MODAL */}
      {moduleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-rose-950/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Delete Module?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">&quot;{moduleToDelete.title}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              This will remove this module and all its included topics.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
              <button
                type="button"
                onClick={() => setModuleToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteModule}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete Module
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE TOPIC CONFIRMATION MODAL */}
      {topicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-[#101722] border border-rose-950/70 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9]">Delete Topic?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">&quot;{topicToDelete.title}&quot;</p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] leading-relaxed">
              This will delete this topic, its subtopics, and associated drill notes.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#263548]">
              <button
                type="button"
                onClick={() => setTopicToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#1C2A3B] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteTopic}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
