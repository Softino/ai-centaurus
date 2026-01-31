
import { Agent, ThinkTank, Expert } from './types';

// Helper to create template agents for think tanks
const createAgent = (id: string, name: string, role: string, icon: string, prompt: string, category: 'agnostic' | 'specific' = 'agnostic'): Agent => ({
  id,
  name,
  version: "1.0.0",
  creator: "Centaurus Core",
  maturity: "Certified",
  costPolicy: "رایگان",
  cognitiveRoles: [role as any],
  domains: [{ level1: "Governance" }],
  problemTypes: ["Strategic Analysis"],
  methodology: "LLM-driven",
  inputs: ["Text"],
  outputs: ["Strategy"],
  perspectives: [role],
  timeHorizon: "Mid-term",
  multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
  description: `عامل تخصصی برای نقش ${name} در مدل‌های استراتژیک.`,
  systemPrompt: prompt,
  icon,
  isCustom: false,
  category
});

export const MARKETPLACE_AGENTS: Agent[] = [
  {
    id: "human_template",
    name: "ناظر انسانی",
    version: "Live",
    creator: "User",
    maturity: "Certified",
    costPolicy: "رایگان",
    cognitiveRoles: ["Decision Support", "Moderator"],
    domains: [{ level1: "Governance" }],
    problemTypes: ["Decision Support"],
    methodology: "Hybrid",
    inputs: ["Text"],
    outputs: ["Decision Guide"],
    perspectives: ["Ethical", "Political"],
    timeHorizon: "Foresight",
    multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
    description: "مداخله مستقیم انسانی در جریان تصمیم‌گیری ایجنت‌ها.",
    systemPrompt: "You are the human architect. Your role is to guide and approve agent decisions.",
    icon: "fa-user-astronaut",
    isCustom: false,
    isHuman: true,
    personality: "قاطع و ناظر",
    category: "agnostic"
  },
  {
    id: "mod_1",
    name: "مدیر جلسه (تسهیل‌گر)",
    version: "2.1.0",
    creator: "تیم تصمیم‌یار",
    maturity: "Certified",
    costPolicy: "رایگان",
    cognitiveRoles: ["Moderator", "Synthesizer"],
    domains: [{ level1: "Governance", level2: "Process Management" }],
    problemTypes: ["Decision Support"],
    methodology: "Rule-based",
    inputs: ["Text"],
    outputs: ["Report"],
    perspectives: ["Social"],
    timeHorizon: "Short-term",
    multiAgent: { canCooperate: true, typicalCollaborators: [], requiresSupervisor: false, conflictProneWith: [] },
    description: "هدایت جریان گفتگو و حفظ تمرکز بر اهداف جلسه.",
    systemPrompt: "شما مدیر جلسه هستید. وظیفه شما خلاصه کردن و هدایت بحث است.",
    icon: "fa-user-tie",
    isCustom: false,
    personality: "بی‌طرف و قاطع",
    category: "agnostic"
  },
  // --- Passport Services Agents ---
  createAgent("pass_proc", "هوش فرآیندی", "Analyst", "fa-gears", "تحلیل دقیق فرآیندهای صدور، شناسایی گلوگاه‌های زمانی و پیشنهاد راهکارهای چابک‌سازی.", "specific"),
  createAgent("pass_queue", "بهینه‌سازی صف و بار", "Planner", "fa-users-line", "مدل‌سازی ریاضی صف‌های انتظار، پیش‌بینی پیک تقاضا و توزیع بهینه منابع انسانی.", "specific"),
  createAgent("pass_back", "تحلیل انباشت پرونده", "Monitor", "fa-layer-group", "رصد لحظه‌ای پرونده‌های معوقه و ارائه هشدارهای زودهنگام برای جلوگیری از انباشت.", "specific"),
  createAgent("pass_cx", "تجربه شهروند (CX)", "Evaluator", "fa-face-smile", "تحلیل بازخوردها و شکایات شهروندان برای بهبود نقاط تماس و افزایش رضایت عمومی.", "specific"),
  createAgent("pass_digi", "تحول دیجیتال", "Ideator", "fa-laptop-code", "ارائه راهکارهای دولت الکترونیک و اتوماسیون هوشمند برای کاهش مراجعات حضوری.", "specific"),
  createAgent("pass_sec", "امنیت و تطبیق", "Critic", "fa-shield-halved", "تضمین انطباق تمامی پیشنهادات با استانداردهای امنیتی و پروتکل‌های حفاظتی.", "specific"),

  // --- Border Intelligence Agents ---
  createAgent("bord_fore", "پیش‌بینی جریان مهاجرت", "Strategist", "fa-chart-line", "تحلیل روندها و پیش‌بینی حجم ترافیک و مهاجرت بر اساس داده‌های کلان.", "specific"),
  createAgent("bord_risk", "تشخیص ریسک تردد", "Analyst", "fa-triangle-exclamation", "شناسایی الگوهای مشکوک و ریسک‌های ناشی از تردد غیرمجاز با رویکرد پیش‌دستانه.", "specific"),
  createAgent("bord_geo", "تحلیل ژئوپترن", "Analyst", "fa-map-location-dot", "تحلیل جغرافیایی نقاط حساس مرزی و مسیرهای پرتردد.", "specific"),
  createAgent("bord_stat", "وضعیت اتباع خارجی", "Evaluator", "fa-passport", "پایش وضعیت اقامتی و حقوقی اتباع خارجی و تحلیل تغییرات دموگرافیک.", "specific"),
  createAgent("bord_warn", "هشدار سریع و سناریو", "Planner", "fa-bell", "تدوین سناریوهای بحران و سیستم‌های هشدار اولیه برای امواج ناگهانی جمعیت.", "specific"),
  createAgent("bord_pol", "اثرسنجی سیاست‌ها", "Critic", "fa-gavel", "تحلیل پیامدهای امنیتی و اجتماعی سیاست‌های جدید مرزی قبل از اجرا.", "specific"),

  // --- Tourism Facilitation Agents ---
  createAgent("tour_fac", "تسهیل‌گر سفر قانونی", "Executor", "fa-plane-departure", "کاهش اصطکاک اداری و روان‌سازی فرآیندهای قانونی برای مسافران مجاز.", "specific"),
  createAgent("tour_flow", "هوش جریان گردشگری", "Analyst", "fa-map", "تحلیل داده‌های گردشگری برای بهبود خدمات و پیش‌بینی نیازهای فصلی.", "specific"),
  createAgent("tour_coord", "هماهنگی بین‌دستگاهی", "Moderator", "fa-handshake", "تسهیل تبادل داده و همکاری بین نهادهای انتظامی، گردشگری و وزارت خارجه.", "specific"),
  createAgent("tour_bench", "الگوبرداری جهانی", "Ideator", "fa-globe", "بررسی و بومی‌سازی بهترین تجارب بین‌المللی در مدیریت هوشمند گذرنامه و سفر.", "specific"),
  createAgent("tour_exp", "تجربه مسافر", "Evaluator", "fa-star", "پایش شاخص‌های رضایت مسافران داخلی و خارجی و تصویرسازی ملی.", "specific"),
  createAgent("tour_rep", "ریسک و شهرت", "Critic", "fa-bullhorn", "ارزیابی ریسک‌های امنیتی در کنار حفظ و ارتقای وجهه عمومی پلیس.", "specific")
];

