export default function HomePage() {
  return (
    <div className="w-full">
      <section className="relative w-full h-[450px] md:h-[550px] overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1920"
          alt="Proxima Lab Equipment"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60 mix-blend-luminosity"
        />

        <div className="absolute inset-0 max-w-7xl mx-auto px-4 flex items-center justify-start">
          <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-xl max-w-2xl border border-white/40 shadow-xl mt-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-text-main mb-4 leading-tight">
              Highest Quality Accessories & Equipment for Laboratories
            </h1>
            <p className="text-base md:text-lg text-text-main/80 mb-6 font-medium">
              We offer both essential hobbyist tools and advanced, certified
              professional equipment tailored to your needs.
            </p>
            <button className="bg-accent hover:bg-accent/90 text-white font-bold px-6 py-3 rounded-lg text-sm uppercase tracking-wider transition-colors shadow-md">
              Learn More
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center md:text-left">
        <h2 className="text-2xl md:text-3xl font-bold text-text-main mb-6">
          Connecting Pioneer Manufacturers in One Place
        </h2>
        <div className="space-y-4 text-base text-text-main/80 leading-relaxed">
          <p>
            At <strong className="text-primary font-semibold">Proxima</strong>,
            we are not just a single manufacturer. We act as a powerful bridge
            connecting multiple pioneering producers from around the world into
            one cohesive ecosystem.
          </p>
          <p>
            Our mission is to simplify your procurement process. Instead of
            browsing dozens of separate websites, you can effortlessly{" "}
            <span className="text-primary font-semibold">
              compare offers, find the perfect apparatus, and combine equipment
              from various brands into a single, seamless order
            </span>
            . We save your time, reduce shipping complexities, and optimize your
            budget.
          </p>
        </div>
      </section>

      <hr className="max-w-7xl mx-auto border-border-base/20" />

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-bg-surface border border-border-base/30 rounded-2xl p-8 md:p-12 shadow-sm grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xl md:text-2xl font-bold text-text-main">
              Professional & Hobbyist Equipment Access
            </h3>
            <p className="text-sm md:text-base text-text-main/80 leading-relaxed">
              While our hobbyist selection is readily available, our high-tier,
              specialized professional equipment requires a strict verification
              process to ensure safety and regulatory compliance.
            </p>
            <p className="text-sm md:text-base text-text-main/80 leading-relaxed">
              To gain full access to professional catalogs, please contact our
              team and submit the necessary official permits. Once reviewed,
              your account will receive formal approval.
            </p>
            <div className="bg-bg-base border-l-4 border-primary p-4 rounded-r-md text-xs md:text-sm text-text-main/90 italic">
              <strong>Corporate Buyers:</strong> If you are part of an
              registered organization, you can easily request to link your
              personal user profile to your company account via a simple
              connection form in your dashboard.
            </div>
          </div>

          <div className="bg-bg-base p-6 rounded-xl border border-border-base/40 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl mb-4">
              🔒
            </div>
            <h4 className="font-bold text-text-main mb-2">Need Pro Access?</h4>
            <p className="text-xs text-text-muted mb-4">
              Get in touch with our verification team to unlock advanced
              machinery and chemical reagents.
            </p>
            <button className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2.5 px-4 rounded-md transition-colors shadow-sm">
              Contact Verification Team
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
