import { useState, useEffect } from "react";
import {
  ListChecks, Armchair, Layers, Footprints, Brain, Eye, Hand, Accessibility, Gamepad2,
  CheckCircle2, Clock, Circle, ArrowRight, FileText, X, Download, ChevronDown,
} from "lucide-react";
import { guidelines, priorityBadgeClass } from "../data/guidelines";
import jsPDF from "jspdf";

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  ListChecks, Armchair, Layers, Footprints, Brain, Eye, Hand, Accessibility, Gamepad2,
};

type Status = "not-started" | "in-progress" | "done";

const STATUS_LABELS: Record<Status, string> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  done: "Done",
};

const STATUS_COLORS: Record<Status, string> = {
  "not-started": "text-slate-500 bg-slate-100",
  "in-progress": "text-amber-700 bg-amber-100",
  done: "text-emerald-700 bg-emerald-100",
};

const STATUS_ICONS: Record<Status, React.ComponentType<{ size?: number; className?: string }>> = {
  "not-started": Circle,
  "in-progress": Clock,
  done: CheckCircle2,
};

const STORAGE_KEY_STATUS = "ive-project-statuses";
const STORAGE_KEY_NAME = "ive-project-name";
const STORAGE_KEY_TYPE = "ive-project-type";
const STORAGE_KEY_CHECKS = "ive-guideline-checks";

function loadStatuses(): Record<number, Status> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_STATUS) ?? "{}");
  } catch {
    return {};
  }
}

function saveStatuses(statuses: Record<number, Status>) {
  localStorage.setItem(STORAGE_KEY_STATUS, JSON.stringify(statuses));
}

interface YourProjectPageProps {
  onNavigate: (page: "home" | "guidelines" | "guideline-detail" | "your-project", guidelineId?: number) => void;
}