export const SOCIAL_EXPERTS: Expert[] = [
  {
    id: "exp_1",
    name: "دکتر سارا احمدی",
    title: "متخصص علوم رفتاری و اجتماعی",
    bio: "بیش از ۱۵ سال تجربه در تحلیل روندهای اجتماعی و تاثیر تکنولوژی بر جوامع مدرن.",
    domain: "Society & Culture",
    specialties: ["تحلیل رفتار مصرف‌کننده", "جامعه‌شناسی دیجیتال"],
    rating: 4.9,
    completedSessions: 124,
    icon: "fa-brain-circuit",
    status: "available",
    category: "agnostic"
  },
  {
    id: "exp_2",
    name: "مهندس علیرضا رضایی",
    title: "استراتژیست حکمرانی داده",
    bio: "مشاور ارشد نهادهای دولتی در زمینه سیاست‌گذاری داده و حریم خصوصی.",
    domain: "Governance",
    specialties: ["سیاست‌گذاری تکنولوژی", "اخلاق هوش مصنوعی"],
    rating: 4.8,
    completedSessions: 89,
    icon: "fa-gavel",
    status: "available",
    category: "agnostic"
  },
  {
    id: "exp_3",
    name: "دکتر مریم پاکزاد",
    title: "آینده‌پژوه اقتصادی",
    bio: "تحلیلگر مدل‌های نوین اقتصادی و ارزهای دیجیتال در خاورمیانه.",
    domain: "Economy",
    specialties: ["اقتصاد چرخشی", "مدل‌سازی مالی"],
    rating: 5.0,
    completedSessions: 56,
    icon: "fa-chart-line-up",
    status: "busy",
    category: "specific"
  },
  // --- Passport Experts ---
  {
    id: "exp_pass_1",
    name: "سرهنگ فرجا (بازنشسته)",
    title: "کارشناس ارشد فرآیندهای سازمانی",
    bio: "۳۰ سال تجربه در مهندسی مجدد فرآیندهای انتظامی و صدور اسناد هویتی.",
    domain: "Governance",
    specialties: ["فرآیندهای انتظامی", "مدیریت بحران"],
    rating: 4.9,
    completedSessions: 42,
    icon: "fa-user-shield",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_pass_2",
    name: "مهندس کامران",
    title: "مدیر عملیات دفاتر خدمات",
    bio: "متخصص در مدیریت شبکه دفاتر پلیس+۱۰ و بهینه‌سازی زنجیره خدمات.",
    domain: "Technology",
    specialties: ["دولت الکترونیک", "لجستیک خدمات"],
    rating: 4.7,
    completedSessions: 15,
    icon: "fa-building-columns",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_pass_3",
    name: "دکتر نیکی",
    title: "متخصص تجربه خدمات عمومی",
    bio: "پژوهشگر ارشد در زمینه رضایت شهروندان و طراحی خدمات عمومی انسان‌محور.",
    domain: "Society & Culture",
    specialties: ["طراحی خدمات", "رضایت‌سنجی"],
    rating: 4.8,
    completedSessions: 23,
    icon: "fa-users-viewfinder",
    status: "busy",
    category: "specific"
  },
  {
    id: "exp_pass_4",
    name: "مهندس ایمانی",
    title: "کارشناس امنیت اطلاعات",
    bio: "مشاور امنیت سایبری در پروژه‌های ملی کارت هوشمند و گذرنامه بیومتریک.",
    domain: "Data & Intelligence",
    specialties: ["امنیت سایبری", "هویت دیجیتال"],
    rating: 5.0,
    completedSessions: 67,
    icon: "fa-fingerprint",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_pass_5",
    name: "دکتر قانونی",
    title: "مشاور حقوقی و مقررات",
    bio: "وکیل پایه یک دادگستری با تخصص در قوانین اداری و حقوق شهروندی.",
    domain: "Governance",
    specialties: ["حقوق اداری", "تطبیق مقررات"],
    rating: 4.6,
    completedSessions: 12,
    icon: "fa-scale-balanced",
    status: "available",
    category: "specific"
  },
  // --- Border Experts ---
  {
    id: "exp_bord_1",
    name: "دکتر مهاجر",
    title: "کارشناس ارشد امور مهاجرت",
    bio: "تحلیلگر ارشد الگوهای مهاجرتی در منطقه خاورمیانه و آسیای میانه.",
    domain: "Society & Culture",
    specialties: ["جمعیت‌شناسی", "سیاست مهاجرت"],
    rating: 4.9,
    completedSessions: 90,
    icon: "fa-person-walking-luggage",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_bord_2",
    name: "سردار مرزبان",
    title: "متخصص امنیت مرزی",
    bio: "فرمانده سابق عملیات مرزی با تجربه در کنترل هوشمند نوار مرزی.",
    domain: "Governance",
    specialties: ["امنیت مرز", "پایش الکترونیک"],
    rating: 5.0,
    completedSessions: 110,
    icon: "fa-tower-observation",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_bord_3",
    name: "دکتر آماری",
    title: "تحلیلگر داده‌های دموگرافیک",
    bio: "متخصص علم داده با تمرکز بر آمار جمعیتی و مدل‌سازی جابجایی انسان.",
    domain: "Data & Intelligence",
    specialties: ["علم داده", "آمار حیاتی"],
    rating: 4.8,
    completedSessions: 34,
    icon: "fa-chart-pie",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_bord_4",
    name: "سرهنگ عملیات",
    title: "افسر ارشد عملیات مرزی",
    bio: "مدیر میدانی در گذرگاه‌های مرزی پرتردد و بحران‌های مهاجرتی.",
    domain: "Governance",
    specialties: ["مدیریت میدانی", "کنترل تردد"],
    rating: 4.9,
    completedSessions: 55,
    icon: "fa-binoculars",
    status: "busy",
    category: "specific"
  },
  {
    id: "exp_bord_5",
    name: "دکتر حقوقی",
    title: "مشاور حقوقی اتباع بیگانه",
    bio: "پژوهشگر حقوق بین‌الملل و کنوانسیون‌های مربوط به پناهندگان.",
    domain: "Governance",
    specialties: ["حقوق بین‌الملل", "امور اتباع"],
    rating: 4.7,
    completedSessions: 20,
    icon: "fa-book-atlas",
    status: "available",
    category: "specific"
  },
  // --- Tourism Experts ---
  {
    id: "exp_tour_1",
    name: "سرهنگ صدور",
    title: "متخصص ارشد گذرنامه",
    bio: "کارشناس خبره در قوانین صدور گذرنامه و ویزا با ۲۰ سال سابقه.",
    domain: "Governance",
    specialties: ["قوانین کنسولی", "اسناد هویتی"],
    rating: 4.8,
    completedSessions: 40,
    icon: "fa-passport",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_tour_2",
    name: "خانم سفرپور",
    title: "متخصص توریسم و سفر",
    bio: "فعال صنعت گردشگری و عضو انجمن آژانس‌های مسافرتی.",
    domain: "Economy",
    specialties: ["مدیریت توریسم", "بازاریابی سفر"],
    rating: 4.7,
    completedSessions: 28,
    icon: "fa-plane",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_tour_3",
    name: "آقای رابط",
    title: "نماینده هماهنگی بین‌دستگاهی",
    bio: "سابقه فعالیت در وزارت خارجه و سازمان میراث فرهنگی برای تسهیل امور.",
    domain: "Governance",
    specialties: ["دیپلماسی اداری", "هماهنگی"],
    rating: 4.6,
    completedSessions: 19,
    icon: "fa-handshake",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_tour_4",
    name: "مهندس ایمن",
    title: "کارشناس امنیت سفر",
    bio: "تحلیلگر ریسک‌های امنیتی برای توریست‌ها و اماکن گردشگری.",
    domain: "Governance",
    specialties: ["امنیت گردشگر", "ارزیابی ریسک"],
    rating: 4.9,
    completedSessions: 31,
    icon: "fa-shield-cat",
    status: "available",
    category: "specific"
  },
  {
    id: "exp_tour_5",
    name: "دکتر تصویر",
    title: "مشاور دیپلماسی عمومی",
    bio: "متخصص برندینگ ملی و مدیریت تصویر عمومی سازمان‌های انتظامی.",
    domain: "Society & Culture",
    specialties: ["روابط عمومی", "برندینگ"],
    rating: 4.8,
    completedSessions: 14,
    icon: "fa-camera-retro",
    status: "available",
    category: "specific"
  }
];

