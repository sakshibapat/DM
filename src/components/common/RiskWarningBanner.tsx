import React from 'react';
import { AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

interface RiskWarningBannerProps {
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'info';
  actionButton?: React.ReactNode;
}

export const RiskWarningBanner: React.FC<RiskWarningBannerProps> = ({
  title,
  description,
  severity = 'medium',
  actionButton,
}) => {
  let style = 'bg-amber-50/80 border-amber-200 text-amber-900';
  let Icon = AlertTriangle;
  let iconColor = 'text-amber-600';

  if (severity === 'high') {
    style = 'bg-rose-50/80 border-rose-200 text-rose-950';
    Icon = ShieldAlert;
    iconColor = 'text-rose-600';
  } else if (severity === 'info') {
    style = 'bg-slate-50 border-slate-200 text-slate-800';
    Icon = Info;
    iconColor = 'text-slate-500';
  }

  return (
    <div className={`p-3.5 rounded-md border flex items-start gap-3 ${style}`}>
      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wide">{title}</h4>
        <p className="text-xs mt-0.5 opacity-90 leading-relaxed">{description}</p>
      </div>
      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
};
