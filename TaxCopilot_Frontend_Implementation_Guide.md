# TaxCopilot — Frontend Implementation Guide
### For Gemini 2.5 Pro | React + Tailwind CSS | Full-Stack Integration Spec

**Version:** 2.0  
**Date:** 2026-03-10  
**Stack:** React 18 + TypeScript + Tailwind CSS + React Query (TanStack Query v5) + React Router v6  
**Backend Base URL (MVP):** `http://localhost:8000/api/v1`  
**Backend Base URL (Prod):** `https://api.taxcopilot.in/api/v1`

---

## AGENT INSTRUCTIONS (Read First)

You are implementing the **complete frontend** for AI Tax Copilot, an Indian conversational tax planning platform. The backend is a FastAPI Python server already built. Your job is to build a production-grade React frontend that integrates with every backend endpoint.

### Critical Rules the Agent Must Never Break

| Rule | Reason |
|------|--------|
| **Never compute, estimate, or hardcode any ₹ tax figure** | All numbers come from the backend tax engine. Frontend is display-only for financial figures. |
| **Access token stored in memory only (JS variable), NEVER localStorage** | Security requirement. Use HttpOnly cookie for refresh token (set by backend). |
| **All amounts formatted in Indian numbering: ₹10,00,000** | Indian standard. Use `formatIndianCurrency()` utility everywhere. |
| **Every AI chat message must have a 👍/👎 feedback button** | Core RLHF feedback loop. |
| **Never show a blank chat** | Always pre-populate with persona-specific opening question from `/onboarding/questions`. |
| **Silent token refresh on 401** | Axios interceptor auto-calls `POST /auth/refresh` before retrying the failed request. |
| **MFA gate after PAN/Aadhaar upload** | After any document upload, check if backend returns `mfa_required: true` and redirect to MFA setup. |

---

## Part 1: Project Setup

### 1.1 Tech Stack & Dependencies

```bash
npm create vite@latest taxcopilot-frontend -- --template react-ts
cd taxcopilot-frontend

npm install \
  @tanstack/react-query \
  axios \
  react-router-dom \
  zustand \
  react-hook-form \
  zod \
  @hookform/resolvers \
  framer-motion \
  recharts \
  lucide-react \
  clsx \
  tailwind-merge \
  react-dropzone \
  @radix-ui/react-tooltip \
  @radix-ui/react-dialog \
  @radix-ui/react-progress \
  @radix-ui/react-tabs \
  @radix-ui/react-toast \
  date-fns

npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
```

### 1.2 Directory Structure

```
taxcopilot-frontend/
├── src/
│   ├── api/
│   │   ├── client.ts           # Axios instance + auth interceptor
│   │   ├── auth.ts             # Auth hooks (useLogin, useRegister)
│   │   ├── chat.ts             # Chat hooks (useSendMessage, useConversations)
│   │   ├── tax.ts              # Tax hooks (useComparison, useHealthScore)
│   │   ├── documents.ts        # Document hooks (useUpload, usePollStatus)
│   │   ├── profile.ts          # Profile hooks (useProfile, usePatchProfile)
│   │   ├── deductions.ts       # Deduction hooks (useOptimizer, useNicheSuggestions)
│   │   └── calendar.ts         # Calendar hooks (useDeadlines)
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── TaxCalculationCard.tsx
│   │   │   ├── SuggestionCard.tsx
│   │   │   ├── CitationDrawer.tsx
│   │   │   ├── QuickReplyChips.tsx
│   │   │   └── FeedbackButtons.tsx
│   │   ├── dashboard/
│   │   │   ├── HealthGauge.tsx
│   │   │   ├── RegimeBadge.tsx
│   │   │   ├── DeadlineChip.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── profile/
│   │   │   ├── FinancialSummaryCard.tsx
│   │   │   └── ProfileDiffToast.tsx
│   │   ├── documents/
│   │   │   ├── DropZone.tsx
│   │   │   ├── ExtractionPreview.tsx
│   │   │   └── ConfidenceIndicator.tsx
│   │   ├── deductions/
│   │   │   ├── DeductionGapBar.tsx
│   │   │   └── NicheSuggestionCard.tsx
│   │   └── ui/
│   │       ├── JargonTooltip.tsx
│   │       ├── AmountDisplay.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Spinner.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── RegimeComparison.tsx
│   │   ├── DocumentUpload.tsx
│   │   ├── DeductionOptimizer.tsx
│   │   ├── AdvanceTax.tsx
│   │   ├── TaxHealthScore.tsx
│   │   ├── TaxCalendar.tsx
│   │   └── Settings.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useIndianCurrency.ts
│   ├── utils/
│   │   ├── formatCurrency.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── styles/
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### 1.3 Tailwind Config

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          500: '#3B82F6', 600: '#2563EB', 700: '#1D4ED8',
        },
        success: { 50: '#ECFDF5', 600: '#059669' },
        warning: { 50: '#FFFBEB', 600: '#D97706' },
        danger:  { 50: '#FEF2F2', 600: '#DC2626' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'slide-up':   'slideUp 200ms ease-out',
        'fade-in':    'fadeIn 200ms ease-out',
        'count-up':   'countUp 600ms ease-out',
        'gauge-fill': 'gaugeFill 1000ms ease-in-out',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

---

## Part 2: API Client & Auth

### 2.1 Axios Client with Silent Token Refresh

```typescript
// src/api/client.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Access token lives ONLY in memory — never localStorage
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // Sends HttpOnly refresh token cookie
});

// Inject access token into every request
apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Silent refresh on 401
let refreshPromise: Promise<string> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = apiClient
          .post('/auth/refresh')
          .then((res) => {
            const token = res.data.access_token;
            setAccessToken(token);
            return token;
          })
          .finally(() => { refreshPromise = null; });
      }
      await refreshPromise;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(original);
    }
    return Promise.reject(error);
  }
);
```

### 2.2 TypeScript Types

```typescript
// src/types/index.ts

export type Persona = 'salaried' | 'freelancer' | 'business_owner' | 'first_time_filer';

export interface User {
  user_id: string;
  email: string;
  persona: Persona;
  onboarding_complete: boolean;
  mfa_enabled: boolean;
}

export interface FinancialProfile {
  financial_year: string;
  version: number;
  salary_income: number;
  freelance_income: number;
  business_income: number;
  other_income: number;
  hra_actual_received: number;
  hra_rent_paid: number;
  hra_city_type: 'metro' | 'non-metro';
  section_80c: number;
  section_80d_self: number;
  section_80d_parents: number;
  section_80ccd_nps: number;
  section_80e: number;
  section_80g: number;
  home_loan_interest: number;
  is_let_out_property: boolean;
  capital_gains_stcg_equity: number;
  capital_gains_ltcg_equity: number;
  tds_deducted: number;
  advance_tax_paid: number;
  presumptive_44ada: boolean;
}

