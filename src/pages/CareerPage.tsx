/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  LayoutList,
  Kanban,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  User,
  DollarSign,
  FileText,
  Filter,
  X,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { JobApplication, JobStatus, NavigationItem } from '../types';
import { storageService } from '../services/storageService';

interface CareerPageProps {
  jobs: JobApplication[];
  onJobsChange: () => void;
  onNavigate?: (tab: NavigationItem) => void;
}

export const CareerPage: React.FC<CareerPageProps> = ({
  jobs,
  onJobsChange,
  onNavigate,
}) => {
  const [layoutMode, setLayoutMode] = useState<'list' | 'kanban'>('list');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFollowUpsDue, setOnlyFollowUpsDue] = useState(false);
  const [sortBy, setSortBy] = useState<'followUp' | 'appDate' | 'company'>('followUp');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('Remote');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<JobStatus>('applied');
  const [nextStep, setNextStep] = useState('Recruiter phone screen follow-up');
  const [followUpDate, setFollowUpDate] = useState('');
  const [salaryRange, setSalaryRange] = useState('$190k - $240k');
  const [contactPerson, setContactPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');

  // Selected Detail Modal / Drawer
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobApplication | null>(null);

  // Delete Confirmation Modal
  const [deletingJob, setDeletingJob] = useState<JobApplication | null>(null);

  // Today's date string
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Helper to determine follow-up urgency
  const getFollowUpUrgency = (dateStr?: string, jobStatus?: JobStatus) => {
    if (!dateStr || jobStatus === 'offered' || jobStatus === 'rejected') {
      return { status: 'none', label: 'No Action Required' };
    }
    const today = new Date(todayStr).getTime();
    const target = new Date(dateStr).getTime();
    const diffDays = Math.round((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: `Overdue by ${Math.abs(diffDays)}d`, diffDays };
    } else if (diffDays === 0) {
      return { status: 'due-today', label: 'Due Today', diffDays };
    } else if (diffDays <= 3) {
      return { status: 'due-soon', label: `Due in ${diffDays}d`, diffDays };
    }
    return { status: 'scheduled', label: `Scheduled for ${dateStr}`, diffDays };
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = jobs.length;
    const bookmarked = jobs.filter((j) => j.status === 'bookmarked').length;
    const applied = jobs.filter((j) => j.status === 'applied').length;
    const interviewing = jobs.filter((j) => j.status === 'interviewing').length;
    const offered = jobs.filter((j) => j.status === 'offered').length;
    const rejected = jobs.filter((j) => j.status === 'rejected').length;

    const followUpsPending = jobs.filter((j) => {
      if (j.status === 'offered' || j.status === 'rejected') return false;
      const urg = getFollowUpUrgency(j.followUpDate, j.status);
      return urg.status === 'overdue' || urg.status === 'due-today' || urg.status === 'due-soon';
    }).length;

    const responseRate = total > 0 ? Math.round(((interviewing + offered) / total) * 100) : 0;
    return { total, bookmarked, applied, interviewing, offered, rejected, followUpsPending, responseRate };
  }, [jobs, todayStr]);

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((j) => {
        if (statusFilter !== 'all' && j.status !== statusFilter) return false;
        if (onlyFollowUpsDue) {
          const urg = getFollowUpUrgency(j.followUpDate, j.status);
          if (urg.status !== 'overdue' && urg.status !== 'due-today' && urg.status !== 'due-soon') {
            return false;
          }
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesComp = j.company.toLowerCase().includes(q);
          const matchesRole = j.role.toLowerCase().includes(q);
          const matchesLoc = j.location.toLowerCase().includes(q);
          const matchesNext = j.nextStep.toLowerCase().includes(q);
          const matchesContact = j.contactPerson?.toLowerCase().includes(q) || false;
          const matchesNotes = j.notes?.toLowerCase().includes(q) || false;
          if (!matchesComp && !matchesRole && !matchesLoc && !matchesNext && !matchesContact && !matchesNotes) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'followUp') {
          // Overdue / earliest follow-up first
          const dateA = a.followUpDate ? new Date(a.followUpDate).getTime() : Infinity;
          const dateB = b.followUpDate ? new Date(b.followUpDate).getTime() : Infinity;
          return dateA - dateB;
        } else if (sortBy === 'appDate') {
          return new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime();
        } else {
          return a.company.localeCompare(b.company);
        }
      });
  }, [jobs, statusFilter, onlyFollowUpsDue, searchQuery, sortBy]);

  // Modal open helpers
  const handleOpenAdd = (defaultStage: JobStatus = 'applied') => {
    setEditingJobId(null);
    setCompany('');
    setRole('');
    setLocation('Remote / Hybrid');
    setAppDate(new Date().toISOString().split('T')[0]);
    setStatus(defaultStage);
    setNextStep(
      defaultStage === 'bookmarked'
        ? 'Review hiring team and customize resume'
        : 'Recruiter phone screen follow-up'
    );
    // Default follow-up date in 4 days
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 4);
    setFollowUpDate(nextWeek.toISOString().split('T')[0]);
    setSalaryRange('$190k - $240k');
    setContactPerson('');
    setNotes('');
    setLink('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (j: JobApplication) => {
    setEditingJobId(j.id);
    setCompany(j.company);
    setRole(j.role);
    setLocation(j.location);
    setAppDate(j.applicationDate);
    setStatus(j.status);
    setNextStep(j.nextStep);
    setFollowUpDate(j.followUpDate || '');
    setSalaryRange(j.salaryRange || '');
    setContactPerson(j.contactPerson || '');
    setNotes(j.notes || '');
    setLink(j.link || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    if (editingJobId) {
      storageService.updateJobApplication({
        id: editingJobId,
        company: company.trim(),
        role: role.trim(),
        location: location.trim(),
        applicationDate: appDate,
        status,
        nextStep: nextStep.trim(),
        followUpDate: followUpDate || '',
        salaryRange: salaryRange.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        notes: notes.trim() || undefined,
        link: link.trim() || undefined,
      });
    } else {
      storageService.addJobApplication({
        company: company.trim(),
        role: role.trim(),
        location: location.trim(),
        applicationDate: appDate,
        status,
        nextStep: nextStep.trim(),
        followUpDate: followUpDate || '',
        salaryRange: salaryRange.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        notes: notes.trim() || undefined,
        link: link.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    onJobsChange();
  };

  const confirmDelete = () => {
    if (!deletingJob) return;
    storageService.deleteJobApplication(deletingJob.id);
    if (selectedJobForDetail?.id === deletingJob.id) {
      setSelectedJobForDetail(null);
    }
    setDeletingJob(null);
    onJobsChange();
  };

  const handleStatusChange = (job: JobApplication, newStatus: JobStatus) => {
    storageService.updateJobApplication({ ...job, status: newStatus });
    if (selectedJobForDetail?.id === job.id) {
      setSelectedJobForDetail({ ...selectedJobForDetail, status: newStatus });
    }
    onJobsChange();
  };

  const statusBadge = (s: JobStatus) => {
    switch (s) {
      case 'interviewing':
        return 'bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/30';
      case 'offered':
        return 'bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30 font-semibold';
      case 'applied':
        return 'bg-[#2DD4BF]/10 text-[#2DD4BF] border border-[#2DD4BF]/30';
      case 'bookmarked':
        return 'bg-[#172231] text-[#CBD5E1] border border-[#263548]';
      case 'rejected':
        return 'bg-[#FB7185]/10 text-[#FB7185] border border-[#FB7185]/30';
    }
  };

  const kanbanColumns: { id: JobStatus; label: string; accent: string }[] = [
    { id: 'bookmarked', label: 'Bookmarked', accent: 'border-[#263548]' },
    { id: 'applied', label: 'Applied', accent: 'border-[#2DD4BF]/50' },
    { id: 'interviewing', label: 'Interviewing', accent: 'border-[#FBBF24]/50' },
    { id: 'offered', label: 'Offered', accent: 'border-[#10B981]/50' },
    { id: 'rejected', label: 'Closed / Rejected', accent: 'border-[#FB7185]/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#F1F5F9] tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-[#FBBF24]" />
            <span>Career Pipeline & Opportunities</span>
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Track interview loops, compensation benchmarks, recruiter contacts, follow-up timelines, and debrief notes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-[#0A1018] border border-[#263548] rounded-lg p-1">
            <button
              onClick={() => setLayoutMode('list')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                layoutMode === 'list'
                  ? 'bg-[#172231] text-[#F1F5F9] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setLayoutMode('kanban')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                layoutMode === 'kanban'
                  ? 'bg-[#172231] text-[#F1F5F9] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenAdd('applied')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-[#101722] border border-[#263548] flex flex-col justify-between">
          <div className="text-xs text-[#94A3B8]">Total Applications</div>
          <div className="text-2xl font-bold text-[#F1F5F9] font-mono tabular-nums mt-1">
            {metrics.total}
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono mt-1">
            {metrics.bookmarked} bookmarked
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101722] border border-[#263548] flex flex-col justify-between">
          <div className="text-xs text-[#94A3B8]">Interview Loops</div>
          <div className="text-2xl font-bold text-[#FBBF24] font-mono tabular-nums mt-1">
            {metrics.interviewing}
          </div>
          <div className="text-[11px] text-[#FBBF24]/80 font-mono mt-1">
            Active negotiations
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101722] border border-[#263548] flex flex-col justify-between">
          <div className="text-xs text-[#94A3B8]">Offers Extended</div>
          <div className="text-2xl font-bold text-[#34D399] font-mono tabular-nums mt-1">
            {metrics.offered}
          </div>
          <div className="text-[11px] text-[#34D399]/80 font-mono mt-1">
            Ready for decision
          </div>
        </div>

        <div
          onClick={() => setOnlyFollowUpsDue(!onlyFollowUpsDue)}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
            onlyFollowUpsDue
              ? 'bg-[#FB7185]/15 border-[#FB7185]/40 ring-1 ring-[#FB7185]/30'
              : 'bg-[#101722] border-[#263548] hover:border-[#2DD4BF]/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Follow-ups Pending</span>
            <AlertCircle className={`w-3.5 h-3.5 ${metrics.followUpsPending > 0 ? 'text-[#FB7185]' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-2xl font-bold text-[#FB7185] font-mono tabular-nums mt-1">
            {metrics.followUpsPending}
          </div>
          <div className="text-[11px] text-[#94A3B8] font-mono mt-1">
            {onlyFollowUpsDue ? 'Click to show all' : 'Click to filter'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#101722] border border-[#263548] flex flex-col justify-between">
          <div className="text-xs text-[#94A3B8]">Response Rate</div>
          <div className="text-2xl font-bold text-[#2DD4BF] font-mono tabular-nums mt-1">
            {metrics.responseRate}%
          </div>
          <div className="text-[11px] text-[#2DD4BF]/80 font-mono mt-1">
            Positive conversion
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101722] border border-[#263548] rounded-xl p-3">
        {/* Stage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'bookmarked', 'applied', 'interviewing', 'offered', 'rejected'] as const).map(
            (s) => {
              const count =
                s === 'all'
                  ? jobs.length
                  : jobs.filter((j) => j.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    statusFilter === s
                      ? 'bg-[#082B2A] text-[#2DD4BF] border border-[#0D9488] font-semibold'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231]'
                  }`}
                >
                  <span>{s === 'all' ? 'All' : s}</span>
                  <span className="text-[10px] font-mono opacity-80">({count})</span>
                </button>
              );
            }
          )}

          {/* Urgent Follow-up toggle */}
          <button
            onClick={() => setOnlyFollowUpsDue(!onlyFollowUpsDue)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              onlyFollowUpsDue
                ? 'bg-[#FB7185]/20 text-[#FB7185] border border-[#FB7185]/40 font-semibold'
                : 'text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#172231]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#FB7185]" />
            <span>Needs Action ({metrics.followUpsPending})</span>
          </button>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4]"
          >
            <option value="followUp">Sort: Urgent Follow-up</option>
            <option value="appDate">Sort: Newest Applied</option>
            <option value="company">Sort: Company A-Z</option>
          </select>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Search role, company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {layoutMode === 'list' ? (
        <div className="rounded-xl bg-[#101722] border border-[#263548] divide-y divide-[#1B2838] overflow-hidden">
          {filteredJobs.length === 0 ? (
            <div className="py-20 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#0A1018] border border-[#263548] flex items-center justify-center text-[#FBBF24]">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-[#F1F5F9]">
                  {searchQuery || statusFilter !== 'all' || onlyFollowUpsDue
                    ? 'No matching job applications'
                    : 'No career applications tracked yet'}
                </h3>
                <p className="text-xs text-[#94A3B8] max-w-sm">
                  {searchQuery || statusFilter !== 'all' || onlyFollowUpsDue
                    ? 'Clear active filters to view all stages in your career pipeline.'
                    : 'Track target AI companies, upcoming interview loops, compensation benchmarks, and follow-ups.'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                {(searchQuery || statusFilter !== 'all' || onlyFollowUpsDue) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setOnlyFollowUpsDue(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#172231] text-xs text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
                <button
                  onClick={() => handleOpenAdd('applied')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#080C12] bg-[#10B981] hover:bg-[#059669] rounded-lg shadow-sm transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Application</span>
                </button>
              </div>
            </div>
          ) : (
            filteredJobs.map((j) => {
              const urgency = getFollowUpUrgency(j.followUpDate, j.status);

              return (
                <div
                  key={j.id}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#172231]/40 transition-colors group"
                >
                  <div
                    onClick={() => setSelectedJobForDetail(j)}
                    className="space-y-2 min-w-0 cursor-pointer flex-1"
                  >
                    {/* Company & Role Header */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-sm font-bold text-[#F1F5F9] group-hover:text-[#2DD4BF] transition-colors">
                        {j.company}
                      </h3>
                      <span className="text-xs text-[#CBD5E1] font-medium">
                        · {j.role}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${statusBadge(
                          j.status
                        )}`}
                      >
                        {j.status}
                      </span>

                      {/* Urgency follow-up badge */}
                      {urgency.status === 'overdue' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FB7185]/15 text-[#FB7185] border border-[#FB7185]/30 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="w-2.5 h-2.5 text-[#FB7185]" />
                          <span>{urgency.label}</span>
                        </span>
                      )}
                      {urgency.status === 'due-today' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 flex items-center gap-1 font-semibold">
                          <Clock className="w-2.5 h-2.5 text-[#FBBF24]" />
                          <span>Follow-up Due Today</span>
                        </span>
                      )}
                      {urgency.status === 'due-soon' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/20">
                          {urgency.label}
                        </span>
                      )}
                    </div>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-2.5 text-xs text-[#94A3B8] font-mono flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#64748B]" />
                        {j.location}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#64748B]" />
                        Applied: {j.applicationDate}
                      </span>
                      {j.salaryRange && (
                        <>
                          <span>·</span>
                          <span className="text-[#34D399] flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-[#10B981]" />
                            {j.salaryRange}
                          </span>
                        </>
                      )}
                      {j.contactPerson && (
                        <>
                          <span>·</span>
                          <span className="text-[#CBD5E1] flex items-center gap-1">
                            <User className="w-3 h-3 text-[#64748B]" />
                            {j.contactPerson}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Next step and follow-up timeline */}
                    <div className="text-xs text-[#CBD5E1] flex items-center gap-2 pt-0.5 flex-wrap">
                      <span className="text-[#FBBF24] font-medium">Next Action:</span>
                      <span className="font-medium text-[#F1F5F9]">{j.nextStep}</span>
                      {j.followUpDate && (
                        <span className="text-[#94A3B8] font-mono text-[11px]">
                          (Follow-up date: {j.followUpDate})
                        </span>
                      )}
                    </div>

                    {/* Notes preview */}
                    {j.notes && (
                      <p className="text-[11px] text-[#94A3B8] italic line-clamp-1 max-w-2xl">
                        "{j.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions & Quick Stage Changer */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {/* Quick Move Dropdown */}
                    <select
                      value={j.status}
                      onChange={(e) => handleStatusChange(j, e.target.value as JobStatus)}
                      className="text-xs bg-[#0A1018] border border-[#263548] rounded-lg px-2 py-1 text-[#CBD5E1] focus:outline-none focus:border-[#5EEAD4] capitalize"
                    >
                      <option value="bookmarked">Bookmarked</option>
                      <option value="applied">Applied</option>
                      <option value="interviewing">Interviewing</option>
                      <option value="offered">Offered</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    {j.link && (
                      <a
                        href={j.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231] transition-colors"
                        title="Open Job Listing"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      onClick={() => handleOpenEdit(j)}
                      className="p-1.5 rounded text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#172231] transition-colors"
                      title="Edit Application"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingJob(j)}
                      className="p-1.5 rounded text-[#94A3B8] hover:text-[#FB7185] hover:bg-[#172231] transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {kanbanColumns.map((col) => {
            const colJobs = filteredJobs.filter((j) => j.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-[#101722] border border-[#263548] rounded-xl p-3 flex flex-col min-h-[540px]"
              >
                <div
                  className={`flex items-center justify-between pb-2.5 border-b ${col.accent} mb-3`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#F1F5F9] tracking-wide">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono text-[#94A3B8] tabular-nums">
                      ({colJobs.length})
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenAdd(col.id)}
                    className="p-1 rounded text-[#94A3B8] hover:text-[#2DD4BF] hover:bg-[#172231] transition-colors"
                    title={`Add ${col.label} application`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {colJobs.length === 0 ? (
                    <div className="py-16 px-2 border border-dashed border-[#263548] rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                      <span className="text-[11px] text-[#64748B]">No applications</span>
                      <button
                        onClick={() => handleOpenAdd(col.id)}
                        className="text-[11px] text-[#2DD4BF] hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add here</span>
                      </button>
                    </div>
                  ) : (
                    colJobs.map((j) => {
                      const urgency = getFollowUpUrgency(j.followUpDate, j.status);

                      return (
                        <div
                          key={j.id}
                          className="p-3.5 rounded-xl bg-[#172231] border border-[#263548] hover:border-[#2DD4BF]/40 transition-all space-y-2 group shadow-sm"
                        >
                          {/* Card header */}
                          <div className="flex items-start justify-between gap-1">
                            <div
                              onClick={() => setSelectedJobForDetail(j)}
                              className="cursor-pointer min-w-0"
                            >
                              <h4 className="text-xs font-bold text-[#F1F5F9] group-hover:text-[#2DD4BF] transition-colors truncate">
                                {j.company}
                              </h4>
                              <p className="text-[11px] text-[#CBD5E1] font-medium truncate">
                                {j.role}
                              </p>
                            </div>

                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleOpenEdit(j)}
                                className="p-1 rounded text-[#94A3B8] hover:text-[#F1F5F9]"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeletingJob(j)}
                                className="p-1 rounded text-[#94A3B8] hover:text-[#FB7185]"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Location & Salary */}
                          <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-mono">
                            <span className="truncate">{j.location}</span>
                            {j.salaryRange && (
                              <span className="text-[#34D399] truncate ml-1">{j.salaryRange}</span>
                            )}
                          </div>

                          {/* Next Action */}
                          <div className="text-[10px] text-[#CBD5E1] leading-snug line-clamp-2 bg-[#101722] p-2 rounded-lg border border-[#263548]">
                            <span className="text-[#94A3B8] font-semibold block text-[9px] uppercase tracking-wider">
                              Next Step
                            </span>
                            {j.nextStep}
                          </div>

                          {/* Follow-up urgency badge */}
                          {urgency.status === 'overdue' && (
                            <div className="text-[9px] font-mono font-semibold text-[#FB7185] bg-[#FB7185]/15 border border-[#FB7185]/30 px-2 py-0.5 rounded flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-[#FB7185] shrink-0" />
                              <span>{urgency.label}</span>
                            </div>
                          )}
                          {urgency.status === 'due-today' && (
                            <div className="text-[9px] font-mono font-semibold text-[#FBBF24] bg-[#FBBF24]/15 border border-[#FBBF24]/30 px-2 py-0.5 rounded flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-[#FBBF24] shrink-0" />
                              <span>Follow-up Due Today</span>
                            </div>
                          )}

                          {/* Move Stage Selector */}
                          <div className="pt-2 border-t border-[#263548] flex items-center justify-between gap-2">
                            <select
                              value={j.status}
                              onChange={(e) => handleStatusChange(j, e.target.value as JobStatus)}
                              className="w-full text-[10px] bg-[#0A1018] border border-[#263548] rounded px-1.5 py-1 text-[#CBD5E1] focus:outline-none capitalize"
                            >
                              <option value="bookmarked">Bookmarked</option>
                              <option value="applied">Applied</option>
                              <option value="interviewing">Interviewing</option>
                              <option value="offered">Offered</option>
                              <option value="rejected">Rejected</option>
                            </select>

                            {j.link && (
                              <a
                                href={j.link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-[#94A3B8] hover:text-[#F1F5F9]"
                                title="Link"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
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

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-[#101722] border border-[#263548] rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1B2838]">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#FBBF24]" />
                <span>{editingJobId ? 'Edit Career Opportunity' : 'Add New Career Application'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Company <span className="text-[#10B981]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anthropic, Google DeepMind, OpenAI"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Role Title <span className="text-[#10B981]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Machine Learning Systems Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. San Francisco, CA / Remote"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as JobStatus)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4] capitalize"
                  >
                    <option value="bookmarked">Bookmarked (Target / Research)</option>
                    <option value="applied">Applied (Submitted / In Review)</option>
                    <option value="interviewing">Interviewing (Active Loops)</option>
                    <option value="offered">Offered (Decision Phase)</option>
                    <option value="rejected">Rejected / Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Application Date
                  </label>
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#CBD5E1]">Follow-up Date</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 3);
                          setFollowUpDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] text-[#2DD4BF] hover:underline"
                      >
                        +3d
                      </button>
                      <span className="text-[#64748B] text-[10px]">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 7);
                          setFollowUpDate(d.toISOString().split('T')[0]);
                        }}
                        className="text-[10px] text-[#2DD4BF] hover:underline"
                      >
                        +7d
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Next Step / Immediate Action
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Technical Round 2: System Architecture Presentation"
                  value={nextStep}
                  onChange={(e) => setNextStep(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Salary & Equity Target
                  </label>
                  <input
                    type="text"
                    placeholder="$200,000 - $260,000 + 0.05% Equity"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                    Contact / Recruiter
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Chen (sarah@company.com)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Job Listing or Portal Link
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0A1018] border border-[#263548] rounded-lg text-xs text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#CBD5E1] mb-1">
                  Interview Prep, Questions & Debrief Notes
                </label>
                <textarea
                  rows={4}
                  placeholder="Hiring manager context, system design topics reviewed, behavioral questions, culture takeaways..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0A1018] border border-[#263548] rounded-lg text-xs font-mono text-[#F1F5F9] placeholder-[#94A3B8] focus:outline-none focus:border-[#5EEAD4] resize-y"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1B2838]">
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
                  {editingJobId ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Job Detail Modal */}
      {selectedJobForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#101722] border border-[#263548] rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#1B2838]">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${statusBadge(
                      selectedJobForDetail.status
                    )}`}
                  >
                    {selectedJobForDetail.status}
                  </span>
                  <span className="text-xs text-[#94A3B8] font-mono">
                    Applied: {selectedJobForDetail.applicationDate}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-[#F1F5F9] mt-1">
                  {selectedJobForDetail.company}
                </h3>
                <p className="text-xs text-[#2DD4BF] font-medium">
                  {selectedJobForDetail.role}
                </p>
              </div>

              <button
                onClick={() => setSelectedJobForDetail(null)}
                className="text-[#94A3B8] hover:text-[#F1F5F9] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#0A1018] p-3.5 rounded-xl border border-[#263548]">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-mono">
                  Location
                </span>
                <span className="text-[#F1F5F9] font-medium">{selectedJobForDetail.location}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-mono">
                  Salary / Equity
                </span>
                <span className="text-[#34D399] font-medium">
                  {selectedJobForDetail.salaryRange || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-mono">
                  Follow-up Date
                </span>
                <span className="text-[#F1F5F9] font-medium">
                  {selectedJobForDetail.followUpDate || 'None'}
                </span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-mono">
                  Contact
                </span>
                <span className="text-[#F1F5F9] font-medium truncate block">
                  {selectedJobForDetail.contactPerson || 'None listed'}
                </span>
              </div>
            </div>

            {/* Next Action Banner */}
            <div className="p-3.5 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 space-y-1">
              <span className="text-[10px] font-mono text-[#FBBF24] uppercase tracking-wider font-bold">
                Next Milestone & Action
              </span>
              <p className="text-xs text-[#F1F5F9] font-medium leading-relaxed">
                {selectedJobForDetail.nextStep}
              </p>
            </div>

            {/* Notes Section */}
            {selectedJobForDetail.notes && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#CBD5E1] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Interview Insights & Debrief</span>
                </span>
                <div className="text-xs text-[#CBD5E1] font-mono whitespace-pre-wrap bg-[#0A1018] p-3 rounded-xl border border-[#263548] leading-relaxed">
                  {selectedJobForDetail.notes}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#1B2838]">
              <div className="flex items-center gap-2">
                {selectedJobForDetail.link && (
                  <a
                    href={selectedJobForDetail.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#172231] text-xs font-medium text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors"
                  >
                    <span>View Listing</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = selectedJobForDetail;
                    setSelectedJobForDetail(null);
                    handleOpenEdit(toEdit);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#172231] hover:bg-[#1C2A3B] text-xs text-[#CBD5E1] hover:text-[#F1F5F9] transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    const toDelete = selectedJobForDetail;
                    setSelectedJobForDetail(null);
                    setDeletingJob(toDelete);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#FB7185]/10 hover:bg-[#FB7185]/20 text-xs text-[#FB7185] transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-app Delete Confirmation Modal */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-[#101722] border border-[#FB7185]/30 rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-[#FB7185]">
              <div className="w-10 h-10 rounded-xl bg-[#FB7185]/10 border border-[#FB7185]/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-[#FB7185]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#F1F5F9]">Delete Application?</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="text-xs text-[#CBD5E1] bg-[#0A1018] p-2.5 rounded-lg border border-[#263548]">
              <div className="font-bold text-[#F1F5F9]">{deletingJob.company}</div>
              <div className="text-[#94A3B8]">{deletingJob.role}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                className="px-3 py-1.5 text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#FB7185] hover:bg-rose-600 rounded-lg shadow-sm transition-colors"
              >
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
