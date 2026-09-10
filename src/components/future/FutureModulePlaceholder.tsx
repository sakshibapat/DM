import React, { useState } from 'react';
import {
  FileCheck,
  ShieldAlert,
  AlertTriangle,
  UserCheck,
  BarChart3,
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Layers,
  Database,
} from 'lucide-react';

interface FutureModulePlaceholderProps {
  moduleId: string;
}

export const FutureModulePlaceholder: React.FC<FutureModulePlaceholderProps> = ({ moduleId }) => {
  const [requested, setRequested] = useState(false);

  const getModuleConfig = () => {
    switch (moduleId) {
      case 'future-assessments':
        return {
          title: 'Assessments & DPIAs (Data Protection Impact Assessments)',
          icon: FileCheck,
          accent: 'text-indigo-600',
          bgAccent: 'bg-indigo-50 border-indigo-200',
          description:
            'Conduct automated GDPR Art 35 impact assessments, transfer impact assessments (TIA), and high-risk algorithm evaluations.',
          plannedFeatures: [
            'Automated DPIA triggers based on high-risk Data Mapping records',
            'Custom risk scoring matrices and mitigation workflow sign-offs',
            'Regulatory submission templates (ICO, CNIL, DPC Ireland)',
            'Vendor security assessment questionnaire dispatch & vendor portal',
          ],
        };
      case 'future-risks':
        return {
          title: 'Enterprise Privacy Risk Management',
          icon: ShieldAlert,
          accent: 'text-rose-600',
          bgAccent: 'bg-rose-50 border-rose-200',
          description:
            'Identify, quantify, and track organizational privacy risks, technical vulnerabilities, and regulatory compliance gaps.',
          plannedFeatures: [
            'Risk register linked directly to Assets and Processing Activities',
            'Inherent vs Residual risk heatmaps and SLA mitigation targets',
            'KRI (Key Risk Indicator) threshold alerts & automated escalation',
            'Integration with ISO 27001 & NIST Privacy Framework controls',
          ],
        };
      case 'future-incidents':
        return {
          title: 'Privacy Incidents & Breach Response',
          icon: AlertTriangle,
          accent: 'text-amber-600',
          bgAccent: 'bg-amber-50 border-amber-200',
          description:
            'Manage security breaches, loss of personal data, and 72-hour regulatory authority notifications (Art 33/34 GDPR).',
          plannedFeatures: [
            '72-hour GDPR breach countdown timer & incident triage checklist',
            'Affected data subject impact calculator and communication logs',
            'Post-incident root cause analysis & corrective action tracking (CAPA)',
            'Authority notification template generation (EDPB guidelines)',
          ],
        };
      case 'future-dsars':
        return {
          title: 'Data Subject Requests (DSAR & Rights)',
          icon: UserCheck,
          accent: 'text-emerald-600',
          bgAccent: 'bg-emerald-50 border-emerald-200',
          description:
            'Automate customer and employee data access, erasure (Right to be Forgotten), rectification, and data portability requests.',
          plannedFeatures: [
            'Secure self-service identity verification portal for data subjects',
            'Automated data discovery across linked Assets and Databases',
            'Redaction suite for third-party personal identifiers',
            'SLA tracking (30-day statutory response countdown)',
          ],
        };
      case 'future-reports':
      default:
        return {
          title: 'Executive Privacy Reporting & Compliance Analytics',
          icon: BarChart3,
          accent: 'text-purple-600',
          bgAccent: 'bg-purple-50 border-purple-200',
          description:
            'Executive governance dashboards, board reports, DPO audit trails, and multi-jurisdiction compliance posture metrics.',
          plannedFeatures: [
            'One-click RoPA PDF & Excel export for supervisory authorities',
            'Cross-inventory linkage completeness scoring',
            'Vendor DPA compliance rate & security cert expiry tracking',
            'Custom KPI reporting widgets for Chief Legal & Risk Officers',
          ],
        };
    }
  };

  const config = getModuleConfig();
  const Icon = config.icon;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Module Title Banner */}
      <div className={`p-6 rounded-xl border ${config.bgAccent} flex items-start gap-4 shadow-2xs`}>
        <div className="p-3 rounded-lg bg-white shadow-2xs border border-slate-200 shrink-0">
          <Icon className={`w-6 h-6 ${config.accent}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Coming Soon in Phase II
            </span>
            <span className="text-xs text-slate-500 font-medium">Archived for Future Phase</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{config.title}</h1>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{config.description}</p>
        </div>
      </div>

      {/* Architecture Readiness Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Seamless Architectural Integration</h3>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The PrivaMap data mapping core architecture is built with extensible schemas. When this module is enabled, it will automatically link directly with your existing 5 inventory registers (Processing Activities, TSPs, Assets, Vendors, and Entities) without requiring data re-entry.
        </p>

        {/* Feature Roadmap Bullet List */}
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Key Capabilities Planned:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {config.plannedFeatures.map((feat, idx) => (
              <div key={idx} className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-700 font-medium leading-normal">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Request Box */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-slate-500">
            Want early preview access to the <strong>{config.title}</strong> module?
          </div>
          <button
            type="button"
            onClick={() => setRequested(!requested)}
            className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
              requested
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
            }`}
          >
            {requested ? (
              <>
                <CheckCircle2 className="w-4 h-4" /> Request Registered
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" /> Request Early Access
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