export interface RegimeComparison {
  recommended_regime: 'old' | 'new';
  savings: number;
  reason: string;
  breakeven_investment: number;
  old_regime: RegimeBreakdown;
  new_regime: RegimeBreakdown;
}

export interface RegimeBreakdown {
  gross_income: number;
  standard_deduction: number;
  chapter_via_deductions: number;
  taxable_income: number;
  base_tax: number;
  surcharge: number;
  rebate_87a: number;
  cess: number;
  total_tax: number;
  effective_rate: number;
  calculation_trace: CalculationStep[];
}

export interface CalculationStep {
  label: string;
  amount: number;
  operation: 'add' | 'subtract' | 'result';
}

export interface ChatMessage {
  message_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: Citation[];
  tax_updated: boolean;
  tax_snapshot_id?: string;
  profile_diff?: ProfileDiff;
  feedback?: 1 | -1 | null;
  created_at: string;
}

export interface Citation {
  section: string;
  text: string;
  fy: string;
}

export interface ProfileDiff {
  field: string;
  old_value: number;
  new_value: number;
  tax_impact: number;
}

export interface TaxHealthScore {
  score: number;
  factors: HealthFactor[];
}

export interface HealthFactor {
  name: string;
  weight: number;
  score: number;
  improvement_action: string;
  improvement_delta: number;
}

export interface AdvanceTaxInstallment {
  installment_number: number;
  due_date: string;
  percentage_due: number;
  amount_due: number;
  amount_paid: number | null;
  status: 'upcoming' | 'due' | 'paid' | 'missed';
  interest_234c: number;
}

export interface DeductionSuggestion {
  section: string;
  subsection: string;
  tier: 1 | 2 | 3;
  eligible: boolean;
  max_deduction: number;
  estimated_saving: number;
  regime: 'old' | 'new' | 'both';
  awareness_score: number;
  action_steps: string[];
  documents_needed: string[];
  ai_explanation: string;
}

export interface DocumentUpload {
  id: string;
  doc_type: string;
  filename: string;
  ocr_status: 'pending' | 'processing' | 'complete' | 'failed';
  extraction_confidence: number;
  extracted_json: Record<string, ExtractionField>;
  uploaded_at: string;
}

