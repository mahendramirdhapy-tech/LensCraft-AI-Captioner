import React from 'react';
import { PlanType, User } from '../types';

interface PlanSelectorProps {
  currentPlan: PlanType;
  onPlanChange: (plan: PlanType) => void;
  remainingQuota: number;
  user: User | null;
  onLogout: () => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ 
  currentPlan, 
  onPlanChange, 
  remainingQuota, 
  user,
  onLogout 
}) => {
  
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            Subscription Plan
            {currentPlan === PlanType.PAID && (
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full font-bold border border-yellow-200">PRO</span>
            )}
          </h3>
          <p className="text-sm text-slate-500">
            {currentPlan === PlanType.FREE 
              ? `Free Tier: 5 captions per day` 
              : "Unlimited captions & priority processing"}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => onPlanChange(PlanType.FREE)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                currentPlan === PlanType.FREE
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Free
            </button>
            <button
              onClick={() => onPlanChange(PlanType.PAID)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                currentPlan === PlanType.PAID
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Pro
            </button>
          </div>

          {user && (
             <div className="flex items-center gap-2 text-xs text-slate-500">
               <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                 {user.avatar ? (
                   <img src={user.avatar} alt="avatar" className="w-full h-full" />
                 ) : (
                   <span className="font-bold text-primary">{user.name[0]}</span>
                 )}
               </div>
               <span>{user.name}</span>
               <button onClick={onLogout} className="text-red-400 hover:text-red-500 underline ml-1">
                 Logout
               </button>
             </div>
          )}
        </div>
      </div>

      {currentPlan === PlanType.FREE && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-600 mb-1">
            <span>Daily Quota</span>
            <span>{remainingQuota} remaining</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${remainingQuota === 0 ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${(remainingQuota / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanSelector;