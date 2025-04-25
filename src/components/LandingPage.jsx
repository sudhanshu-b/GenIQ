// src/components/LandingPage.jsx
import React from "react";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";

const LandingPage = () => {
  const placeholders = [
    "Create a quiz about JavaScript fundamentals...",
    "Generate a history quiz on Ancient Egypt...",
    "Make a science quiz about the solar system...",
    "Build a quiz on machine learning concepts...",
    "Design a quiz about world geography...",
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Generating quiz with input:", e.target[0].value);
    // Here you would typically call your quiz generation API
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-4">
            GenIQ
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-2">
            AI-Powered Quiz Generator
          </p>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Create engaging quizzes instantly based on your topics. Perfect for educators, students, and curious minds.
          </p>
        </div>

        <div className="w-full max-w-2xl mx-auto mb-12">
          <PlaceholdersAndVanishInput 
            placeholders={placeholders} 
            onSubmit={handleSubmit}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 dark:text-indigo-400 text-xl mb-2">Fast Generation</div>
            <p className="text-gray-600 dark:text-gray-400">Create comprehensive quizzes in seconds with our AI technology.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 dark:text-indigo-400 text-xl mb-2">Customizable</div>
            <p className="text-gray-600 dark:text-gray-400">Tailor difficulty levels, question types, and topics to your needs.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="text-indigo-600 dark:text-indigo-400 text-xl mb-2">Share Easily</div>
            <p className="text-gray-600 dark:text-gray-400">Export quizzes or share links directly with students or friends.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
