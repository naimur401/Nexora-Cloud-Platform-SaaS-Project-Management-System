import { useState, useEffect } from 'react'

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navClass = 'fixed top-0 w-full z-50 transition-all duration-300 ' + (isScrolled ? 'bg-white shadow-lg py-3' : 'bg-transparent py-5')

  return (
    <div className="min-h-screen bg-white">
      <nav className={navClass}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Nexora Cloud
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-purple-600 transition">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-purple-600 transition">Pricing</a>
            <a href="#about" className="text-gray-700 hover:text-purple-600 transition">About</a>
          </div>
          <div className="space-x-3">
            <a href="/login" className="px-5 py-2 text-purple-600 border-2 border-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition inline-block">
              Login
            </a>
            <a href="/register" className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition inline-block">
              Start Free Trial
            </a>
          </div>
        </div>
      </nav>

      <section className="pt-32 pb-20 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-6">
              🔥 SaaS Project Management Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Manage Projects Like Never Before
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Multi-tenant SaaS platform combining Jira + Notion + Admin System. 
              Perfect for teams who want to scale their operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/register" className="px-8 py-4 bg-purple-600 text-white rounded-xl text-lg font-semibold hover:bg-purple-700 transition transform hover:scale-105 inline-block">
                🚀 Start Free Trial
              </a>
              <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-xl text-lg font-semibold hover:bg-purple-600 hover:text-white transition">
                📹 Watch Demo
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-6">
              No credit card required • Free 14-day trial
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl font-bold text-purple-600">10K+</div><div className="text-gray-600 mt-2">Active Teams</div></div>
            <div><div className="text-4xl font-bold text-purple-600">99.9%</div><div className="text-gray-600 mt-2">Uptime</div></div>
            <div><div className="text-4xl font-bold text-purple-600">50M+</div><div className="text-gray-600 mt-2">Tasks Completed</div></div>
            <div><div className="text-4xl font-bold text-purple-600">24/7</div><div className="text-gray-600 mt-2">Support</div></div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need in One Platform</h2>
            <p className="text-xl text-gray-600">Powerful features for modern teams</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-3">Multi-Tenant Architecture</h3>
              <p className="text-gray-600">Complete company isolation with role-based access control (RBAC)</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-3">Advanced Analytics</h3>
              <p className="text-gray-600">Real-time insights, task completion rates, and team performance</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-bold mb-3">Real-time Notifications</h3>
              <p className="text-gray-600">Instant updates on task assignments, deadlines, and status changes</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-xl font-bold mb-3">Enterprise Security</h3>
              <p className="text-gray-600">JWT authentication, refresh tokens, and audit logging system</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-3">Kanban Board</h3>
              <p className="text-gray-600">Drag-and-drop task management with priority and deadlines</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-bold mb-3">Team Collaboration</h3>
              <p className="text-gray-600">Task comments, activity logs, and seamless communication</p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-600">Choose the plan that works for you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition">
              <h3 className="text-2xl font-bold mb-2">Starter</h3>
              <div className="text-4xl font-bold mb-4"><span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li>✓ Up to 10 users</li>
                <li>✓ 5 projects</li>
                <li>✓ Basic analytics</li>
                <li>✓ Email support</li>
              </ul>
              <button className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition">Get Started</button>
            </div>
            <div className="border-2 border-purple-600 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-blue-50 relative">
              <div className="absolute top-0 right-0 bg-purple-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm">POPULAR</div>
              <h3 className="text-2xl font-bold mb-2">Professional</h3>
              <div className="text-4xl font-bold mb-4"><span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li>✓ Up to 50 users</li>
                <li>✓ Unlimited projects</li>
                <li>✓ Advanced analytics</li>
                <li>✓ Priority support</li>
                <li>✓ API access</li>
              </ul>
              <button className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">Get Started</button>
            </div>
            <div className="border-2 border-gray-200 rounded-2xl p-8 hover:border-purple-600 transition">
              <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
              <div className="text-4xl font-bold mb-4">Custom</div>
              <ul className="space-y-3 mb-8">
                <li>✓ Unlimited users</li>
                <li>✓ Custom features</li>
                <li>✓ Dedicated support</li>
                <li>✓ SSO integration</li>
                <li>✓ On-premise option</li>
              </ul>
              <button className="w-full py-3 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Workflow?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of teams using Nexora Cloud Platform</p>
          <a href="/register" className="px-8 py-4 bg-white text-purple-600 rounded-xl text-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105 inline-block">
            Start Your 14-Day Free Trial
          </a>
          <p className="text-sm mt-4 opacity-75">No credit card required</p>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div><h3 className="text-2xl font-bold mb-4">Nexora Cloud</h3><p className="text-gray-400">Multi-tenant SaaS platform for modern teams</p></div>
            <div><h4 className="font-semibold mb-4">Product</h4><ul className="space-y-2 text-gray-400"><li>Features</li><li>Pricing</li><li>API</li><li>Documentation</li></ul></div>
            <div><h4 className="font-semibold mb-4">Company</h4><ul className="space-y-2 text-gray-400"><li>About</li><li>Blog</li><li>Careers</li><li>Contact</li></ul></div>
            <div><h4 className="font-semibold mb-4">Legal</h4><ul className="space-y-2 text-gray-400"><li>Privacy</li><li>Terms</li><li>Security</li><li>Compliance</li></ul></div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Nexora Cloud Platform. All rights reserved. Built for Saudi Enterprises</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
