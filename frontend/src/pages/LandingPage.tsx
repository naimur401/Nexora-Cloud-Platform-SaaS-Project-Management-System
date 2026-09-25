
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [counts, setCounts] = useState({ teams: 0, tasks: 0, uptime: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animated counters
  useEffect(() => {
    const targets = { teams: 10000, tasks: 50000000, uptime: 99.9 };
    const duration = 2000;
    const step = 30;
    const steps = duration / step;

    let current = 0;
    const interval = setInterval(() => {
      current++;
      const progress = current / steps;
      setCounts({
        teams: Math.floor(targets.teams * progress),
        tasks: Math.floor(targets.tasks * progress),
        uptime: Math.floor(targets.uptime * progress * 10) / 10
      });
      if (current >= steps) {
        clearInterval(interval);
        setCounts({ teams: targets.teams, tasks: targets.tasks, uptime: targets.uptime });
      }
    }, step);

    return () => clearInterval(interval);
  }, []);

  const faqs = [
    { q: 'Is Nexora Cloud compliant with Saudi regulations?', a: 'Yes! Nexora Cloud is fully compliant with Saudi data protection laws and follows NCA (National Cybersecurity Authority) guidelines. We support Arabic language (RTL) and are designed to meet Vision 2030 digital transformation goals.' },
    { q: 'هل يدعم النظام اللغة العربية؟', a: 'نعم، منصة نيكسورا كلاود تدعم اللغة العربية بالكامل مع دعم RTL. جميع الواجهات والتقارير متاحة بالعربية والإنجليزية.' },
    { q: 'Can I integrate with existing tools?', a: 'Yes! We provide REST API, API keys, and pre-built integrations with popular tools like Slack, Google Workspace, Microsoft Teams, and more.' },
    { q: 'How secure is my data?', a: 'We use enterprise-grade security with JWT authentication, refresh tokens, audit trails, and encrypted data storage. Your data is isolated per company (multi-tenant architecture).' },
    { q: 'Do you offer custom pricing for enterprises?', a: 'Absolutely! We offer custom Enterprise plans with dedicated support, SSO integration, on-premise options, and custom features tailored to your business needs.' }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* ============ NAVBAR ============ */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">N</span>
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Nexora</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition font-medium">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-purple-600 transition font-medium">Pricing</a>
            <a href="#testimonials" className="text-gray-700 hover:text-purple-600 transition font-medium">Customers</a>
            <a href="#faq" className="text-gray-700 hover:text-purple-600 transition font-medium">FAQ</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="px-5 py-2 text-purple-600 border-2 border-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition font-medium">
              Login
            </Link>
            <Link to="/register" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition font-medium">
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO SECTION ============ */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50">
        {/* Animated background blobs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 -right-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Arabic Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-purple-200 rounded-full text-sm font-semibold mb-6 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-purple-600">🔥 SaaS Platform for Saudi Enterprises</span>
              <span className="text-gray-400">|</span>
              <span className="text-purple-600" dir="rtl">منصة سعودية</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Manage Teams,{' '}
              <span className="bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                Scale Business
              </span>
              <br />
              <span className="text-gray-800">Like Never Before</span>
            </h1>

            <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
              The all-in-one multi-tenant SaaS platform combining <strong>Jira + Notion + Admin System</strong>.
              Built for modern teams across the Middle East.
            </p>

            <p className="text-lg text-gray-500 mb-10 max-w-3xl mx-auto" dir="rtl">
              منصة متكاملة لإدارة المشاريع والفرق، مصممة خصيصًا للشركات السعودية والخليجية
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link to="/register" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-lg font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                🚀 Start Free Trial
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl text-lg font-semibold hover:border-purple-600 hover:text-purple-600 transition flex items-center justify-center gap-2">
                📹 Watch Demo
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">✅ No credit card required</span>
              <span className="flex items-center gap-1">✅ 14-day free trial</span>
              <span className="flex items-center gap-1">✅ Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST BADGES ============ */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-gray-500 mb-8 font-medium">TRUSTED BY LEADING SAUDI ENTERPRISES</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            {['Aramco', 'STC', 'SABIC', 'Mobily', 'Elm', 'NEOM'].map((company) => (
              <div key={company} className="text-2xl font-bold text-gray-400 hover:text-purple-600 transition cursor-pointer">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ STATS SECTION ============ */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{counts.teams.toLocaleString()}+</div>
              <div className="text-purple-100">Active Teams</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{counts.uptime}%</div>
              <div className="text-purple-100">Uptime SLA</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">{(counts.tasks / 1000000).toFixed(0)}M+</div>
              <div className="text-purple-100">Tasks Completed</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-purple-100">Support (AR/EN)</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES SECTION ============ */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              FEATURES
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              Everything You Need to Scale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade features designed for modern teams
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🏢', title: 'Multi-Tenant Architecture', desc: 'Complete company isolation with role-based access control (RBAC) for enterprise-level security.', color: 'from-purple-500 to-purple-600' },
              { icon: '📊', title: 'Advanced Analytics', desc: 'Real-time insights, task completion rates, team performance metrics, and interactive dashboards.', color: 'from-blue-500 to-blue-600' },
              { icon: '🔔', title: 'Real-time Notifications', desc: 'Instant updates on task assignments, deadline alerts, status changes, and team activities.', color: 'from-green-500 to-green-600' },
              { icon: '🔐', title: 'Enterprise Security', desc: 'JWT authentication, refresh tokens, audit trail, API keys, and role-based permissions.', color: 'from-red-500 to-red-600' },
              { icon: '✅', title: 'Kanban Board', desc: 'Drag-and-drop task management with priorities, deadlines, comments, and file attachments.', color: 'from-orange-500 to-orange-600' },
              { icon: '💳', title: 'Subscription Management', desc: 'Flexible pricing plans (Free, Pro, Enterprise), billing history, and company-wise subscriptions.', color: 'from-pink-500 to-pink-600' }
            ].map((feature, i) => (
              <div key={i} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-2xl mb-6 shadow-md group-hover:scale-110 transition`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            {[
              { icon: '👥', label: 'Team Invitations' },
              { icon: '📎', label: 'File Attachments' },
              { icon: '💬', label: 'Task Comments' },
              { icon: '🔍', label: 'Search & Filter' },
              { icon: '🌍', label: 'Arabic (RTL) Support' },
              { icon: '📈', label: 'Project Tracking' },
              { icon: '🎯', label: 'Priority System' },
              { icon: '🔗', label: 'REST API' }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 hover:border-purple-300 transition">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING SECTION ============ */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              PRICING
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your team size</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-gray-500 text-sm mb-4">Perfect for small teams</p>
              <div className="text-4xl font-bold mb-6">
                $0<span className="text-lg text-gray-500">/mo</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">0 ريال سعودي</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Up to 5 users</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> 3 projects</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Basic analytics</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Email support</li>
              </ul>
              <Link to="/register" className="block w-full py-3 text-center border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition font-semibold">
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan - Highlighted */}
            <div className="border-2 border-purple-600 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-blue-50 relative shadow-2xl transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                ⭐ MOST POPULAR
              </div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <p className="text-gray-500 text-sm mb-4">Best for growing teams</p>
              <div className="text-4xl font-bold mb-6">
                $29<span className="text-lg text-gray-500">/mo</span>
              </div>
              <div className="text-sm text-gray-400 mb-6">109 ريال سعودي</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Up to 50 users</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Unlimited projects</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Advanced analytics</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Priority support</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> API access</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> File attachments</li>
              </ul>
              <Link to="/register" className="block w-full py-3 text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-xl transition font-semibold">
                Start Free Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-300 transition-all duration-300 hover:shadow-xl">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <p className="text-gray-500 text-sm mb-4">For large organizations</p>
              <div className="text-4xl font-bold mb-6">Custom</div>
              <div className="text-sm text-gray-400 mb-6">حسب الطلب</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Unlimited users</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Custom features</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> Dedicated support</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> SSO integration</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> On-premise option</li>
                <li className="flex items-center gap-2 text-gray-700"><span className="text-green-500">✓</span> SLA guarantee</li>
              </ul>
              <button className="block w-full py-3 text-center border-2 border-purple-600 text-purple-600 rounded-xl hover:bg-purple-600 hover:text-white transition font-semibold">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TESTIMONIALS SECTION ============ */}
      <section id="testimonials" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              TESTIMONIALS
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Loved by Teams Everywhere</h2>
            <p className="text-xl text-gray-600">See what our customers say</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Ahmed Al-Rashid', role: 'CTO, TechSolutions KSA', text: 'The best project management platform we\'ve used. Multi-tenant architecture is perfect for our multi-company setup.', avatar: 'A', color: 'from-purple-500 to-purple-600' },
              { name: 'Fatima Al-Zahrani', role: 'PM, Digital Marketing Pro', text: 'Excellent Arabic support and the Kanban board is incredible. Our team productivity increased by 40%.', avatar: 'F', color: 'from-blue-500 to-blue-600' },
              { name: 'Mohammed Al-Qahtani', role: 'CEO, Saudi Enterprise Co', text: 'Perfect for Vision 2030 digital transformation. The audit trail and security features are top-notch.', avatar: 'M', color: 'from-green-500 to-green-600' }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-1 text-yellow-400 mb-4">
                  {'★★★★★'.split('').map((star, j) => <span key={j}>{star}</span>)}
                </div>
                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECURITY SECTION ============ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3 text-gray-800">Enterprise-Grade Security & Compliance</h2>
            <p className="text-gray-600">Built with security-first architecture</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🔒', label: 'ISO 27001 Ready' },
              { icon: '🛡️', label: 'SOC 2 Compliant' },
              { icon: '🇸🇦', label: 'NCA Guidelines' },
              { icon: '🔐', label: 'GDPR Ready' }
            ].map((item, i) => (
              <div key={i} className="text-center p-6 bg-gray-50 rounded-xl hover:bg-purple-50 transition">
                <div className="text-4xl mb-3">{item.icon}</div>
                <div className="font-semibold text-gray-700">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ SECTION ============ */}
      <section id="faq" className="py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
              FAQ
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">Everything you need to know</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <span className="font-semibold text-gray-800 text-lg">{faq.q}</span>
                  <span className={`text-2xl text-purple-600 transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA SECTION ============ */}
      <section className="py-24 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center text-white relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl mb-4 opacity-90">
            Join thousands of teams already using Nexora Cloud Platform
          </p>
          <p className="text-lg mb-10 opacity-80" dir="rtl">
            انضم إلى آلاف الفرق التي تستخدم منصة نيكسورا كلاود
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-semibold hover:shadow-2xl transition transform hover:scale-105">
              🚀 Start Your 14-Day Free Trial
            </Link>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl text-lg font-semibold hover:bg-white/10 transition">
              📞 Schedule a Demo
            </button>
          </div>

          <p className="text-sm mt-6 opacity-75">No credit card required • Cancel anytime</p>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold">N</span>
                <span className="text-2xl font-bold">Nexora Cloud</span>
              </div>
              <p className="text-gray-400 mb-4">
                Multi-tenant SaaS platform for modern teams in the Middle East. Built for Vision 2030.
              </p>
              <p className="text-gray-400 text-sm" dir="rtl">
                منصة سحابية متعددة المستأجرين للفرق الحديثة في الشرق الأوسط
              </p>
              <div className="flex gap-3 mt-6">
                {['🐦', '💼', '📧', '📱'].map((icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-purple-600 transition">
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-purple-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-purple-400 transition">Pricing</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">API Docs</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition">About</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Careers</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Blog</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-purple-400 transition">Privacy</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Terms</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Security</a></li>
                <li><a href="#" className="hover:text-purple-400 transition">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2026 Nexora Cloud Platform. All rights reserved.
              </p>
              <p className="text-gray-400 text-sm">
                Made with ❤️ for Saudi Enterprises | صُنع في السعودية
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
