/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Bookmark,
  Pin,
  Tag,
  Trash2,
  Edit2,
  Folder,
  Layers,
  Cpu,
  GraduationCap,
  Server,
  Briefcase,
  ExternalLink,
  Check,
  Copy,
  FolderPlus,
  X,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Note, NoteFolder, Project, LearningRoadmap, NavigationItem } from '../types';
import { storageService } from '../services/storageService';

interface KnowledgePageProps {
  notes: Note[];
  folders: NoteFolder[];
  projects?: Project[];
  roadmaps?: LearningRoadmap[];
  onNotesChange: () => void;
  onNavigate?: (tab: NavigationItem) => void;
}

export const KnowledgePage: React.FC<KnowledgePageProps> = ({
  notes,
  folders,
  projects = [],
  roadmaps = [],
  onNotesChange,
  onNavigate,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [showOnlyPinned, setShowOnlyPinned] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Edit / Add Note Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formFolderId, setFormFolderId] = useState('folder-genai');
  const [formContent, setFormContent] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formBookmarked, setFormBookmarked] = useState(false);

  // Linked Entity state
  const [linkType, setLinkType] = useState<'none' | 'project' | 'roadmap'>('none');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  // Add Folder Modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderIcon, setNewFolderIcon] = useState('Layers');

  // Delete Confirmation Modal
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  // Flat list of topics for linking
  const allLearningTopics = useMemo(() => {
    const list: { id: string; title: string; roadmapTitle: string }[] = [];
    roadmaps.forEach((r) => {
      r.modules.forEach((m) => {
        m.topics.forEach((t) => {
          list.push({
            id: t.id,
            title: `${r.title} → ${t.title}`,
            roadmapTitle: r.title,
          });
        });
      });
    });
    return list;
  }, [roadmaps]);

  // Aggregate tags with counts
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    notes.forEach((n) => {
      n.tags.forEach((t) => {
        const clean = t.trim();
        if (clean) {
          map.set(clean, (map.get(clean) || 0) + 1);
        }
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  // Filtered Notes
  const filteredNotes = useMemo(() => {
    return notes
      .filter((n) => {
        if (selectedFolderId !== 'folder-all' && n.folderId !== selectedFolderId) {
          return false;
        }
        if (showOnlyBookmarked && !n.isBookmarked) {
          return false;
        }
        if (showOnlyPinned && !n.isPinned) {
          return false;
        }
        if (selectedTag && !n.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = n.title.toLowerCase().includes(q);
          const matchesContent = n.content.toLowerCase().includes(q);
          const matchesTags = n.tags.some((t) => t.toLowerCase().includes(q));
          const matchesLinked = n.linkedEntity?.title.toLowerCase().includes(q);
          if (!matchesTitle && !matchesContent && !matchesTags && !matchesLinked) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, selectedFolderId, showOnlyBookmarked, showOnlyPinned, selectedTag, searchQuery]);

  // Active note
  const activeNote = useMemo(() => {
    if (selectedNoteId) {
      const found = notes.find((n) => n.id === selectedNoteId);
      if (found) return found;
    }
    return filteredNotes[0] || null;
  }, [notes, selectedNoteId, filteredNotes]);

  // Toggle bookmark
  const handleToggleBookmark = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    storageService.updateNote({ ...note, isBookmarked: !note.isBookmarked });
    onNotesChange();
  };

  // Toggle pin
  const handleTogglePin = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    storageService.updateNote({ ...note, isPinned: !note.isPinned });
    onNotesChange();
  };

  // Copy note content
  const handleCopyNote = (n: Note) => {
    const text = `# ${n.title}\n\n${n.content}`;
    navigator.clipboard.writeText(text);
    setCopiedNoteId(n.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Delete note confirmation
  const confirmDeleteNote = () => {
    if (!deletingNote) return;
    storageService.deleteNote(deletingNote.id);
    if (selectedNoteId === deletingNote.id) {
      setSelectedNoteId('');
    }
    setDeletingNote(null);
    onNotesChange();
  };

  // Open Add modal
  const handleOpenAdd = () => {
    setEditingNoteId(null);
    setFormTitle('');
    setFormFolderId(selectedFolderId !== 'folder-all' ? selectedFolderId : folders[0]?.id || 'folder-genai');
    setFormContent('## Overview\n\nKey takeaways, technical intuition, or architectural details.\n\n### Key Concepts\n- Point 1\n- Point 2\n\n```python\n# Implementation snippet\n```');
    setFormTags(selectedTag ? selectedTag : 'Engineering');
    setFormPinned(false);
    setFormBookmarked(false);
    setLinkType('none');
    setSelectedEntityId('');
    setIsModalOpen(true);
  };

  // Open Edit modal
  const handleOpenEdit = (n: Note) => {
    setEditingNoteId(n.id);
    setFormTitle(n.title);
    setFormFolderId(n.folderId);
    setFormContent(n.content);
    setFormTags(n.tags.join(', '));
    setFormPinned(n.isPinned);
    setFormBookmarked(n.isBookmarked);

    if (n.linkedEntity) {
      setLinkType(n.linkedEntity.type === 'project' ? 'project' : 'roadmap');
      setSelectedEntityId(n.linkedEntity.id);
    } else {
      setLinkType('none');
      setSelectedEntityId('');
    }
    setIsModalOpen(true);
  };

  // Save Note
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let linkedEntity: Note['linkedEntity'] = undefined;
    if (linkType === 'project' && selectedEntityId) {
      const proj = projects.find((p) => p.id === selectedEntityId);
      if (proj) {
        linkedEntity = {
          type: 'project',
          id: proj.id,
          title: proj.name,
        };
      }
    } else if (linkType === 'roadmap' && selectedEntityId) {
      const topic = allLearningTopics.find((t) => t.id === selectedEntityId);
      if (topic) {
        linkedEntity = {
          type: 'roadmap',
          id: topic.id,
          title: topic.title,
        };
      }
    }

    const tagList = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingNoteId) {
      const existing = notes.find((n) => n.id === editingNoteId);
      if (existing) {
        storageService.updateNote({
          ...existing,
          title: formTitle.trim(),
          folderId: formFolderId,
          content: formContent.trim(),
          tags: tagList,
          isPinned: formPinned,
          isBookmarked: formBookmarked,
          linkedEntity,
        });
      }
    } else {
      const created = storageService.addNote({
        title: formTitle.trim(),
        folderId: formFolderId,
        content: formContent.trim(),
        tags: tagList,
        isPinned: formPinned,
        isBookmarked: formBookmarked,
        linkedEntity,
      });
      setSelectedNoteId(created.id);
    }

    setIsModalOpen(false);
    onNotesChange();
  };

  // Add custom folder
  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    storageService.addNoteFolder({
      name: newFolderName.trim(),
      color: 'emerald',
      icon: newFolderIcon,
    });
    setNewFolderName('');
    setIsFolderModalOpen(false);
    onNotesChange();
  };

  const getFolderIcon = (icon: string) => {
    switch (icon) {
      case 'Cpu':
        return Cpu;
      case 'GraduationCap':
        return GraduationCap;
      case 'Server':
        return Server;
      case 'Briefcase':
        return Briefcase;
      default:
        return Layers;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#10B981]" />
            <span>Knowledge Vault & Engineering Notes</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Capture architectural blueprints, distributed systems specs, equations, and linked project insights
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#CBD5E1] bg-[#172231] border border-[#263548] hover:border-[#2DD4BF]/40 hover:text-[#F1F5F9] rounded-lg transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5 text-[#10B981]" />
            <span>New Folder</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Notebook Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[680px]">
        {/* Left Column: Folders, Filters & Tags (3 Cols) */}
        <div className="md:col-span-3 rounded-xl bg-[#101722] border border-[#263548] p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Quick Filters */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedFolderId('folder-all');
                  setShowOnlyBookmarked(false);
                  setShowOnlyPinned(false);
                  setSelectedTag(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  selectedFolderId === 'folder-all' && !showOnlyBookmarked && !showOnlyPinned && !selectedTag
                    ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-[#10B981]" />
                  <span>All Notes</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                  {notes.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowOnlyBookmarked(!showOnlyBookmarked);
                  setShowOnlyPinned(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  showOnlyBookmarked
                    ? 'bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-[#FBBF24] fill-[#FBBF24]/20" />
                  <span>Bookmarked</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                  {notes.filter((n) => n.isBookmarked).length}
                </span>
              </button>

              <button
                onClick={() => {
                  setShowOnlyPinned(!showOnlyPinned);
                  setShowOnlyBookmarked(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  showOnlyPinned
                    ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Pin className="w-4 h-4 text-[#10B981]" />
                  <span>Pinned Notes</span>
                </div>
                <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                  {notes.filter((n) => n.isPinned).length}
                </span>
              </button>
            </div>

            {/* Folders Section */}
            <div className="pt-2 border-t border-[#1B2838] space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                  Notebooks
                </span>
                <button
                  onClick={() => setIsFolderModalOpen(true)}
                  className="text-[#94A3B8] hover:text-[#2DD4BF] p-0.5"
                  title="Add Notebook Folder"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {folders
                  .filter((f) => f.id !== 'folder-all')
                  .map((f) => {
                    const Icon = getFolderIcon(f.icon);
                    const isSelected = selectedFolderId === f.id && !showOnlyBookmarked && !showOnlyPinned;
                    const count = notes.filter((n) => n.folderId === f.id).length;

                    return (
                      <button
                        key={f.id}
                        onClick={() => {
                          setSelectedFolderId(f.id);
                          setShowOnlyBookmarked(false);
                          setShowOnlyPinned(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                            : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
                          <span className="truncate">{f.name}</span>
                        </div>
                        <span className="text-[10px] font-mono tabular-nums text-[#94A3B8]">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Tags Cloud Section */}
            {tagCounts.length > 0 && (
              <div className="pt-3 border-t border-[#1B2838] space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-[#64748B]" />
                    <span>Tags</span>
                  </span>
                  {selectedTag && (
                    <button
                      onClick={() => setSelectedTag(null)}
                      className="text-[10px] text-[#2DD4BF] hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {tagCounts.map(([tag, count]) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(isSelected ? null : tag)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                          isSelected
                            ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                            : 'bg-[#0A1018] border border-[#263548] text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#5EEAD4]/40'
                        }`}
                      >
                        <span>#{tag}</span>
                        <span className="text-[9px] opacity-70">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats Footer */}
          <div className="pt-3 border-t border-[#1B2838] text-[11px] text-[#94A3B8] font-mono flex items-center justify-between">
            <span>{notes.length} total notes</span>
            <span>{notes.filter((n) => n.linkedEntity).length} cross-linked</span>
          </div>
        </div>

        {/* Middle Column: Note List (4 Cols) */}
        <div className="md:col-span-4 rounded-xl bg-[#101722] border border-[#263548] p-4 flex flex-col space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search notes, tags, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Active Filters Pill Row */}
          {(selectedTag || showOnlyBookmarked || showOnlyPinned || searchQuery) && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
              <span className="text-[#94A3B8] flex items-center gap-1">
                <Filter className="w-2.5 h-2.5" /> Filtered by:
              </span>
              {showOnlyBookmarked && (
                <span className="px-1.5 py-0.5 rounded bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30">
                  Bookmarked
                </span>
              )}
              {showOnlyPinned && (
                <span className="px-1.5 py-0.5 rounded bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488]">
                  Pinned
                </span>
              )}
              {selectedTag && (
                <span className="px-1.5 py-0.5 rounded bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488]">
                  #{selectedTag}
                </span>
              )}
              {searchQuery && (
                <span className="px-1.5 py-0.5 rounded bg-[#172231] text-[#CBD5E1]">
                  "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedTag(null);
                  setShowOnlyBookmarked(false);
                  setShowOnlyPinned(false);
                  setSearchQuery('');
                  setSelectedFolderId('folder-all');
                }}
                className="text-[#2DD4BF] hover:underline ml-auto"
              >
                Reset
              </button>
            </div>
          )}

          {/* Notes List */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {filteredNotes.length === 0 ? (
              <div className="py-16 px-2 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A1018] border border-[#263548] flex items-center justify-center text-[#94A3B8]">
                  <BookOpen className="w-5 h-5 text-[#10B981]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-semibold text-[#F1F5F9]">No notes found</h4>
                  <p className="text-[11px] text-[#94A3B8]">
                    {searchQuery || selectedTag || showOnlyBookmarked
                      ? 'No notes match your active query or filters.'
                      : 'This notebook is currently empty.'}
                  </p>
                </div>
                {searchQuery || selectedTag || showOnlyBookmarked ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                      setShowOnlyBookmarked(false);
                      setShowOnlyPinned(false);
                      setSelectedFolderId('folder-all');
                    }}
                    className="px-2.5 py-1 rounded bg-[#172231] text-[11px] text-[#CBD5E1] hover:text-[#F1F5F9]"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAdd}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] shadow-sm transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Note</span>
                  </button>
                )}
              </div>
            ) : (
              filteredNotes.map((n) => {
                const isSelected = activeNote?.id === n.id;
                const folderName = folders.find((f) => f.id === n.folderId)?.name;

                return (
                  <div
                    key={n.id}
                    onClick={() => setSelectedNoteId(n.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2 group ${
                      isSelected
                        ? 'bg-[#172231] border-[#2DD4BF] shadow-md ring-1 ring-[#2DD4BF]/30'
                        : 'bg-[#0A1018] border-[#263548] hover:border-[#2DD4BF]/40 hover:bg-[#172231]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {n.isPinned && (
                          <Pin className="w-3 h-3 text-[#10B981] fill-[#10B981] shrink-0" />
                        )}
                        <h4 className="text-xs font-bold text-[#F1F5F9] truncate group-hover:text-[#2DD4BF] transition-colors">
                          {n.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => handleToggleBookmark(n.id, e)}
                          className="text-[#94A3B8] hover:text-[#FBBF24] p-0.5 transition-colors"
                          title={n.isBookmarked ? 'Bookmarked' : 'Add bookmark'}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              n.isBookmarked ? 'text-[#FBBF24] fill-[#FBBF24]' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#94A3B8] line-clamp-2 leading-relaxed">
                      {n.content.replace(/#|\*|`|\$/g, '')}
                    </p>

                    {/* Linked entity tag */}
                    {n.linkedEntity && (
                      <div className="flex items-center gap-1 text-[10px] text-[#2DD4BF] font-mono truncate">
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">
                          {n.linkedEntity.type}: {n.linkedEntity.title}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-[#64748B] font-mono pt-1 border-t border-[#1B2838]">
                      <span className="truncate">{folderName || 'General'}</span>
                      <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Note Viewer & Detail (5 Cols) */}
        <div className="md:col-span-5 rounded-xl bg-[#101722] border border-[#263548] p-6 flex flex-col justify-between space-y-4">
          {activeNote ? (
            <div className="space-y-4 flex-1 overflow-y-auto">
              {/* Note Header & Actions */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1B2838]">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {activeNote.isPinned && (
                      <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 px-1.5 py-0.5 rounded border border-[#10B981]/30 flex items-center gap-1">
                        <Pin className="w-2.5 h-2.5 fill-[#10B981]" />
                        Pinned
                      </span>
                    )}
                    {activeNote.isBookmarked && (
                      <span className="text-[10px] font-mono text-[#FBBF24] bg-[#FBBF24]/10 px-1.5 py-0.5 rounded border border-[#FBBF24]/30 flex items-center gap-1">
                        <Bookmark className="w-2.5 h-2.5 fill-[#FBBF24]" />
                        Bookmarked
                      </span>
                    )}
                    <span className="text-[11px] text-[#94A3B8] font-mono">
                      Updated {new Date(activeNote.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-[#F1F5F9] leading-tight">
                    {activeNote.title}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleToggleBookmark(activeNote.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#FBBF24] hover:bg-[#172231] transition-colors"
                    title={activeNote.isBookmarked ? 'Remove Bookmark' : 'Bookmark Note'}
                  >
                    <Bookmark
                      className={`w-4 h-4 ${
                        activeNote.isBookmarked ? 'text-[#FBBF24] fill-[#FBBF24]' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleTogglePin(activeNote.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#10B981] hover:bg-[#172231] transition-colors"
                    title={activeNote.isPinned ? 'Unpin' : 'Pin to top'}
                  >
                    <Pin className={`w-4 h-4 ${activeNote.isPinned ? 'fill-[#10B981] text-[#10B981]' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleCopyNote(activeNote)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231] transition-colors"
                    title="Copy Note"
                  >
                    {copiedNoteId === activeNote.id ? (
                      <Check className="w-4 h-4 text-[#10B981]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(activeNote)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231] transition-colors"
                    title="Edit Note"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingNote(activeNote)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#172231] transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Linked Entity Banner */}
              {activeNote.linkedEntity && (
                <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548] text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {activeNote.linkedEntity.type === 'project' ? (
                      <Briefcase className="w-4 h-4 text-[#10B981] shrink-0" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-[#2DD4BF] shrink-0" />
                    )}
                    <div className="truncate">
                      <span className="text-[10px] text-[#94A3B8] uppercase tracking-wider block">
                        Linked {activeNote.linkedEntity.type}
                      </span>
                      <span className="text-[#F1F5F9] font-medium truncate block">
                        {activeNote.linkedEntity.title}
                      </span>
                    </div>
                  </div>

                  {onNavigate && (
                    <button
                      onClick={() =>
                        onNavigate(
                          activeNote.linkedEntity?.type === 'project' ? 'projects' : 'learning'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#172231] text-[11px] font-medium text-[#2DD4BF] hover:bg-[#1C2A3B] transition-colors shrink-0"
                    >
                      <span>Jump</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Note Content Viewer */}
              <div className="prose prose-invert max-w-none text-xs text-[#CBD5E1] leading-relaxed font-mono whitespace-pre-wrap bg-[#0A1018] p-4 rounded-xl border border-[#263548] overflow-x-auto">
                {activeNote.content}
              </div>

              {/* Tags & Metadata */}
              <div className="pt-3 border-t border-[#1B2838] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Tag className="w-3 h-3 text-[#64748B]" />
                  {activeNote.tags.length > 0 ? (
                    activeNote.tags.map((t, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTag(t)}
                        className="text-[10px] font-mono text-[#CBD5E1] bg-[#0A1018] border border-[#263548] hover:border-[#5EEAD4]/50 hover:text-[#2DD4BF] px-2 py-0.5 rounded transition-colors"
                      >
                        #{t}
                      </button>
                    ))
                  ) : (
                    <span className="text-[10px] text-[#64748B]">No tags</span>
                  )}
                </div>

                <div className="text-[10px] text-[#94A3B8] font-mono">
                  {activeNote.content.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0A1018] border border-[#263548] flex items-center justify-center text-[#94A3B8]">
                <BookOpen className="w-6 h-6 text-[#10B981]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#F1F5F9]">No Note Selected</h3>
                <p className="text-xs text-[#94A3B8] max-w-xs">
                  Select a note from the notebook list to review equations, architectural specs, or write a new document.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Note</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#101722] border border-[#263548] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B2838]">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#10B981]" />
                <span>{editingNoteId ? 'Edit Knowledge Note' : 'Create Knowledge Note'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Title <span className="text-[#10B981]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed KV-Cache Memory Formula & Chunking"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-sm text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Folder</label>
                  <select
                    value={formFolderId}
                    onChange={(e) => setFormFolderId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  >
                    {folders
                      .filter((f) => f.id !== 'folder-all')
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="AI, CUDA, SystemDesign, Transformers"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              {/* Link to Project or Learning Topic */}
              <div className="p-3 rounded-xl bg-[#0A1018] border border-[#263548] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-[#CBD5E1] flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Link to Project or Learning Topic (Optional)</span>
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    {(['none', 'project', 'roadmap'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setLinkType(t);
                          setSelectedEntityId('');
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                          linkType === t
                            ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                            : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                        }`}
                      >
                        {t === 'none' ? 'None' : t === 'project' ? 'Project' : 'Learning'}
                      </button>
                    ))}
                  </div>
                </div>

                {linkType === 'project' && (
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">Select Project</label>
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#172231] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                    >
                      <option value="">-- Choose a Project --</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {linkType === 'roadmap' && (
                  <div>
                    <label className="block text-[11px] text-[#94A3B8] mb-1">
                      Select Learning Topic
                    </label>
                    <select
                      value={selectedEntityId}
                      onChange={(e) => setSelectedEntityId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#172231] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                    >
                      <option value="">-- Choose a Topic --</option>
                      {allLearningTopics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Content (Markdown / Plaintext)
                </label>
                <textarea
                  rows={9}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs font-mono text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4] resize-y"
                  placeholder="Draft your engineering notes, markdown equations, code blocks..."
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={formPinned}
                    onChange={(e) => setFormPinned(e.target.checked)}
                    className="rounded text-[#10B981] bg-[#0A1018] border-[#263548] focus:ring-[#5EEAD4]"
                  />
                  <span>Pin to top of list</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    checked={formBookmarked}
                    onChange={(e) => setFormBookmarked(e.target.checked)}
                    className="rounded text-[#FBBF24] bg-[#0A1018] border-[#263548] focus:ring-[#FBBF24]"
                  />
                  <span>Mark as bookmarked</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1B2838]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] rounded-lg shadow-sm hover:bg-[#059669] transition-colors"
                >
                  {editingNoteId ? 'Save Changes' : 'Create Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#101722] border border-[#263548] rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#1B2838]">
              <h3 className="text-xs font-bold text-[#F1F5F9] flex items-center gap-1.5">
                <FolderPlus className="w-4 h-4 text-[#10B981]" />
                <span>New Notebook Folder</span>
              </h3>
              <button
                onClick={() => setIsFolderModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LLM Inference & CUDA"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Icon Style</label>
                <select
                  value={newFolderIcon}
                  onChange={(e) => setNewFolderIcon(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                >
                  <option value="Layers">Layers</option>
                  <option value="Cpu">Cpu / Hardware</option>
                  <option value="Server">Server / Systems</option>
                  <option value="GraduationCap">Academic / Research</option>
                  <option value="Briefcase">Career / Prep</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1B2838]">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deletingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#101722] border border-[#FB7185]/30 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="w-10 h-10 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FB7185]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">Delete Note?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#CBD5E1] bg-[#0A1018] p-2.5 rounded-lg border border-[#263548] font-medium">
              "{deletingNote.title}"
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 rounded-lg shadow-sm transition-colors"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
