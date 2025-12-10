import React from 'react';
import { Trophy, Star, Clock, Users, Target, Shield, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from './Navbar';

export const Home = () => {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Trophy className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back, {user.username}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Ready to make some predictions?
          </p>
          <Link
            to="/dashboard"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Trophy className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Match Prediction System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Test your football knowledge and compete with friends in our exciting prediction tournament!
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            to="/login"
            className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-lg border-2 border-blue-600"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* Quick Start Steps */}
      <div className="bg-blue-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 text-center">
          Quick Start Guide
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: Users, step: 1, title: "Register", desc: "Create your account" },
            { icon: Shield, step: 2, title: "Get Approved", desc: "Admin confirms payment" },
            { icon: Target, step: 3, title: "Predict", desc: "Make match predictions" },
            { icon: Trophy, step: 4, title: "Win Points", desc: "Climb the leaderboard" }
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-blue-600 text-white rounded-full p-3">
                  <item.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2">
                {item.step}
              </div>
              <h3 className="font-semibold text-blue-900">{item.title}</h3>
              <p className="text-sm text-blue-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-blue-600" />
            Rules & Guidelines
          </h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">Registration</h3>
              <p className="text-gray-600">Create account with email and password. Admin approval required after payment confirmation.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">Prediction Deadline</h3>
              <p className="text-gray-600">Predictions must be made at least 5 minutes before match starts. Late predictions are not accepted.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">One Prediction Per Match</h3>
              <p className="text-gray-600">Each user can make only one prediction per match. Edit allowed until deadline.</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900">Fair Play</h3>
              <p className="text-gray-600">Multiple accounts or suspicious activity will result in disqualification.</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Star className="h-6 w-6 mr-2 text-yellow-500" />
            Scoring System
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <div>
                <h3 className="font-semibold text-green-900">Exact Score</h3>
                <p className="text-sm text-green-700">Perfect prediction</p>
              </div>
              <div className="text-2xl font-bold text-green-600">7 pts</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div>
                <h3 className="font-semibold text-blue-900">One Score Correct</h3>
                <p className="text-sm text-blue-700">Team A or B score exact</p>
              </div>
              <div className="text-2xl font-bold text-blue-600">5 pts</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <div>
                <h3 className="font-semibold text-yellow-900">Correct Winner</h3>
                <p className="text-sm text-yellow-700">Right team wins</p>
              </div>
              <div className="text-2xl font-bold text-yellow-600">2 pts</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <h3 className="font-semibold text-gray-900">Wrong Prediction</h3>
                <p className="text-sm text-gray-700">No match</p>
              </div>
              <div className="text-2xl font-bold text-gray-600">0 pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Star Feature */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center flex items-center justify-center">
          <Star className="h-6 w-6 mr-2 text-yellow-500" />
          Two-Star Power-Up Feature
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-yellow-500 text-white rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Double Points</h3>
            <p className="text-gray-600">Use Two-Star to double your prediction points (14, 10, or 4 points)</p>
          </div>
          <div className="text-center">
            <div className="bg-orange-500 text-white rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Limited Use</h3>
            <p className="text-gray-600">Only 3 Two-Star predictions allowed per tournament. Use wisely!</p>
          </div>
          <div className="text-center">
            <div className="bg-red-500 text-white rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-3">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Strategic Choice</h3>
            <p className="text-gray-600">Save for important matches or confident predictions</p>
          </div>
        </div>
      </div>

      {/* How to Play Steps */}
      <div className="bg-white shadow rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          How to Play - Step by Step
        </h2>
        <div className="space-y-6">
          {[
            {
              title: "Step 1: Create Account",
              description: "Sign up with your email and create a secure password.",
              details: ["Valid email required", "Password minimum 8 characters", "Username must be unique"]
            },
            {
              title: "Step 2: Payment & Approval",
              description: "Complete payment and wait for admin approval.",
              details: ["Payment confirmation required", "Admin verifies payment", "Account activated within 24 hours"]
            },
            {
              title: "Step 3: Browse Matches",
              description: "View upcoming matches and tournaments.",
              details: ["Filter by status", "View match details", "Check start times"]
            },
            {
              title: "Step 4: Make Predictions",
              description: "Predict scores before match deadline.",
              details: ["Enter exact scores", "Choose Two-Star if confident", "Submit before deadline"]
            },
            {
              title: "Step 5: Track Results",
              description: "Watch matches and check your points.",
              details: ["Live score updates", "Automatic point calculation", "Leaderboard ranking"]
            },
            {
              title: "Step 6: Win Prizes",
              description: "Climb leaderboard and win rewards.",
              details: ["Top 10 win prizes", "Bonus for perfect predictions", "Tournament champions"]
            }
          ].map((step, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 mb-2">{step.description}</p>
                <ul className="text-sm text-gray-500 space-y-1">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Important Notes */}
      <div className="mt-12 bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Important Notes
        </h3>
        <ul className="space-y-2 text-red-700">
          <li>• Predictions lock 5 minutes before match start - no exceptions</li>
          <li>• Two-Star power-ups cannot be undone once used</li>
          <li>• Admin decisions are final in case of disputes</li>
          <li>• Multiple accounts will result in permanent disqualification</li>
          <li>• Prize distribution within 7 days of tournament end</li>
        </ul>
      </div>

      {/* Final CTA Section */}
      <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Predicting?</h2>
        <p className="text-xl mb-8 opacity-90">Join thousands of football fans and test your prediction skills!</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-blue-50 transition-all transform hover:scale-105 shadow-xl"
          >
            Get Started Now
          </Link>
          <Link
            to="/login"
            className="bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-800 transition-all transform hover:scale-105 shadow-xl border-2 border-white/20"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
    </>
  );
};
