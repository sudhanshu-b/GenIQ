// src/components/LandingPage.jsx
import React, { useState } from "react";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";
import QuizDisplay from "../components/QuizDisplay"; // Import the new component
import axios from "axios";

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const placeholders = [
    "Create a quiz about JavaScript fundamentals...",
    "Generate a history quiz on Ancient Egypt...",
    "Make a science quiz about the solar system...",
    "Build a quiz on machine learning concepts...",
    "Design a quiz about world geography...",
  ];

  const handleSubmit = async (input, difficulty = "Medium") => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Format the prompt to specifically request questions with correct answers in a specific format
      const formattedPrompt = `Generate a ${difficulty} difficulty quiz about "${input}". 
      Please provide 10 multiple-choice questions with 4 options each.
      
      Format each question like this:
      **1. Question text here?**
          a) First option
          b) Second option
          c) Third option
          d) Fourth option
          
      After all questions, include an Answer Key section like this:
      **Answer Key:**
      1. a) (correct option letter)
      2. c) (correct option letter)
      (etc.)
      
      Add a brief explanation for each correct answer in the Answer Key section.`;
      
      // Send request to the backend
      const response = await axios.post('http://localhost:3000/api/gemini/generate', {
        prompt: formattedPrompt
      });
      
      // Store the response
      if (response.data && response.data.response) {
        setQuizData(response.data.response);
        setShowQuiz(true);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const input = inputValue.trim();
    const difficultySelect = e.target.elements.difficulty;
    const difficulty = difficultySelect ? difficultySelect.value : "Medium";
    
    if (!input) {
      setError('Please enter a topic for your quiz');
      return;
    }
    
    handleSubmit(input, difficulty);
  };

  const handleFinishQuiz = () => {
    setShowQuiz(false);
    setQuizData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center">
        {!showQuiz ? (
          <>
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

            <div className="w-full max-w-2xl mx-auto mb-6">
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <PlaceholdersAndVanishInput 
                  placeholders={placeholders} 
                  className="w-full"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
                
                <div className="flex justify-center space-x-4">
                  <select 
                    name="difficulty" 
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium" defaultValue>Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                  
                  <button 
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </button>
                </div>
              </form>
              
              {error && (
                <div className="mt-4 text-red-500 dark:text-red-400">
                  {error}
                </div>
              )}
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
                <div className="text-indigo-600 dark:text-indigo-400 text-xl mb-2">Get Scores</div>
                <p className="text-gray-600 dark:text-gray-400">Get instant score and feedback based on your performance.</p>
              </div>
            </div>
          </>
        ) : (
          <QuizDisplay quizContent={quizData} onFinish={handleFinishQuiz} />
        )}
      </div>
    </div>
  );
};

export default LandingPage;