import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Code2,
  Download,
  FileCheck2,
  FileText,
  FolderGit2,
  GraduationCap,
  Layers,
  Plus,
  Printer,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { useWayfinder } from '../../context/WayfinderContext';
import {
  JobMarketService,
  ResumeService,
} from '../../services/careerIntelligenceServices';
import {
  ResumeCertificationEntry,
  ResumeEducationEntry,
  ResumeExperienceEntry,
  ResumeProjectEntry,
  ResumeSkillProvenance,
  ResumeSkillSelection,
  ResumeTemplateId,
  ResumeVersionRecord,
} from '../../types/marketSkillsCareer';
import { RESUME_BUILDING_SUBSKILLS } from '../../data/marketSkillsMockData';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';

const RESUME_STEPS = [
  { step: 1, title: 'Step 1 — Personal Info', icon: UserCheck },
  { step: 2, title: 'Step 2 — Summary', icon: FileText },
  { step: 3, title: 'Step 3 — Education', icon: GraduationCap },
  { step: 4, title: 'Step 4 — Skills & Provenance', icon: ShieldCheck },
  { step: 5, title: 'Step 5 — Experience', icon: Briefcase },
  { step: 6, title: 'Step 6 — Projects', icon: FolderGit2 },
  { step: 7, title: 'Step 7 — Certifications', icon: Award },
  { step: 8, title: 'Step 8 — Completeness & Tailoring', icon: ClipboardCheck },
] as const;

const RESUME_TEMPLATES: {
  id: ResumeTemplateId;
  label: string;
  tagline: string;
  layoutNotes: string;
}[] = [
  {
    id: 'ATS_FRIENDLY',
    label: 'ATS-Friendly Resume',
    tagline: 'Single-column semantic hierarchy for automated parsers',
    layoutNotes: 'Strict linear headers, zero tables or multi-column floats, standard date delimiters.',
  },
  {
    id: 'MINIMAL_PROFESSIONAL',
    label: 'Minimal Professional Resume',
    tagline: 'Clean executive typography for corporate & consulting roles',
    layoutNotes: 'Balanced whitespace, crisp horizontal rules, and concise responsibility blocks.',
  },
  {
    id: 'MODERN_GRADUATE',
    label: 'Modern Graduate Resume',
    tagline: 'Highlights academic specialization, assessed skills & capstone projects',
    layoutNotes: 'Positions Education and Verified Capability badges prominently near the top.',
  },
  {
    id: 'ACADEMIC',
    label: 'Academic Resume / CV',
    tagline: 'Structured for fellowships, research labs & postgraduate applications',
    layoutNotes: 'Emphasizes research methodology, publications, awards, and academic achievements.',
  },
  {
    id: 'TECHNICAL',
    label: 'Technical Resume',
    tagline: 'Optimized for engineering, data, and software portfolios',
    layoutNotes: 'Highlights technical skill provenance, repository links, and system deliverables.',
  },
  {
    id: 'INTERNSHIP_FOCUSED',
    label: 'Internship-Focused Resume',
    tagline: 'Tailored for students applying to summer/semester internships',
    layoutNotes: 'Prioritizes coursework, WAYFINDER verified projects, and demonstrated skills.',
  },
];

function provenanceBadgeStyle(provenance: ResumeSkillProvenance): string {
  switch (provenance) {
    case 'VERIFIED_CAPABILITY':
      return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]';
    case 'DEMONSTRATED':
      return 'bg-[#DDF0FF] text-[#075FC7] border-[#8DBDFF]';
    case 'ASSESSED':
      return 'bg-[#E5F2FF] text-[#0B2E56] border-[#99C8FF]';
    case 'SELF_REPORTED':
    default:
      return 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]';
  }
}

