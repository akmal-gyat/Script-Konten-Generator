import React, { useState, useRef } from "react";
import { 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Copy, 
  Check, 
  Clapperboard, 
  Tv, 
  Megaphone, 
  FileText, 
  Compass, 
  Flame, 
  HelpCircle, 
  ChevronRight, 
  Lightbulb, 
  RefreshCw,
  Clock,
  Film,
  Grid,
  Heart,
  ExternalLink,
  Plus,
  ArrowRight
} from "lucide-react";

// Types for structural generated output or presets
interface StoryboardScene {
  sceneNumber: number;
  visual: string;
  audio: string;
  duration: string;
}

interface GeneratedContent {
  title: string;
  targetAudience: string;
  platformRelevance: string;
  hook: string;
  coreIdea: string;
  storyboard: StoryboardScene[];
  caption: string;
  hashtags: string[];
  productionTips: string[];
}

export default function App() {
  // Config state
  const [briefText, setBriefText] = useState("");
  const [platform, setPlatform] = useState("TikTok, Reels, & Shorts (Short-form)");
  const [tone, setTone] = useState("Kreatif, Menarik & Santai");
  
  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status state
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"storyboard" | "copywriting" | "production">("storyboard");

  // Presets Indonesian Content Ideas
  const presets = [
    {
      title: "Kuliner Sourdough Lokal",
      brief: "Mempromosikan produk roti sourdough gandum utuh dari bakery rumahan lokal. Targetnya adalah milenial yang peduli kesehatan sereal alami dan tanpa pengawet.",
      platform: "Instagram Reels (Estetik/Lifestyle)",
      tone: "Cinematic, Estetik & Hangat"
    },
    {
      title: "Tips Produktivitas WFH",
      brief: "Membagikan 3 tips rahasia manajemen waktu saat bekerja jarak jauh agar tidak lembur terus-menerus. Tips meliputi metode Pomodoro dan manajemen distraksi telepon pintar.",
      platform: "TikTok, Reels, & Shorts (Short-form)",
      tone: "Edukatif, Inspiratif & Berwibawa"
    },
    {
      title: "Review Minimalis Meja Kerja",
      brief: "Review estetika setup meja kerja minimalis kayu walnut dengan lampu LED hangat. Menonjolkan kerapian kabel (cable management) dan keyboard mekanikal.",
      platform: "YouTube Shorts (Hacks/Informasi cepat)",
      tone: "Cinematic, Estetik & Hangat"
    },
    {
      title: "Keuangan Kaum Muda",
      brief: "Membahas sindrom FOMO yang membuat anak muda sering nongkrong boros, lalu memberikan alternatif investasi micro-saving mulai dari 10 ribu rupiah saja.",
      platform: "TikTok, Reels, & Shorts (Short-form)",
      tone: "Humoris, Akrab & Berotak Dingin"
    }
  ];

  // Apply a selected preset
  const applyPreset = (preset: typeof presets[0]) => {
    setBriefText(preset.brief);
    setPlatform(preset.platform);
    setTone(preset.tone);
    setErrorStatus(null);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  const processImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setErrorStatus("Format berkas harus berupa gambar (PNG, JPG, JPEG, WEBP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorStatus("Ukuran gambar terlalu besar. Maksimal adalah 5 Megabyte.");
      return;
    }

    setImageFile(file);
    setErrorStatus(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate Action
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefText.trim() && !imagePreview) {
      setErrorStatus("Silakan masukkan penjelasan brief berupa teks, atau unggah gambar referensi terlebih dahulu!");
      return;
    }

    setIsLoading(true);
    setErrorStatus(null);
    setResult(null);

    try {
      const payload = {
        briefText: briefText,
        imageData: imagePreview || null,
        imageMimeType: imageFile ? imageFile.type : null,
        platform: platform,
        tone: tone
      };

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server merespon dengan status ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      setTimeout(() => {
        const target = document.getElementById("content-results-section");
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Gagal menghubungi server generator. Pastikan Anda telah memasukkan kunci API di panel Secrets.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toast-like copy action helper
  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f2f1eb] text-black font-sans antialiased selection:bg-[#002aff] selection:text-white" id="generator-app-root">
      
      {/* Top brutalist black accent bar */}
      <div className="h-3 bg-[#002aff]" id="top-bar-decoration" />

      {/* HERO HERO BRUTALIST GRID */}
      <header className="relative pt-12 pb-12 px-6 sm:px-12 border-b-2 border-black bg-[#f2f1eb]" id="hero-brutalist">
        {/* Giant light gray label on background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0 overflow-hidden" id="giant-background">
          <h1 className="text-[14vw] font-display uppercase tracking-tighter text-black/[0.03] leading-none whitespace-nowrap">
            IDE KONTEN
          </h1>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10" id="hero-inner-grid">
          
          <div className="md:col-span-8 space-y-4" id="hero-left">
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase leading-none text-black">
              IDE <span className="text-[#002aff]">KONTEN</span> <br />GENERATOR
            </h1>
            
            <div className="relative inline-block" id="signature-subtitle">
              <span className="text-3xl sm:text-5xl font-script text-[#002aff] lowercase tracking-normal block transform -rotate-2">
                skenario instan &amp; visual
              </span>
            </div>
          </div>

          <div className="md:col-span-4" id="hero-right">
            <div className="p-5 border-2 border-black bg-white rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" id="hero-description-card">
              <p className="text-xs sm:text-[13px] text-slate-700 font-medium leading-relaxed">
                Ubah brief tulisan, naskah kasar, foto produk, atau sketsa corat-coret menjadi rancangan video pendek berurutan, takarir (caption) media sosial pemicu interaksi, hashtag penembus FYP, serta kiat-kiat produksi syuting profesional.
              </p>
            </div>
          </div>

        </div>
      </header>

      {/* HORIZONTAL RUNNING MARQUEE 1 */}
      <div className="bg-black text-white border-b-2 border-black overflow-hidden py-3" id="marquee-banner-top">
        <div className="animate-marquee whitespace-nowrap flex items-center gap-16 font-display text-xs font-bold tracking-[0.2em]">
          {Array(10).fill(null).map((_, i) => (
            <span key={i} className="flex items-center gap-16">
              <span>SCRIPT VIRAL</span>
              <span className="text-[#002aff] font-script tracking-normal text-2xl lowercase rotate-[-2deg] font-normal">vancouver style</span>
              <span>ENGAGEMENT CAPTION</span>
              <span className="w-2 h-2 bg-[#002aff] rounded-full" />
              <span>VIRAL HOOK GENERATOR</span>
            </span>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-12" id="main-workspace-grid">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start" id="workspace-columns-split">
          
          {/* LEFT: WORKSPACE CONFIGURATION (takes 5 columns) */}
          <section className="lg:col-span-5 space-y-8" id="brief-config-sidebar">
            
            {/* Input Form Box */}
            <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 relative" id="config-card">
              
              <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6" id="config-card-header">
                <h2 className="text-sm font-black tracking-widest uppercase flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#002aff]" />
                  <span>/ KOMPONEN BRIEF</span>
                </h2>
                <span className="text-[10px] font-mono text-slate-400">[FORMULIR ASISTEN]</span>
              </div>

              <form onSubmit={handleGenerate} className="space-y-6" id="input-form">
                
                {/* Visual Image Upload Area (Adopting Lookbook/Quality styling) */}
                <div id="image-upload-block">
                  <label className="block text-xs font-black tracking-wider uppercase mb-2 flex items-center justify-between text-black">
                    <span>1. GAMBAR PENDUKUNG ATAU BRIEF SKETSA</span>
                    <span className="text-[10px] text-slate-400 lowercase font-normal font-mono">maks. 5mb</span>
                  </label>

                  {imagePreview ? (
                    <div className="relative rounded-sm border-2 border-black p-3 bg-slate-50 flex items-center gap-3 animate-fade-in" id="preview-box">
                      <img 
                        src={imagePreview} 
                        alt="Preview Mini" 
                        className="w-16 h-16 object-cover rounded-sm border border-black/20 shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-black truncate" id="img-name">
                          {imageFile ? imageFile.name : "Gambar Referensi Terpilih"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)} MB` : "Tengah dimuat"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="p-1.5 rounded-full bg-slate-200 hover:bg-red-100 text-slate-700 hover:text-red-700 transition-colors ml-auto border border-black/10"
                        title="Hapus gambar"
                        id="btn-delete-img"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-sm p-6 text-center cursor-pointer transition-all ${
                        isDragOver 
                          ? "border-[#002aff] bg-blue-50/50" 
                          : "border-black hover:border-[#002aff] hover:bg-slate-50"
                      }`}
                      id="brutalist-dropzone"
                    >
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="form-file-input"
                      />
                      <div className="flex flex-col items-center gap-2" id="dropzone-text-group">
                        <div className="p-3 rounded-full bg-[#002aff]/10 text-[#002aff] border border-[#002aff]/20" id="icon-upload-holder">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-black">
                          Seret berkas gambar atau klik di sini
                        </p>
                        <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                          Unggah selebaran, tangkapan layar brief teks, sketsa ide kasar, atau produk yang ingin dipromosikan
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Brief Text / Prompt Input */}
                <div id="brief-text-block">
                  <label htmlFor="brief-textarea" className="block text-xs font-black tracking-wider uppercase mb-2 text-black">
                    2. DESKRIPSI SINGKAT KONTEN (PROMPT)
                  </label>
                  <textarea
                    id="brief-textarea"
                    value={briefText}
                    onChange={(e) => setBriefText(e.target.value)}
                    rows={4}
                    className="w-full bg-[#fcfbf9] border-2 border-black p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#002aff]/20 focus:border-[#002aff] text-black placeholder:text-slate-400 font-medium leading-relaxed rounded-sm"
                    placeholder="Contoh: Buatkan konten edukasi pendek mengenai kesalahan umum pemula saat berolahraga angkat beban, lengkap dengan solusi praktisnya..."
                  />
                  <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                    <span>Mendukung teks, deskripsi visual, dan ide apa pun</span>
                    <span>{briefText.length} karakter</span>
                  </div>
                </div>

                {/* Target Platform Picker */}
                <div id="platform-block">
                  <label htmlFor="platform-selector" className="block text-xs font-black tracking-wider uppercase mb-2 text-black">
                    3. PLATFORM DISTRIBUSI UTAMA
                  </label>
                  <select
                    id="platform-selector"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-[#fcfbf9] border-2 border-black p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002aff]/20 focus:border-[#002aff] text-black rounded-sm transition-all cursor-pointer"
                  >
                    <option value="TikTok, Reels, & Shorts (Short-form)">TikTok, Reels, & Shorts (Video Pendek 15-60 dtk)</option>
                    <option value="Instagram Reels (Estetik/Lifestyle)">Instagram Reels (Estetik/Lifestyle)</option>
                    <option value="YouTube Shorts (Hacks/Informasi cepat)">YouTube Shorts (Informasi & Tips Cepat)</option>
                    <option value="YouTube Horizontal (Video Panjang 5-10 menit)">YouTube Horizontal (Panduan Mendalam)</option>
                    <option value="LinkedIn & Twitter Feed (Bahan micro-blogging)">LinkedIn / Instagram Carousel (Teks & Slide)</option>
                  </select>
                </div>

                {/* Tone / Style Picker */}
                <div id="tone-block">
                  <label htmlFor="tone-selector" className="block text-xs font-black tracking-wider uppercase mb-2 text-black">
                    4. GAYA PENYAMPAIAN & NADA BICARA (TONE)
                  </label>
                  <select
                    id="tone-selector"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[#fcfbf9] border-2 border-black p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#002aff]/20 focus:border-[#002aff] text-black rounded-sm transition-all cursor-pointer"
                  >
                    <option value="Kreatif, Menarik & Santai">Kreatif, Menarik & Santai (Cocok untuk FYP)</option>
                    <option value="Humoris, Akrab & Berotak Dingin">Humoris, Lucu, & Menyindir Halus (Relatable)</option>
                    <option value="Cinematic, Estetik & Hangat">Cinematic, Estetik, Hangat (Storytelling visual)</option>
                    <option value="Edukatif, Inspiratif & Berwibawa">Edukatif, Profesional, Inspiratif (Membangun Otoritas)</option>
                    <option value="Berenergi Tinggi & Promo Heboh">Berenergi Tinggi, Penjualan Agresif (Promo & Launch)</option>
                  </select>
                </div>

                {/* Error Box */}
                {errorStatus && (
                  <div className="p-3 bg-red-50 border-2 border-red-500 rounded-sm text-red-700 text-xs flex items-start gap-2 animate-pulse" id="error-alert">
                    <span className="font-black bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]">!</span>
                    <p className="flex-1 font-semibold">{errorStatus}</p>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-4 bg-[#002aff] hover:bg-black text-white rounded-sm font-black text-xs uppercase tracking-widest transition-all cursor-pointer shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] disabled:bg-slate-400 disabled:shadow-none flex items-center justify-center gap-2"
                  id="btn-submit-generation"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sedang Meracik Skenario AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>PROSES KREASI SEKARANG</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* PRESETS BLOCK: Inovasi Brutalist Grid */}
            <div className="bg-white border-2 border-black rounded-sm p-6 space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" id="presets-sidebar-card">
              <div className="flex items-center gap-1.5 pb-2 border-b border-black/10" id="presets-title-box">
                <Lightbulb className="w-4 h-4 text-[#002aff]" />
                <h3 className="text-xs font-black tracking-widest text-black uppercase">
                  / PRESET BRIEF PILIHAN CEPAT
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3" id="presets-grid-container">
                {presets.map((presetItem, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyPreset(presetItem)}
                    className="p-3 rounded-sm border border-black/20 hover:border-[#002aff] bg-slate-50 hover:bg-[#002aff]/5 text-left transition-all group relative overflow-hidden"
                    id={`preset-button-${index}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-black group-hover:text-[#002aff] truncate">
                        {presetItem.title}
                      </span>
                      <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                        {presetItem.platform.split(" ")[0]}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {presetItem.brief}
                    </p>
                  </button>
                ))}
              </div>
            </div>

          </section>

          {/* RIGHT: WORKSPACE GENERATOR OUTPUT & RESPONSIVE DISPLAYS (takes 7 columns) */}
          <section className="lg:col-span-7" id="content-results-section">
            
            {/* Loading placeholder skeleton */}
            {isLoading && (
              <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 space-y-6 animate-pulse" id="loading-mask">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-8 bg-slate-200 rounded w-3/4" />
                  <div className="h-5 bg-slate-200 rounded w-1/2 animate-bounce" />
                </div>
                
                <div className="border-t-2 border-dashed border-black/10 pt-6 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-10 bg-slate-200 rounded-sm" />
                    <div className="h-10 bg-slate-200 rounded-sm" />
                    <div className="h-10 bg-slate-200 rounded-sm" />
                  </div>
                  
                  <div className="space-y-3 pt-2">
                    <div className="h-28 bg-slate-100 rounded-sm" />
                    <div className="h-12 bg-slate-100 rounded-sm" />
                    <div className="h-20 bg-slate-100 rounded-sm" />
                  </div>
                </div>

                <div className="text-center py-4 bg-[#002aff]/5 rounded-sm border border-[#002aff]/20">
                  <p className="text-xs text-[#002aff] font-bold animate-pulse tracking-widest uppercase">
                    MENGHUBUNGI GEMINI AI KREATOR &amp; MENYUSUN STORYBOARD...
                  </p>
                </div>
              </div>
            )}

            {/* Static Initial State (Empty) */}
            {!isLoading && !result && (
              <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-8 text-center space-y-8 py-16" id="empty-state">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#002aff]/10 text-[#002aff] flex items-center justify-center border-2 border-black" id="empty-icon-wrapper">
                  <Clapperboard className="w-8 h-8 animate-pulse" />
                </div>
                
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-black tracking-widest uppercase text-black">
                    / IDE KONTEN STUDIO BELUM SIAP
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Pilih preset atau tulis brief naskah kasar di bagian kiri. Masukkan foto pendukung untuk memperkaya pemahaman AI. Tekan tombol berwarna biru <strong className="text-[#002aff]">PROSES KREASI</strong> untuk meluncurkan asisten AI.
                  </p>
                </div>

                {/* Features block inspired by Swiss-minimal list cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 max-w-lg mx-auto" id="perks-grid">
                  <div className="p-3.5 bg-slate-50 border border-black/10 rounded-sm text-center flex flex-col items-center gap-1.5">
                    <Film className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-xs font-black text-black">STORYBOARD</h4>
                    <span className="text-[10px] text-slate-400">Video adegan-demi-adegan</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-black/10 rounded-sm text-center flex flex-col items-center gap-1.5">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h4 className="text-xs font-black text-black">COPYWRITING</h4>
                    <span className="text-[10px] text-slate-400">Caption &amp; tagar populer</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 border border-black/10 rounded-sm text-center flex flex-col items-center gap-1.5">
                    <Megaphone className="w-5 h-5 text-[#002aff]" />
                    <h4 className="text-xs font-black text-black">TIPS SYUTING</h4>
                    <span className="text-[10px] text-slate-400">Arah visual &amp; audio</span>
                  </div>
                </div>
              </div>
            )}

            {/* REAL GENERATED WORKSPACE DATA DISPLAY */}
            {!isLoading && result && (
              <div className="space-y-6 animate-fade-in" id="output-ready-wrapper">
                
                {/* Title Card & Main Identity (Like Product details head) */}
                <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 relative overflow-hidden" id="title-card">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#002aff]/5 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3" id="title-badges">
                    <span className="px-2.5 py-1 rounded-sm bg-[#002aff] text-white text-[9px] font-black uppercase tracking-wider border border-black">
                      {platform}
                    </span>
                    <span className="px-2.5 py-1 rounded-sm bg-[#f2f1eb] text-black text-[9px] font-black uppercase tracking-wider border border-black/20">
                      {tone}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-display font-black text-black tracking-tight leading-snug uppercase" id="output-title">
                    {result.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed" id="output-core-idea">
                    <strong className="text-black font-extrabold uppercase tracking-wide">Inti Ide:</strong> {result.coreIdea}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-5 border-t border-black/15" id="output-meta-stats">
                    <div className="p-3 bg-slate-50 border border-black/10 rounded-sm" id="meta-stat-audience">
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Target Audiens</p>
                      <p className="text-xs font-bold text-black mt-1">{result.targetAudience}</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-black/10 rounded-sm" id="meta-stat-relevance">
                      <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Relevansi Algoritma</p>
                      <p className="text-xs font-bold text-black mt-1">{result.platformRelevance}</p>
                    </div>
                  </div>
                </div>

                {/* Engaging Key Hook Alert Box (Black & Blue Brutalist) */}
                <div className="bg-[#002aff] text-white border-2 border-black rounded-sm p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-start gap-4 relative overflow-hidden" id="hook-banner">
                  <div className="absolute top-0 right-0 p-3 text-white/5 pointer-events-none select-none" id="hook-decoration">
                    <Flame className="w-24 h-24 rotate-12" />
                  </div>
                  
                  <div className="p-2.5 rounded-sm bg-black text-[#002aff] shrink-0 border border-black" id="hook-bullet-holder">
                    <Flame className="w-5 h-5 fill-[#002aff]" />
                  </div>

                  <div className="space-y-1 relative z-10 flex-1">
                    <div className="flex items-center justify-between" id="hook-row-meta">
                      <h4 className="text-[10px] font-black tracking-widest uppercase text-[#f2f1eb]/80">
                        / HOOK DETIK 1-3 (ANTI-SKIP AUDIENS)
                      </h4>
                      <button 
                        onClick={() => copyToClipboard(result.hook, "hook")}
                        className="text-white hover:text-black hover:bg-white/20 p-1.5 rounded transition-all"
                        title="Salin hook"
                        id="btn-copy-hook-text"
                      >
                        {copiedSection === "hook" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-base sm:text-lg font-black tracking-wide pt-1 leading-relaxed italic">
                      &ldquo;{result.hook}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Tab selectors for Workspace Views */}
                <div className="bg-white border-2 border-black p-1.5 flex rounded-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" id="tabs-navigation">
                  <button
                    onClick={() => setActiveTab("storyboard")}
                    className={`flex-1 py-3 text-xs font-black rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === "storyboard" 
                        ? "bg-[#002aff] text-white border border-black shadow-sm" 
                        : "text-slate-600 hover:text-black hover:bg-slate-50"
                    }`}
                    id="btn-tab-storyboard"
                  >
                    <Film className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Storyboard ({result.storyboard ? result.storyboard.length : 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("copywriting")}
                    className={`flex-1 py-3 text-xs font-black rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === "copywriting" 
                        ? "bg-[#002aff] text-white border border-black shadow-sm" 
                        : "text-slate-600 hover:text-black hover:bg-slate-50"
                    }`}
                    id="btn-tab-copywriting"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Caption / Takarir</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("production")}
                    className={`flex-1 py-3 text-xs font-black rounded-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === "production" 
                        ? "bg-[#002aff] text-white border border-black shadow-sm" 
                        : "text-slate-600 hover:text-black hover:bg-slate-50"
                    }`}
                    id="btn-tab-production"
                  >
                    <Lightbulb className="w-4 h-4" />
                    <span className="uppercase tracking-wider">Tips Syuting</span>
                  </button>
                </div>

                {/* Tab Output Content Blocks */}
                <div className="bg-white border-2 border-black rounded-sm shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6" id="tabs-body-content">
                  
                  {/* TAB 1: STORYBOARD TIMELINE */}
                  {activeTab === "storyboard" && (
                    <div className="space-y-6" id="panel-storyboard">
                      <div className="flex items-center justify-between border-b border-black/10 pb-3" id="storyboard-header-row">
                        <h4 className="text-xs font-black tracking-widest text-black uppercase flex items-center gap-2">
                          <Clapperboard className="w-4 h-4 text-[#002aff]" />
                          <span>ALUR ADEGAN DETIL (SEQUENCE STORYBOARD)</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 font-bold">[KRONOLOGIS]</span>
                      </div>

                      <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-4 before:w-[2px] before:bg-slate-200" id="storyboard-timeline">
                        {result.storyboard?.map((scene, index) => (
                          <div key={index} className="relative pl-10 group" id={`scene-${index}`}>
                            
                            {/* Chronology Badge Bullet */}
                            <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-white text-black border-2 border-black text-xs font-black flex items-center justify-center shadow-sm group-hover:bg-[#002aff] group-hover:text-white transition-all">
                              {scene.sceneNumber || index + 1}
                            </div>

                            {/* Scene Content Card */}
                            <div className="bg-[#fcfbf9] border border-black/10 group-hover:border-black rounded-sm p-4 transition-all" id={`scene-card-${index}`}>
                              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100" id={`scene-meta-row-${index}`}>
                                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                                  SCENE KE-{scene.sceneNumber || index + 1}
                                </span>
                                <span className="text-[10px] font-black text-black bg-slate-200/80 px-2.5 py-0.5 rounded-sm flex items-center gap-1 font-mono">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>{scene.duration || "3-5 detik"}</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id={`scene-block-split-${index}`}>
                                <div className="space-y-1.5" id={`scene-visual-${index}`}>
                                  <span className="text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest block">Panduan Kamera &amp; Visual</span>
                                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                                    {scene.visual}
                                  </p>
                                </div>
                                <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-slate-200/60 pt-2.5 md:pt-0 md:pl-4" id={`scene-audio-${index}`}>
                                  <span className="text-[9px] font-mono font-bold text-[#002aff] uppercase tracking-widest block">Naskah Dialog / Voice Over</span>
                                  <p className="text-xs text-slate-900 font-extrabold leading-relaxed">
                                    {scene.audio || "Hanya visual / musik latar saja."}
                                  </p>
                                </div>
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: COPYWRITING */}
                  {activeTab === "copywriting" && (
                    <div className="space-y-6" id="panel-copywriting">
                      
                      {/* Caption Box */}
                      <div className="space-y-2" id="caption-container">
                        <div className="flex items-center justify-between">
                          <label htmlFor="caption-output" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Takarir (Caption) Salinan Media Sosial
                          </label>
                          <button
                            onClick={() => copyToClipboard(result.caption, "caption")}
                            className="text-[#002aff] hover:text-black text-xs font-black flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded transition-all"
                            id="btn-copy-caption-text"
                          >
                            {copiedSection === "caption" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Caption</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="p-4 bg-slate-50 border border-black/10 rounded-sm leading-relaxed text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap" id="caption-body">
                          {result.caption}
                        </div>
                      </div>

                      {/* Hashtags Pool */}
                      <div className="space-y-2" id="hashtags-container">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Saran Hashtag Penembus FYP / Algoritma
                          </label>
                          <button
                            onClick={() => copyToClipboard(result.hashtags?.join(" ") || "", "hashtags")}
                            className="text-[#002aff] hover:text-black text-xs font-black flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded transition-all"
                            id="btn-copy-hashtags-text"
                          >
                            {copiedSection === "hashtags" ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Semua Hashtag</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1" id="hashtags-tokens">
                          {result.hashtags?.map((tag, i) => (
                            <span 
                              key={i} 
                              className="px-3 py-1.5 rounded-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-semibold cursor-pointer transition-colors"
                              onClick={() => copyToClipboard(tag, `tag-${i}`)}
                              title="Klik untuk menyalin"
                              id={`tag-token-${i}`}
                            >
                              {copiedSection === `tag-${i}` ? "✓ " : ""}{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 3: SHOOT & PRODUCTION TIPS */}
                  {activeTab === "production" && (
                    <div className="space-y-4" id="panel-production">
                      <h4 className="text-xs font-black tracking-widest text-black uppercase flex items-center gap-2 mb-2">
                        <Megaphone className="w-4 h-4 text-[#002aff]" />
                        <span>KIAT PRAKTIS PRODUKSI &amp; EDITING VIDEO</span>
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="production-tips-grid">
                        {result.productionTips?.map((tip, i) => (
                          <div key={i} className="p-4 rounded-sm bg-slate-50 border border-black/10 flex items-start gap-3 group hover:border-black transition-colors" id={`tip-card-${i}`}>
                            <div className="p-1 rounded-sm bg-[#002aff]/10 text-[#002aff] shrink-0 mt-0.5" id={`tip-bullet-${i}`}>
                              <Check className="w-3.5 h-3.5 font-black" />
                            </div>
                            <p className="text-xs text-slate-700 leading-relaxed font-semibold" id={`tip-text-${i}`}>
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-[#002aff]/5 rounded-sm border border-[#002aff]/20 text-[#002aff] text-xs leading-relaxed mt-4 flex items-start gap-2.5" id="pro-camera-tip">
                        <span className="text-base">💡</span>
                        <p className="font-semibold">
                          <strong>Kiat Kreator Ahli:</strong> Lakukan pengambilan gambar penutup (outro) di platform yang sama secara konsisten. Tambahkan teks ajakan bertindak (CTA) mengambang berkedip agar pemirsa mengetuk profil akun Anda.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Reset Trigger Row */}
                <div className="flex justify-center" id="reset-button-wrapper">
                  <button
                    type="button"
                    onClick={() => {
                      setResult(null);
                      setBriefText("");
                      removeImage();
                      setErrorStatus(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-black font-black hover:bg-white transition-all py-2.5 px-5 rounded-sm border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                    id="btn-restart-studio"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>MULAI IDE BARU DARI AWAL</span>
                  </button>
                </div>

              </div>
            )}

          </section>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-24 border-t-2 border-black bg-[#eae8e0] py-10 text-center space-y-4 text-black" id="applet-footer">
        
        {/* Footer Circle Stamp */}
        <div className="flex items-center justify-center" id="footer-logo">
          <div className="w-12 h-12 rounded-full border-2 border-black bg-white text-black flex items-center justify-center font-black text-sm select-none shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            V
          </div>
        </div>

        <p className="text-xs font-bold text-slate-600 flex flex-wrap items-center justify-center gap-1.5" id="footer-text">
          <span><Heart className="w-3.5 h-3.5 inline text-rose-600 fill-rose-600" /></span>
        </p>
        
        <p className="text-[10px] text-slate-400 font-mono font-bold" id="footer-copyright">
          &copy; 2026 IDE KONTEN GENERATOR. ALL RIGHTS RESERVED. KREATIF, PRAKTIS, &amp; TANPA BATAS.
        </p>

      </footer>

    </div>
  );
}