export const MARKETPLACE_THINK_TANKS: ThinkTank[] = [
  {
    id: "tt_passport",
    name: "بهینه‌سازی خدمات گذرنامه",
    industry: "خدمات عمومی و انتظامی",
    description: "بهینه‌سازی فرآیندهای صدور و تمدید گذرنامه با تمرکز بر کاهش زمان، هزینه و افزایش رضایت عمومی بدون کاهش سطح امنیت.",
    icon: "fa-passport",
    category: "specific",
    agents: [
      createAgent("pass_proc", "هوش فرآیندی", "Analyst", "fa-gears", "تحلیل فرآیندها و شناسایی گلوگاه‌ها.", "specific"),
      createAgent("pass_queue", "بهینه‌سازی صف", "Planner", "fa-users-line", "مدیریت بار کاری و پیش‌بینی تقاضا.", "specific"),
      createAgent("pass_back", "تحلیل انباشت", "Monitor", "fa-layer-group", "پایش پرونده‌های معوقه.", "specific"),
      createAgent("pass_cx", "تجربه شهروند", "Evaluator", "fa-face-smile", "تحلیل بازخورد و رضایت ارباب رجوع.", "specific"),
      createAgent("pass_digi", "تحول دیجیتال", "Ideator", "fa-laptop-code", "پیشنهاد اتوماسیون و خدمات الکترونیک.", "specific"),
      createAgent("pass_sec", "امنیت و تطبیق", "Critic", "fa-shield-halved", "بررسی انطباق امنیتی پیشنهادات.", "specific")
    ]
  },
  {
    id: "tt_border_intel",
    name: "هوش مرزی و جریان مهاجرت",
    industry: "امنیت ملی و مرزبانی",
    description: "پایش، تحلیل و پیش‌بینی جریان‌های ورود و خروج و شناسایی ریسک‌های مهاجرت غیرقانونی با رویکرد پیش‌دستانه.",
    icon: "fa-tower-observation",
    category: "specific",
    agents: [
      createAgent("bord_fore", "پیش‌بینی جریان", "Strategist", "fa-chart-line", "پیش‌بینی روندهای مهاجرتی.", "specific"),
      createAgent("bord_risk", "تشخیص ریسک", "Analyst", "fa-triangle-exclamation", "شناسایی الگوهای پرخطر.", "specific"),
      createAgent("bord_geo", "تحلیل ژئوپترن", "Analyst", "fa-map-location-dot", "تحلیل مسیرهای جغرافیایی حساس.", "specific"),
      createAgent("bord_stat", "وضعیت اتباع", "Evaluator", "fa-passport", "تحلیل وضعیت حقوقی اتباع خارجی.", "specific"),
      createAgent("bord_warn", "هشدار سریع", "Planner", "fa-bell", "تولید سناریوهای بحران و هشدار.", "specific"),
      createAgent("bord_pol", "اثرسنجی سیاست", "Critic", "fa-gavel", "تحلیل پیامدهای سیاست‌های جدید.", "specific")
    ]
  },
  {
    id: "tt_tourism",
    name: "تسهیل گردشگری و سفر قانونی",
    industry: "گردشگری و دیپلماسی",
    description: "تسهیل تردد قانونی و گردشگری ضمن حفظ امنیت و ارتقای وجهه خدمات انتظامی.",
    icon: "fa-plane-circle-check",
    category: "specific",
    agents: [
      createAgent("tour_fac", "تسهیل‌گر سفر", "Executor", "fa-plane-departure", "کاهش اصطکاک اداری سفر قانونی.", "specific"),
      createAgent("tour_flow", "هوش گردشگری", "Analyst", "fa-map", "تحلیل و پیش‌بینی جریان توریست.", "specific"),
      createAgent("tour_coord", "هماهنگی", "Moderator", "fa-handshake", "هماهنگی بین‌دستگاهی.", "specific"),
      createAgent("tour_bench", "الگوبرداری", "Ideator", "fa-globe", "مقایسه با استانداردهای جهانی.", "specific"),
      createAgent("tour_exp", "تجربه مسافر", "Evaluator", "fa-star", "تحلیل تجربه مسافران.", "specific"),
      createAgent("tour_rep", "ریسک و شهرت", "Critic", "fa-bullhorn", "ارزیابی ریسک‌های امنیتی و شهرت.", "specific")
    ]
  },
  {
    id: "tt_hats",
    name: "شش کلاه تفکر (Hats)",
    industry: "مدیریت و تصمیم‌گیری",
    description: "مدل کلاسیک ادوارد دبونو برای بررسی مسئله از زوایای مختلف شناختی.",
    icon: "fa-hat-wizard",
    category: "agnostic",
    agents: [
      createAgent("h_white", "کلاه سفید", "Analyst", "fa-circle", "فقط بر داده‌ها، واقعیت‌ها و ارقام تمرکز کنید. بدون قضاوت شخصی.", "agnostic"),
      createAgent("h_red", "کلاه قرمز", "Evaluator", "fa-heart", "بر اساس احساسات، غریزه و حدس‌های درونی نظر دهید.", "agnostic"),
      createAgent("h_black", "کلاه سیاه", "Critic", "fa-shield-halved", "نقاط ضعف، خطرات و موانع بالقوه را شناسایی کنید. منتقد باشید.", "agnostic"),
      createAgent("h_yellow", "کلاه زرد", "Ideator", "fa-sun", "بر جنبه‌های مثبت، منافع و خوش‌بینی تمرکز کنید.", "agnostic"),
      createAgent("h_green", "کلاه سبز", "Ideator", "fa-seedling", "ایده‌های خلاقانه و راهکارهای جایگزین ارائه دهید.", "agnostic"),
      createAgent("h_blue", "کلاه آبی", "Moderator", "fa-brain", "مدیریت جلسه، جمع‌بندی و کنترل فرآیند تفکر را بر عهده بگیرید.", "agnostic")
    ]
  },
  {
    id: "tt_scamper",
    name: "مدل خلاقیت SCAMPER",
    industry: "نوآوری و حل مسئله",
    description: "مناسب برای میزگردهای نوآوری و ایده‌پردازی با تمرکز بر بهبود ایده‌ها و حل خلاقانه مسائل.",
    icon: "fa-lightbulb",
    category: "agnostic",
    agents: [
      createAgent("sc_sub", "جایگزینی (Substitute)", "Ideator", "fa-shuffle", "چه چیزی را می‌توان جایگزین کرد؟ (متریال، افراد، فرآیندها)", "agnostic"),
      createAgent("sc_com", "ترکیب (Combine)", "Synthesizer", "fa-layer-group", "کدام بخش‌ها یا ایده‌ها را می‌توان با هم ترکیب کرد تا هم‌افزایی ایجاد شود؟", "agnostic"),
      createAgent("sc_ada", "تطبیق (Adapt)", "Strategist", "fa-sliders", "چگونه می‌توان این ایده را با شرایط یا مفاهیم دیگر تطبیق داد؟", "agnostic"),
      createAgent("sc_mod", "تغییر/اصلاح (Modify)", "Evaluator", "fa-expand", "چه ویژگی‌هایی را می‌توان بزرگ‌نمایی کرد یا تغییر داد تا ارزش افزوده ایجاد شود؟", "agnostic"),
      createAgent("sc_put", "کاربرد دیگر (Put to Use)", "Strategist", "fa-recycle", "این ایده چه کاربردهای متفاوتی در حوزه‌های دیگر دارد؟", "agnostic"),
      createAgent("sc_eli", "حذف (Eliminate)", "Critic", "fa-eraser", "چه بخش‌هایی اضافی هستند و باید برای ساده‌سازی حذف شوند؟", "agnostic"),
      createAgent("sc_rev", "معکوس‌سازی (Reverse)", "Ideator", "fa-rotate", "اگر فرآیند یا ترتیب را معکوس کنیم چه اتفاقی می‌افزاید؟", "agnostic")
    ]
  },
  {
    id: "tt_div_conv",
    name: "مدل تفکر واگرا و همگرا",
    industry: "تصمیم‌گیری گروهی",
    description: "فرآیند دو مرحله‌ای: تولید آزادانه ایده‌ها (واگرا) و سپس تحلیل و اولویت‌بندی (همگرا).",
    icon: "fa-arrows-split-up-and-left",
    category: "agnostic",
    agents: [
      createAgent("dc_div", "عامل واگرا (Divergent)", "Ideator", "fa-burst", "بدون محدودیت ایده تولید کنید. کمیت بر کیفیت مقدم است.", "agnostic"),
      createAgent("dc_conv", "عامل همگرا (Convergent)", "Evaluator", "fa-compress", "ایده‌ها را بر اساس معیارهای استراتژیک فیلتر و انتخاب کنید.", "agnostic")
    ]
  },
  {
    id: "tt_fishbowl",
    name: "تکنیک آکواریوم (Fishbowl)",
    industry: "مدیریت مشارکت",
    description: "ساختار حلقه داخلی (گویندگان فعال) و حلقه بیرونی (شنوندگان) برای بحث‌های تخصصی و حساس.",
    icon: "fa-fish-fins",
    category: "agnostic",
    agents: [
      createAgent("fb_inner", "گوینده داخلی", "Strategist", "fa-microphone", "بحث تخصصی و عمیق در هسته مرکزی نشست.", "agnostic"),
      createAgent("fb_outer", "شنونده فعال", "Analyst", "fa-ear-listen", "تحلیل بحث‌های داخلی و آماده‌سازی سوالات کلیدی.", "agnostic"),
      createAgent("fb_mod", "مدیر آکواریوم", "Moderator", "fa-arrows-rotate", "مدیریت چرخش نقش‌ها بین حلقه‌های داخلی و بیرونی.", "agnostic")
    ]
  },
  {
    id: "tt_roles",
    name: "شش نقش تفکر (Roles)",
    industry: "مدیریت جلسات",
    description: "نسخه ساده‌تر کلاه‌های تفکر مناسب برای جلسات مدیریتی کوچک.",
    icon: "fa-user-group",
    category: "agnostic",
    agents: [
      createAgent("ro_ana", "تحلیل‌گر (Analyst)", "Analyst", "fa-chart-simple", "بررسی ابعاد فنی و آماری موضوع.", "agnostic"),
      createAgent("ro_cri", "منتقد (Critic)", "Critic", "fa-eye", "شناسایی باگ‌ها و ضعف‌های منطقی پیشنهادات.", "agnostic"),
      createAgent("ro_cre", "خلاق (Creative)", "Ideator", "fa-palette", "ارائه نگاه‌های نو و خارج از چارچوب.", "agnostic"),
      createAgent("ro_imp", "مجری (Implementer)", "Executor", "fa-gears", "بررسی قابلیت اجرایی و عملیاتی ایده‌ها.", "agnostic"),
      createAgent("ro_fac", "تسهیل‌گر (Facilitator)", "Moderator", "fa-comments", "هماهنگ‌سازی جریان گفتگو.", "agnostic"),
      createAgent("ro_obs", "ناظر (Observer)", "Monitor", "fa-binoculars", "ثبت وقایع و نگاه کلان به فرآیند نشست.", "agnostic")
    ]
  },
  {
    id: "tt_swot",
    name: "SWOT مشارکتی",
    industry: "تحلیل وضعیت",
    description: "تحلیل موقعیت استراتژیک از طریق شناسایی قوت‌ها، ضعف‌ها، فرصت‌ها و تهدیدها.",
    icon: "fa-chess-knight",
    category: "agnostic",
    agents: [
      createAgent("sw_str", "تحلیل‌گر قوت‌ها", "Analyst", "fa-plus-circle", "شناسایی مزایای رقابتی داخلی.", "agnostic"),
      createAgent("sw_weak", "تحلیل‌گر ضعف‌ها", "Critic", "fa-minus-circle", "شناسایی محدودیت‌ها و کمبودهای داخلی.", "agnostic"),
      createAgent("sw_opp", "تحلیل‌گر فرصت‌ها", "Strategist", "fa-arrow-trend-up", "شناسایی زمینه‌های رشد خارجی.", "agnostic"),
      createAgent("sw_thr", "تحلیل‌گر تهدیدها", "Monitor", "fa-triangle-exclamation", "شناسایی خطرات محیطی خارجی.", "agnostic")
    ]
  }
];

export const MODELS = {
  TEXT: 'gemini-3-flash-preview',
  PRO: 'gemini-3-pro-preview'
};
