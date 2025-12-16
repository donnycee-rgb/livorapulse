import { Activity, ArrowRight, BarChart3, Heart, Leaf, MonitorSmartphone, Smile, Timer, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/landingbackground.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Understand your health.<br />
              <span className="text-lp-accent">Improve your life.</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Real-time insights that help you track, analyze, and improve your daily well-being.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-lp-accent text-black font-semibold rounded-full hover:bg-lp-accent/90 transition-colors"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 border border-gray-600 text-gray-300 font-semibold rounded-full hover:bg-gray-800 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">The Problem</h2>
              <p className="text-lg text-gray-300 mb-6">
                Many people struggle to understand how their daily habits affect their health and well-being. Scattered data from apps and devices makes it hard to see the bigger picture.
              </p>
              <p className="text-lg text-gray-300">
                Without clear insights, it's difficult to make meaningful changes that lead to better health outcomes.
              </p>
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-lp-accent">Our Solution</h2>
              <p className="text-lg text-gray-300 mb-6">
                LivoraPulse brings all your health data together in one place, providing real-time analysis and actionable insights.
              </p>
              <p className="text-lg text-gray-300">
                See how your physical activity, digital habits, productivity, environment, and mood interconnect to give you a complete view of your well-being.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features / Benefits Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Key Benefits</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Simple tools that deliver real results for your health and lifestyle.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <Activity className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Track Physical Health</h3>
              <p className="text-gray-300">Monitor steps, distance, and calories to stay active and energized.</p>
            </div>
            <div className="text-center">
              <MonitorSmartphone className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Manage Digital Habits</h3>
              <p className="text-gray-300">Understand screen time and app usage to create healthier digital routines.</p>
            </div>
            <div className="text-center">
              <Timer className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Boost Productivity</h3>
              <p className="text-gray-300">Track focus sessions and study time to improve your efficiency.</p>
            </div>
            <div className="text-center">
              <Leaf className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Support the Environment</h3>
              <p className="text-gray-300">Log eco-friendly actions and track your positive impact.</p>
            </div>
            <div className="text-center">
              <Smile className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Monitor Mood & Stress</h3>
              <p className="text-gray-300">Track emotional well-being to maintain balance and reduce stress.</p>
            </div>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Get Actionable Insights</h3>
              <p className="text-gray-300">Receive personalized recommendations based on your data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">Three simple steps to better health insights.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-lp-accent text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Connect & Start</h3>
              <p className="text-gray-300">Link your devices and apps to begin tracking your data automatically.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-lp-accent text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Monitor & Analyze</h3>
              <p className="text-gray-300">View real-time dashboards and charts that show your health patterns.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-lp-accent text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Improve & Optimize</h3>
              <p className="text-gray-300">Use insights to make small changes that lead to big improvements.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credibility */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-8">Built for Trust & Performance</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <TrendingUp className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Modern Technology</h3>
              <p className="text-gray-300">Powered by React and Vite for fast, reliable performance.</p>
            </div>
            <div>
              <Heart className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
              <p className="text-gray-300">Your data stays secure and is never shared without permission.</p>
            </div>
            <div>
              <BarChart3 className="w-12 h-12 text-lp-accent mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Data-Driven</h3>
              <p className="text-gray-300">Insights based on real data, not guesswork.</p>
            </div>
          </div>
          <p className="text-gray-400 mt-12">Early-stage product – growing fast with user feedback.</p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-lp-accent to-lp-secondary text-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Take Control of Your Health?</h2>
          <p className="text-xl mb-8">Start tracking today and see the difference real insights can make.</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-8 py-4 bg-black text-white font-semibold rounded-full hover:bg-gray-800 transition-colors"
          >
            View Dashboard
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
