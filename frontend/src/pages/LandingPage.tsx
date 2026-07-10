import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur shadow-md py-3" : "bg-transparent py-5"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Nexora Cloud
            </span>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-purple-600 transition text-sm font-medium">Features</a>
            <a href="#pricing" className="text-gray-600 hover:text-purple-600 transition text-sm font-medium">Pricing</a>
            <a href="#about" className="text-gray-600 hover:text-purple-600 transition text-sm font-medium">About</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/login")} className="px-4 py-2 text-purple-600 font-medium text-sm hover:text-purple-700 transition">
              Sign In
            </button>
            <button onClick={() => navigate("/register")} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition shadow-sm">
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto px-6 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-8 border border-purple-200">
              <span className="w-2 h-2 bg-purple-600 rounded-full animate-pulse"></span>
              Enterprise SaaS Project Management Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Manage Projects
              </span>
              <br />
              <span className="text-gray-900">Like Never Before</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              A multi-tenant SaaS platform combining the best of Jira, Notion, and enterprise admin systems — built for teams that want to scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate("/register")} className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200">
                Start Free Trial →
              </button>
              <button onClick={() => navigate("/login")} className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:border-purple-400 hover:text-purple-600 transition-all duration-200">
                View Demo
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-6">No credit card required · Free 14-day trial · Cancel anytime</p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { value: "10K+", label: "Active Teams" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "50M+", label: "Tasks Completed" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="text-center bg-white/80 backdrop-blur rounded-2xl p-6 shadow-sm border border-white">
                <div className="text-3xl font-extrabold text-purple-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Everything Your Team Needs</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Powerful features built for modern enterprises</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🏢", title: "Multi-Tenant Architecture", desc: "Complete company isolation with role-based access control (RBAC) for enterprise security.", color: "from-purple-500 to-purple-600" },
              { icon: "📊", title: "Advanced Analytics", desc: "Real-time insights, task completion rates, user productivity, and monthly trends.", color: "from-blue-500 to-blue-600" },
              { icon: "🔔", title: "Real-time Notifications", desc: "Instant updates on task assignments, deadline changes, and status updates.", color: "from-indigo-500 to-indigo-600" },
              { icon: "🔐", title: "Enterprise Security", desc: "JWT access tokens, refresh tokens, secure logout, and full audit logging.", color: "from-green-500 to-green-600" },
              { icon: "✅", title: "Kanban Board", desc: "Drag-and-drop task management with priority levels, deadlines, and assignments.", color: "from-orange-500 to-orange-600" },
              { icon: "💬", title: "Team Collaboration", desc: "Task comments, activity logs, team mentions, and seamless communication tools.", color: "from-pink-500 to-pink-600" },
            ].map((f) => (
              <div key={f.title} className="group bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-500">Choose the plan that works for your team</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter", price: "$29", period: "/mo", popular: false,
                features: ["Up to 10 users", "5 projects", "Basic analytics", "Email support", "Kanban board"],
                cta: "Get Started", variant: "outline"
              },
              {
                name: "Professional", price: "$79", period: "/mo", popular: true,
                features: ["Up to 50 users", "Unlimited projects", "Advanced analytics", "Priority support", "API access", "Audit logs"],
                cta: "Start Free Trial", variant: "solid"
              },
              {
                name: "Enterprise", price: "Custom", period: "", popular: false,
                features: ["Unlimited users", "Custom features", "Dedicated support", "SSO integration", "On-premise option", "SLA guarantee"],
                cta: "Contact Sales", variant: "outline"
              },
            ].map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-8 ${plan.popular ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl scale-105" : "bg-white border border-gray-200 text-gray-900"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.popular ? "text-purple-200" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.popular ? "text-purple-100" : "text-gray-600"}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${plan.popular ? "bg-white/20" : "bg-purple-100 text-purple-600"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/register")}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition ${plan.popular ? "bg-white text-purple-600 hover:bg-gray-100" : "border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"}`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-extrabold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl mb-8 text-purple-100 max-w-2xl mx-auto">
            Join thousands of teams using Nexora Cloud to ship faster and collaborate better.
          </p>
          <button onClick={() => navigate("/register")} className="px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-bold hover:bg-gray-100 transition shadow-lg">
            Start Your Free Trial →
          </button>
          <p className="text-sm mt-4 text-purple-200">No credit card required · Setup in 2 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">N</span>
                </div>
                <span className="text-lg font-bold">Nexora Cloud</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Multi-tenant SaaS platform for modern enterprise teams.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "API", "Documentation"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Legal", links: ["Privacy", "Terms", "Security", "Compliance"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-300">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-gray-400 hover:text-white transition text-sm">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2024 Nexora Cloud Platform. All rights reserved.</p>
            <p className="text-gray-500 text-sm">Built for Saudi Enterprises 🇸🇦</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