export const Screen25ResumeBuilder: React.FC = () => {
  const { state, navigateTo } = useWayfinder();

  const [versions, setVersions] = useState<ResumeVersionRecord[]>(() =>
    ResumeService.getResumeVersions()
  );
  const [activeVersionId, setActiveVersionId] = useState<string>(
    () => ResumeService.getResumeVersions()[0]?.id || ''
  );
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('MKT_OPP_CS_01');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [newVersionName, setNewVersionName] = useState<string>('');
  const [skillFilterFieldId, setSkillFilterFieldId] = useState<string>('ALL');

  // Draft entry states for Education, Experience, Projects, Certifications
  const [eduDraft, setEduDraft] = useState<Omit<ResumeEducationEntry, 'id'>>({
    institution: '',
    degree: '',
    specialization: '',
    startDate: '',
    endDateOrExpected: '',
    academicAchievements: '',
  });

  const [expDraft, setExpDraft] = useState<Omit<ResumeExperienceEntry, 'id'>>({
    experienceType: 'INTERNSHIP',
    roleTitle: '',
    organization: '',
    location: '',
    startDate: '',
    endDate: '',
    responsibilities: '',
  });

  const [projDraft, setProjDraft] = useState<{
    projectName: string;
    role: string;
    description: string;
    technologiesText: string;
    projectUrl: string;
    evidenceOrPortfolioLink: string;
  }>({
    projectName: '',
    role: '',
    description: '',
    technologiesText: '',
    projectUrl: '',
    evidenceOrPortfolioLink: '',
  });

  const [certDraft, setCertDraft] = useState<Omit<ResumeCertificationEntry, 'id'>>({
    category: 'CERTIFICATION',
    title: '',
    issuerOrVenue: '',
    dateIssued: '',
    credentialUrl: '',
  });

  const activeResume = useMemo(() => {
    return versions.find((v) => v.id === activeVersionId) || versions[0];
  }, [versions, activeVersionId]);

  const updateActiveResume = (updater: (current: ResumeVersionRecord) => ResumeVersionRecord) => {
    if (!activeResume) return;
    const next = updater(activeResume);
    const updatedList = ResumeService.saveResumeVersion(next);
    setVersions([...updatedList]);
  };

  const completenessReport = useMemo(() => {
    return ResumeService.evaluateResumeCompleteness(activeResume);
  }, [activeResume]);

  const marketOpportunities = useMemo(() => JobMarketService.getAllOpportunities(), []);

  const selectedOpportunity = useMemo(() => {
    return (
      marketOpportunities.find((o) => o.id === selectedOpportunityId) || marketOpportunities[0]
    );
  }, [marketOpportunities, selectedOpportunityId]);

  const tailoringReport = useMemo(() => {
    if (!selectedOpportunity) return null;
    return ResumeService.compareResumeWithOpportunity(
      activeResume,
      selectedOpportunity,
      state.skillsCatalogue,
      state.capabilityRecords
    );
  }, [activeResume, selectedOpportunity, state.skillsCatalogue, state.capabilityRecords]);

  const filteredCatalogueSkills = useMemo(() => {
    if (skillFilterFieldId === 'ALL') return state.skillsCatalogue;
    return state.skillsCatalogue.filter((s) => s.fieldId === skillFilterFieldId);
  }, [state.skillsCatalogue, skillFilterFieldId]);

  const handleCreateNewVersion = () => {
    const label = newVersionName.trim() || `Resume Version ${versions.length + 1}`;
    const created = ResumeService.createEmptyResumeVersion(label);
    const nextVersions = ResumeService.getResumeVersions();
    setVersions([...nextVersions]);
    setActiveVersionId(created.id);
    setNewVersionName('');
    setStatusBanner(`Created new resume version "${created.versionName}".`);
  };

  const handleDuplicateForOpportunity = () => {
    if (!selectedOpportunity) return;
    const copy: ResumeVersionRecord = {
      ...activeResume,
      id: `RES_VER_${Date.now()}`,
      versionName: `${activeResume.versionName} — Tailored for ${selectedOpportunity.employerName}`,
      tailoredOpportunityId: selectedOpportunity.id,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = ResumeService.saveResumeVersion(copy);
    setVersions([...updatedList]);
    setActiveVersionId(copy.id);
    setStatusBanner(
      `Created dedicated version tailored for "${selectedOpportunity.title}". Review all sections before exporting.`
    );
  };

  const handleToggleSkillInResume = (skillId: string) => {
    const exists = activeResume.skills.some((s) => s.skillId === skillId);
    if (exists) {
      updateActiveResume((cur) => ({
        ...cur,
        skills: cur.skills.filter((s) => s.skillId !== skillId),
      }));
      return;
    }
    const skillObj = state.skillsCatalogue.find((s) => s.id === skillId);
    if (!skillObj) return;
    const derived = ResumeService.deriveSkillProvenanceFromWayfinder(
      skillObj,
      state.capabilityRecords,
      state.studentSkillRecords,
      state.evidenceSubmissions
    );
    const entry: ResumeSkillSelection = {
      skillId: skillObj.id,
      skillName: skillObj.name,
      fieldId: skillObj.fieldId,
      mappedCapabilityId: skillObj.mappedCapabilityId,
      provenance: derived.provenance,
      rubricLevel: derived.level,
    };
    updateActiveResume((cur) => ({
      ...cur,
      skills: [...cur.skills, entry],
    }));
  };

  const handleImportStudentProfileData = () => {
    const importedProjects: ResumeProjectEntry[] = state.portfolioRecords
      .filter((pr) => pr.recordType === 'PROJECT')
      .map((pr) => ({
        id: `RES_PROJ_${pr.id}`,
        projectName: pr.title,
        role: 'Lead Student Contributor',
        description: pr.description,
        technologiesOrSkills: [getCapabilityDimensionName(pr.linkedDimensionId)],
        projectUrl: pr.artifactUrl || '',
        evidenceOrPortfolioLink: pr.artifactUrl || '',
      }));

    const importedSkills: ResumeSkillSelection[] = state.studentSkillRecords.map((rec) => {
      const sk = state.skillsCatalogue.find((s) => s.id === rec.skillId);
      const derived = sk
        ? ResumeService.deriveSkillProvenanceFromWayfinder(
            sk,
            state.capabilityRecords,
            state.studentSkillRecords,
            state.evidenceSubmissions
          )
        : { provenance: 'SELF_REPORTED' as ResumeSkillProvenance, level: rec.demonstratedLevel };
      return {
        skillId: rec.skillId,
        skillName: sk?.name || rec.skillId,
        fieldId: sk?.fieldId || 'FIELD_CS_SW',
        mappedCapabilityId: sk?.mappedCapabilityId || 'CAP_PROG_SW',
        provenance: derived.provenance,
        rubricLevel: derived.level,
      };
    });

    updateActiveResume((cur) => ({
      ...cur,
      personalInfo: {
        ...cur.personalInfo,
        fullName: cur.personalInfo.fullName || state.currentUser?.fullName || '',
        email: cur.personalInfo.email || state.currentUser?.email || '',
      },
      education:
        cur.education.length > 0
          ? cur.education
          : state.currentUser?.institutionName || state.currentUser?.program
            ? [
                {
                  id: `EDU_${Date.now()}`,
                  institution: state.currentUser?.institutionName || 'University Institution',
                  degree: 'Undergraduate Degree',
                  specialization: state.currentUser?.program || 'Academic Major',
                  startDate: '2023-08',
                  endDateOrExpected: 'Expected 2027-05',
                  academicAchievements: 'Imported from WAYFINDER student profile.',
                },
              ]
            : [],
      skills: importedSkills.length > 0 ? importedSkills : cur.skills,
      projects: importedProjects.length > 0 ? importedProjects : cur.projects,
    }));

    setStatusBanner(
      'Synchronised skills, provenance levels, and portfolio artifacts from your WAYFINDER profile.'
    );
  };

  const handleExportHtmlOrDoc = (format: 'HTML' | 'DOC') => {
    const html = ResumeService.generatePrintableResumeHtml(activeResume);
    const mimeType = format === 'DOC' ? 'application/msword' : 'text/html';
    const ext = format === 'DOC' ? 'doc' : 'html';
    const blob = new Blob([html], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (activeResume.versionName || 'wayfinder-resume')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.download = `${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusBanner(
      `Downloaded ${format === 'DOC' ? 'Word-compatible (.doc)' : 'Printable HTML (.html)'} resume file.`
    );
  };

  const handlePrintResume = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Module 5A Official Skill Integration */}
      <div className="wf-panel p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="wf-Chip">MODULE 3 — RESUME BUILDER &amp; OFFICIAL SKILL</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#E5F2FF] text-[#075FC7] border border-[#8DBDFF]">
                CLAIM ≠ CAPABILITY ≠ PROOF
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0B2E56]">
              Evidence-Backed Resume Builder &amp; Resume Capability Studio
            </h1>
            <p className="text-sm text-[#123B63] mt-1 max-w-3xl">
              Resume Building is treated both as a measurable capability in the WAYFINDER Skill Library
              and as a structured 8-step authoring environment that distinguishes Self-Reported,
              Assessed, Demonstrated, and Verified capabilities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleImportStudentProfileData}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sync from WAYFINDER Profile
            </button>
            <button
              type="button"
              onClick={() => navigateTo('26_LINKEDIN_SUPPORT')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <Layers className="w-3.5 h-3.5" /> LinkedIn Profile Support
            </button>
          </div>
        </div>

        {/* 5A — Resume Building as an Official Skill Panel */}
        <div className="mt-5 p-4 rounded-xl bg-white/80 border border-[#8DBDFF]/60">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
                  Official Skill Catalogue Entry: SKL_CAREER_RESUME_BUILDING
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#DDF0FF] text-[#0B2E56]">
                  Mapped to COMMUNICATION &amp; Articulation
                </span>
              </div>
              <h2 className="text-base font-bold text-[#0B2E56] mt-0.5">
                Professional Resume Architecture, Evidence Attribution &amp; Opportunity Tailoring
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigateTo('08_APTITUDE_ASSESSMENT')}
                className="wf-btn wf-btn-primary text-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5" /> Assess Resume Skill (ASM_SKL_RESUME_V1)
              </button>
              <button
                type="button"
                onClick={() => navigateTo('15_LEARNING_CENTRE')}
                className="wf-btn wf-btn-secondary text-xs"
              >
                <BookOpen className="w-3.5 h-3.5" /> Resume Learning Resources
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {RESUME_BUILDING_SUBSKILLS.map((sub, idx) => (
              <div
                key={sub.id}
                className="p-2.5 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/40 text-xs"
              >
                <div className="font-bold text-[#0B2E56]">
                  {idx + 1}. {sub.title}
                </div>
                <p className="text-[11px] text-[#315A7D] mt-0.5 leading-snug">{sub.description}</p>
              </div>
            ))}
          </div>
        </div>

        {statusBanner && (
          <div className="mt-4 p-3 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-[#15803D] text-xs font-semibold flex items-center justify-between">
            <span>{statusBanner}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="underline ml-3 font-bold"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Version Selector & Template Selector Bar */}
      <div className="wf-panel p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#174B80] mb-1">
              Active Resume Version ({versions.length} saved)
            </label>
            <div className="flex gap-2">
              <select
                aria-label="Select Active Resume Version"
                value={activeResume.id}
                onChange={(e) => setActiveVersionId(e.target.value)}
                className="wf-select flex-1 text-sm"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.versionName} ({v.templateId.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
              {versions.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const remaining = ResumeService.deleteResumeVersion(activeResume.id);
                    setVersions([...remaining]);
                    setActiveVersionId(remaining[0].id);
                  }}
                  className="wf-btn wf-btn-secondary text-xs px-3 text-[#B91C1C]"
                  title="Delete this resume version"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#174B80] mb-1">
              Create Additional Resume Version
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                placeholder="e.g., Research Fellowship CV v2"
                className="wf-input flex-1 text-sm"
              />
              <button
                type="button"
                onClick={handleCreateNewVersion}
                className="wf-btn wf-btn-secondary text-xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" /> New Version
              </button>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => handleExportHtmlOrDoc('HTML')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export HTML
            </button>
            <button
              type="button"
              onClick={() => handleExportHtmlOrDoc('DOC')}
              className="wf-btn wf-btn-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Export .DOC
            </button>
            <button
              type="button"
              onClick={handlePrintResume}
              className="wf-btn wf-btn-primary text-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* 6 Templates Selector */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#174B80] mb-2">
            Resume Template Architecture (Switch templates anytime without losing content)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
            {RESUME_TEMPLATES.map((tpl) => {
              const isSelected = activeResume.templateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    updateActiveResume((cur) => ({
                      ...cur,
                      templateId: tpl.id,
                    }))
                  }
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#DDF0FF] border-[#075FC7] shadow-sm'
                      : 'bg-white/75 border-[#8DBDFF]/50 hover:bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-[#0B2E56] flex items-center justify-between">
                    <span>{tpl.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#075FC7] shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#315A7D] mt-1 leading-snug">{tpl.tagline}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left = 8-Step Guided Authoring, Right = Live Preview & Completeness */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: 8 Steps Navigation + Active Step Form */}
        <div className="xl:col-span-7 space-y-4">
          {/* Step Tabs */}
          <div className="wf-panel p-3 flex flex-wrap gap-1.5">
            {RESUME_STEPS.map((s) => {
              const Icon = s.icon;
              const active = activeStep === s.step;
              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setActiveStep(s.step)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#075FC7] text-white shadow-sm'
                      : 'bg-white/70 text-[#0B2E56] hover:bg-white border border-[#8DBDFF]/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>

          {/* Step Content Panel */}
          <div className="wf-panel p-6 space-y-5">
            {activeStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 1 — Personal Information &amp; External Proof Links
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Include accurate contact details and direct links to your portfolio, GitHub, or
                    professional profile so reviewers can inspect your work.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={activeResume.personalInfo.fullName}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, fullName: e.target.value },
                        }))
                      }
                      placeholder="e.g., Arjun Krishnamurthy"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={activeResume.personalInfo.email}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, email: e.target.value },
                        }))
                      }
                      placeholder="e.g., arjun.k@university.edu"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={activeResume.personalInfo.phone}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, phone: e.target.value },
                        }))
                      }
                      placeholder="e.g., +91 98765 43210"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      City / Region *
                    </label>
                    <input
                      type="text"
                      value={activeResume.personalInfo.location}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, location: e.target.value },
                        }))
                      }
                      placeholder="e.g., Bengaluru, KA (Open to Hybrid/Remote)"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      LinkedIn / Professional Profile URL
                    </label>
                    <input
                      type="url"
                      value={activeResume.personalInfo.professionalProfileUrl}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: {
                            ...cur.personalInfo,
                            professionalProfileUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Portfolio / Personal Website URL
                    </label>
                    <input
                      type="url"
                      value={activeResume.personalInfo.portfolioUrl}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, portfolioUrl: e.target.value },
                        }))
                      }
                      placeholder="https://portfolio.example.edu"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      GitHub / Technical Repository / Open Science URL
                    </label>
                    <input
                      type="url"
                      value={activeResume.personalInfo.githubUrl}
                      onChange={(e) =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          personalInfo: { ...cur.personalInfo, githubUrl: e.target.value },
                        }))
                      }
                      placeholder="https://github.com/yourusername"
                      className="wf-input w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 2 — Professional Summary &amp; Role Positioning
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Write a concise 2–4 sentence summary grounded in your academic field, assessed
                    capabilities, and verifiable projects. Avoid unsupported superlatives.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#174B80] mb-1">
                    Professional Summary Statement
                  </label>
                  <textarea
                    rows={5}
                    value={activeResume.professionalSummary}
                    onChange={(e) =>
                      updateActiveResume((cur) => ({
                        ...cur,
                        professionalSummary: e.target.value,
                      }))
                    }
                    placeholder="e.g., Final-year Computer Science undergraduate specialising in relational database architecture, query optimisation, and backend API reliability. Demonstrated Level 2 proficiency in Technical Execution and Problem Solving through WAYFINDER skill assessments and reproducible SQL benchmarking projects."
                    className="wf-input w-full text-sm"
                  />
                  <div className="text-[11px] text-[#315A7D] mt-1">
                    Character count: {activeResume.professionalSummary.trim().length} (Recommended:
                    160–420 characters)
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">Step 3 — Education</h2>
                  <p className="text-xs text-[#315A7D]">
                    Record your degree, specialisation, institution, timeline, and relevant
                    coursework or academic honours.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-[#8DBDFF]/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={eduDraft.institution}
                      onChange={(e) => setEduDraft({ ...eduDraft, institution: e.target.value })}
                      placeholder="Institution Name *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={eduDraft.degree}
                      onChange={(e) => setEduDraft({ ...eduDraft, degree: e.target.value })}
                      placeholder="Degree / Qualification (e.g., B.Tech, B.A., M.Sc.) *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={eduDraft.specialization}
                      onChange={(e) => setEduDraft({ ...eduDraft, specialization: e.target.value })}
                      placeholder="Major / Specialisation *"
                      className="wf-input text-sm"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={eduDraft.startDate}
                        onChange={(e) => setEduDraft({ ...eduDraft, startDate: e.target.value })}
                        placeholder="Start (e.g. 2023-08)"
                        className="wf-input text-sm"
                      />
                      <input
                        type="text"
                        value={eduDraft.endDateOrExpected}
                        onChange={(e) =>
                          setEduDraft({ ...eduDraft, endDateOrExpected: e.target.value })
                        }
                        placeholder="End / Expected"
                        className="wf-input text-sm"
                      />
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={eduDraft.academicAchievements}
                    onChange={(e) =>
                      setEduDraft({ ...eduDraft, academicAchievements: e.target.value })
                    }
                    placeholder="Relevant coursework, thesis topic, GPA, or academic achievements"
                    className="wf-input w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!eduDraft.institution.trim() || !eduDraft.degree.trim()) return;
                      updateActiveResume((cur) => ({
                        ...cur,
                        education: [
                          ...cur.education,
                          { ...eduDraft, id: `EDU_${Date.now()}` },
                        ],
                      }));
                      setEduDraft({
                        institution: '',
                        degree: '',
                        specialization: '',
                        startDate: '',
                        endDateOrExpected: '',
                        academicAchievements: '',
                      });
                    }}
                    className="wf-btn wf-btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Education Entry
                  </button>
                </div>

                {activeResume.education.length > 0 && (
                  <div className="space-y-2">
                    {activeResume.education.map((edu) => (
                      <div
                        key={edu.id}
                        className="p-3 rounded-xl bg-white/85 border border-[#8DBDFF]/50 flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="text-sm font-bold text-[#0B2E56]">
                            {edu.degree} — {edu.specialization}
                          </div>
                          <div className="text-xs text-[#174B80]">
                            {edu.institution} ({edu.startDate} – {edu.endDateOrExpected})
                          </div>
                          {edu.academicAchievements && (
                            <p className="text-xs text-[#123B63] mt-1">{edu.academicAchievements}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveResume((cur) => ({
                              ...cur,
                              education: cur.education.filter((x) => x.id !== edu.id),
                            }))
                          }
                          className="text-xs text-[#B91C1C] font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeStep === 4 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-[#0B2E56]">
                      Step 4 — Skills from WAYFINDER Profile (Provenance Attribution)
                    </h2>
                    <p className="text-xs text-[#315A7D]">
                      Every skill selected for your resume automatically carries its WAYFINDER
                      provenance: Self-Reported, Assessed, Demonstrated, or Verified Capability.
                    </p>
                  </div>
                  <select
                    aria-label="Filter Skills by Field"
                    value={skillFilterFieldId}
                    onChange={(e) => setSkillFilterFieldId(e.target.value)}
                    className="wf-select text-xs"
                  >
                    <option value="ALL">All Fields ({state.skillsCatalogue.length} skills)</option>
                    {state.fieldsCatalogue.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.shortName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Provenance Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] font-semibold">
                    1. SELF_REPORTED: Student claim only
                  </div>
                  <div className="p-2 rounded-lg bg-[#E5F2FF] text-[#0B2E56] border border-[#99C8FF] font-semibold">
                    2. ASSESSED: Measured via Skill Assessment
                  </div>
                  <div className="p-2 rounded-lg bg-[#DDF0FF] text-[#075FC7] border border-[#8DBDFF] font-semibold">
                    3. DEMONSTRATED: Rubric score demonstrated
                  </div>
                  <div className="p-2 rounded-lg bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC] font-semibold">
                    4. VERIFIED_CAPABILITY: Accepted Evidence proof
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {filteredCatalogueSkills.map((sk) => {
                    const selected = activeResume.skills.some((s) => s.skillId === sk.id);
                    const derived = ResumeService.deriveSkillProvenanceFromWayfinder(
                      sk,
                      state.capabilityRecords,
                      state.studentSkillRecords,
                      state.evidenceSubmissions
                    );
                    return (
                      <div
                        key={sk.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          selected
                            ? 'bg-[#DDF0FF]/80 border-[#075FC7]'
                            : 'bg-white/80 border-[#8DBDFF]/40'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-[#0B2E56]">{sk.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${provenanceBadgeStyle(
                                derived.provenance
                              )}`}
                            >
                              {derived.provenance.replace(/_/g, ' ')}
                              {derived.level !== null ? ` • Level ${derived.level}` : ''}
                            </span>
                            <span className="text-[11px] text-[#315A7D]">
                              {sk.specialization} • {getCapabilityDimensionName(sk.mappedCapabilityId)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSkillInResume(sk.id)}
                          className={`wf-btn text-xs ${
                            selected ? 'wf-btn-primary' : 'wf-btn-secondary'
                          }`}
                        >
                          {selected ? 'Included' : 'Add to Resume'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 5 — Experience (Employment, Internships, Volunteering, Leadership)
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Describe your responsibilities using concrete action verbs, methods applied, and
                    verifiable outcomes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-[#8DBDFF]/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      aria-label="Experience Type"
                      value={expDraft.experienceType}
                      onChange={(e) =>
                        setExpDraft({
                          ...expDraft,
                          experienceType: e.target.value as ResumeExperienceEntry['experienceType'],
                        })
                      }
                      className="wf-select text-sm"
                    >
                      <option value="INTERNSHIP">Internship</option>
                      <option value="EMPLOYMENT">Employment / Part-Time</option>
                      <option value="VOLUNTEERING">Volunteering / Community Service</option>
                      <option value="LEADERSHIP">Student Leadership / Society Role</option>
                    </select>
                    <input
                      type="text"
                      value={expDraft.roleTitle}
                      onChange={(e) => setExpDraft({ ...expDraft, roleTitle: e.target.value })}
                      placeholder="Role Title (e.g., Research Intern) *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={expDraft.organization}
                      onChange={(e) => setExpDraft({ ...expDraft, organization: e.target.value })}
                      placeholder="Organisation / Lab / Company *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={expDraft.location}
                      onChange={(e) => setExpDraft({ ...expDraft, location: e.target.value })}
                      placeholder="Location (e.g., Remote / Chennai)"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={expDraft.startDate}
                      onChange={(e) => setExpDraft({ ...expDraft, startDate: e.target.value })}
                      placeholder="Start Date (e.g., 2025-05)"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={expDraft.endDate}
                      onChange={(e) => setExpDraft({ ...expDraft, endDate: e.target.value })}
                      placeholder="End Date (e.g., 2025-08 or Present)"
                      className="wf-input text-sm"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={expDraft.responsibilities}
                    onChange={(e) =>
                      setExpDraft({ ...expDraft, responsibilities: e.target.value })
                    }
                    placeholder="Describe specific responsibilities, tools used, and measurable deliverables *"
                    className="wf-input w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!expDraft.roleTitle.trim() || !expDraft.organization.trim()) return;
                      updateActiveResume((cur) => ({
                        ...cur,
                        experience: [
                          ...cur.experience,
                          { ...expDraft, id: `EXP_${Date.now()}` },
                        ],
                      }));
                      setExpDraft({
                        experienceType: 'INTERNSHIP',
                        roleTitle: '',
                        organization: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        responsibilities: '',
                      });
                    }}
                    className="wf-btn wf-btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience Entry
                  </button>
                </div>

                {activeResume.experience.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-white/85 border border-[#8DBDFF]/50 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0B2E56]">
                        {exp.roleTitle} — {exp.organization}{' '}
                        <span className="text-xs font-normal text-[#075FC7]">
                          [{exp.experienceType}]
                        </span>
                      </div>
                      <div className="text-xs text-[#315A7D]">
                        {exp.location} • {exp.startDate} – {exp.endDate}
                      </div>
                      <p className="text-xs text-[#123B63] mt-1">{exp.responsibilities}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          experience: cur.experience.filter((x) => x.id !== exp.id),
                        }))
                      }
                      className="text-xs text-[#B91C1C] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeStep === 6 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 6 — Projects &amp; Verifiable Evidence Links
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Link projects directly to repositories, lab reports, or WAYFINDER Evidence
                    Ledger artifacts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-[#8DBDFF]/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={projDraft.projectName}
                      onChange={(e) =>
                        setProjDraft({ ...projDraft, projectName: e.target.value })
                      }
                      placeholder="Project Title *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={projDraft.role}
                      onChange={(e) => setProjDraft({ ...projDraft, role: e.target.value })}
                      placeholder="Your Role (e.g., Author / Developer)"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={projDraft.technologiesText}
                      onChange={(e) =>
                        setProjDraft({ ...projDraft, technologiesText: e.target.value })
                      }
                      placeholder="Skills / Tools (comma-separated, e.g., PostgreSQL, Python)"
                      className="wf-input text-sm sm:col-span-2"
                    />
                    <input
                      type="url"
                      value={projDraft.projectUrl}
                      onChange={(e) => setProjDraft({ ...projDraft, projectUrl: e.target.value })}
                      placeholder="Project / GitHub URL"
                      className="wf-input text-sm"
                    />
                    <input
                      type="url"
                      value={projDraft.evidenceOrPortfolioLink}
                      onChange={(e) =>
                        setProjDraft({
                          ...projDraft,
                          evidenceOrPortfolioLink: e.target.value,
                        })
                      }
                      placeholder="WAYFINDER Evidence / Artifact Link"
                      className="wf-input text-sm"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={projDraft.description}
                    onChange={(e) => setProjDraft({ ...projDraft, description: e.target.value })}
                    placeholder="Project objective, methodology, and verifiable outcome *"
                    className="wf-input w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!projDraft.projectName.trim() || !projDraft.description.trim()) return;
                      updateActiveResume((cur) => ({
                        ...cur,
                        projects: [
                          ...cur.projects,
                          {
                            id: `PROJ_${Date.now()}`,
                            projectName: projDraft.projectName.trim(),
                            role: projDraft.role.trim() || 'Contributor',
                            description: projDraft.description.trim(),
                            technologiesOrSkills: projDraft.technologiesText
                              .split(',')
                              .map((t) => t.trim())
                              .filter(Boolean),
                            projectUrl: projDraft.projectUrl.trim(),
                            evidenceOrPortfolioLink: projDraft.evidenceOrPortfolioLink.trim(),
                          },
                        ],
                      }));
                      setProjDraft({
                        projectName: '',
                        role: '',
                        description: '',
                        technologiesText: '',
                        projectUrl: '',
                        evidenceOrPortfolioLink: '',
                      });
                    }}
                    className="wf-btn wf-btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project Entry
                  </button>
                </div>

                {activeResume.projects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl bg-white/85 border border-[#8DBDFF]/50 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0B2E56]">
                        {p.projectName} ({p.role})
                      </div>
                      <div className="text-xs text-[#075FC7] font-semibold">
                        {p.technologiesOrSkills.join(' • ')}
                      </div>
                      <p className="text-xs text-[#123B63] mt-1">{p.description}</p>
                      {(p.projectUrl || p.evidenceOrPortfolioLink) && (
                        <div className="text-[11px] text-[#315A7D] mt-1">
                          Artifact Link: {p.evidenceOrPortfolioLink || p.projectUrl}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          projects: cur.projects.filter((x) => x.id !== p.id),
                        }))
                      }
                      className="text-xs text-[#B91C1C] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeStep === 7 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 7 — Certifications, Awards, Publications &amp; Achievements
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Include verified credentials, academic awards, or peer-reviewed publications.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-white/80 border border-[#8DBDFF]/50 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      aria-label="Achievement Category"
                      value={certDraft.category}
                      onChange={(e) =>
                        setCertDraft({
                          ...certDraft,
                          category: e.target.value as ResumeCertificationEntry['category'],
                        })
                      }
                      className="wf-select text-sm"
                    >
                      <option value="CERTIFICATION">Certification</option>
                      <option value="AWARD">Academic / Competition Award</option>
                      <option value="PUBLICATION">Publication / Paper</option>
                      <option value="ACHIEVEMENT">Notable Achievement</option>
                    </select>
                    <input
                      type="text"
                      value={certDraft.title}
                      onChange={(e) => setCertDraft({ ...certDraft, title: e.target.value })}
                      placeholder="Title *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={certDraft.issuerOrVenue}
                      onChange={(e) =>
                        setCertDraft({ ...certDraft, issuerOrVenue: e.target.value })
                      }
                      placeholder="Issuing Body / Journal / Institution *"
                      className="wf-input text-sm"
                    />
                    <input
                      type="text"
                      value={certDraft.dateIssued}
                      onChange={(e) => setCertDraft({ ...certDraft, dateIssued: e.target.value })}
                      placeholder="Date (e.g., 2026-03)"
                      className="wf-input text-sm"
                    />
                    <input
                      type="url"
                      value={certDraft.credentialUrl}
                      onChange={(e) =>
                        setCertDraft({ ...certDraft, credentialUrl: e.target.value })
                      }
                      placeholder="Credential Verification URL (optional)"
                      className="wf-input text-sm sm:col-span-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!certDraft.title.trim() || !certDraft.issuerOrVenue.trim()) return;
                      updateActiveResume((cur) => ({
                        ...cur,
                        certifications: [
                          ...cur.certifications,
                          { ...certDraft, id: `CERT_${Date.now()}` },
                        ],
                      }));
                      setCertDraft({
                        category: 'CERTIFICATION',
                        title: '',
                        issuerOrVenue: '',
                        dateIssued: '',
                        credentialUrl: '',
                      });
                    }}
                    className="wf-btn wf-btn-primary text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Credential / Achievement
                  </button>
                </div>

                {activeResume.certifications.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-white/85 border border-[#8DBDFF]/50 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#0B2E56]">
                        {c.title}{' '}
                        <span className="text-xs font-normal text-[#075FC7]">[{c.category}]</span>
                      </div>
                      <div className="text-xs text-[#315A7D]">
                        {c.issuerOrVenue} • {c.dateIssued}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        updateActiveResume((cur) => ({
                          ...cur,
                          certifications: cur.certifications.filter((x) => x.id !== c.id),
                        }))
                      }
                      className="text-xs text-[#B91C1C] font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeStep === 8 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-[#0B2E56]">
                    Step 8 — Completeness Checker &amp; Ethical Opportunity Tailoring
                  </h2>
                  <p className="text-xs text-[#315A7D]">
                    Inspect structural completeness across all 8 criteria and compare your resume
                    against any Job Market Intelligence opportunity without fabricating unpossessed
                    skills.
                  </p>
                </div>

                {/* Completeness Checks */}
                <div className="p-4 rounded-xl bg-white/85 border border-[#8DBDFF]/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-[#0B2E56]">
                      Structural Completeness Audit: {completenessReport.passedChecks} /{' '}
                      {completenessReport.totalChecks} Checks Passed
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                        completenessReport.issues.length === 0
                          ? 'bg-[#DCFCE7] text-[#15803D]'
                          : 'bg-[#FEF3C7] text-[#B45309]'
                      }`}
                    >
                      {completenessReport.issues.length === 0
                        ? 'READY FOR EXPORT'
                        : `${completenessReport.issues.length} Item(s) Flagged`}
                    </span>
                  </div>

                  {completenessReport.issues.length === 0 ? (
                    <div className="text-xs text-[#15803D] font-semibold">
                      All contact fields, education entries, summaries, timelines, descriptions, and
                      proof links are complete.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {completenessReport.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="p-3 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50 text-xs"
                        >
                          <div className="flex items-center justify-between font-bold text-[#0B2E56]">
                            <span>{issue.sectionLabel}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] ${
                                issue.severity === 'REQUIRED'
                                  ? 'bg-[#FEE2E2] text-[#B91C1C]'
                                  : 'bg-[#FEF3C7] text-[#B45309]'
                              }`}
                            >
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-[#123B63] mt-1">{issue.message}</p>
                          <p className="text-[#075FC7] font-semibold mt-0.5">
                            Remediation: {issue.remediationTip}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ethical Opportunity-Based Resume Tailoring */}
                <div className="p-4 rounded-xl bg-white/85 border border-[#8DBDFF]/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-[#075FC7]">
                        Opportunity-Based Resume Tailoring
                      </div>
                      <h3 className="text-base font-bold text-[#0B2E56]">
                        Compare Resume Against Target Opportunity Requirements
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={handleDuplicateForOpportunity}
                      className="wf-btn wf-btn-secondary text-xs"
                    >
                      <Target className="w-3.5 h-3.5" /> Duplicate Version for This Opportunity
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#174B80] mb-1">
                      Select Target Opportunity (Sample Data)
                    </label>
                    <select
                      aria-label="Select Target Opportunity for Tailoring"
                      value={selectedOpportunityId}
                      onChange={(e) => setSelectedOpportunityId(e.target.value)}
                      className="wf-select w-full text-sm"
                    >
                      {marketOpportunities.map((opp) => (
                        <option key={opp.id} value={opp.id}>
                          {opp.title} — {opp.employerName} ({opp.specialization})
                        </option>
                      ))}
                    </select>
                  </div>

                  {tailoringReport && (
                    <div className="space-y-3 text-xs">
                      <div className="p-3 rounded-lg bg-[#E5F2FF] border border-[#8DBDFF] text-[#0B2E56] font-semibold flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#075FC7] shrink-0 mt-0.5" />
                        <span>{tailoringReport.ethicalTailoringNotice}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50">
                          <div className="font-bold text-[#0B2E56] mb-1">
                            Relevant Demonstrated / Assessed Skills to Highlight
                          </div>
                          {tailoringReport.relevantDemonstratedOrAssessedSkills.length > 0 ? (
                            <ul className="list-disc list-inside text-[#123B63] space-y-0.5">
                              {tailoringReport.relevantDemonstratedOrAssessedSkills.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[#315A7D]">
                              No assessed/demonstrated skills matching this opportunity are currently
                              in your resume. Add assessed skills in Step 4 or take a Skill
                              Assessment.
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50">
                          <div className="font-bold text-[#0B2E56] mb-1">
                            Accurate Capability Keywords (Strictly Verified/Assessed)
                          </div>
                          {tailoringReport.accurateCapabilityKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {tailoringReport.accurateCapabilityKeywords.map((kw) => (
                                <span
                                  key={kw}
                                  className="px-2 py-0.5 rounded bg-[#DDF0FF] text-[#0B2E56] font-semibold text-[11px]"
                                >
                                  {kw}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#315A7D]">
                              Complete a capability assessment or add verified skills to generate
                              accurate capability keywords.
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50">
                          <div className="font-bold text-[#0B2E56] mb-1">
                            Missing Information in Current Resume
                          </div>
                          {tailoringReport.missingInformationInResume.length > 0 ? (
                            <ul className="list-disc list-inside text-[#B45309] space-y-0.5">
                              {tailoringReport.missingInformationInResume.map((m) => (
                                <li key={m}>{m}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[#15803D] font-semibold">
                              All core sections relevant to this opportunity are present.
                            </p>
                          )}
                        </div>

                        <div className="p-3 rounded-lg bg-[#F4FAFF] border border-[#8DBDFF]/50">
                          <div className="font-bold text-[#0B2E56] mb-1">
                            Areas Needing Further Development Before Claiming
                          </div>
                          {tailoringReport.areasNeedingFurtherDevelopment.length > 0 ? (
                            <ul className="list-disc list-inside text-[#123B63] space-y-0.5">
                              {tailoringReport.areasNeedingFurtherDevelopment.map((area) => (
                                <li key={area}>{area}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-[#15803D] font-semibold">
                              Your demonstrated capabilities meet all target requirements for this
                              role.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Structured Resume Preview */}
        <div className="xl:col-span-5 space-y-4">
          <div className="wf-panel p-6 bg-white/95 border border-[#8DBDFF]">
            <div className="flex items-center justify-between border-b border-[#8DBDFF]/50 pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7]">
                  LIVE STRUCTURED PREVIEW ({activeResume.templateId.replace(/_/g, ' ')})
                </span>
                <h2 className="text-lg font-bold text-[#0B2E56]">{activeResume.versionName}</h2>
              </div>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-[#E5F2FF] text-[#0B2E56]">
                {completenessReport.passedChecks}/{completenessReport.totalChecks} Complete
              </span>
            </div>

            {/* Rendered Resume Document */}
            <div className="p-5 rounded-xl bg-white border border-[#8DBDFF]/60 shadow-inner space-y-4 text-xs text-[#123B63]">
              <div className="border-b border-[#8DBDFF]/60 pb-3">
                <div className="text-xl font-bold text-[#0B2E56]">
                  {activeResume.personalInfo.fullName || 'Your Full Name (Step 1)'}
                </div>
                <div className="text-[11px] text-[#315A7D] mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {activeResume.personalInfo.email && <span>{activeResume.personalInfo.email}</span>}
                  {activeResume.personalInfo.phone && <span>{activeResume.personalInfo.phone}</span>}
                  {activeResume.personalInfo.location && (
                    <span>{activeResume.personalInfo.location}</span>
                  )}
                  {activeResume.personalInfo.professionalProfileUrl && (
                    <span>{activeResume.personalInfo.professionalProfileUrl}</span>
                  )}
                  {activeResume.personalInfo.portfolioUrl && (
                    <span>{activeResume.personalInfo.portfolioUrl}</span>
                  )}
                  {activeResume.personalInfo.githubUrl && (
                    <span>{activeResume.personalInfo.githubUrl}</span>
                  )}
                </div>
              </div>

              {activeResume.professionalSummary && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Professional Summary
                  </div>
                  <p className="leading-relaxed">{activeResume.professionalSummary}</p>
                </div>
              )}

              {activeResume.education.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Education
                  </div>
                  <div className="space-y-2">
                    {activeResume.education.map((e) => (
                      <div key={e.id}>
                        <div className="flex justify-between font-bold text-[#0B2E56]">
                          <span>
                            {e.degree} — {e.specialization}
                          </span>
                          <span className="text-[#315A7D]">
                            {e.startDate} – {e.endDateOrExpected}
                          </span>
                        </div>
                        <div className="text-[#174B80]">{e.institution}</div>
                        {e.academicAchievements && (
                          <div className="text-[11px] text-[#315A7D] mt-0.5">
                            {e.academicAchievements}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeResume.skills.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Skills &amp; WAYFINDER Provenance Attribution
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeResume.skills.map((s) => (
                      <span
                        key={s.skillId}
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${provenanceBadgeStyle(
                          s.provenance
                        )}`}
                      >
                        {s.skillName} [{s.provenance.replace(/_/g, ' ')}
                        {s.rubricLevel !== null ? ` • L${s.rubricLevel}` : ''}]
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeResume.experience.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Experience
                  </div>
                  <div className="space-y-2">
                    {activeResume.experience.map((x) => (
                      <div key={x.id}>
                        <div className="flex justify-between font-bold text-[#0B2E56]">
                          <span>
                            {x.roleTitle} — {x.organization}
                          </span>
                          <span className="text-[#315A7D]">
                            {x.startDate} – {x.endDate}
                          </span>
                        </div>
                        <p className="mt-0.5">{x.responsibilities}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeResume.projects.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Projects &amp; Verifiable Artifacts
                  </div>
                  <div className="space-y-2">
                    {activeResume.projects.map((p) => (
                      <div key={p.id}>
                        <div className="flex justify-between font-bold text-[#0B2E56]">
                          <span>
                            {p.projectName} ({p.role})
                          </span>
                          <span className="text-[#075FC7]">
                            {p.technologiesOrSkills.join(', ')}
                          </span>
                        </div>
                        <p className="mt-0.5">{p.description}</p>
                        {(p.projectUrl || p.evidenceOrPortfolioLink) && (
                          <div className="text-[11px] text-[#075FC7] mt-0.5">
                            Proof Link: {p.evidenceOrPortfolioLink || p.projectUrl}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeResume.certifications.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#075FC7] border-b border-[#8DBDFF]/40 pb-1 mb-1.5">
                    Certifications &amp; Achievements
                  </div>
                  <div className="space-y-1.5">
                    {activeResume.certifications.map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span>
                          <strong className="text-[#0B2E56]">{c.title}</strong> — {c.issuerOrVenue}
                        </span>
                        <span className="text-[#315A7D]">{c.dateIssued}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
