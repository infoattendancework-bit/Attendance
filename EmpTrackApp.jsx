import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Users, Lock, User, Eye, EyeOff, Building2, Search, ChevronDown, ChevronRight,
  ChevronLeft, ArrowLeft, ArrowRight, Calendar, MapPin, Wifi, WifiOff, Play, Pause,
  Shield, Filter, RotateCcw, CheckCircle2, XCircle, AlertCircle, X, Globe,
  HelpCircle, LogOut, Settings, Clock, ListChecks, FileClock, Briefcase, Copy
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  BACKEND CONFIG                                                     */
/* ------------------------------------------------------------------ */
// Paste your deployed Google Apps Script Web App URL here (ends in /exec).
// See Code.gs for the backend + deployment steps.
const API_BASE_URL = "https://script.google.com/macros/s/AKfycbwA21hf49HUdtVCdZK8RXyxWwHQS4cA0NSFuAZ8DiN8-GLe4soRE9i86eRcyFZ1dL0p/exec";

async function apiCall(action, data = {}) {
  if (!API_BASE_URL || API_BASE_URL.startsWith("PASTE_")) {
    return { success: false, error: "Backend not connected yet. Paste your Apps Script Web App URL into API_BASE_URL." };
  }
  try {
    const res = await fetch(API_BASE_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight against Apps Script
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action, ...data }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: "Network error — could not reach the backend." };
  }
}

/* ------------------------------------------------------------------ */
/*  TRANSLATIONS (EN / NP)                                             */
/* ------------------------------------------------------------------ */

const DICT = {
  need_help: { en: "Need help?", np: "सहयोग चाहियो?" },
  login_register: { en: "Login / Register", np: "लगइन / दर्ता" },
  access_account: { en: "Access your organization account", np: "आफ्नो संस्थाको खाता प्रयोग गर्नुहोस्" },
  select_role: { en: "Continue as", np: "यसको रूपमा जारी राख्नुहोस्" },
  im_employee: { en: "I'm an Employee", np: "म कर्मचारी हुँ" },
  im_admin: { en: "I'm an Organization Admin", np: "म संस्था प्रशासक हुँ" },
  password: { en: "Password", np: "पासवर्ड" },
  password_ph: { en: "Enter your password", np: "आफ्नो पासवर्ड लेख्नुहोस्" },
  continue_btn: { en: "Continue", np: "अगाडि बढ्नुहोस्" },
  or: { en: "or", np: "वा" },
  register: { en: "Register your organization", np: "आफ्नो संस्था दर्ता गर्नुहोस्" },
  secure_data: { en: "Your data is secure and protected", np: "तपाईंको डाटा सुरक्षित छ" },
  footer_rights: { en: "© 2026 EmpTrack. All rights reserved.", np: "© २०२६ EmpTrack. सर्वाधिकार सुरक्षित।" },
  register_org_title: { en: "Register your organization", np: "आफ्नो संस्था दर्ता गर्नुहोस्" },
  register_org_sub: { en: "Registering creates a brand-new, private spreadsheet for your organization automatically. Your admin then adds employee accounts from the dashboard.", np: "दर्ता गर्दा तपाईंको संस्थाको लागि स्वतः नयाँ स्प्रेडसिट बन्छ। त्यसपछि प्रशासकले कर्मचारी खाता थप्न सक्नुहुन्छ।" },
  org_name: { en: "Organization name", np: "संस्थाको नाम" },
  org_id_optional: { en: "Preferred Organization ID (optional)", np: "रुचाइएको संस्था आईडी (वैकल्पिक)" },
  org_email: { en: "Organization email", np: "संस्थाको इमेल" },
  admin_name: { en: "Admin name", np: "प्रशासकको नाम" },
  admin_email: { en: "Admin email", np: "प्रशासकको इमेल" },
  confirm_password: { en: "Confirm password", np: "पासवर्ड पुष्टि गर्नुहोस्" },
  register_org_btn: { en: "Create organization", np: "संस्था बनाउनुहोस्" },
  back_to_login: { en: "Back to login", np: "लगइनमा फर्कनुहोस्" },
  reg_received_title: { en: "Organization created", np: "संस्था बनाइयो" },
  reg_received_sub: { en: "A new spreadsheet was created for your organization. Save these details — your admin will need them to log in.", np: "तपाईंको संस्थाको लागि नयाँ स्प्रेडसिट बनाइयो। यी विवरणहरू सुरक्षित राख्नुहोस्।" },
  back_to_login_btn: { en: "Back to Login", np: "लगइनमा फर्कनुहोस्" },
  back: { en: "Back", np: "पछाडि" },
  select_org_title: { en: "Select your organization", np: "आफ्नो संस्था छान्नुहोस्" },
  select_org_sub: { en: "Search across all registered organizations", np: "सबै दर्ता भएका संस्थाहरू खोज्नुहोस्" },
  search_org_ph: { en: "Search by organization name...", np: "संस्थाको नामले खोज्नुहोस्" },
  no_orgs_found: { en: "No organizations found.", np: "कुनै संस्था फेला परेन।" },
  loading_orgs: { en: "Loading organizations…", np: "संस्थाहरू लोड हुँदैछ…" },
  continue: { en: "Continue", np: "अगाडि बढ्नुहोस्" },
  org_details_title: { en: "Organization details", np: "संस्थाको विवरण" },
  org_details_sub: { en: "Enter your organization credentials to continue.", np: "अगाडि बढ्न आफ्नो संस्थाको जानकारी लेख्नुहोस्।" },
  selected_org: { en: "Selected organization", np: "छानिएको संस्था" },
  access_code: { en: "Access Code", np: "पहुँच कोड" },
  access_code_ph: { en: "Enter access code", np: "पहुँच कोड लेख्नुहोस्" },
  employee_id: { en: "Employee ID or email", np: "कर्मचारी आईडी वा इमेल" },
  employee_id_ph: { en: "Enter your employee ID or email", np: "आफ्नो कर्मचारी आईडी वा इमेल लेख्नुहोस्" },
  admin_email_ph: { en: "Enter your admin email", np: "आफ्नो प्रशासक इमेल लेख्नुहोस्" },
  login_encrypted: { en: "Your login information is encrypted and secure.", np: "तपाईंको लगइन जानकारी सुरक्षित छ।" },
  organization: { en: "Organization", np: "संस्था" },
  today_date: { en: "Today / Date", np: "आज / मिति" },
  today_day: { en: "Today / Day", np: "आज / बार" },
  location_detected: { en: "Location Detected", np: "स्थान पत्ता लाग्यो" },
  detecting_location: { en: "Detecting your location…", np: "तपाईंको स्थान पत्ता लगाउँदै…" },
  autodetect_on: { en: "Auto-detect location is ON", np: "स्वत:-पत्ता स्थान सक्रिय छ" },
  location_denied: { en: "Location permission is required to automatically record attendance location.", np: "उपस्थिति स्थान स्वतः रेकर्ड गर्न स्थान अनुमति चाहिन्छ।" },
  retry: { en: "Retry", np: "फेरि प्रयास गर्नुहोस्" },
  use_demo_location: { en: "Use demo location", np: "नमूना स्थान प्रयोग गर्नुहोस्" },
  current_status: { en: "Current status", np: "हालको अवस्था" },
  pause: { en: "Pause", np: "रोक्नुहोस्" },
  launch: { en: "Launch", np: "सुरु गर्नुहोस्" },
  online: { en: "Online", np: "अनलाइन" },
  offline: { en: "Offline", np: "अफलाइन" },
  paused: { en: "Paused", np: "रोकिएको" },
  todays_activity: { en: "Today's Activity", np: "आजको गतिविधि" },
  no_activity_yet: { en: "No activity yet today. Launch a session to get started.", np: "आज अझै कुनै गतिविधि छैन। सुरु गर्न सेसन लन्च गर्नुहोस्।" },
  active_employees: { en: "Active employees", np: "सक्रिय कर्मचारी" },
  offline_employees: { en: "Offline employees", np: "अफलाइन कर्मचारी" },
  view_employee_list: { en: "View Employee List", np: "कर्मचारी सूची हेर्नुहोस्" },
  list_of_employees: { en: "List of Employees", np: "कर्मचारीहरूको सूची" },
  add_employee: { en: "Add Employee", np: "कर्मचारी थप्नुहोस्" },
  manage_employees_sub: { en: "View and manage all employees in your organization's spreadsheet.", np: "आफ्नो संस्थाका सबै कर्मचारी हेर्नुहोस् र व्यवस्थापन गर्नुहोस्।" },
  search_employees_ph: { en: "Search by name, ID or email...", np: "नाम, आईडी वा इमेलद्वारा खोज्नुहोस्..." },
  all_statuses: { en: "All Statuses", np: "सबै अवस्था" },
  reset: { en: "Reset", np: "रिसेट" },
  col_no: { en: "No.", np: "क्र.सं." },
  col_emp_id: { en: "Employee ID", np: "कर्मचारी आईडी" },
  col_emp_name: { en: "Employee Name", np: "कर्मचारीको नाम" },
  col_status: { en: "Status", np: "अवस्था" },
  col_last_activity: { en: "Last Activity", np: "पछिल्लो गतिविधि" },
  col_location: { en: "Location", np: "स्थान" },
  no_employees_match: { en: "No employees match your filters.", np: "तपाईंको फिल्टरसँग कुनै कर्मचारी मेल खाँदैन।" },
  showing_of: { en: "Showing", np: "देखाइँदै" },
  to: { en: "to", np: "देखि" },
  of: { en: "of", np: "मध्ये" },
  employees_word: { en: "employees", np: "कर्मचारीहरू" },
  back_to_list: { en: "Back to Employee List", np: "कर्मचारी सूचीमा फर्कनुहोस्" },
  location_label: { en: "Location", np: "स्थान" },
  last_activity_label: { en: "Last activity", np: "पछिल्लो गतिविधि" },
  attendance_history: { en: "Attendance history", np: "उपस्थिति इतिहास" },
  add_employee_title: { en: "Add employee", np: "कर्मचारी थप्नुहोस्" },
  add_employee_sub: { en: "Create a staff account for", np: "को लागि कर्मचारी खाता बनाउनुहोस्" },
  full_name: { en: "Full name", np: "पूरा नाम" },
  full_name_ph: { en: "Employee's full name", np: "कर्मचारीको पूरा नाम" },
  email: { en: "Email", np: "इमेल" },
  email_ph: { en: "employee@company.com", np: "employee@company.com" },
  initial_password: { en: "Initial password", np: "प्रारम्भिक पासवर्ड" },
  temp_password_ph: { en: "Temporary password", np: "अस्थायी पासवर्ड" },
  fill_all_fields: { en: "Please fill in all fields.", np: "कृपया सबै फिल्ड भर्नुहोस्।" },
  profile: { en: "Profile", np: "प्रोफाइल" },
  account_settings: { en: "Account Settings", np: "खाता सेटिङ" },
  help_support: { en: "Help & Support", np: "सहयोग" },
  logout: { en: "Logout", np: "लगआउट" },
  employee_word: { en: "Employee", np: "कर्मचारी" },
  administrator_word: { en: "Administrator", np: "प्रशासक" },
  cancel: { en: "Cancel", np: "रद्द गर्नुहोस्" },
  no_entries_filter: { en: "No entries match this filter.", np: "यो फिल्टरसँग कुनै प्रविष्टि मेल खाँदैन।" },
  view_full_timeline: { en: "View full timeline →", np: "पूरा समयरेखा हेर्नुहोस् →" },
  full_timeline_title: { en: "Full activity timeline", np: "पूरा गतिविधि समयरेखा" },
  your_org_id: { en: "Organization ID", np: "संस्था आईडी" },
  your_access_code: { en: "Access Code", np: "पहुँच कोड" },
  spreadsheet_link: { en: "Your organization's spreadsheet", np: "तपाईंको संस्थाको स्प्रेडसिट" },
  copy: { en: "Copy", np: "प्रतिलिपि" },
  copied: { en: "Copied!", np: "प्रतिलिपि भयो!" },
};

