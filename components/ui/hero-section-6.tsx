"use client";
import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { AnimatedGroup } from "@/components/ui/animated-group";
import { ArrowRight, Sparkles, GraduationCap, ShieldCheck, CheckCircle2 } from "lucide-react";

interface Iphone15ProProps extends React.SVGProps<SVGSVGElement> {
  width?: string | number;
  height?: string | number;
  src?: string;
  alt?: string;
}

const Iphone15Pro: React.FC<Iphone15ProProps> = ({
  width = "100%",
  height = "auto",
  src,
  alt = "iPhone screen content",
  className,
  ...props
}) => {
  return (
    <div className={cn("relative", className)}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 433 882"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-all duration-500 ease-in-out drop-shadow-2xl"
        {...props}
      >
        {/* Outer frame */}
        <path
          d="M2 73C2 32.6832 34.6832 0 75 0H357C397.317 0 430 32.6832 430 73V809C430 849.317 397.317 882 357 882H75C34.6832 882 2 849.317 2 809V73Z"
          className="fill-slate-300"
        />
        {/* Side buttons */}
        <path
          d="M0 171C0 170.448 0.447715 170 1 170H3V204H1C0.447715 204 0 203.552 0 203V171Z"
          className="fill-slate-400"
        />
        <path
          d="M1 234C1 233.448 1.44772 233 2 233H3.5V300H2C1.44772 300 1 299.552 1 299V234Z"
          className="fill-slate-400"
        />
        <path
          d="M1 319C1 318.448 1.44772 318 2 318H3.5V385H2C1.44772 385 1 384.552 1 384V319Z"
          className="fill-slate-400"
        />
        <path
          d="M430 279H432C432.552 279 433 279.448 433 280V384C433 384.552 432.552 385 432 385H430V279Z"
          className="fill-slate-400"
        />

        {/* Inner body */}
        <path
          d="M6 74C6 35.3401 37.3401 4 76 4H356C394.66 4 426 35.3401 426 74V808C426 846.66 394.66 878 356 878H76C37.3401 878 6 846.66 6 808V74Z"
          className="fill-slate-100"
        />

        {/* Top speaker grille */}
        <path
          opacity="0.5"
          d="M174 5H258V5.5C258 6.60457 257.105 7.5 256 7.5H176C174.895 7.5 174 6.60457 174 5.5V5Z"
          className="fill-slate-400"
        />

        {/* Screen area */}
        <path
          d="M21.25 75C21.25 44.2101 46.2101 19.25 77 19.25H355C385.79 19.25 410.75 44.2101 410.75 75V807C410.75 837.79 385.79 862.75 355 862.75H77C46.2101 862.75 21.25 837.79 21.25 807V75Z"
          className="fill-slate-50"
        />

        {/* Screen Content Area */}
        {src && (
          <foreignObject
            x="21.25"
            y="19.25"
            width="389.5"
            height="843.5"
            clipPath="url(#roundedCorners)"
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "55.75px",
                overflow: "hidden",
                position: "relative",
              }}
              className="bg-slate-50"
            >
              <Image
                src={src}
                alt={alt}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          </foreignObject>
        )}

        {/* Notch area */}
        <path
          d="M154 48.5C154 38.2827 162.283 30 172.5 30H259.5C269.717 30 278 38.2827 278 48.5C278 58.7173 269.717 67 259.5 67H172.5C162.283 67 154 58.7173 154 48.5Z"
          className="fill-slate-200"
        />
        {/* Inner Notch Elements */}
        <path
          d="M249 48.5C249 42.701 253.701 38 259.5 38C265.299 38 270 42.701 270 48.5C270 54.299 265.299 59 259.5 59C253.701 59 249 54.299 249 48.5Z"
          className="fill-slate-300"
        />
        <path
          d="M254 48.5C254 45.4624 256.462 43 259.5 43C262.538 43 265 45.4624 265 48.5C265 51.5376 262.538 54 259.5 54C256.462 54 254 51.5376 254 48.5Z"
          className="fill-blue-500/30"
        />

        <defs>
          <clipPath id="roundedCorners">
            <rect
              x="21.25"
              y="19.25"
              width="389.5"
              height="843.5"
              rx="55.75"
              ry="55.75"
            />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
};