export default function YourProjectPage({ onNavigate }: YourProjectPageProps) {
  const [projectName, setProjectName] = useState(
    () => localStorage.getItem(STORAGE_KEY_NAME) ?? ""
  );
  const [projectType, setProjectType] = useState(
    () => localStorage.getItem(STORAGE_KEY_TYPE) ?? ""
  );
  const [statuses, setStatuses] = useState<Record<number, Status>>(loadStatuses);
  const [showReport, setShowReport] = useState(false);
  const [openStatus, setOpenStatus] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NAME, projectName);
  }, [projectName]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TYPE, projectType);
  }, [projectType]);

  const setStatus = (id: number, status: Status) => {
    const next = { ...statuses, [id]: status };
    setStatuses(next);
    saveStatuses(next);
    setOpenStatus(null);
  };

  const doneCount = guidelines.filter((g) => statuses[g.id] === "done").length;
  const inProgressCount = guidelines.filter((g) => statuses[g.id] === "in-progress").length;
  const pct = Math.round((doneCount / guidelines.length) * 100);

  const getGuidelineCheckPct = (id: number) => {
    try {
      const checks: Record<string, boolean[]> = JSON.parse(localStorage.getItem(STORAGE_KEY_CHECKS) ?? "{}");
      const arr = checks[id];
      if (!arr || arr.length === 0) return 0;
      return Math.round((arr.filter(Boolean).length / arr.length) * 100);
    } catch {
      return 0;
    }
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("IVE Design Guide — Project Report", 14, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Project: ${projectName || "(unnamed)"}`, 14, 35);
    doc.text(`Type: ${projectType || "(not specified)"}`, 14, 43);
    doc.text(`Overall completion: ${pct}% (${doneCount}/9 guidelines done)`, 14, 51);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 59);

    let y = 72;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Guideline Status", 14, y);
    y += 8;

    guidelines.forEach((g) => {
      const status = statuses[g.id] ?? "not-started";
      const checkPct = getGuidelineCheckPct(g.id);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const mark = status === "done" ? "[DONE]" : status === "in-progress" ? "[IN PROGRESS]" : "[ ]";
      doc.text(`${mark} Priority ${g.priority}: ${g.title} — Checklist: ${checkPct}%`, 14, y);
      y += 7;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("Priority Recommendations", 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    const pending = guidelines.filter((g) => statuses[g.id] !== "done").sort((a, b) => a.priority - b.priority).slice(0, 3);
    if (pending.length > 0) {
      doc.text("Focus on: " + pending.map((p) => `Priority ${p.priority} (${p.title})`).join(", "), 14, y, { maxWidth: 180 });
    }

    doc.save(`ive-project-report-${Date.now()}.pdf`);
  };

  return (
    <div className="pt-16 min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-xs font-semibold mb-4">
            Project Checklist
          </div>
          <h1 className="text-4xl font-bold text-[#1E293B] mb-3">Your Project</h1>
          <p className="text-lg text-slate-500">Apply the 9 guidelines to your VR project.</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Project Setup */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-[#1E293B] mb-6">Project Setup</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Lathe Training Simulator"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Project Type</label>
              <div className="relative">
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E] transition-colors appearance-none bg-white"
                >
                  <option value="">Select a type…</option>
                  <option value="Industrial Training">Industrial Training</option>
                  <option value="Educational">Educational</option>
                  <option value="Safety Training">Safety Training</option>
                  <option value="Other">Other</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1E293B]">Overall Progress</h2>
            <span className="text-2xl font-bold text-[#0F766E]">{pct}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
            <div className="progress-bar h-full" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={14} />
              <span>{doneCount} of 9 completed</span>
            </div>
            {inProgressCount > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <Clock size={14} />
                <span>{inProgressCount} in progress</span>
              </div>
            )}
          </div>
        </div>

        {/* Guideline List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-[#1E293B]">Guidelines</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {guidelines.map((g) => {
              const Icon = iconMap[g.iconName];
              const status: Status = statuses[g.id] ?? "not-started";
              const StatusIcon = STATUS_ICONS[status];
              const checkPct = getGuidelineCheckPct(g.id);

              return (
                <div key={g.id} className="px-6 py-4 hover:bg-[#F8FAFC] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#0F766E]/08 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-[#0F766E]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${priorityBadgeClass(g.priority)}`}>P{g.priority}</span>
                        <span className="font-semibold text-sm text-[#1E293B] truncate">{g.title}</span>
                      </div>
                      {checkPct > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="progress-bar h-full" style={{ width: `${checkPct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400">{checkPct}% checklist</span>
                        </div>
                      )}
                    </div>

                    {/* Status dropdown */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={() => setOpenStatus(openStatus === g.id ? null : g.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${STATUS_COLORS[status]}`}
                      >
                        <StatusIcon size={12} />
                        {STATUS_LABELS[status]}
                        <ChevronDown size={12} />
                      </button>
                      {openStatus === g.id && (
                        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-1 min-w-[140px]">
                          {(Object.keys(STATUS_LABELS) as Status[]).map((s) => {
                            const SIcon = STATUS_ICONS[s];
                            return (
                              <button
                                key={s}
                                onClick={() => setStatus(g.id, s)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors ${s === status ? "text-[#0F766E]" : "text-slate-600"}`}
                              >
                                <SIcon size={12} />
                                {STATUS_LABELS[s]}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onNavigate("guideline-detail", g.id)}
                      className="text-xs text-[#0F766E] font-semibold hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      View <ArrowRight size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Generation */}
        <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1E293B] mb-1">Generate Report</h2>
              <p className="text-sm text-slate-500">Review completion and download a PDF summary.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowReport(!showReport)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0F766E] text-white hover:bg-[#0A5E57] transition-colors flex items-center gap-2"
              >
                <FileText size={15} />
                Generate Report
              </button>
              <button
                onClick={downloadReport}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Download size={15} />
                Download PDF
              </button>
            </div>
          </div>

          {showReport && (
            <div className="mt-8 border-t border-slate-100 pt-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-bold text-[#1E293B] text-base">{projectName || "Untitled Project"}</h3>
                  {projectType && <p className="text-sm text-slate-500">{projectType}</p>}
                </div>
                <button onClick={() => setShowReport(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { value: `${pct}%`, label: "Overall Completion", color: "#0F766E" },
                  { value: `${doneCount}/9`, label: "Guidelines Done", color: "#0EA5E9" },
                  { value: `${inProgressCount}`, label: "In Progress", color: "#F59E0B" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl p-4 text-center border border-slate-100 bg-slate-50">
                    <div className="text-2xl font-bold" style={{ color: m.color }}>{m.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* Completed guidelines */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  Completed Guidelines
                </h4>
                <div className="space-y-2">
                  {guidelines.filter((g) => statuses[g.id] === "done").length === 0 ? (
                    <p className="text-sm text-slate-400 italic">None completed yet.</p>
                  ) : (
                    guidelines.filter((g) => statuses[g.id] === "done").map((g) => (
                      <div key={g.id} className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                        <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                        <span className="text-sm text-emerald-800 font-medium">Priority {g.priority}: {g.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending guidelines */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock size={15} className="text-amber-500" />
                  Pending Guidelines
                </h4>
                <div className="space-y-2">
                  {guidelines.filter((g) => statuses[g.id] !== "done").length === 0 ? (
                    <p className="text-sm text-emerald-600 font-medium">All guidelines completed!</p>
                  ) : (
                    guidelines.filter((g) => statuses[g.id] !== "done").map((g) => (
                      <div key={g.id} className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-100">
                        <Circle size={14} className="text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-amber-800 font-medium">Priority {g.priority}: {g.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Priority recommendations */}
              <div className="p-4 rounded-xl bg-[#F0FDF9] border border-[#0F766E]/20">
                <h4 className="text-sm font-bold text-[#0F766E] mb-2">Priority Recommendations</h4>
                <p className="text-sm text-[#1E293B]">
                  Focus on Priority 1–3 guidelines first:{" "}
                  {guidelines
                    .filter((g) => g.priority <= 3 && statuses[g.id] !== "done")
                    .map((g) => g.title)
                    .join(", ") || "All high-priority guidelines are complete!"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-[#1E293B] text-center">
        <p className="text-slate-400 text-sm">
          Developed as part of a Master's research on immersive training interfaces · Federal University of Paraná (UFPR)
        </p>
      </footer>
    </div>
  );
}
