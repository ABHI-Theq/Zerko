"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowLeft, Github, Linkedin, Mail, Code2, Sparkles, Target, Users, Zap, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-all duration-200 hover:gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back</span>
            </button>
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Zerko Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Zerko</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 md:py-20">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200 mb-6">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">About Zerko</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolutionizing Interview{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Preparation
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Zerko is an AI-powered interview platform designed to help job seekers practice, improve, and ace their interviews with confidence.
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-12 mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              We believe that everyone deserves a fair chance to showcase their skills and land their dream job. Traditional interview preparation is often expensive, time-consuming, and inaccessible to many. Zerko democratizes interview preparation by providing:
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">AI-Powered Practice</h3>
                  <p className="text-gray-600">Practice with advanced voice AI that simulates real interview scenarios</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Accessible to All</h3>
                  <p className="text-gray-600">Free platform available 24/7 for anyone, anywhere</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Instant Feedback</h3>
                  <p className="text-gray-600">Get detailed analysis and actionable insights immediately</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Continuous Improvement</h3>
                  <p className="text-gray-600">Track your progress and improve with every practice session</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Technology Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-xl p-8 md:p-12 mb-12 text-white"
          >
            <h2 className="text-3xl font-bold mb-6">Powered by Cutting-Edge Technology</h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              Zerko leverages the latest advancements in artificial intelligence and web technologies to deliver a seamless, intelligent interview experience.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="font-bold text-xl mb-3">Google Gemini 2.5 Pro</h3>
                <p className="text-gray-300">Advanced AI for intelligent question generation and feedback analysis</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="font-bold text-xl mb-3">Next.js 15 & React 19</h3>
                <p className="text-gray-300">Modern, fast, and responsive user interface with server-side rendering</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="font-bold text-xl mb-3">Voice Recognition</h3>
                <p className="text-gray-300">Real-time speech-to-text with cross-browser compatibility</p>
              </div>
            </div>
          </motion.div>

          {/* Developer Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-xl border border-gray-200 p-8 md:p-12 mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Meet the Developer</h2>
              <p className="text-gray-600 text-lg">Built with passion and dedication</p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
                <div className="flex-shrink-0">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <span className="text-5xl font-bold text-white">AS</span>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Abhishek Sharma</h3>
                  <p className="text-lg text-gray-700 mb-4">BTech Engineer</p>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    A passionate software engineer dedicated to building innovative solutions that make a real difference. 
                    Zerko was created to help job seekers worldwide prepare for interviews with confidence and succeed in their career goals.
                  </p>
                  
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <Link 
                      href="https://github.com/ABHI-Theq" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-all duration-200 hover:shadow-lg group"
                    >
                      <Github className="w-5 h-5" />
                      <span className="font-medium">GitHub</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    
                    <Link 
                      href="https://www.linkedin.com/in/abhishek-sharma-one" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg group"
                    >
                      <Linkedin className="w-5 h-5" />
                      <span className="font-medium">LinkedIn</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                    
                    <a 
                      href="mailto:abhi03085e@gmail.com"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
          >
            {[
              { value: "10K+", label: "Active Users" },
              { value: "50K+", label: "Interviews" },
              { value: "95%", label: "Success Rate" },
              { value: "4.9/5", label: "Rating" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of successful candidates who have improved their interview skills with Zerko
            </p>
            <Link href="/auth/sign-up">
              <Button className="bg-white text-gray-900 hover:bg-gray-100 px-8 h-14 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started for Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white/50 backdrop-blur-sm border-t border-gray-200">
        <div className="container mx-auto px-6 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Zerko. Built with ❤️ by Abhishek Sharma</p>
        </div>
      </footer>
    </div>
  );
}