export interface ExtractionField {
  value: string | number;
  confidence: number;
  confirmed: boolean;
}
```

### 2.3 Auth Context

```typescript
// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, setAccessToken } from '@/api/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, persona: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // On mount: try to refresh using HttpOnly cookie
    apiClient.post('/auth/refresh')
      .then((res) => {
        setAccessToken(res.data.access_token);
        return apiClient.get('/auth/me');
      })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    setAccessToken(res.data.access_token);
    const me = await apiClient.get('/auth/me');
    setUser(me.data);
  };

  const register = async (email: string, password: string, persona: string) => {
    const res = await apiClient.post('/auth/register', { email, password, persona });
    setAccessToken(res.data.access_token);
    const me = await apiClient.get('/auth/me');
    setUser(me.data);
  };

  const logout = async () => {
    await apiClient.post('/auth/logout');
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
```

---

## Part 3: Utility Functions

### 3.1 Indian Currency Formatter

```typescript
// src/utils/formatCurrency.ts

/**
 * Formats a number in Indian numbering system.
 * 1000000 → "₹10,00,000"
 * 150000  → "₹1,50,000"
 * 75000   → "₹75,000"
 */
export function formatINR(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`;
    if (amount >= 100_000)    return `₹${(amount / 100_000).toFixed(1)}L`;
    if (amount >= 1_000)      return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Returns tax savings as a positive formatted string.
 * Used for "saves ₹X" displays.
 */
export function formatSavings(amount: number): string {
  return `saves ${formatINR(Math.abs(amount))}`;
}
```

---

## Part 4: Page Implementations

### 4.1 Login / Register Pages

```typescript
// src/pages/Login.tsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch {
      setError('Incorrect email or password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">₹</span>
          </div>
          <span className="text-xl font-bold text-gray-900">TaxCopilot</span>
          <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">FY 2024–25</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
        <p className="text-gray-500 mb-6 text-sm">Your tax advisor is waiting.</p>

        {error && (
          <div className="bg-danger-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="you@example.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              autoComplete="current-password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          New to TaxCopilot?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Create account
          </Link>
        </p>

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-400 mt-4">
          🔒 Your financial data is encrypted with AES-256. PAN and Aadhaar are never sent to AI models.
        </p>
      </div>
    </div>
  );
}
```

### 4.2 Onboarding Page

```typescript
// src/pages/Onboarding.tsx
// 3-step wizard: Persona → Quick questions → Launch chat
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/api/client';
import { Persona } from '@/types';

const PERSONAS: { id: Persona; title: string; subtitle: string; icon: string; color: string }[] = [
  { id: 'salaried',          title: 'Salaried Employee',  subtitle: '₹8L–₹25L, Form 16 available',    icon: '🧑‍💼', color: 'border-primary-500 bg-primary-50' },
  { id: 'freelancer',        title: 'Freelancer / Gig',   subtitle: 'Variable income, no TDS employer', icon: '💻', color: 'border-violet-500 bg-violet-50' },
  { id: 'business_owner',    title: 'Business Owner',      subtitle: '₹15L+, P&L + personal income',     icon: '🏢', color: 'border-amber-500 bg-amber-50' },
  { id: 'first_time_filer',  title: 'First-Time Filer',   subtitle: 'New to taxes — guided mode',        icon: '🎓', color: 'border-emerald-500 bg-emerald-50' },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePersonaSelect = (p: Persona) => {
    setPersona(p);
    setStep(2);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/onboarding/complete');
      // Create first conversation
      const convRes = await apiClient.post('/chat/conversations', {
        financial_year: 'FY2024-25',
      });
      navigate(`/chat/${convRes.data.conversation_id}`);
    } catch {
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">₹</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Let's set up your tax profile</h1>
          <p className="text-gray-500 text-sm mt-1">Takes 60 seconds. No forms, no jargon.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'bg-primary-600 w-12' : 'bg-gray-200 w-8'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Persona Selection */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">Which best describes you?</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePersonaSelect(p.id)}
                    className={`border-2 rounded-xl p-4 text-left transition-all hover:shadow-md active:scale-95 ${p.color}`}
                  >
                    <span className="text-3xl mb-2 block">{p.icon}</span>
                    <h3 className="font-semibold text-gray-900">{p.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{p.subtitle}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Quick confirm */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                <span className="text-5xl">{PERSONAS.find(p => p.id === persona)?.icon}</span>
                <h2 className="text-xl font-bold text-gray-900 mt-3">
                  {PERSONAS.find(p => p.id === persona)?.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  We'll customize TaxCopilot for your specific situation.
                </p>
                <div className="mt-6 space-y-2">
                  {persona === 'salaried' && (
                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                      💡 I'll help you choose between Old and New regime, optimize HRA, and auto-parse your Form 16.
                    </div>
                  )}
                  {persona === 'freelancer' && (
                    <div className="bg-violet-50 rounded-lg p-3 text-sm text-violet-800">
                      💡 I'll calculate your advance tax, check 44ADA eligibility, and track deductible expenses.
                    </div>
                  )}
                  {persona === 'business_owner' && (
                    <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
                      💡 I'll separate personal and business income, track loss set-offs, and flag TDS compliance.
                    </div>
                  )}
                  {persona === 'first_time_filer' && (
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm text-emerald-800">
                      💡 I'll check if you even need to file, explain every term in plain English, and guide you step by step.
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 rounded-lg py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                    Back
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-primary-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-primary-700">
                    That's me →
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Launch */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 0.5 }}>
                  <span className="text-6xl">🚀</span>
                </motion.div>
                <h2 className="text-xl font-bold text-gray-900 mt-4">You're all set!</h2>
                <p className="text-gray-500 text-sm mt-2">
                  TaxCopilot is ready. Your first question is waiting.
                </p>
                <div className="mt-4 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 text-left border-l-4 border-primary-500">
                  <span className="font-medium">TaxCopilot will ask:</span>
                  <br />
                  {persona === 'salaried' && '"What's your approximate annual gross salary?"'}
                  {persona === 'freelancer' && '"What were your total professional receipts this year?"'}
                  {persona === 'business_owner' && '"Let's start with your business revenue for FY 2024-25."'}
                  {persona === 'first_time_filer' && '"Congrats on your first job! Let's check if you even need to file ITR."'}
                </div>
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="w-full mt-6 bg-primary-600 text-white rounded-lg py-3 text-sm font-semibold hover:bg-primary-700 disabled:opacity-50"
                >
                  {isLoading ? 'Setting up...' : 'Start chatting →'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
```

### 4.3 Dashboard Page

```typescript
// src/pages/Dashboard.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/utils/formatCurrency';
import { TaxHealthScore, RegimeComparison } from '@/types';
import HealthGauge from '@/components/dashboard/HealthGauge';

export default function Dashboard() {
  const { user } = useAuth();

  const { data: healthScore } = useQuery<TaxHealthScore>({
    queryKey: ['health-score'],
    queryFn: () => apiClient.get('/tax/health-score').then(r => r.data),
  });

  const { data: comparison } = useQuery<RegimeComparison>({
    queryKey: ['tax-comparison'],
    queryFn: () => apiClient.get('/tax/comparison').then(r => r.data),
  });

  const { data: calendar } = useQuery({
    queryKey: ['calendar-upcoming'],
    queryFn: () => apiClient.get('/calendar/upcoming').then(r => r.data),
  });

  const { data: suggestions } = useQuery({
    queryKey: ['niche-suggestions'],
    queryFn: () => apiClient.get('/tax/suggestions').then(r => r.data),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">₹</span>
          </div>
          <span className="font-bold text-gray-900">TaxCopilot</span>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">FY 2024–25</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/chat/new" className="bg-primary-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-primary-700 font-medium">
            + Ask TaxCopilot
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting()} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's your tax health overview for FY 2024–25</p>
        </div>

        {/* Niche savings alert banner */}
        {suggestions?.total_potential_savings > 0 && (
          <Link to="/deductions" className="block bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💎</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">Hidden savings detected</p>
                <p className="text-sm text-amber-700">
                  You may be eligible for {formatINR(suggestions.total_potential_savings)} in unclaimed deductions across {suggestions.suggestions?.length} sections.
                </p>
              </div>
              <span className="text-amber-600 font-medium text-sm">View →</span>
            </div>
          </Link>
        )}

        {/* Hero row: Health Score + Regime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tax Health Score */}
          <Link to="/health-score" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Tax Health Score</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">FY 2024–25</span>
            </div>
            {healthScore ? (
              <HealthGauge score={healthScore.score} />
            ) : (
              <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            )}
            {healthScore && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                {healthScore.score < 50
                  ? '⚠️ Several opportunities to improve'
                  : healthScore.score < 80
                  ? '📈 Good — a few improvements available'
                  : '✅ Excellent tax health'}
              </p>
            )}
          </Link>

          {/* Regime recommendation */}
          <Link to="/regime" className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Regime Recommendation</h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                comparison?.recommended_regime === 'new'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {comparison?.recommended_regime === 'new' ? 'New Regime' : 'Old Regime'}
              </span>
            </div>
            {comparison ? (
              <>
                <p className="text-3xl font-bold text-emerald-600">{formatINR(comparison.savings)}</p>
                <p className="text-sm text-gray-500 mt-1">saved vs. the other regime</p>
                <p className="text-xs text-gray-400 mt-3 line-clamp-2">{comparison.reason}</p>
              </>
            ) : (
              <div className="space-y-2">
                <div className="h-8 bg-gray-100 rounded animate-pulse" />
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              </div>
            )}
          </Link>
        </div>

        {/* Upcoming deadlines */}
        {calendar?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Upcoming Deadlines</h2>
              <Link to="/calendar" className="text-sm text-primary-600 hover:underline">View all</Link>
            </div>
            <div className="space-y-3">
              {calendar.slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    d.urgency === 'urgent' ? 'bg-red-100 text-red-700' :
                    d.urgency === 'warning' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {d.days_remaining} days
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{d.title}</p>
                    <p className="text-xs text-gray-400">{d.date}</p>
                  </div>
                  {d.amount && <span className="text-sm font-mono text-gray-700">{formatINR(d.amount)}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/documents', icon: '📄', label: 'Upload Document' },
            { to: '/chat/new', icon: '💬', label: 'Ask a Question' },
            { to: '/deductions', icon: '🎯', label: 'Find Deductions' },
            { to: '/tax/pdf', icon: '⬇️', label: 'Download Summary' },
          ].map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-primary-200 transition-all"
            >
              <span className="text-2xl block mb-2">{a.icon}</span>
              <span className="text-xs font-medium text-gray-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
```

### 4.4 Chat Page (Primary Screen)

```typescript
// src/pages/Chat.tsx
// This is the flagship page. Two-panel layout: chat + Financial Summary Card.

import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ChatMessage, ProfileDiff } from '@/types';
import MessageBubble from '@/components/chat/MessageBubble';
import FinancialSummaryCard from '@/components/profile/FinancialSummaryCard';
import QuickReplyChips from '@/components/chat/QuickReplyChips';
import { formatINR } from '@/utils/formatCurrency';
import { Paperclip, Mic, Send } from 'lucide-react';

const QUICK_REPLIES: Record<string, string[]> = {
  default: [
    'Show regime comparison',
    'What deductions am I missing?',
    'Upload my Form 16',
    'Calculate advance tax',
  ],
  post_income: [
    'Add my deductions',
    'Which regime is better for me?',
    'How much advance tax do I owe?',
  ],
  post_deduction: [
    'Are there more deductions?',
    'Show final tax',
    'Download tax summary',
  ],
};

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [pendingDiff, setPendingDiff] = useState<ProfileDiff | null>(null);
  const [citationMsg, setCitationMsg] = useState<ChatMessage | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Create new conversation if needed
  useEffect(() => {
    if (conversationId === 'new') {
      apiClient.post('/chat/conversations', { financial_year: 'FY2024-25' })
        .then(res => navigate(`/chat/${res.data.conversation_id}`, { replace: true }));
    }
  }, [conversationId]);

  // Fetch messages
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => apiClient.get(`/chat/conversations/${conversationId}/messages`).then(r => r.data),
    enabled: !!conversationId && conversationId !== 'new',
    refetchInterval: false,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (message: string) =>
      apiClient.post(`/chat/conversations/${conversationId}/messages`, {
        message,
        financial_year: 'FY2024-25',
      }).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      if (data.tax_updated) {
        queryClient.invalidateQueries({ queryKey: ['profile'] });
        queryClient.invalidateQueries({ queryKey: ['tax-comparison'] });
        queryClient.invalidateQueries({ queryKey: ['health-score'] });
      }
      if (data.profile_diff) {
        setPendingDiff(data.profile_diff);
        setTimeout(() => setPendingDiff(null), 5000);
      }
    },
  });

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || sendMutation.isPending) return;
    setInput('');
    await sendMutation.mutateAsync(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  const messages: ChatMessage[] = messagesData?.messages || [];
  const quickReplies = QUICK_REPLIES.default;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">₹</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 text-sm">TaxCopilot</h1>
            <p className="text-xs text-gray-400">FY 2024–25 · AI Tax Advisor</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">● Online</span>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1 rounded-lg"
            >
              {isSidebarOpen ? 'Hide' : 'Show'} Summary
            </button>
          </div>
        </header>

        {/* Profile diff toast */}
        {pendingDiff && (
          <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm flex items-center gap-2 animate-slide-up">
            <span className="text-amber-600">📊</span>
            <span className="text-amber-800">
              <span className="font-medium">{pendingDiff.field}</span> updated:{' '}
              <span className="line-through text-gray-400">{formatINR(pendingDiff.old_value)}</span>
              {' → '}
              <span className="font-medium">{formatINR(pendingDiff.new_value)}</span>
              {' · Tax '}
              <span className={pendingDiff.tax_impact > 0 ? 'text-red-600' : 'text-green-600'}>
                {pendingDiff.tax_impact > 0 ? '+' : ''}{formatINR(pendingDiff.tax_impact)}
              </span>
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary-600 border-t-transparent" />
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.message_id}
              message={msg}
              onCitationClick={() => setCitationMsg(msg)}
              conversationId={conversationId!}
            />
          ))}

          {sendMutation.isPending && (
            <div className="flex gap-2 items-end">
              <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">₹</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        <QuickReplyChips replies={quickReplies} onSelect={handleSend} disabled={sendMutation.isPending} />

        {/* Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-end gap-2 max-w-3xl mx-auto">
            <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-2">
              <Paperclip size={18} />
            </button>
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question or financial detail..."
                rows={1}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 max-h-32 overflow-y-auto"
                style={{ minHeight: '42px' }}
              />
            </div>
            <button className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-2">
              <Mic size={18} />
            </button>
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMutation.isPending}
              className="flex-shrink-0 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl p-2.5 transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            TaxCopilot is an estimation tool. For complex situations, consult a CA.
          </p>
        </div>
      </div>

      {/* Financial Summary Sidebar */}
      {isSidebarOpen && (
        <div className="hidden md:block w-80 bg-white border-l border-gray-200 flex-shrink-0 overflow-y-auto">
          <FinancialSummaryCard conversationId={conversationId!} />
        </div>
      )}

      {/* Citation Drawer */}
      {citationMsg && (
        <CitationDrawerPanel message={citationMsg} onClose={() => setCitationMsg(null)} />
      )}
    </div>
  );
}
```

---

## Part 5: Key Component Implementations

### 5.1 MessageBubble

```typescript
// src/components/chat/MessageBubble.tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { ChatMessage } from '@/types';
import TaxCalculationCard from './TaxCalculationCard';
import { formatINR } from '@/utils/formatCurrency';
import { ThumbsUp, ThumbsDown, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  message: ChatMessage;
  onCitationClick: () => void;
  conversationId: string;
}

export default function MessageBubble({ message, onCitationClick, conversationId }: Props) {
  const [feedback, setFeedback] = useState<1 | -1 | null>(message.feedback ?? null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correction, setCorrection] = useState('');

  const feedbackMutation = useMutation({
    mutationFn: (rating: 1 | -1) =>
      apiClient.post('/feedback/message', { message_id: message.message_id, rating }),
    onSuccess: (_, rating) => setFeedback(rating),
  });

  const correctionMutation = useMutation({
    mutationFn: (text: string) =>
      apiClient.post('/feedback/correction', { message_id: message.message_id, correction_text: text }),
  });

  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">₹</span>
        </div>
      )}

      <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed animate-fade-in ${
          isUser
            ? 'bg-primary-600 text-white rounded-br-sm'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
        }`}>
          {message.content}
        </div>

        {/* Tax calculation card (if this message triggered a calculation) */}
        {message.tax_snapshot_id && !isUser && (
          <TaxCalculationCard snapshotId={message.tax_snapshot_id} />
        )}

        {/* AI message actions */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            {/* Timestamp */}
            <span className="text-xs text-gray-400">
              {new Date(message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Citations */}
            {message.citations?.length > 0 && (
              <button
                onClick={onCitationClick}
                className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
              >
                <BookOpen size={12} />
                {message.citations.length} source{message.citations.length > 1 ? 's' : ''}
              </button>
            )}

            {/* Feedback */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => feedbackMutation.mutate(1)}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${feedback === 1 ? 'text-green-600' : 'text-gray-400'}`}
              >
                <ThumbsUp size={13} />
              </button>
              <button
                onClick={() => { feedbackMutation.mutate(-1); setShowCorrection(true); }}
                className={`p-1 rounded hover:bg-gray-100 transition-colors ${feedback === -1 ? 'text-red-500' : 'text-gray-400'}`}
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Correction form */}
        {showCorrection && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 w-full animate-fade-in">
            <p className="text-xs font-medium text-gray-600 mb-2">What was wrong? (helps us improve)</p>
            <textarea
              value={correction}
              onChange={(e) => setCorrection(e.target.value)}
              rows={2}
              className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              placeholder="e.g. My income is ₹15L, not ₹10L"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { correctionMutation.mutate(correction); setShowCorrection(false); }}
                className="text-xs bg-primary-600 text-white px-3 py-1 rounded-lg hover:bg-primary-700"
              >
                Submit
              </button>
              <button onClick={() => setShowCorrection(false)} className="text-xs text-gray-500 hover:text-gray-700">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.2 Financial Summary Card

```typescript
// src/components/profile/FinancialSummaryCard.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { FinancialProfile } from '@/types';
import { formatINR } from '@/utils/formatCurrency';
import { Pencil, Check, X } from 'lucide-react';

const DISPLAY_FIELDS: { key: keyof FinancialProfile; label: string; section?: string }[] = [
  { key: 'salary_income',    label: 'Salary Income',     section: 'Income' },
  { key: 'freelance_income', label: 'Freelance Income',  section: 'Income' },
  { key: 'other_income',     label: 'Other Income',      section: 'Income' },
  { key: 'section_80c',      label: '80C Investments',   section: 'Deductions' },
  { key: 'section_80d_self', label: '80D (Self)',         section: 'Deductions' },
  { key: 'section_80ccd_nps',label: 'NPS (80CCD 1B)',    section: 'Deductions' },
  { key: 'tds_deducted',     label: 'TDS Deducted',      section: 'Taxes Paid' },
  { key: 'advance_tax_paid', label: 'Advance Tax Paid',  section: 'Taxes Paid' },
];

export default function FinancialSummaryCard({ conversationId }: { conversationId: string }) {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<keyof FinancialProfile | null>(null);
  const [editValue, setEditValue] = useState('');
  const [regimeView, setRegimeView] = useState<'new' | 'old'>('new');

  const { data: profile } = useQuery<FinancialProfile>({
    queryKey: ['profile'],
    queryFn: () => apiClient.get('/profile').then(r => r.data),
  });

  const { data: comparison } = useQuery({
    queryKey: ['tax-comparison'],
    queryFn: () => apiClient.get('/tax/comparison').then(r => r.data),
  });

  const patchMutation = useMutation({
    mutationFn: (update: Partial<FinancialProfile>) =>
      apiClient.patch('/profile', update).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['tax-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['health-score'] });
      setEditingField(null);
    },
  });

  const startEdit = (field: keyof FinancialProfile, current: number) => {
    setEditingField(field);
    setEditValue(current.toString());
  };

  const saveEdit = () => {
    if (!editingField) return;
    patchMutation.mutate({ [editingField]: parseFloat(editValue) || 0 });
  };

  const displayTax = regimeView === 'new'
    ? comparison?.new_regime?.total_tax
    : comparison?.old_regime?.total_tax;

  const currentSection = (field: keyof FinancialProfile) =>
    DISPLAY_FIELDS.find(f => f.key === field)?.section;

  let lastSection = '';

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900 text-sm">Financial Summary</h2>
        <div className="flex text-xs bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setRegimeView('new')}
            className={`px-2 py-1 rounded-md transition-colors ${regimeView === 'new' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            New
          </button>
          <button
            onClick={() => setRegimeView('old')}
            className={`px-2 py-1 rounded-md transition-colors ${regimeView === 'old' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
          >
            Old
          </button>
        </div>
      </div>

      {/* Tax figure hero */}
      {comparison ? (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Estimated Tax ({regimeView === 'new' ? 'New' : 'Old'} Regime)</p>
          <p className="text-2xl font-bold text-primary-700 font-mono">
            {displayTax !== undefined ? formatINR(displayTax) : '—'}
          </p>
          {comparison.recommended_regime === regimeView && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1 inline-block">
              ✅ Recommended
            </span>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 rounded-xl h-20 animate-pulse mb-4" />
      )}

      {/* Field list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {DISPLAY_FIELDS.map(({ key, label, section }) => {
          const showSection = section !== lastSection;
          lastSection = section!;
          const value = profile?.[key] as number || 0;

          return (
            <div key={key}>
              {showSection && (
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-3 mb-1 first:mt-0">
                  {section}
                </p>
              )}
              {editingField === key ? (
                <div className="flex items-center gap-1 bg-primary-50 border border-primary-200 rounded-lg px-2 py-1.5">
                  <span className="text-xs text-gray-600 flex-1 truncate">{label}</span>
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-24 text-xs border border-gray-300 rounded px-1.5 py-1 text-right font-mono focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                  />
                  <button onClick={saveEdit} className="text-green-600 hover:text-green-700 p-0.5">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditingField(null)} className="text-red-500 hover:text-red-600 p-0.5">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(key, value)}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
                >
                  <span className="text-xs text-gray-600 text-left truncate">{label}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono ${value > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                      {value > 0 ? formatINR(value) : '—'}
                    </span>
                    <Pencil size={10} className="text-gray-300 group-hover:text-gray-500 flex-shrink-0" />
                  </div>
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <a href="/regime" className="block text-center text-xs text-primary-600 hover:underline">
          View full breakdown →
        </a>
      </div>
    </div>
  );
}
```

### 5.3 Regime Comparison Page

```typescript
// src/pages/RegimeComparison.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { RegimeComparison, RegimeBreakdown, CalculationStep } from '@/types';
import { formatINR } from '@/utils/formatCurrency';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';

function BreakdownRow({ step }: { step: CalculationStep }) {
  const isResult = step.operation === 'result';
  return (
    <div className={`flex justify-between text-sm py-1.5 ${isResult ? 'font-bold border-t border-gray-200 mt-1 pt-2' : ''}`}>
      <span className={isResult ? 'text-gray-900' : 'text-gray-600'}>{step.label}</span>
      <span className={`font-mono ${step.operation === 'subtract' ? 'text-red-500' : isResult ? 'text-gray-900' : 'text-gray-800'}`}>
        {step.operation === 'subtract' ? '−' : step.operation === 'add' ? '+' : '='}
        {' '}{formatINR(step.amount)}
      </span>
    </div>
  );
}

function RegimeCard({ breakdown, label, isWinner, regime }: {
  breakdown: RegimeBreakdown;
  label: string;
  isWinner: boolean;
  regime: 'old' | 'new';
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`rounded-2xl border-2 p-5 ${isWinner ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">{label}</h3>
        {isWinner && (
          <span className="bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
            ✅ Recommended
          </span>
        )}
      </div>

      <p className="text-3xl font-bold font-mono text-gray-900 mb-1">{formatINR(breakdown.total_tax)}</p>
      <p className="text-xs text-gray-500">Effective rate: {(breakdown.effective_rate * 100).toFixed(1)}%</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary-600 mt-3 hover:underline"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide' : 'Show'} calculation trace
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {breakdown.calculation_trace?.map((step, i) => (
            <BreakdownRow key={i} step={step} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegimeComparisonPage() {
  const { data, isLoading } = useQuery<RegimeComparison>({
    queryKey: ['tax-comparison'],
    queryFn: () => apiClient.get('/tax/comparison').then(r => r.data),
  });

  const { data: optimizer } = useQuery({
    queryKey: ['deductions-optimizer'],
    queryFn: () => apiClient.get('/deductions/optimizer').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <h1 className="font-bold text-gray-900">Regime Comparison</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Recommendation banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
          <p className="text-sm opacity-80 mb-1">Based on your profile</p>
          <h2 className="text-2xl font-bold mb-1">
            {data.recommended_regime === 'new' ? 'New' : 'Old'} Regime saves you {formatINR(data.savings)}
          </h2>
          <p className="text-sm opacity-90">{data.reason}</p>
        </div>

        {/* Side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RegimeCard
            breakdown={data.new_regime}
            label="New Regime"
            isWinner={data.recommended_regime === 'new'}
            regime="new"
          />
          <RegimeCard
            breakdown={data.old_regime}
            label="Old Regime"
            isWinner={data.recommended_regime === 'old'}
            regime="old"
          />
        </div>

        {/* Breakeven */}
        {data.recommended_regime === 'new' && data.breakeven_investment > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="font-medium text-amber-900 text-sm mb-1">💡 Breakeven Investment</p>
            <p className="text-sm text-amber-800">
              Invest <span className="font-bold">{formatINR(data.breakeven_investment)}</span> more in deductible instruments (80C, NPS, etc.) to make the Old Regime equally beneficial.
            </p>
          </div>
        )}

        {/* Deduction opportunities */}
        {optimizer?.sections?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Deduction Opportunities</h3>
              <Link to="/deductions" className="text-xs text-primary-600 hover:underline">View all →</Link>
            </div>
            <div className="space-y-3">
              {optimizer.sections.slice(0, 4).map((s: any) => (
                <div key={s.section} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700">{s.label} ({s.section})</span>
                    <span className="text-emerald-600 font-medium">{formatINR(s.estimated_saving)} savings</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min((s.used / s.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{formatINR(s.used)} used</span>
                    <span>{formatINR(s.limit)} limit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.4 Niche Deduction Optimizer

```typescript
// src/pages/DeductionOptimizer.tsx
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { DeductionSuggestion } from '@/types';
import { formatINR } from '@/utils/formatCurrency';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const TIER_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'High Impact',   color: 'bg-red-100 text-red-700' },
  2: { label: 'Situational',   color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Niche / Rare',  color: 'bg-purple-100 text-purple-700' },
};

function SuggestionCard({ s }: { s: DeductionSuggestion }) {
  const [open, setOpen] = useState(false);
  const tier = TIER_LABELS[s.tier];

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full p-4 text-left hover:bg-gray-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm text-gray-900">Section {s.section}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tier.color}`}>{tier.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                s.regime === 'both' ? 'bg-green-100 text-green-700' :
                s.regime === 'old' ? 'bg-blue-100 text-blue-700' :
                'bg-violet-100 text-violet-700'
              }`}>
                {s.regime === 'both' ? 'Both Regimes' : s.regime === 'old' ? 'Old Regime' : 'New Regime'}
              </span>
            </div>
            <p className="text-sm text-gray-700">{s.subsection}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold text-emerald-600">{formatINR(s.estimated_saving)}</p>
            <p className="text-xs text-gray-400">potential saving</p>
          </div>
        </div>

        {/* Awareness badge */}
        <div className="flex items-center gap-1 mt-2">
          <div className="h-1 rounded-full bg-gray-100 flex-1">
            <div
              className="h-1 rounded-full bg-amber-400"
              style={{ width: `${(1 - s.awareness_score) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">{Math.round((1 - s.awareness_score) * 100)}% of people miss this</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
          {/* AI explanation */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">What is this?</p>
            <p className="text-sm text-gray-700">{s.ai_explanation}</p>
          </div>

          {/* Action steps */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1">How to claim</p>
            <ol className="space-y-1">
              {s.action_steps.map((step, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-primary-100 text-primary-700 rounded-full text-xs flex items-center justify-center font-medium">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Documents needed */}
          {s.documents_needed.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Documents needed</p>
              <div className="flex flex-wrap gap-1">
                {s.documents_needed.map((doc, i) => (
                  <span key={i} className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-gray-600">
                    📎 {doc}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Max deduction */}
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
            <span>Maximum deduction limit</span>
            <span className="font-mono font-medium text-gray-700">{formatINR(s.max_deduction)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeductionOptimizerPage() {
  const [showRare, setShowRare] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['niche-suggestions', showRare],
    queryFn: () =>
      apiClient.get('/tax/suggestions', { params: { regime: 'both', include_rare: showRare } }).then(r => r.data),
  });

  const { data: optimizer } = useQuery({
    queryKey: ['deductions-optimizer'],
    queryFn: () => apiClient.get('/deductions/optimizer').then(r => r.data),
  });

  const suggestions: DeductionSuggestion[] = data?.suggestions || [];
  const tier1 = suggestions.filter(s => s.tier === 1);
  const tier2 = suggestions.filter(s => s.tier === 2);
  const tier3 = suggestions.filter(s => s.tier === 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <h1 className="font-bold text-gray-900">Deduction Optimizer</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Total savings banner */}
        {data?.total_potential_savings > 0 && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
            <p className="text-sm opacity-80 mb-1">Total unclaimed potential</p>
            <p className="text-3xl font-bold">{formatINR(data.total_potential_savings)}</p>
            <p className="text-sm opacity-90 mt-1">across {suggestions.length} eligible sections you haven't fully utilised</p>
          </div>
        )}

        {/* Standard deduction gaps */}
        {optimizer?.sections?.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Standard Deduction Gaps</h2>
            <div className="space-y-4">
              {optimizer.sections.map((s: any) => (
                <div key={s.section}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-800">{s.label} <span className="text-xs text-gray-400">({s.section})</span></span>
                    <span className="text-emerald-600 font-medium text-xs">{formatINR(s.estimated_saving)} savings available</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${s.used >= s.limit ? 'bg-green-500' : 'bg-primary-500'}`}
                      style={{ width: `${Math.min((s.used / s.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{formatINR(s.used)} used</span>
                    <span>{formatINR(s.limit - s.used)} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Niche suggestions — Tier 1 */}
        {tier1.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">💎 High Impact — Widely Missed</h2>
            <div className="space-y-3">
              {tier1.map(s => <SuggestionCard key={s.section} s={s} />)}
            </div>
          </div>
        )}

        {/* Tier 2 */}
        {tier2.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">🎯 Situational — Check If Applicable</h2>
            <div className="space-y-3">
              {tier2.map(s => <SuggestionCard key={s.section} s={s} />)}
            </div>
          </div>
        )}

        {/* Tier 3 toggle */}
        <button
          onClick={() => setShowRare(!showRare)}
          className="w-full border border-gray-200 bg-white rounded-xl py-3 text-sm text-gray-500 hover:bg-gray-50"
        >
          {showRare ? '▲ Hide' : '▼ Show'} niche / rare deductions (patents, authors, disabilities...)
        </button>

        {showRare && tier3.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">🔬 Rare — Niche Professions</h2>
            <div className="space-y-3">
              {tier3.map(s => <SuggestionCard key={s.section} s={s} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.5 Document Upload Page

```typescript
// src/pages/DocumentUpload.tsx
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client';
import { DocumentUpload, ExtractionField } from '@/types';
import { formatINR } from '@/utils/formatCurrency';
import { Link } from 'react-router-dom';
import { Upload, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

const DOC_TYPES = [
  { id: 'form16',           label: 'Form 16' },
  { id: 'ais',              label: 'AIS Statement' },
  { id: '26as',             label: 'Form 26AS' },
  { id: 'salary_slip',      label: 'Salary Slip' },
  { id: 'rent_receipt',     label: 'Rent Receipt' },
  { id: 'investment_proof', label: 'Investment Proof' },
  { id: 'bank_statement',   label: 'Bank Statement' },
];

function ConfidenceChip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  if (pct >= 85) return <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">{pct}%</span>;
  if (pct >= 60) return <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">⚠️ {pct}%</span>;
  return <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">❗ {pct}%</span>;
}

function ExtractionTable({ docId }: { docId: string }) {
  const queryClient = useQueryClient();
  const { data: extraction } = useQuery({
    queryKey: ['extraction', docId],
    queryFn: () => apiClient.get(`/documents/${docId}/extraction`).then(r => r.data),
    refetchInterval: (data) => data ? false : 2000,
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiClient.post(`/documents/${docId}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['tax-comparison'] });
      queryClient.invalidateQueries({ queryKey: ['health-score'] });
    },
  });

  if (!extraction?.extracted_json) return null;

  const fields = Object.entries(extraction.extracted_json) as [string, ExtractionField][];

  return (
    <div className="space-y-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
            <th className="pb-2 font-medium">Field</th>
            <th className="pb-2 font-medium">Value</th>
            <th className="pb-2 font-medium">Confidence</th>
          </tr>
        </thead>
        <tbody>
          {fields.map(([key, field]) => (
            <tr key={key} className="border-b border-gray-50">
              <td className="py-2 text-gray-600 capitalize">{key.replace(/_/g, ' ')}</td>
              <td className="py-2 font-mono text-gray-800 font-medium">
                {typeof field.value === 'number' ? formatINR(field.value) : String(field.value)}
              </td>
              <td className="py-2">
                <ConfidenceChip value={field.confidence} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending}
          className="flex-1 bg-primary-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
        >
          {confirmMutation.isPending ? 'Saving...' : '✓ Confirm & Update Profile'}
        </button>
      </div>
    </div>
  );
}

export default function DocumentUploadPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('form16');
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  const { data: docs } = useQuery<DocumentUpload[]>({
    queryKey: ['documents'],
    queryFn: () => apiClient.get('/documents').then(r => r.data),
    refetchInterval: (data) =>
      data?.some(d => d.ocr_status === 'processing') ? 2000 : false,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post(`/documents/upload?doc_type=${selectedType}&financial_year=FY2024-25`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setExpandedDoc(res.data.id);
    },
  });

  const onDrop = useCallback((files: File[]) => {
    files.forEach(f => uploadMutation.mutate(f));
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] },
    maxSize: 10 * 1024 * 1024,
  });

  const statusIcon = (status: string) => {
    if (status === 'complete') return <CheckCircle size={16} className="text-green-500" />;
    if (status === 'failed') return <XCircle size={16} className="text-red-500" />;
    if (status === 'processing') return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
    return <Clock size={16} className="text-gray-400" />;
  };

  // Check for Form 16 / AIS mismatch
  const { data: mismatch } = useQuery({
    queryKey: ['doc-mismatch'],
    queryFn: () => apiClient.get('/documents/mismatch').then(r => r.data).catch(() => null),
    enabled: (docs?.length || 0) >= 2,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
          <h1 className="font-bold text-gray-900">Upload Documents</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Mismatch warning */}
        {mismatch?.has_mismatch && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm">
            <p className="font-semibold text-amber-900 mb-1">⚠️ TDS Mismatch Detected</p>
            <p className="text-amber-800">{mismatch.description}</p>
          </div>
        )}

        {/* Doc type selector */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Document type</p>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map(d => (
              <button
                key={d.id}
                onClick={() => setSelectedType(d.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  selectedType === d.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 bg-white'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-primary-600' : 'text-gray-400'}`} />
          <p className="font-medium text-gray-700 text-sm">
            {isDragActive ? 'Drop your document here' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 10MB</p>
          <p className="text-xs text-gray-400 mt-2">
            🔒 PAN and Aadhaar are masked before any AI processing.
          </p>
        </div>

        {/* Upload progress */}
        {uploadMutation.isPending && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-sm text-blue-800">
            <RefreshCw size={16} className="animate-spin" />
            Uploading and scanning document...
          </div>
        )}

        {/* Documents list */}
        {docs && docs.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-gray-900 text-sm">Uploaded Documents</h2>
            {docs.map((doc) => (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                  onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                >
                  {statusIcon(doc.ocr_status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-400">{doc.doc_type} · {doc.financial_year}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    doc.ocr_status === 'complete' ? 'bg-green-100 text-green-700' :
                    doc.ocr_status === 'failed' ? 'bg-red-100 text-red-700' :
                    doc.ocr_status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {doc.ocr_status}
                  </span>
                </button>

                {expandedDoc === doc.id && doc.ocr_status === 'complete' && (
                  <div className="border-t border-gray-100 p-4">
                    <ExtractionTable docId={doc.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

### 5.6 Health Gauge Component

```typescript
// src/components/dashboard/HealthGauge.tsx
import { useEffect, useRef } from 'react';

export default function HealthGauge({ score }: { score: number }) {
  const color =
    score >= 80 ? '#059669' :
    score >= 50 ? '#D97706' :
    '#DC2626';

  const label =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    score >= 40 ? 'Fair' :
    'Needs Attention';

  const radius = 45;
  const circumference = Math.PI * radius; // semicircle
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 70" className="w-40 overflow-visible">
        {/* Background track */}
        <path
          d={`M 10,60 A ${radius},${radius} 0 0 1 110,60`}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* Score fill */}
        <path
          d={`M 10,60 A ${radius},${radius} 0 0 1 110,60`}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
        {/* Score text */}
        <text x="60" y="55" textAnchor="middle" fontSize="22" fontWeight="bold" fill="#111827">
          {score}
        </text>
        <text x="60" y="68" textAnchor="middle" fontSize="8" fill="#6B7280">
          {label}
        </text>
      </svg>
    </div>
  );
}
```

---

## Part 6: App Router

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import RegimeComparison from '@/pages/RegimeComparison';
import DocumentUpload from '@/pages/DocumentUpload';
import DeductionOptimizer from '@/pages/DeductionOptimizer';
import AdvanceTax from '@/pages/AdvanceTax';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_complete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboarding_complete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

            {/* Protected */}
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/chat/:conversationId" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/regime" element={<PrivateRoute><RegimeComparison /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><DocumentUpload /></PrivateRoute>} />
            <Route path="/deductions" element={<PrivateRoute><DeductionOptimizer /></PrivateRoute>} />
            <Route path="/advance-tax" element={<PrivateRoute><AdvanceTax /></PrivateRoute>} />

            {/* Default */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

---

## Part 7: Security Checklist

The agent must verify every item before marking implementation complete.

| Item | Implementation | Verified |
|------|---------------|---------|
| Access token in memory only | `let accessToken: string | null = null` in `client.ts` | ☐ |
| Refresh token in HttpOnly cookie | Set by backend, `withCredentials: true` on axios | ☐ |
| Silent 401 refresh | Axios interceptor in `client.ts` | ☐ |
| MFA gate after PAN/Aadhaar doc upload | Check `mfa_required` in doc upload response → redirect `/mfa-setup` | ☐ |
| No tax figures computed in frontend | All numbers from API. Zero arithmetic on financial data in frontend | ☐ |
| Indian number format everywhere | `formatINR()` used on all `number` fields | ☐ |
| Privacy notice on upload | Shown in dropzone: "PAN/Aadhaar masked before AI" | ☐ |
| Disclaimer on every chat page | "Estimation tool — consult a CA for complex situations" | ☐ |
| WCAG 2.1 AA | Minimum contrast, keyboard nav, ARIA labels on gauges/progress bars | ☐ |
| No PII in localStorage | Search codebase for `localStorage.setItem` — must be zero | ☐ |

---

## Part 8: API Quick Reference

| Screen | API Calls (in order) |
|--------|---------------------|
| Login | `POST /auth/login` → `GET /auth/me` |
| Register | `POST /auth/register` → `GET /auth/me` |
| Onboarding | `GET /onboarding/questions` → `POST /onboarding/complete` → `POST /chat/conversations` |
| Dashboard | `GET /tax/health-score`, `GET /tax/comparison`, `GET /calendar/upcoming`, `GET /tax/suggestions` |
| Chat (load) | `GET /chat/conversations/{id}/messages` |
| Chat (send) | `POST /chat/conversations/{id}/messages` → handle `tax_updated`, `profile_diff`, `citations` |
| Feedback | `POST /feedback/message { message_id, rating }` |
| Correction | `POST /feedback/correction { message_id, correction_text }` |
| Summary Card | `GET /profile`, `GET /tax/comparison` — invalidate on `tax_updated: true` |
| Edit field | `PATCH /profile { field: value }` → invalidate `['profile', 'tax-comparison', 'health-score']` |
| Regime | `GET /tax/comparison`, `GET /deductions/optimizer` |
| Upload | `POST /documents/upload` → poll `GET /documents/{id}/status` → `GET /documents/{id}/extraction` → `POST /documents/{id}/confirm` |
| Mismatch | `GET /documents/mismatch` (after 2+ docs uploaded) |
| Deductions | `GET /tax/suggestions?regime=both`, `GET /deductions/optimizer`, `GET /deductions/44ada`, `GET /deductions/nps/recommendation` |
| Advance Tax | `GET /tax/advance-tax` → `POST /tax/advance-tax/mark-paid` |
| Health Score | `GET /tax/health-score` |
| Calendar | `GET /calendar/deadlines`, `GET /calendar/upcoming` |
| PDF | `GET /tax/summary/pdf` → trigger `window.location.href = signedUrl` |
| Scenario | `POST /tax/scenario { hypothetical_profile_changes }` |

---

## Part 9: Persona-Specific UX Notes

### Salaried Employee
- Dashboard prominently shows **Regime Comparison** + Form 16 upload CTA
- Chat opening: *"What's your approximate annual gross salary?"*
- Proactively surface: HRA calculator, 80C gap, 80D

### Freelancer / Gig Worker
- Dashboard hero: **Advance Tax Timeline** + 44ADA alert if eligible
- Chat opening: *"What were your total professional receipts this FY?"*
- Proactively surface: 44ADA eligibility, GST threshold (₹20L), expense tracking
- Niche deductions: 80GG (if no HRA), home office expenses

### Business Owner
- Dashboard hero: **Business vs Personal income split**
- Chat opening: *"Let's start with your business revenue for FY 2024-25."*
- Proactively surface: Loss set-off tracker, TDS compliance status

### First-Time Filer
- Guided walkthrough mode: simplified chat with more explicit explanations
- Every jargon term auto-expands tooltip on first appearance
- Chat opening: *"Congrats on your first job! Let's check if you even need to file ITR this year."*
- No advanced features shown until basics are complete

---

*Document prepared by: Product Team, AI Tax Copilot*  
*For: Gemini 2.5 Pro frontend implementation*  
*Backend Spec Version: 1.0 | Frontend Spec Version: 2.0 | Confidential*