function useTranslate(lang) {
  return useCallback((key) => (DICT[key] ? DICT[key][lang] || DICT[key].en : key), [lang]);
}

const CITIES = [
  { name: "Bengaluru, India", lat: 12.9716, lng: 77.5946 },
  { name: "Gurugram, India", lat: 28.4595, lng: 77.0266 },
  { name: "Hyderabad, India", lat: 17.3850, lng: 78.4867 },
  { name: "Pune, India", lat: 18.5204, lng: 73.8567 },
  { name: "Mumbai, India", lat: 19.0760, lng: 72.8777 },
  { name: "New Delhi, India", lat: 28.6139, lng: 77.2090 },
  { name: "Kathmandu, Nepal", lat: 27.7172, lng: 85.3240 },
];

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function nearestCity(lat, lng) {
  let best = null, bestDist = Infinity;
  for (const c of CITIES) {
    const d = Math.pow(c.lat - lat, 2) + Math.pow(c.lng - lng, 2);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best ? best.name : "Unknown location";
}

function todayInfo() {
  const d = new Date();
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return { day: days[d.getDay()], date: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` };
}

/* ------------------------------------------------------------------ */
/*  SMALL PRESENTATIONAL COMPONENTS                                    */
/* ------------------------------------------------------------------ */

function Logo({ size = "md" }) {
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1769E0" }}>
        <Users className="w-4.5 h-4.5 text-white" size={18} />
      </div>
      <span className={`${textSize} font-semibold tracking-tight`}>
        <span style={{ color: "#12233F" }}>Emp</span>
        <span style={{ color: "#1769E0" }}>Track</span>
      </span>
    </div>
  );
}

function StatusBadge({ status, label }) {
  const map = {
    Online: { bg: "#E8F7EE", dot: "#16A34A", text: "#15803D" },
    Offline: { bg: "#F1F5F9", dot: "#94A3B8", text: "#475569" },
    Paused: { bg: "#FFF7E6", dot: "#F59E0B", text: "#B45309" },
  };
  const s = map[status] || map.Offline;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {label || status}
    </span>
  );
}

function Toasts({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="flex items-start gap-2 bg-white border rounded-xl shadow-lg px-4 py-3 animate-[fadeIn_.2s_ease]" style={{ borderColor: "#D9E1EC" }}>
          {t.type === "error" ? <XCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#DC2626" }} /> : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#16A34A" }} />}
          <p className="text-sm flex-1" style={{ color: "#12233F" }}>{t.message}</p>
          <button onClick={() => onDismiss(t.id)} aria-label="Dismiss notification" className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function PrimaryButton({ children, className = "", disabled, ...props }) {
  return (
    <button disabled={disabled} className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${className}`} style={{ background: "#1769E0" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = "#1354b8"; }}
      onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = "#1769E0"; }}
      {...props}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors hover:bg-slate-50 ${className}`} style={{ borderColor: "#D9E1EC", color: "#12233F" }} {...props}>
      {children}
    </button>
  );
}

function TextField({ label, icon: Icon, error, right, ...props }) {
  const id = useRef(`f-${Math.random().toString(36).slice(2, 9)}`).current;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1.5" style={{ color: "#12233F" }}>{label}</label>
      <div className="relative">
        {Icon && <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />}
        <input id={id} className="w-full rounded-xl border text-sm py-2.5 focus:outline-none focus:ring-2"
          style={{ borderColor: error ? "#DC2626" : "#D9E1EC", paddingLeft: Icon ? "2.5rem" : "1rem", paddingRight: right ? "2.5rem" : "1rem", color: "#12233F" }}
          onFocus={(e) => (e.target.style.boxShadow = "0 0 0 3px rgba(23,105,224,0.15)")}
          onBlur={(e) => (e.target.style.boxShadow = "none")}
          {...props} />
        {right}
      </div>
      {error && <p className="mt-1 text-xs flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle className="w-3 h-3" /> {error}</p>}
    </div>
  );
}

function CircleIcon({ icon: Icon }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#E7F0FE" }}>
      <Icon className="w-5.5 h-5.5" size={22} style={{ color: "#1769E0" }} />
    </div>
  );
}

function Spinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div className="w-7 h-7 rounded-full border-2 border-slate-200 animate-spin" style={{ borderTopColor: "#1769E0" }} />
      {label && <p className="text-sm" style={{ color: "#64748B" }}>{label}</p>}
    </div>
  );
}

function AuthShell({ children, step, lang, t, onToggleLang }) {
  return (
    <div className="min-h-full flex flex-col" style={{ background: "#F4F8FF" }}>
      <header className="flex items-center justify-between px-5 sm:px-8 py-4">
        <Logo />
        <div className="flex items-center gap-4 text-sm" style={{ color: "#64748B" }}>
          <button className="hidden sm:inline-flex items-center gap-1 hover:text-slate-700"><HelpCircle className="w-4 h-4" /> {t("need_help")}</button>
          <button onClick={onToggleLang} aria-label="Toggle language" className="inline-flex items-center gap-1 hover:text-slate-700 rounded-lg px-2 py-1 border" style={{ borderColor: "#D9E1EC" }}>
            <Globe className="w-4 h-4" /> {lang === "en" ? "EN" : "NP"}
          </button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border shadow-sm p-6 sm:p-8" style={{ borderColor: "#D9E1EC" }}>
            {step && (
              <div className="flex justify-end mb-2">
                <span className="text-xs font-medium w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#E7F0FE", color: "#1769E0" }}>{step}</span>
              </div>
            )}
            {children}
          </div>
        </div>
      </main>
      <footer className="text-center text-xs pb-6" style={{ color: "#94A3B8" }}>{t("footer_rights")}</footer>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="text-center py-8"><p className="text-sm" style={{ color: "#94A3B8" }}>{text}</p></div>;
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                            */
/* ------------------------------------------------------------------ */

export default function EmpTrackApp() {
  const [screen, setScreen] = useState("login");
  const [history, setHistory] = useState([]);
  const [role, setRole] = useState(null); // 'employee' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState(null); // { orgId, orgName }
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState("en");
  const t = useTranslate(lang);
  const toggleLang = () => setLang((l) => (l === "en" ? "np" : "en"));
  const statusLabel = (s) => t(s === "Online" ? "online" : s === "Paused" ? "paused" : "offline");

  const [employees, setEmployees] = useState([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);

  const [attendanceStatus, setAttendanceStatus] = useState("Offline");
  const [activityLog, setActivityLog] = useState([]);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const [empSearch, setEmpSearch] = useState("");
  const [empStatusFilter, setEmpStatusFilter] = useState("All Statuses");
  const [empPage, setEmpPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeTimeline, setSelectedEmployeeTimeline] = useState([]);
  const PAGE_SIZE = 8;
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  function pushToast(message, type = "success") {
    const id = Math.random().toString(36).slice(2);
    setToasts((ts) => [...ts, { id, message, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3500);
  }

  function go(next) { setHistory((h) => [...h, screen]); setScreen(next); }
  function back() {
    setHistory((h) => { const copy = [...h]; const prev = copy.pop(); if (prev) setScreen(prev); return copy; });
  }

  /* ---------------- Geolocation ---------------- */
  function detectLocation() {
    setLocationLoading(true);
    setLocationError(false);
    if (!navigator.geolocation) { setLocationLoading(false); setLocationError(true); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude, label: nearestCity(latitude, longitude), mock: false });
        setLocationLoading(false);
      },
      () => { setLocationLoading(false); setLocationError(true); },
      { timeout: 8000 }
    );
  }
  function useMockLocation() {
    setLocation({ lat: 28.6315, lng: 77.2167, label: "Connaught Place, New Delhi, Delhi 110001, India", mock: true });
    setLocationError(false);
  }
  useEffect(() => { if (screen === "employeeDashboard" && !location) detectLocation(); /* eslint-disable-next-line */ }, [screen]);

  // Load today's activity once logged in as an employee
  useEffect(() => {
    if (screen === "employeeDashboard" && currentUser?.employeeId && selectedOrg?.orgId) {
      apiCall("getActivity", { orgId: selectedOrg.orgId, employeeId: currentUser.employeeId, todayOnly: true }).then((res) => {
        if (res.success) {
          setActivityLog(res.activity.map((a) => ({ time: a.time, action: a.action, desc: a.desc, location: a.location })));
          if (res.activity.length) setAttendanceStatus(res.activity[res.activity.length - 1].action === "Offline" ? "Offline" : res.activity[res.activity.length - 1].action === "Pause" ? "Paused" : "Online");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  /* ---------------- Attendance actions ---------------- */
  async function handleAction(action) {
    const now = new Date();
    const h = now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;
    const time = `${pad(h)}:${pad(now.getMinutes())} ${now.getHours() >= 12 ? "PM" : "AM"}`;
    const descMap = { Launch: "Work launched", Online: "You are online", Pause: "Work paused", Offline: "You are now offline" };
    const desc = descMap[action];
    const newStatus = action === "Offline" ? "Offline" : action === "Pause" ? "Paused" : "Online";

    setAttendanceStatus(newStatus);
    setActivityLog((log) => [...log, { time, action, desc, location: location ? location.label : "Location unavailable" }]);
    pushToast(desc);

    const res = await apiCall("logActivity", {
      orgId: selectedOrg.orgId, employeeId: currentUser.employeeId,
      time, action, desc, location: location ? location.label : "",
    });
    if (!res.success) pushToast(res.error || "Could not save to spreadsheet", "error");
  }

  /* ---------------- Auth ---------------- */
  function doLogout() {
    setRole(null); setCurrentUser(null); setSelectedOrg(null);
    setAttendanceStatus("Offline"); setActivityLog([]); setLocation(null);
    setEmployees([]); setHistory([]); setScreen("login");
    pushToast("Logged out successfully");
  }

  /* ---------------- Derived data ---------------- */
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const q = empSearch.trim().toLowerCase();
      const matchesSearch = !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
      const matchesStatus = empStatusFilter === "All Statuses" || e.status === empStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [employees, empSearch, empStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const pagedEmployees = filteredEmployees.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE);
  const activeCount = employees.filter((e) => e.status === "Online").length;
  const offlineCount = employees.filter((e) => e.status === "Offline").length;

  async function refreshEmployees() {
    if (!selectedOrg?.orgId) return;
    const res = await apiCall("getEmployees", { orgId: selectedOrg.orgId });
    if (res.success) setEmployees(res.employees);
    else pushToast(res.error || "Could not load employees", "error");
  }

  useEffect(() => { if (screen === "employeeList" || screen === "adminDashboard") refreshEmployees(); /* eslint-disable-next-line */ }, [screen]);

  async function addEmployee({ id, name, email, password }) {
    const res = await apiCall("addEmployee", { orgId: selectedOrg.orgId, id, name, email, password });
    if (res.success) {
      pushToast("Employee added to spreadsheet");
      setShowAddEmployee(false);
      refreshEmployees();
    } else {
      pushToast(res.error || "Could not add employee", "error");
    }
    return res;
  }

  function resetFilters() { setEmpSearch(""); setEmpStatusFilter("All Statuses"); setEmpPage(1); }

  /* ================================================================ */
  /*  SCREENS                                                           */
  /* ================================================================ */

  function LoginScreen() {
    return (
      <AuthShell lang={lang} t={t} onToggleLang={toggleLang}>
        <CircleIcon icon={Lock} />
        <h1 className="text-xl font-semibold text-center" style={{ color: "#12233F" }}>{t("login_register")}</h1>
        <p className="text-sm text-center mt-1 mb-6" style={{ color: "#64748B" }}>{t("access_account")}</p>

        <p className="text-xs font-medium mb-2 text-center" style={{ color: "#94A3B8" }}>{t("select_role")}</p>
        <div className="grid grid-cols-1 gap-3 mb-5">
          <button onClick={() => { setRole("employee"); go("orgs"); }} className="flex items-center gap-3 rounded-xl border-2 p-4 text-left hover:bg-slate-50" style={{ borderColor: "#1769E0" }}>
            <User className="w-5 h-5" style={{ color: "#1769E0" }} />
            <span className="text-sm font-medium" style={{ color: "#12233F" }}>{t("im_employee")}</span>
          </button>
          <button onClick={() => { setRole("admin"); go("orgs"); }} className="flex items-center gap-3 rounded-xl border-2 p-4 text-left hover:bg-slate-50" style={{ borderColor: "#D9E1EC" }}>
            <Briefcase className="w-5 h-5" style={{ color: "#64748B" }} />
            <span className="text-sm font-medium" style={{ color: "#12233F" }}>{t("im_admin")}</span>
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1" style={{ background: "#D9E1EC" }} />
          <span className="text-xs" style={{ color: "#94A3B8" }}>{t("or")}</span>
          <div className="h-px flex-1" style={{ background: "#D9E1EC" }} />
        </div>
        <SecondaryButton onClick={() => go("register")}><Building2 className="w-4 h-4" /> {t("register")}</SecondaryButton>

        <div className="mt-6 pt-5 border-t flex items-center justify-center gap-2 text-xs" style={{ borderColor: "#D9E1EC", color: "#64748B" }}>
          <Shield className="w-3.5 h-3.5" /> {t("secure_data")}
        </div>
      </AuthShell>
    );
  }

  function RegisterScreen() {
    const [form, setForm] = useState({});
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState("");

    function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

    async function submit(e) {
      e.preventDefault();
      setError("");
      if (!form.orgName || !form.adminName || !form.adminEmail || !form.pw) {
        setError("Please fill in all required fields.");
        return;
      }
      if (form.pw !== form.pw2) { setError("Passwords do not match."); return; }
      setLoading(true);
      const res = await apiCall("registerOrg", {
        orgName: form.orgName, orgId: form.orgId, domain: form.orgEmail ? form.orgEmail.split("@")[1] : "",
        adminName: form.adminName, adminEmail: form.adminEmail, adminPassword: form.pw,
      });
      setLoading(false);
      if (res.success) { setResult(res); pushToast("Organization created"); }
      else setError(res.error || "Registration failed.");
    }

    function copyText(label, val) {
      navigator.clipboard?.writeText(val);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    }

    if (result) {
      return (
        <AuthShell lang={lang} t={t} onToggleLang={toggleLang}>
          <CircleIcon icon={CheckCircle2} />
          <h1 className="text-xl font-semibold text-center" style={{ color: "#12233F" }}>{t("reg_received_title")}</h1>
          <p className="text-sm text-center mt-1 mb-5" style={{ color: "#64748B" }}>{t("reg_received_sub")}</p>

          <div className="space-y-2 mb-5">
            {[["your_org_id", result.orgId], ["your_access_code", result.accessCode]].map(([labelKey, val]) => (
              <div key={labelKey} className="flex items-center justify-between rounded-xl border px-4 py-3" style={{ borderColor: "#D9E1EC", background: "#F4F8FF" }}>
                <div>
                  <p className="text-xs" style={{ color: "#64748B" }}>{t(labelKey)}</p>
                  <p className="text-sm font-semibold" style={{ color: "#12233F" }}>{val}</p>
                </div>
                <button onClick={() => copyText(labelKey, val)} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg border" style={{ borderColor: "#D9E1EC", color: "#1769E0" }}>
                  <Copy className="w-3.5 h-3.5" /> {copied === labelKey ? t("copied") : t("copy")}
                </button>
              </div>
            ))}
            {result.spreadsheetUrl && (
              <a href={result.spreadsheetUrl} target="_blank" rel="noreferrer" className="block text-xs underline text-center pt-1" style={{ color: "#1769E0" }}>{t("spreadsheet_link")}</a>
            )}
          </div>

          <PrimaryButton onClick={() => { setScreen("login"); setHistory([]); }}>{t("back_to_login_btn")}</PrimaryButton>
        </AuthShell>
      );
    }

    return (
      <AuthShell lang={lang} t={t} onToggleLang={toggleLang}>
        <CircleIcon icon={Building2} />
        <h1 className="text-xl font-semibold text-center" style={{ color: "#12233F" }}>{t("register_org_title")}</h1>
        <p className="text-sm text-center mt-1 mb-5" style={{ color: "#64748B" }}>{t("register_org_sub")}</p>

        <form onSubmit={submit} className="space-y-3.5" noValidate>
          <TextField label={t("org_name")} placeholder="Acme Corporation" required onChange={(e) => update("orgName", e.target.value)} />
          <TextField label={t("org_id_optional")} placeholder="e.g. ACME001" onChange={(e) => update("orgId", e.target.value)} />
          <TextField label={t("org_email")} type="email" placeholder="admin@acme.corp" required onChange={(e) => update("orgEmail", e.target.value)} />
          <TextField label={t("admin_name")} placeholder="Full name" required onChange={(e) => update("adminName", e.target.value)} />
          <TextField label={t("admin_email")} type="email" placeholder="you@acme.corp" required onChange={(e) => update("adminEmail", e.target.value)} />
          <TextField label={t("password")} type="password" placeholder="Create a password" required onChange={(e) => update("pw", e.target.value)} />
          <TextField label={t("confirm_password")} type="password" placeholder="Re-enter password" required onChange={(e) => update("pw2", e.target.value)} />
          {error && <p className="text-xs flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle className="w-3 h-3" /> {error}</p>}
          <PrimaryButton type="submit" disabled={loading}>{loading ? <Spinner /> : t("register_org_btn")}</PrimaryButton>
        </form>
        <button onClick={() => { setScreen("login"); setHistory([]); }} className="mt-4 w-full text-center text-sm font-medium" style={{ color: "#1769E0" }}>{t("back_to_login")}</button>
      </AuthShell>
    );
  }

  function OrganizationsScreen() {
    const [q, setQ] = useState("");
    const [sel, setSel] = useState(null);
    const [orgs, setOrgs] = useState([]);
    const [orgsLoading, setOrgsLoading] = useState(true);
    const debounceRef = useRef(null);

    async function fetchOrgs(query) {
      setOrgsLoading(true);
      const res = await apiCall("listOrgs", { q: query });
      setOrgsLoading(false);
      if (res.success) setOrgs(res.orgs);
      else pushToast(res.error || "Could not load organizations", "error");
    }

    useEffect(() => { fetchOrgs(""); /* eslint-disable-next-line */ }, []);
    useEffect(() => {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchOrgs(q), 300);
      return () => clearTimeout(debounceRef.current);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
      <AuthShell lang={lang} t={t} onToggleLang={toggleLang}>
        <CircleIcon icon={Building2} />
        <h1 className="text-xl font-semibold text-center" style={{ color: "#12233F" }}>{t("select_org_title")}</h1>
        <p className="text-sm text-center mt-1 mb-5" style={{ color: "#64748B" }}>{t("select_org_sub")}</p>

        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input className="w-full rounded-xl border text-sm py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2" style={{ borderColor: "#D9E1EC" }} placeholder={t("search_org_ph")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("search_org_ph")} />
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl border divide-y" style={{ borderColor: "#D9E1EC" }}>
          {orgsLoading && <div className="p-6 text-center text-sm" style={{ color: "#94A3B8" }}>{t("loading_orgs")}</div>}
          {!orgsLoading && orgs.length === 0 && <div className="p-6 text-center text-sm" style={{ color: "#94A3B8" }}>{t("no_orgs_found")}</div>}
          {!orgsLoading && orgs.map((o) => (
            <button key={o.orgId} onClick={() => setSel(o)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors" style={{ background: sel?.orgId === o.orgId ? "#F4F8FF" : "white" }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#E7F0FE" }}><Building2 className="w-4 h-4" style={{ color: "#1769E0" }} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: "#12233F" }}>{o.orgName}</p>
                <p className="text-xs truncate" style={{ color: "#64748B" }}>{o.orgId}{o.domain ? ` · ${o.domain}` : ""}</p>
              </div>
              {sel?.orgId === o.orgId && <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#1769E0" }} />}
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <SecondaryButton onClick={back}><ArrowLeft className="w-4 h-4" /> {t("back")}</SecondaryButton>
          <PrimaryButton disabled={!sel} onClick={() => { setSelectedOrg(sel); go("orgDetails"); }}>{t("continue")} <ArrowRight className="w-4 h-4" /></PrimaryButton>
        </div>
      </AuthShell>
    );
  }

  function OrgDetailsScreen() {
    const [accessCode, setAccessCode] = useState("");
    const [showCode, setShowCode] = useState(false);
    const [loginId, setLoginId] = useState(""); // employee id/email OR admin email
    const [pw, setPw] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState("");

    async function submit(e) {
      e.preventDefault();
      setError("");
      if (!accessCode || !loginId || !pw) { setError("Please fill in all required fields."); return; }
      setLoading(true);
      const access = await apiCall("checkOrgAccess", { orgId: selectedOrg.orgId, accessCode });
      if (!access.success) { setLoading(false); setError(access.error); return; }

      if (role === "employee") {
        const res = await apiCall("employeeLogin", { orgId: selectedOrg.orgId, employeeId: loginId, password: pw });
        setLoading(false);
        if (!res.success) { setError(res.error); return; }
        setCurrentUser({ email: res.employee.email, employeeId: res.employee.id, name: res.employee.name, initials: initialsOf(res.employee.name) });
        pushToast("Successfully logged in");
        go("employeeDashboard");
      } else {
        const res = await apiCall("adminLogin", { orgId: selectedOrg.orgId, email: loginId, password: pw });
        setLoading(false);
        if (!res.success) { setError(res.error); return; }
        setCurrentUser({ email: res.email, name: res.name, initials: initialsOf(res.name) });
        pushToast("Successfully logged in");
        go("adminDashboard");
      }
    }

    return (
      <AuthShell step={2} lang={lang} t={t} onToggleLang={toggleLang}>
        <h1 className="text-xl font-semibold" style={{ color: "#12233F" }}>{t("org_details_title")}</h1>
        <p className="text-sm mt-1 mb-5" style={{ color: "#64748B" }}>{t("org_details_sub")}</p>

        <div className="flex items-center gap-3 rounded-xl border p-3 mb-5" style={{ borderColor: "#D9E1EC", background: "#F4F8FF" }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#E7F0FE" }}><Building2 className="w-4 h-4" style={{ color: "#1769E0" }} /></div>
          <div><p className="text-xs" style={{ color: "#64748B" }}>{t("selected_org")}</p><p className="text-sm font-medium" style={{ color: "#12233F" }}>{selectedOrg?.orgName}</p></div>
        </div>

        <form onSubmit={submit} className="space-y-4" noValidate>
          <TextField label={t("access_code")} type={showCode ? "text" : "password"} placeholder={t("access_code_ph")} value={accessCode} onChange={(e) => setAccessCode(e.target.value)}
            right={<button type="button" aria-label="Toggle access code" onClick={() => setShowCode((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
          <div className="h-px" style={{ background: "#D9E1EC" }} />
          <TextField label={role === "employee" ? t("employee_id") : t("admin_email")} placeholder={role === "employee" ? t("employee_id_ph") : t("admin_email_ph")} value={loginId} onChange={(e) => setLoginId(e.target.value)} />
          <TextField label={t("password")} type={showPw ? "text" : "password"} placeholder={t("password_ph")} value={pw} onChange={(e) => setPw(e.target.value)}
            right={<button type="button" aria-label="Toggle password" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} />
          {error && <p className="text-xs flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle className="w-3 h-3" /> {error}</p>}
          <div className="flex gap-3 pt-1">
            <SecondaryButton type="button" onClick={back}>← {t("back")}</SecondaryButton>
            <PrimaryButton type="submit" disabled={loading}>{loading ? <Spinner /> : <>{t("continue")} <ArrowRight className="w-4 h-4" /></>}</PrimaryButton>
          </div>
        </form>

        <div className="mt-5 pt-5 border-t flex items-center justify-center gap-2 text-xs" style={{ borderColor: "#D9E1EC", color: "#64748B" }}>
          <Lock className="w-3.5 h-3.5" /> {t("login_encrypted")}
        </div>
      </AuthShell>
    );
  }

  function initialsOf(name) {
    return (name || "").trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join("").toUpperCase() || "U";
  }

  /* ---------------- Employee Dashboard ---------------- */

  function ProfileMenu({ items }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
      document.addEventListener("mousedown", onClick);
      return () => document.removeEventListener("mousedown", onClick);
    }, []);
    return (
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2" aria-haspopup="true" aria-expanded={open}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: "#1769E0" }}>{currentUser?.initials}</div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium leading-tight" style={{ color: "#12233F" }}>{currentUser?.name}</p>
            <p className="text-xs leading-tight" style={{ color: "#64748B" }}>{role === "admin" ? t("administrator_word") : t("employee_word")}</p>
          </div>
          <ChevronDown className="w-4 h-4" style={{ color: "#94A3B8" }} />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border shadow-lg py-1.5 z-20" style={{ borderColor: "#D9E1EC" }}>
            {items.map((it) => (
              <button key={it.key} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2" style={{ color: it.key === "logout" ? "#DC2626" : "#12233F" }} onClick={() => { setOpen(false); it.key === "logout" ? doLogout() : pushToast(`${it.label} — demo only`); }}>
                {it.key === "logout" ? <LogOut className="w-3.5 h-3.5" /> : it.key === "profile" ? <User className="w-3.5 h-3.5" /> : it.key === "organization" ? <Building2 className="w-3.5 h-3.5" /> : <Settings className="w-3.5 h-3.5" />}
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function profileMenuItems() {
    return [
      { key: "profile", label: t("profile") },
      { key: "account_settings", label: t("account_settings") },
      { key: "organization", label: t("organization") },
      { key: "help_support", label: t("help_support") },
      { key: "logout", label: t("logout") },
    ];
  }

  function TopNav({ orgLabel, right }) {
    const today = todayInfo();
    return (
      <header className="bg-white border-b px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: "#D9E1EC" }}>
        <div className="flex items-center gap-3">
          <Logo />
          <div className="hidden sm:block h-6 w-px" style={{ background: "#D9E1EC" }} />
          <div className="hidden sm:flex items-center gap-2 text-sm" style={{ color: "#12233F" }}>
            <Building2 className="w-4 h-4" style={{ color: "#64748B" }} />
            <span><span className="block text-xs" style={{ color: "#94A3B8" }}>{t("organization")}</span><span className="font-medium">{orgLabel}</span></span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-sm" style={{ color: "#12233F" }}>
            <Calendar className="w-4 h-4" style={{ color: "#64748B" }} />
            <span><span className="block text-xs" style={{ color: "#94A3B8" }}>{t("today_date")}</span><span className="font-medium">{today.date}</span></span>
          </div>
          {right}
        </div>
      </header>
    );
  }

  function ActionButton({ icon: Icon, label, active, color, onClick }) {
    return (
      <button onClick={onClick} className="flex flex-col items-center justify-center gap-2 rounded-xl border py-4 transition-colors" style={{ borderColor: active ? color : "#D9E1EC", background: active ? `${color}14` : "white" }}>
        <Icon className="w-5 h-5" style={{ color }} />
        <span className="text-xs font-medium" style={{ color: "#12233F" }}>{label}</span>
      </button>
    );
  }

  function EmployeeDashboardScreen() {
    const today = todayInfo();
    return (
      <div className="min-h-full" style={{ background: "#F4F8FF" }}>
        <TopNav orgLabel={selectedOrg?.orgName} right={<ProfileMenu items={profileMenuItems()} />} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4.5 h-4.5" size={18} style={{ color: "#1769E0" }} />
              <h2 className="font-semibold" style={{ color: "#12233F" }}>{selectedOrg?.orgName}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: "#64748B" }}><Calendar className="w-3.5 h-3.5" /> {t("today_day")}</div>
                <p className="text-lg font-semibold" style={{ color: "#12233F" }}>{today.day}</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: "#64748B" }}><Calendar className="w-3.5 h-3.5" /> {t("today_date")}</div>
                <p className="text-lg font-semibold" style={{ color: "#12233F" }}>{today.date}</p>
              </div>
            </div>

            <div className="rounded-xl border p-4 mb-5" style={{ borderColor: "#D9E1EC" }}>
              <div className="flex items-start gap-3">
                <MapPin className="w-4.5 h-4.5 shrink-0 mt-0.5" size={18} style={{ color: "#1769E0" }} />
                <div className="flex-1 min-w-0">
                  {locationLoading && <p className="text-sm" style={{ color: "#64748B" }}>{t("detecting_location")}</p>}
                  {!locationLoading && location && (
                    <>
                      <p className="text-sm font-medium" style={{ color: "#12233F" }}>{t("location_detected")}</p>
                      <p className="text-sm truncate" style={{ color: "#64748B" }}>{location.label}</p>
                      <span className="inline-flex items-center gap-1 mt-2 text-xs px-2 py-1 rounded-full" style={{ background: "#E8F7EE", color: "#15803D" }}><CheckCircle2 className="w-3 h-3" /> {t("autodetect_on")} {location.mock && "(mock)"}</span>
                    </>
                  )}
                  {!locationLoading && !location && locationError && (
                    <>
                      <p className="text-sm" style={{ color: "#DC2626" }}>{t("location_denied")}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={detectLocation} className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: "#1769E0", color: "white" }}>{t("retry")}</button>
                        <button onClick={useMockLocation} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: "#D9E1EC", color: "#12233F" }}>{t("use_demo_location")}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: "#64748B" }}>{t("current_status")}</p>
              <StatusBadge status={attendanceStatus} label={statusLabel(attendanceStatus)} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <ActionButton icon={Pause} label={t("pause")} active={attendanceStatus === "Paused"} color="#F59E0B" onClick={() => handleAction("Pause")} />
              <ActionButton icon={Play} label={t("launch")} active={false} color="#16A34A" onClick={() => handleAction("Launch")} />
              <ActionButton icon={Wifi} label={t("online")} active={attendanceStatus === "Online"} color="#1769E0" onClick={() => handleAction("Online")} />
              <ActionButton icon={WifiOff} label={t("offline")} active={attendanceStatus === "Offline"} color="#94A3B8" onClick={() => handleAction("Offline")} />
              <ActionButton icon={ArrowLeft} label={t("back")} active={false} color="#64748B" onClick={() => go("orgs")} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2" style={{ color: "#12233F" }}><ListChecks className="w-4 h-4" style={{ color: "#1769E0" }} /> {t("todays_activity")}</h3>
              <button onClick={() => setShowFullTimeline(true)} className="text-sm font-medium" style={{ color: "#1769E0" }}>{t("view_full_timeline")}</button>
            </div>
            {activityLog.length === 0 ? <EmptyState text={t("no_activity_yet")} /> : (
              <ol className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
                {activityLog.map((a, i) => (
                  <li key={i} className="flex sm:flex-col gap-3 sm:gap-1.5 sm:flex-1 sm:min-w-[150px] relative">
                    <div className="flex flex-col items-center sm:hidden">
                      <span className="w-2 h-2 rounded-full mt-1.5" style={{ background: "#1769E0" }} />
                      {i < activityLog.length - 1 && <span className="w-px flex-1" style={{ background: "#D9E1EC" }} />}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs" style={{ color: "#94A3B8" }}>{a.time}</p>
                      <p className="text-sm font-medium" style={{ color: "#12233F" }}>{a.action}</p>
                      <p className="text-xs" style={{ color: "#64748B" }}>{a.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </main>
        {showFullTimeline && <FullTimelineModal entries={activityLog} onClose={() => setShowFullTimeline(false)} />}
      </div>
    );
  }

  function FullTimelineModal({ entries, onClose }) {
    const [statusFilter, setStatusFilter] = useState("All");
    const filtered = entries.filter((e) => statusFilter === "All" || e.action === statusFilter);
    return (
      <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t("full_timeline_title")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: "#12233F" }}><FileClock className="w-4 h-4" style={{ color: "#1769E0" }} /> {t("full_timeline_title")}</h3>
            <button onClick={onClose} aria-label="Close"><X className="w-4 h-4" style={{ color: "#94A3B8" }} /></button>
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border text-sm py-2 px-3 mb-4" style={{ borderColor: "#D9E1EC" }}>
            <option>All</option><option>Online</option><option>Launch</option><option>Pause</option><option>Offline</option>
          </select>
          {filtered.length === 0 ? <EmptyState text={t("no_entries_filter")} /> : (
            <ul className="space-y-3">
              {filtered.map((e, i) => (
                <li key={i} className="flex gap-3 border-b pb-3" style={{ borderColor: "#F1F5F9" }}>
                  <span className="text-xs w-16 shrink-0" style={{ color: "#94A3B8" }}>{e.time}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#12233F" }}>{e.action}</p>
                    <p className="text-xs" style={{ color: "#64748B" }}>{e.desc}</p>
                    <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#94A3B8" }}><MapPin className="w-3 h-3" /> {e.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- Admin Dashboard ---------------- */

  function AdminDashboardScreen() {
    const today = todayInfo();
    return (
      <div className="min-h-full" style={{ background: "#F4F8FF" }}>
        <TopNav orgLabel={selectedOrg?.orgName} right={<ProfileMenu items={profileMenuItems()} />} />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4.5 h-4.5" size={18} style={{ color: "#1769E0" }} />
              <h2 className="font-semibold" style={{ color: "#12233F" }}>{selectedOrg?.orgName}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: "#64748B" }}><Calendar className="w-3.5 h-3.5" /> {t("today_day")}</div>
                <p className="text-lg font-semibold" style={{ color: "#12233F" }}>{today.day}</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center gap-2 text-xs mb-1.5" style={{ color: "#64748B" }}><Calendar className="w-3.5 h-3.5" /> {t("today_date")}</div>
                <p className="text-lg font-semibold" style={{ color: "#12233F" }}>{today.date}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center justify-between mb-2"><Users className="w-4.5 h-4.5" size={18} style={{ color: "#1769E0" }} /><StatusBadge status="Online" label={t("online")} /></div>
                <p className="text-2xl font-semibold" style={{ color: "#12233F" }}>{activeCount}</p>
                <p className="text-xs" style={{ color: "#64748B" }}>{t("active_employees")}</p>
              </div>
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                <div className="flex items-center justify-between mb-2"><Users className="w-4.5 h-4.5" size={18} style={{ color: "#94A3B8" }} /><StatusBadge status="Offline" label={t("offline")} /></div>
                <p className="text-2xl font-semibold" style={{ color: "#12233F" }}>{offlineCount}</p>
                <p className="text-xs" style={{ color: "#64748B" }}>{t("offline_employees")}</p>
              </div>
            </div>
            <button onClick={() => go("employeeList")} className="w-full flex items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-colors hover:bg-slate-50" style={{ borderColor: "#1769E0", color: "#1769E0" }}>
              <Users className="w-4 h-4" /> {t("view_employee_list")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  function EmployeeListScreen() {
    return (
      <div className="min-h-full" style={{ background: "#F4F8FF" }}>
        <TopNav orgLabel={selectedOrg?.orgName} right={<ProfileMenu items={profileMenuItems()} />} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <div className="flex items-start justify-between flex-wrap gap-3 mb-1">
              <div className="flex items-center gap-2"><ListChecks className="w-4.5 h-4.5" size={18} style={{ color: "#1769E0" }} /><h2 className="font-semibold" style={{ color: "#12233F" }}>{t("list_of_employees")}</h2></div>
              <button onClick={() => setShowAddEmployee(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-white rounded-xl px-3.5 py-2" style={{ background: "#1769E0" }}>
                <User className="w-3.5 h-3.5" /> {t("add_employee")}
              </button>
            </div>
            <p className="text-sm mb-5" style={{ color: "#64748B" }}>{t("manage_employees_sub")}</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
                <input className="w-full rounded-xl border text-sm py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2" style={{ borderColor: "#D9E1EC" }} placeholder={t("search_employees_ph")} value={empSearch} onChange={(e) => { setEmpSearch(e.target.value); setEmpPage(1); }} aria-label={t("search_employees_ph")} />
              </div>
              <select value={empStatusFilter} onChange={(e) => { setEmpStatusFilter(e.target.value); setEmpPage(1); }} className="rounded-xl border text-sm py-2.5 px-3" style={{ borderColor: "#D9E1EC", color: "#12233F" }} aria-label="Filter by status">
                <option value="All Statuses">{t("all_statuses")}</option>
                <option value="Online">{t("online")}</option>
                <option value="Offline">{t("offline")}</option>
                <option value="Paused">{t("paused")}</option>
              </select>
              <button onClick={resetFilters} className="inline-flex items-center justify-center gap-1.5 rounded-xl border text-sm py-2.5 px-3.5" style={{ borderColor: "#D9E1EC", color: "#12233F" }}><RotateCcw className="w-3.5 h-3.5" /> {t("reset")}</button>
              <button onClick={refreshEmployees} className="inline-flex items-center justify-center gap-1.5 rounded-xl text-sm py-2.5 px-4 font-medium text-white" style={{ background: "#1769E0" }}><Filter className="w-3.5 h-3.5" /> Refresh</button>
            </div>

            <div className="hidden md:block overflow-x-auto rounded-xl border" style={{ borderColor: "#D9E1EC" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ background: "#F4F8FF", color: "#64748B" }}>
                    <th className="px-4 py-3 font-medium">{t("col_no")}</th>
                    <th className="px-4 py-3 font-medium">{t("col_emp_id")}</th>
                    <th className="px-4 py-3 font-medium">{t("col_emp_name")}</th>
                    <th className="px-4 py-3 font-medium">{t("col_status")}</th>
                    <th className="px-4 py-3 font-medium">{t("col_last_activity")}</th>
                    <th className="px-4 py-3 font-medium">{t("col_location")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedEmployees.map((e, i) => (
                    <tr key={e.id} className="border-t hover:bg-slate-50 cursor-pointer" style={{ borderColor: "#F1F5F9" }} onClick={async () => {
                      setSelectedEmployee(e);
                      const res = await apiCall("getActivity", { orgId: selectedOrg.orgId, employeeId: e.id });
                      setSelectedEmployeeTimeline(res.success ? res.activity : []);
                      go("employeeDetail");
                    }}>
                      <td className="px-4 py-3" style={{ color: "#64748B" }}>{(empPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "#12233F" }}>{e.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ background: "#1769E0" }}>{initialsOf(e.name)}</div>
                          <div><p className="font-medium" style={{ color: "#12233F" }}>{e.name}</p><p className="text-xs" style={{ color: "#94A3B8" }}>{e.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={e.status} label={statusLabel(e.status)} /></td>
                      <td className="px-4 py-3" style={{ color: "#64748B" }}>{e.lastActivity}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1" style={{ color: "#64748B" }}><MapPin className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} /> {e.location}</span></td>
                    </tr>
                  ))}
                  {pagedEmployees.length === 0 && <tr><td colSpan={6}><EmptyState text={t("no_employees_match")} /></td></tr>}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {pagedEmployees.map((e) => (
                <button key={e.id} onClick={async () => {
                  setSelectedEmployee(e);
                  const res = await apiCall("getActivity", { orgId: selectedOrg.orgId, employeeId: e.id });
                  setSelectedEmployeeTimeline(res.success ? res.activity : []);
                  go("employeeDetail");
                }} className="w-full text-left rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ background: "#1769E0" }}>{initialsOf(e.name)}</div>
                    <div className="min-w-0 flex-1"><p className="font-medium text-sm truncate" style={{ color: "#12233F" }}>{e.name}</p><p className="text-xs truncate" style={{ color: "#94A3B8" }}>{e.email}</p></div>
                    <StatusBadge status={e.status} label={statusLabel(e.status)} />
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: "#64748B" }}><span>{e.id}</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {e.location}</span></div>
                  <p className="text-xs mt-1" style={{ color: "#94A3B8" }}>{e.lastActivity}</p>
                </button>
              ))}
              {pagedEmployees.length === 0 && <EmptyState text={t("no_employees_match")} />}
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-5">
              <p className="text-xs" style={{ color: "#64748B" }}>{t("showing_of")} {filteredEmployees.length === 0 ? 0 : (empPage - 1) * PAGE_SIZE + 1} {t("to")} {Math.min(empPage * PAGE_SIZE, filteredEmployees.length)} {t("of")} {filteredEmployees.length} {t("employees_word")}</p>
              <div className="flex items-center gap-1">
                <button disabled={empPage === 1} onClick={() => setEmpPage((p) => p - 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: "#D9E1EC" }} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                  <button key={i} onClick={() => setEmpPage(i + 1)} className="w-8 h-8 rounded-lg text-sm font-medium" style={{ background: empPage === i + 1 ? "#1769E0" : "transparent", color: empPage === i + 1 ? "white" : "#64748B" }}>{i + 1}</button>
                ))}
                {totalPages > 5 && <span className="text-xs px-1" style={{ color: "#94A3B8" }}>…</span>}
                <button disabled={empPage === totalPages} onClick={() => setEmpPage((p) => p + 1)} className="w-8 h-8 rounded-lg border flex items-center justify-center disabled:opacity-30" style={{ borderColor: "#D9E1EC" }} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </main>
        {showAddEmployee && <AddEmployeeModal onClose={() => setShowAddEmployee(false)} onSubmit={addEmployee} existingIds={employees.map((e) => e.id)} />}
      </div>
    );
  }

  function AddEmployeeModal({ onClose, onSubmit, existingIds }) {
    const [id, setId] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function submit(e) {
      e.preventDefault();
      if (!id.trim() || !name.trim() || !email.trim() || !password.trim()) { setError(t("fill_all_fields")); return; }
      if (existingIds.includes(id.trim().toUpperCase())) { setError("An employee with this ID already exists."); return; }
      setSaving(true);
      const res = await onSubmit({ id, name, email, password });
      setSaving(false);
      if (res && !res.success) setError(res.error);
    }

    return (
      <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
        <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={t("add_employee_title")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold flex items-center gap-2" style={{ color: "#12233F" }}><User className="w-4 h-4" style={{ color: "#1769E0" }} /> {t("add_employee_title")}</h3>
            <button onClick={onClose} aria-label="Close"><X className="w-4 h-4" style={{ color: "#94A3B8" }} /></button>
          </div>
          <p className="text-sm mb-5" style={{ color: "#64748B" }}>{t("add_employee_sub")} {selectedOrg?.orgName}. This is written directly to your org's spreadsheet.</p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <TextField label={t("employee_id")} placeholder="EMP00XXX" value={id} onChange={(e) => setId(e.target.value)} />
            <TextField label={t("full_name")} placeholder={t("full_name_ph")} value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label={t("email")} type="email" placeholder={t("email_ph")} value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label={t("initial_password")} type="text" placeholder={t("temp_password_ph")} value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-xs flex items-center gap-1" style={{ color: "#DC2626" }}><AlertCircle className="w-3 h-3" /> {error}</p>}
            <div className="flex gap-3 pt-1">
              <SecondaryButton type="button" onClick={onClose}>{t("cancel")}</SecondaryButton>
              <PrimaryButton type="submit" disabled={saving}>{saving ? <Spinner /> : t("add_employee_title")}</PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    );
  }

  function EmployeeDetailScreen() {
    const e = selectedEmployee;
    if (!e) return null;
    return (
      <div className="min-h-full" style={{ background: "#F4F8FF" }}>
        <TopNav orgLabel={selectedOrg?.orgName} right={<ProfileMenu items={profileMenuItems()} />} />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <button onClick={back} className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#1769E0" }}><ArrowLeft className="w-4 h-4" /> {t("back_to_list")}</button>
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white shrink-0" style={{ background: "#1769E0" }}>{initialsOf(e.name)}</div>
              <div><h2 className="text-lg font-semibold" style={{ color: "#12233F" }}>{e.name}</h2><p className="text-sm" style={{ color: "#64748B" }}>{e.id} · {e.email}</p></div>
              <div className="ml-auto"><StatusBadge status={e.status} label={statusLabel(e.status)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}><p className="text-xs mb-1" style={{ color: "#64748B" }}>{t("location_label")}</p><p className="text-sm font-medium flex items-center gap-1.5" style={{ color: "#12233F" }}><MapPin className="w-3.5 h-3.5" style={{ color: "#94A3B8" }} /> {e.location}</p></div>
              <div className="rounded-xl border p-4" style={{ borderColor: "#D9E1EC" }}><p className="text-xs mb-1" style={{ color: "#64748B" }}>{t("last_activity_label")}</p><p className="text-sm font-medium" style={{ color: "#12233F" }}>{e.lastActivity}</p></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-5 sm:p-6" style={{ borderColor: "#D9E1EC" }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "#12233F" }}><FileClock className="w-4 h-4" style={{ color: "#1769E0" }} /> {t("attendance_history")}</h3>
            {selectedEmployeeTimeline.length === 0 ? <EmptyState text={t("no_entries_filter")} /> : (
              <ul className="space-y-3">
                {selectedEmployeeTimeline.map((tItem, i) => (
                  <li key={i} className="flex gap-3 border-b pb-3 last:border-0" style={{ borderColor: "#F1F5F9" }}>
                    <span className="text-xs w-24 shrink-0" style={{ color: "#94A3B8" }}>{tItem.date} · {tItem.time}</span>
                    <div><p className="text-sm font-medium" style={{ color: "#12233F" }}>{tItem.action}</p><p className="text-xs" style={{ color: "#64748B" }}>{tItem.desc}</p><p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "#94A3B8" }}><MapPin className="w-3 h-3" /> {tItem.location}</p></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    );
  }

  /* ---------------- Router ---------------- */

  const screens = {
    login: LoginScreen,
    register: RegisterScreen,
    orgs: OrganizationsScreen,
    orgDetails: OrgDetailsScreen,
    employeeDashboard: EmployeeDashboardScreen,
    adminDashboard: AdminDashboardScreen,
    employeeList: EmployeeListScreen,
    employeeDetail: EmployeeDetailScreen,
  };
  const Screen = screens[screen] || LoginScreen;

  return (
    <div className="w-full min-h-[600px]" style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px);} to { opacity: 1; transform: translateY(0);} }
        *:focus-visible { outline: 2px solid #1769E0; outline-offset: 2px; }
      `}</style>
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((ts) => ts.filter((x) => x.id !== id))} />
      <Screen />
    </div>
  );
}
