
import React from 'react';
import { ComplianceData } from '../types';

interface ComplianceReportProps {
  data: ComplianceData;
  completedTaskIds: string[];
  onToggleTask: (taskId: string) => void;
}

const Card: React.FC<{ title: string; icon: string; bgColor: string; iconColor: string; children: React.ReactNode; className?: string }> = ({ title, icon, bgColor, iconColor, children, className = "" }) => (
  <div className={`bg-white rounded-[1.5rem] shadow-sm border border-slate-100 p-8 relative overflow-hidden break-inside-avoid mb-6 ${className}`}>
    <div className={`absolute top-0 right-0 w-24 h-24 ${bgColor} opacity-10 rounded-bl-[4rem] print:hidden`}></div>
    <div className="flex items-center gap-4 mb-6 relative z-10">
      <div className={`w-10 h-10 ${bgColor} ${iconColor} rounded-xl flex items-center justify-center text-xl shadow-sm print:border print:border-slate-100`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

export const ComplianceReport: React.FC<ComplianceReportProps> = ({ data, completedTaskIds, onToggleTask }) => {
  const totalTasks = data.actionableTaskChecklist.length;
  const progressPercentage = Math.round((completedTaskIds.length / totalTasks) * 100);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 w-full animate-in fade-in duration-700 print:py-0 print:px-0">
      {/* Header & Progress */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 print:mb-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-[#1d70b8] font-bold uppercase tracking-widest text-xs">
            <span className="w-2 h-2 rounded-full bg-[#1d70b8] animate-pulse print:hidden"></span>
            Compliance Roadmap
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Operational Protocol
          </h2>
          <p className="text-slate-500 text-lg font-medium print:text-sm">
            Regulatory sequence and documentation mandates generated specifically for your business case.
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handlePrint}
            className="gradient-bg text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 print:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Export as PDF
          </button>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl min-w-[280px] print:hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Protocol Maturity</span>
              <span className="text-[#1d70b8] font-black text-xl">{progressPercentage}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full gradient-bg transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-12 flex items-start gap-4 print:mb-6 print:bg-white print:border-slate-200">
        <span className="text-2xl print:hidden">⚖️</span>
        <div>
          <strong className="text-amber-900 block mb-1">Status: Informational Roadmap</strong>
          <p className="text-amber-800 text-sm font-medium leading-relaxed opacity-90 print:text-xs print:text-slate-600">
            This document outlines standard Indian regulatory workflows. It is not legal counsel. Professional review of documents (Form 16, ROC filings, GST returns) is required before final submission.
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card title="Required Workflow" icon="⚡" bgColor="bg-blue-50" iconColor="text-[#1d70b8]">
            <div className="space-y-4">
              {data.actionableTaskChecklist.map((item, i) => {
                const taskId = `task-${i}`;
                const isCompleted = completedTaskIds.includes(taskId);
                return (
                  <div key={i} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${isCompleted ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm'} group print:bg-white print:border-slate-100 print:mb-2`}>
                    <div className="print:hidden">
                      <input 
                        type="checkbox" 
                        checked={isCompleted}
                        onChange={() => onToggleTask(taskId)}
                        className="mt-1 h-6 w-6 rounded-lg border-2 border-slate-300 text-[#1d70b8] focus:ring-[#1d70b8] transition-all cursor-pointer" 
                      />
                    </div>
                    <div className="hidden print:block w-4 h-4 border border-slate-300 rounded mt-1"></div>
                    <div>
                      <p className={`font-bold text-slate-800 mb-1 leading-tight ${isCompleted ? 'line-through decoration-slate-400' : ''}`}>{item.task}</p>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed print:text-xs">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Documentation Stack" icon="📂" bgColor="bg-emerald-50" iconColor="text-emerald-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.requiredDocuments.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-emerald-50/20 rounded-xl border border-emerald-100 print:bg-white print:border-slate-100">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span className="text-slate-700 font-bold text-sm tracking-tight">{doc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          <Card title="Regulatory Context" icon="📜" bgColor="bg-indigo-50" iconColor="text-indigo-600">
            <div className="space-y-5">
              {data.applicableRegulations.map((reg, i) => (
                <div key={i}>
                  <h4 className="font-black text-slate-800 mb-1 text-sm">{reg.name}</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{reg.description}</p>
                  {i < data.applicableRegulations.length - 1 && <div className="mt-4 border-b border-slate-50"></div>}
                </div>
              ))}
            </div>
          </Card>

          <Card title="Risk Factors" icon="🚩" bgColor="bg-rose-50" iconColor="text-rose-600">
            <div className="space-y-4">
              {data.riskFlags.map((risk, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl print:bg-white print:border-slate-100">
                  <span className="text-rose-600 mt-0.5">•</span>
                  <p className="text-xs text-rose-900 font-bold leading-relaxed">{risk}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Frequencies" icon="🗓️" bgColor="bg-amber-50" iconColor="text-amber-600">
            <div className="space-y-3">
              {data.deadlinesFrequency.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                  <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wider">{item}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-20 pt-10 border-t border-slate-100 text-center print:mt-10">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          Certified Roadmap — Generated by ReguFlow AI Engine
        </p>
      </div>
    </div>
  );
};