const navItems = [
  { name: "Scholarships", href: "#schemes" },
  { name: "Eligibility Checker", href: "#checker" },
  { name: "Categories", href: "#categories" },
  { name: "Success Stories", href: "#stories" },
  { name: "Application Guide", href: "#guide" },
];

export default function HeroSection6() {
  const textVariants: Variants = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.2,
        duration: 0.9,
      },
    },
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      {/* Dynamic Ambient Background without pitch black */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,#ffedd5_0%,#eff6ff_45%,#f8fafc_100%)] opacity-90 pointer-events-none" />

      {/* Subtle Mesh Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:36px_36px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navbar */}
      <nav className="w-full flex justify-between items-center py-4 px-6 md:px-12 border-b border-slate-200/80 bg-white/80 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-slate-900">
          <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span>Scheme<span className="text-orange-600">Finder</span></span>
        </div>

        <div className="items-center gap-8 hidden md:flex">
          {navItems.map((item) => (
            <Link href={item.href} key={item.name}>
              <span className="text-sm font-semibold text-slate-600 hover:text-orange-600 transition-colors">
                {item.name}
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="#app">
            <button className="px-5 py-2.5 text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all rounded-lg shadow-sm hover:shadow-md">
              Get Started Free &rarr;
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section Container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headings, Subtitle & Action CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                },
                item: textVariants,
              }}
            >
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
                <span>Ministry of Education · Govt. of India</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Find your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  scholarship
                </span>
                <br />
                the{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
                  smart
                </span>{" "}
                way
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl mb-8 leading-relaxed font-normal">
                Tell us who you are — Scheme Finder matches you with every scheme you actually qualify for, then guides you through applying step-by-step.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-10">
                <button className="flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white w-full sm:w-auto shadow-md transition-all hover:-translate-y-0.5 cursor-pointer">
                  <span>Check My Eligibility</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button className="flex items-center justify-center gap-2 px-6 py-3.5 text-base font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-sm w-full sm:w-auto cursor-pointer">
                  <span>Browse Schemes</span>
                </button>
              </div>

              {/* Stats Strip */}
              <div className="flex items-center gap-8 pt-6 border-t border-slate-200 w-full">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    29<span className="text-orange-500">+</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Active Schemes</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    ₹2<span className="text-orange-500">L+</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">Avg Benefit/Year</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    28<span className="text-orange-500">+</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">States Covered</div>
                </div>
              </div>
            </AnimatedGroup>
          </div>

          {/* Right Column: Hero Match Card & Interactive Preview */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, y: 25, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="relative"
            >
              {/* Background Stacked Card Accents */}
              <div className="absolute -top-3 -right-3 inset-0 bg-slate-200/70 rounded-2xl -z-10 transform rotate-1" />
              <div className="absolute -top-6 -right-6 inset-0 bg-slate-300/40 rounded-2xl -z-20 transform rotate-2" />

              {/* Main Top Match Card */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/90 shadow-xl shadow-slate-900/5 relative z-10 backdrop-blur-sm">
                
                {/* Card Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span>Top Match for You</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>

                {/* Scheme Title & Ministry */}
                <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                  NSP Post–Matric Scholarship
                </h3>
                <p className="text-xs font-medium text-slate-500 mb-5">
                  National Scholarship Portal · Ministry of Education
                </p>

                {/* Amount */}
                <div className="mb-5">
                  <div className="text-3xl font-extrabold text-orange-600 tracking-tight">
                    ₹25,000{" "}
                    <span className="text-sm font-normal text-slate-500">/ year</span>
                  </div>
                </div>

                {/* Match Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between items-center text-xs font-bold mb-2">
                    <span className="text-slate-600">Eligibility Match</span>
                    <span className="text-emerald-600">92%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                </div>

                {/* Filter / Criteria Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                    OBC / SC / ST
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Income &lt; ₹2.5L
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Class 11 – PhD
                  </span>
                </div>

                {/* Apply Button */}
                <button className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer">
                  <span>Apply on scholarships.gov.in</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Floating Status Card */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="absolute -bottom-5 -left-5 bg-white/95 border border-slate-200 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2.5 z-20 backdrop-blur-md"
              >
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">100% Direct Govt. Transfer</div>
                  <div className="text-[11px] text-slate-500">DBT Enabled on Aadhaar</div>
                </div>
              </motion.div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
