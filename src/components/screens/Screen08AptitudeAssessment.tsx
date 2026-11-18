import React, { useState } from 'react';
import { useWayfinder } from '../../context/WayfinderContext';
import { getActiveAptitudeItems } from '../../data/aptitudeBank';
import { getCapabilityDimensionName } from '../../data/capabilityDimensions';
import { getFieldById, getSkillById } from '../../data/fieldAndSkillLibrary';
import { AptitudeDomain, SkillAssessmentAttempt } from '../../types/wayfinder';
import {
  BrainCircuit,
  CheckCircle2,
  Lock,
  Info,
  AlertTriangle,
  Clock,
  BookOpen,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { LiquidButton, LiquidTabs } from '../common/LiquidGlassKit';

export const Screen08AptitudeAssessment: React.FC = () => {
  const {
    state,
    selectSkillAssessment,
    submitSkillAssessmentAttempt,
    submitAptitudeDomainAttempt,
    navigateTo,
  } = useWayfinder();

  const [assessmentMode, setAssessmentMode] = useState<'SKILL_ENGINE' | 'CORE_APTITUDE'>(
    'SKILL_ENGINE'
  );

  // --- Mode 1: Field & Skill Assessment Engine State ---
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('ALL');
  const [skillResponses, setSkillResponses] = useState<Record<string, string | string[]>>({});
  const [latestSkillResult, setLatestSkillResult] = useState<SkillAssessmentAttempt | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filteredAssessments = state.skillAssessments.filter((asm) =>
    selectedFieldFilter === 'ALL' ? true : asm.fieldId === selectedFieldFilter
  );

  const activeSkillAssessment =
    state.skillAssessments.find((a) => a.id === state.selectedSkillAssessmentId) ||
    filteredAssessments[0] ||
    state.skillAssessments[0];

  const activeField = activeSkillAssessment
    ? getFieldById(activeSkillAssessment.fieldId, state.fieldsCatalogue)
    : undefined;
  const activeSkill = activeSkillAssessment
    ? getSkillById(activeSkillAssessment.skillId, state.skillsCatalogue)
    : undefined;

  const handleSelectAssessment = (id: string) => {
    selectSkillAssessment(id);
    setSkillResponses({});
    setLatestSkillResult(null);
    setValidationError(null);
  };

  const handleSingleChoiceSelect = (itemId: string, optionId: string) => {
    setSkillResponses((prev) => ({ ...prev, [itemId]: optionId }));
    setValidationError(null);
  };

  const handleMultiSelectToggle = (itemId: string, optionId: string) => {
    setSkillResponses((prev) => {
      const current = Array.isArray(prev[itemId]) ? (prev[itemId] as string[]) : [];
      const next = current.includes(optionId)
        ? current.filter((x) => x !== optionId)
        : [...current, optionId];
      return { ...prev, [itemId]: next };
    });
    setValidationError(null);
  };

  const handleTextOrNumericChange = (itemId: string, val: string) => {
    setSkillResponses((prev) => ({ ...prev, [itemId]: val }));
    setValidationError(null);
  };

  const handleSubmitSkillAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSkillAssessment) return;

    const result = submitSkillAssessmentAttempt(activeSkillAssessment.id, skillResponses);
    if (!result) return;

    if (result.completionStatus === 'INCOMPLETE_VALIDATION_ERROR') {
      setValidationError(
        result.areasNeedingDevelopment[0] ||
          'Please complete all required items before submitting.'
      );
      setLatestSkillResult(null);
      return;
    }

    setValidationError(null);
    setLatestSkillResult(result);
  };

  // --- Mode 2: Core Aptitude & Domain State ---
  const activeItems = getActiveAptitudeItems(state.featureFlags.enableSpatialReasoning);
  const availableDomains: { id: AptitudeDomain; label: string }[] = [
    { id: 'NUMERICAL', label: 'Numerical Reasoning' },
    { id: 'VERBAL', label: 'Verbal & Technical Comprehension' },
    { id: 'LOGICAL', label: 'Logical & Algorithmic Analysis' },
    { id: 'TARGET_KNOWLEDGE', label: 'Software & Systems Foundations' },
  ];

  if (state.featureFlags.enableSpatialReasoning) {
    availableDomains.push({
      id: 'SPATIAL',
      label: 'Spatial Reasoning',
    });
  }

  const [selectedDomain, setSelectedDomain] = useState<AptitudeDomain>('NUMERICAL');
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);

  const domainQuestions = activeItems.filter((item) => item.domain === selectedDomain);
  const currentDomainLabel =
    availableDomains.find((d) => d.id === selectedDomain)?.label || selectedDomain;

  const handleOptionSelect = (itemId: string, optionId: string) => {
    setSelectedOptions((prev) => ({ ...prev, [itemId]: optionId }));
  };

  const handleSubmitDomain = (e: React.FormEvent) => {
    e.preventDefault();
    submitAptitudeDomainAttempt(selectedDomain, selectedOptions);
    setSubmittedNotice(
      `Your ${currentDomainLabel} assessment has been scored and added to your Capability Passport.`
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header & Mode Switcher */}
      <div className="liquid-stack-card liquid-glow-bar rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#DDF2FF] border border-[#8CCBFF] flex items-center justify-center shadow-sm">
              <BrainCircuit className="w-5 h-5 text-[#087FE0]" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-semibold text-[#087FE0] uppercase">
                Skill Assessment Engine &amp; Aptitude Modules
              </span>
              <h1 className="font-display text-2xl font-bold text-[#0F2942]">
                Verify Your Knowledge and Problem-Solving Skills
              </h1>
            </div>
          </div>

          <LiquidButton
            variant="secondary"
            size="sm"
            pill
            onClick={() => navigateTo('10_ASSESSMENT_RESULTS')}
          >
            My Assessment Results →
          </LiquidButton>
        </div>

        <p className="text-xs sm:text-sm text-[#456784] leading-relaxed">
          Select a <strong>Field &amp; Skill Assessment</strong> or a{' '}
          <strong>Core Aptitude Module</strong>. Objective assessments use deterministic scoring
          rules; portfolio and practical tasks route to human reviewer evaluation.
        </p>

        <LiquidTabs
          tabs={[
            {
              id: 'SKILL_ENGINE',
              label: `Field & Skill Assessments (${state.skillAssessments.length})`,
            },
            {
              id: 'CORE_APTITUDE',
              label: `Core Aptitude Modules (${availableDomains.length})`,
            },
          ]}
          activeTab={assessmentMode}
          onChange={(id) => setAssessmentMode(id as 'SKILL_ENGINE' | 'CORE_APTITUDE')}
          className="w-full"
        />
      </div>

      {assessmentMode === 'SKILL_ENGINE' && activeSkillAssessment ? (
        <div className="space-y-6">
          {/* Step 1 & 2: Field & Skill Assessment Selector */}
          <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="skill-field-filter"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  1. Filter by Discipline / Field
                </label>
                <select
                  id="skill-field-filter"
                  value={selectedFieldFilter}
                  onChange={(e) => {
                    const nextField = e.target.value;
                    setSelectedFieldFilter(nextField);
                    const matching = state.skillAssessments.filter((a) =>
                      nextField === 'ALL' ? true : a.fieldId === nextField
                    );
                    if (matching[0]) {
                      handleSelectAssessment(matching[0].id);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs sm:text-sm"
                >
                  <option value="ALL">All Populated Assessment Fields</option>
                  {state.fieldsCatalogue
                    .filter((f) => state.skillAssessments.some((a) => a.fieldId === f.id))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="skill-assessment-select"
                  className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                >
                  2. Select Skill Assessment &amp; Target Level
                </label>
                <select
                  id="skill-assessment-select"
                  value={activeSkillAssessment.id}
                  onChange={(e) => handleSelectAssessment(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl select-liquid text-xs sm:text-sm"
                >
                  {filteredAssessments.map((asm) => (
                    <option key={asm.id} value={asm.id}>
                      {asm.title} (Up to Level {asm.targetProficiencyLevel} · v{asm.version})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 3: Assessment Instructions, Duration, Prerequisites & Evaluation Method */}
            <div className="p-4 rounded-xl glass-panel-subtle space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-bold text-[#0F2942] text-sm">
                  {activeSkillAssessment.title}
                </div>
                <div className="flex items-center gap-2 text-[#527493] font-mono text-[11px]">
                  <span>ID: {activeSkillAssessment.id}</span>
                  <span>·</span>
                  <span>Version {activeSkillAssessment.version}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-[#087FE0]">
                    <Clock className="w-3.5 h-3.5" /> {activeSkillAssessment.estimatedDurationMinutes}{' '}
                    min
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#456784]">
                <div>
                  <strong className="text-[#0F2942] block">Field &amp; Skill:</strong>
                  {activeField?.name || activeSkillAssessment.fieldId} —{' '}
                  {activeSkill?.name || activeSkillAssessment.skillId}
                </div>
                <div>
                  <strong className="text-[#0F2942] block">Linked Capability Dimension:</strong>
                  {getCapabilityDimensionName(activeSkillAssessment.mappedCapabilityId)} (Up to
                  Level {activeSkillAssessment.targetProficiencyLevel})
                </div>
                <div>
                  <strong className="text-[#0F2942] block">Evaluation Method:</strong>
                  {activeSkillAssessment.requiresHumanReview
                    ? 'Human Reviewer Rubric (No automated quiz score)'
                    : 'Deterministic Server-Side Answer Key'}
                </div>
              </div>

              <div className="text-[#456784] space-y-1 pt-2 border-t border-[#C5E4FA]">
                <div>
                  <strong className="text-[#0F2942]">Measurement Objective:</strong>{' '}
                  {activeSkillAssessment.measurementObjective}
                </div>
                <div>
                  <strong className="text-[#0F2942]">Instructions:</strong>{' '}
                  {activeSkillAssessment.instructions}
                </div>
                <div>
                  <strong className="text-[#0F2942]">Scoring Rules:</strong>{' '}
                  {activeSkillAssessment.scoringRulesSummary}
                </div>
                <div className="text-amber-800">
                  <strong>Assessment Scope &amp; Limitations:</strong>{' '}
                  {activeSkillAssessment.limitationsNotice}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Validation Required:</strong> {validationError}
              </div>
            </div>
          )}

          {/* Detailed Result Panel (Steps 6, 7, 8, 9, 10, 11) */}
          {latestSkillResult && (
            <div className="liquid-stack-card rounded-2xl p-6 space-y-5 border-2 border-[#087FE0]/30">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  <div>
                    <span className="text-[11px] font-mono font-semibold text-[#087FE0] uppercase">
                      Attempt Recorded · {latestSkillResult.assessmentId} v
                      {latestSkillResult.assessmentVersion}
                    </span>
                    <h2 className="font-display text-xl font-bold text-[#0F2942]">
                      {latestSkillResult.completionStatus === 'COMPLETED_SCORED'
                        ? `Score: ${latestSkillResult.correctCount} / ${latestSkillResult.totalItems} (${latestSkillResult.scorePercentage}%) — Assessed Level ${latestSkillResult.awardedRubricLevel}`
                        : 'Portfolio / Project Deliverable Submitted for Human Review'}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <LiquidButton
                    variant="secondary"
                    size="sm"
                    pill
                    onClick={() => navigateTo('15_LEARNING_CENTRE')}
                    icon={<BookOpen className="w-3.5 h-3.5 text-[#087FE0]" />}
                  >
                    Open Learning Hub
                  </LiquidButton>
                  <LiquidButton
                    variant="primary"
                    size="sm"
                    pill
                    onClick={() => navigateTo('14_READINESS_GAP_ANALYSIS')}
                  >
                    Check Updated Readiness Gaps →
                  </LiquidButton>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                  <div className="font-bold text-emerald-800">Demonstrated Strengths</div>
                  {latestSkillResult.demonstratedStrengths.length === 0 ? (
                    <p className="text-[#456784]">
                      No items were answered correctly in this attempt. Review the feedback below and
                      study the recommended resources before reassessing.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-[#0F2942]">
                      {latestSkillResult.demonstratedStrengths.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-xl glass-panel-subtle space-y-2">
                  <div className="font-bold text-amber-800">Areas Needing Further Development</div>
                  {latestSkillResult.areasNeedingDevelopment.length === 0 ? (
                    <p className="text-emerald-800">
                      All assessment items answered accurately! Next step: pair this assessment
                      result with a practical project artifact in the Evidence Ledger.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-[#456784]">
                      {latestSkillResult.areasNeedingDevelopment.map((a, i) => (
                        <li key={i}>• {a}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {latestSkillResult.itemFeedback.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#0F2942]">
                    Question-by-Question Diagnostic Feedback
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {latestSkillResult.itemFeedback.map((fb, idx) => (
                      <div
                        key={fb.itemId}
                        className="p-3.5 rounded-xl glass-panel-subtle text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#0F2942]">
                            Item {idx + 1}: {fb.subtopic}
                          </span>
                          <span
                            className={`font-mono font-semibold ${
                              fb.isCorrect ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {fb.isCorrect ? 'Correct' : 'Needs Review'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#456784] leading-relaxed">
                          {fb.feedbackSummary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                <div className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> What This Result Means &amp; Its
                  Limitations (CLAIM ≠ CAPABILITY ≠ PROOF)
                </div>
                <p className="leading-relaxed">{latestSkillResult.limitationsExplanation}</p>
                <div className="pt-1 font-semibold text-amber-950">Recommended Next Steps:</div>
                <ul className="space-y-0.5">
                  {latestSkillResult.recommendedNextSteps.map((step, i) => (
                    <li key={i}>• {step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Assessment Completion Form */}
          <form onSubmit={handleSubmitSkillAssessment} className="space-y-4">
            {activeSkillAssessment.requiresHumanReview ? (
              <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
                <div className="text-xs font-mono font-semibold text-[#087FE0] uppercase">
                  Human Reviewer Evaluation Workflow
                </div>
                <h3 className="font-display text-lg font-bold text-[#0F2942]">
                  {activeSkillAssessment.reviewerTaskPrompt}
                </h3>
                <p className="text-xs text-[#456784]">
                  <strong>Expected Deliverable:</strong>{' '}
                  {activeSkillAssessment.expectedDeliverableGuide}
                </p>

                <div>
                  <label
                    htmlFor="deliverable-url"
                    className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                  >
                    Portfolio / Project Deliverable URL (Required)
                  </label>
                  <input
                    id="deliverable-url"
                    type="url"
                    value={(skillResponses['DELIVERABLE_URL'] as string) || ''}
                    onChange={(e) => handleTextOrNumericChange('DELIVERABLE_URL', e.target.value)}
                    placeholder="https://github.com/... or https://figma.com/..."
                    className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="deliverable-rationale"
                    className="block text-xs font-semibold text-[#0F2942] mb-1.5"
                  >
                    Design / Engineering Rationale &amp; Verification Notes (Required)
                  </label>
                  <textarea
                    id="deliverable-rationale"
                    rows={4}
                    value={(skillResponses['DELIVERABLE_RATIONALE'] as string) || ''}
                    onChange={(e) =>
                      handleTextOrNumericChange('DELIVERABLE_RATIONALE', e.target.value)
                    }
                    placeholder="Explain the problem solved, how accessibility/quality standards were verified, and what your artifact demonstrates..."
                    className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <span className="text-xs text-[#456784]">
                    Submitting queues this artifact in the Evidence Ledger for human reviewer
                    evaluation. No automated score is fabricated.
                  </span>
                  <LiquidButton
                    type="submit"
                    variant="primary"
                    pill
                    icon={<FileCheck className="w-4 h-4" />}
                  >
                    Submit for Human Review
                  </LiquidButton>
                </div>
              </div>
            ) : (
              <>
                {activeSkillAssessment.items.map((item, idx) => (
                  <div key={item.id} className="glass-panel rounded-2xl p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[#087FE0] font-semibold">
                        Question {idx + 1} of {activeSkillAssessment.items.length} ·{' '}
                        {item.questionType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[#527493]">
                        Subtopic: <strong className="text-[#0F2942]">{item.subtopic}</strong> ·
                        Target Level {item.targetLevel}
                      </span>
                    </div>

                    {item.scenarioContext && (
                      <div className="p-3.5 rounded-xl glass-panel-subtle text-xs text-[#174B80] leading-relaxed">
                        <strong>Scenario Context:</strong> {item.scenarioContext}
                      </div>
                    )}

                    <p className="text-sm sm:text-base font-semibold text-[#0F2942] leading-relaxed">
                      {item.prompt}
                    </p>

                    {item.questionType === 'NUMERICAL_PROBLEM' ? (
                      <div className="flex items-center gap-3 max-w-sm">
                        <input
                          type="number"
                          step="any"
                          aria-label={item.prompt}
                          value={(skillResponses[item.id] as string) || ''}
                          onChange={(e) => handleTextOrNumericChange(item.id, e.target.value)}
                          placeholder="Enter numeric answer..."
                          className="w-full px-3.5 py-2.5 rounded-xl input-liquid text-sm font-mono"
                        />
                        {item.numericalUnitLabel && (
                          <span className="text-xs font-mono font-semibold text-[#087FE0]">
                            {item.numericalUnitLabel}
                          </span>
                        )}
                      </div>
                    ) : item.questionType === 'MULTIPLE_SELECT' ? (
                      <div className="space-y-2.5">
                        <div className="text-[11px] text-[#527493]">
                          Select all options that apply:
                        </div>
                        {item.options?.map((opt) => {
                          const currentArr = Array.isArray(skillResponses[item.id])
                            ? (skillResponses[item.id] as string[])
                            : [];
                          const isChecked = currentArr.includes(opt.id);
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs sm:text-sm ${
                                isChecked
                                  ? 'tab-liquid-active text-[#0F2942]'
                                  : 'bg-white/80 border-[#C5E4FA] text-[#456784] hover:text-[#0F2942] hover:border-[#8CCBFF] hover:bg-[#F0F9FF]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMultiSelectToggle(item.id, opt.id)}
                                className="accent-[#087FE0]"
                              />
                              <span className="font-mono font-bold text-[#087FE0] uppercase">
                                {opt.id}.
                              </span>
                              <span>{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {item.options?.map((opt) => {
                          const isSelected = skillResponses[item.id] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs sm:text-sm ${
                                isSelected
                                  ? 'tab-liquid-active text-[#0F2942]'
                                  : 'bg-white/80 border-[#C5E4FA] text-[#456784] hover:text-[#0F2942] hover:border-[#8CCBFF] hover:bg-[#F0F9FF]'
                              }`}
                            >
                              <input
                                type="radio"
                                name={item.id}
                                value={opt.id}
                                checked={isSelected}
                                onChange={() => handleSingleChoiceSelect(item.id, opt.id)}
                                className="accent-[#087FE0]"
                              />
                              <span className="font-mono font-bold text-[#087FE0] uppercase">
                                {opt.id}.
                              </span>
                              <span>{opt.text}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}

                <div className="liquid-stack-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-[#456784]">
                    <Info className="w-4 h-4 text-[#087FE0] shrink-0" />
                    <span>
                      Submitting validates all responses, scores against the versioned answer key,
                      and updates your assessed skill level.
                    </span>
                  </div>

                  <LiquidButton type="submit" variant="primary" size="lg" pill>
                    Submit {activeSkillAssessment.title}
                  </LiquidButton>
                </div>
              </>
            )}
          </form>
        </div>
      ) : (
        /* Mode 2: Core Aptitude & Domain Modules */
        <div className="space-y-6">
          <div className="liquid-stack-card rounded-2xl p-6 space-y-4">
            <div className="p-3.5 rounded-xl glass-panel-subtle flex items-start gap-2.5 text-xs text-[#456784]">
              <Lock className="w-4 h-4 text-[#087FE0] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#0F2942]">Accessibility Note:</strong> Spatial Reasoning is{' '}
                {state.featureFlags.enableSpatialReasoning ? (
                  <span className="text-amber-700 font-semibold">
                    currently enabled for this session
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold">
                    turned off by default to ensure accessible, non-visual testing
                  </span>
                )}
                .
              </div>
            </div>

            <LiquidTabs
              tabs={availableDomains.map((d) => ({
                id: d.id,
                label: d.label,
              }))}
              activeTab={selectedDomain}
              onChange={(id) => {
                setSelectedDomain(id);
                setSubmittedNotice(null);
              }}
              className="w-full"
            />
          </div>

          {submittedNotice && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{submittedNotice}</span>
              </div>
              <LiquidButton
                variant="secondary"
                size="sm"
                onClick={() => navigateTo('10_ASSESSMENT_RESULTS')}
              >
                View Results →
              </LiquidButton>
            </div>
          )}

          <form onSubmit={handleSubmitDomain} className="space-y-4">
            {domainQuestions.map((q, index) => (
              <div key={q.id} className="glass-panel rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#087FE0] font-semibold">
                    Question {index + 1} of {domainQuestions.length}
                  </span>
                  <span className="text-[#527493]">
                    Skill Area:{' '}
                    <strong className="text-[#0F2942]">
                      {getCapabilityDimensionName(q.mappedCapabilityId)}
                    </strong>
                  </span>
                </div>

                <p className="text-sm sm:text-base font-semibold text-[#0F2942] leading-relaxed">
                  {q.question}
                </p>

                <div className="space-y-2.5">
                  {q.options.map((opt) => {
                    const isSelected = selectedOptions[q.id] === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all text-xs sm:text-sm ${
                          isSelected
                            ? 'tab-liquid-active text-[#0F2942]'
                            : 'bg-white/80 border-[#C5E4FA] text-[#456784] hover:text-[#0F2942] hover:border-[#8CCBFF] hover:bg-[#F0F9FF]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={opt.id}
                          checked={isSelected}
                          onChange={() => handleOptionSelect(q.id, opt.id)}
                          className="accent-[#087FE0]"
                        />
                        <span className="font-mono font-bold text-[#087FE0] uppercase">
                          {opt.id}.
                        </span>
                        <span>{opt.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="liquid-stack-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#456784]">
                <Info className="w-4 h-4 text-[#087FE0] shrink-0" />
                <span>
                  Submitting this module updates the corresponding objective skill level in your
                  Capability Passport.
                </span>
              </div>

              <LiquidButton type="submit" variant="primary" size="lg" pill>
                Submit {currentDomainLabel}
              </LiquidButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

