import React, { useState, useEffect, useRef } from 'react';
import { PlanType, HistoryItem, User } from './types';
import * as quotaService from './services/quotaService';
import * as geminiService from './services/geminiService';
import * as authService from './services/authService';
import PlanSelector from './components/PlanSelector';
import History from './components/History';
import AuthModal from './components/AuthModal';

// SVG Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
);

const ImageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [plan, setPlan] = useState<PlanType>(PlanType.FREE);
  const [quotaRemaining, setQuotaRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedMimeType, setSelectedMimeType] = useState<string>('image/jpeg');
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize state from local storage
  useEffect(() => {
    // 1. Check if user is logged in
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);

    // 2. Load stored plan (or force FREE if not logged in)
    let storedPlan = quotaService.getStoredPlan();
    
    // Safety check: If stored plan is PAID but no user, revert to FREE
    if (storedPlan === PlanType.PAID && !currentUser) {
      storedPlan = PlanType.FREE;
      quotaService.setStoredPlan(PlanType.FREE);
    }

    setPlan(storedPlan);
    updateQuota(storedPlan);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateQuota = (currentPlan: PlanType) => {
    if (currentPlan === PlanType.PAID) {
      setQuotaRemaining(Infinity);
    } else {
      const { remaining } = quotaService.checkQuota();
      setQuotaRemaining(remaining);
    }
  };

  const handlePlanChangeRequest = (requestedPlan: PlanType) => {
    if (requestedPlan === PlanType.PAID) {
      if (!user) {
        // Must login to access Pro
        setIsAuthModalOpen(true);
        return;
      }
    }
    
    // If switching back to free or already logged in
    quotaService.setStoredPlan(requestedPlan);
    setPlan(requestedPlan);
    updateQuota(requestedPlan);
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Auto upgrade to Paid upon login for this demo
    quotaService.setStoredPlan(PlanType.PAID);
    setPlan(PlanType.PAID);
    updateQuota(PlanType.PAID);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    // Revert to Free
    quotaService.setStoredPlan(PlanType.FREE);
    setPlan(PlanType.FREE);
    updateQuota(PlanType.FREE);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImage(file);
    }
  };

  const handleImage = (file: File) => {
    // Reset current result
    setCurrentCaption(null);
    setError(null);

    // Validate size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Please upload an image under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setSelectedMimeType(file.type);
    };
    reader.readAsDataURL(file);
  };

  const generateCaption = async () => {
    if (!selectedImage) return;

    // Check quota before processing
    const { allowed } = quotaService.checkQuota();
    if (!allowed && plan === PlanType.FREE) {
      setError("Daily quota reached. Upgrade to Pro for unlimited access.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentCaption(null);

    try {
      const startTime = Date.now();
      
      const result = await geminiService.generateCaption(selectedImage, selectedMimeType);
      
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));

      setCurrentCaption(result.text);
      
      // Update Quota only if free plan
      if (plan === PlanType.FREE) {
        quotaService.incrementQuota();
        updateQuota(plan);
      }

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl: selectedImage,
        caption: result.text,
        modelUsed: result.model,
        timestamp: Date.now()
      };
      
      setHistory(prev => [newHistoryItem, ...prev]);

    } catch (err: any) {
      setError(err.message || "Failed to generate caption");
    } finally {
      setLoading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen pb-12">
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg">
              <ImageIcon />
            </div>
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">LensCraft AI</h1>
          </div>
          <div className="flex items-center gap-4">
             {user ? (
               <div className="hidden sm:flex items-center gap-2">
                 <span className="text-sm font-medium text-slate-700">Hi, {user.name}</span>
               </div>
             ) : (
               <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="text-sm font-medium text-slate-600 hover:text-primary transition-colors"
               >
                 Log in
               </button>
             )}
             <div className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
              v1.0.0
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-8">
        
        {/* Intro */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Instantly Caption Your Photos</h2>
          <p className="text-slate-500">Upload an image and let our advanced AI models describe it for you.</p>
        </div>

        {/* Plan & Quota */}
        <PlanSelector 
          currentPlan={plan} 
          onPlanChange={handlePlanChangeRequest}
          remainingQuota={quotaRemaining}
          user={user}
          onLogout={handleLogout}
        />

        {/* Main Interface */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          
          <div className="p-6 md:p-8">
            {/* Upload Area */}
            <div 
              onClick={triggerFileUpload}
              className={`
                group relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
                ${selectedImage ? 'border-primary/30 bg-primary/5' : 'border-slate-300 hover:border-primary hover:bg-slate-50'}
              `}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleFileSelect} 
                className="hidden" 
              />
              
              {selectedImage ? (
                <div className="relative">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="max-h-64 mx-auto rounded-lg shadow-sm"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <p className="text-white font-medium flex items-center gap-2">
                      <UploadIcon /> Change Image
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <UploadIcon />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-1">Click to upload image</h3>
                  <p className="text-sm text-slate-400">Supported formats: JPG, PNG, WEBP</p>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </div>
            )}

            {/* Action Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={generateCaption}
                disabled={!selectedImage || loading || (plan === PlanType.FREE && quotaRemaining <= 0)}
                className={`
                  flex items-center gap-2 px-8 py-3 rounded-full font-semibold shadow-md transition-all
                  ${!selectedImage || (plan === PlanType.FREE && quotaRemaining <= 0)
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : loading 
                      ? 'bg-primary/80 text-white cursor-wait'
                      : 'bg-primary hover:bg-blue-600 text-white hover:shadow-lg transform hover:-translate-y-0.5'
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <SparklesIcon /> Generate Caption
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result Section */}
          {currentCaption && (
            <div className="bg-slate-50 border-t border-slate-200 p-6 md:p-8 animate-fade-in">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-slate-500 mb-3">AI Caption</h3>
              <p className="text-slate-800 text-lg leading-relaxed font-medium">
                {currentCaption}
              </p>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => navigator.clipboard.writeText(currentCaption)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Copy to clipboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History Section */}
        <History items={history} />
        
      </main>
    </div>
  );
}

export default App;