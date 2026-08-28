const stats = [
  { label: "LaTeX Packages", value: "1000+" },
  { label: "Compile Speed", value: "<2s" },
  { label: "Cloud Autosave", value: "24/7" },
];

const features = [
  {
    title: "Instant Compilation",
    desc: "Compile complex TeX documents directly in your browser with live error diagnostics and crisp PDF output, no setup required.",
  },
  {
    title: "Cloud Syncing",
    desc: "Every edit is auto-saved to the cloud, so your documents stay safe and accessible from any device, any time.",
  },
  {
    title: "Publication-Ready Output",
    desc: "From research papers to theses, get clean publication-ready PDFs every time with a real-time preview built in.",
  },
  {
    title: "Built for Academics",
    desc: "Organize your .tex files, bibliographies, and assets in structured workspaces designed for researchers and students.",
  },
];

export default function QuerySection() {
  return (
    <section className="w-full   my-30">
      <div className="w-6xl mx-auto">
       
        <div className="mb-12">
          <h2 className="text-4xl sm:text-5xl lg:text-[40px] font-semibold text-white">
            Why Choose Inking for LaTeX
          </h2>
        </div>

      
        <div className="flex flex-col lg:flex-row gap-20">
         
          <div className="w-full lg:w-[50%] flex flex-col divide-y divide-white/10">
            {features.map((f, i) => (
              <div key={i} className="py-5 flex gap-4 items-start">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                <div>
                  <p className="text-[22px] font-medium text-white">
                    {f.title}
                  </p>
                  <p className="text-[14px] text-white/40 mt-1 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          
          <div className="flex flex-col gap-2 w-[50%] mt-40">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#101010]  px-5 py-4.5"
              >
                <p className="text-[14px] text-[#fbfbfb] mb-2">{stat.label}</p>
                <p className="text-[24px]  text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}