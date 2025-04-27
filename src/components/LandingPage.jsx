// src/components/LandingPage.jsx
import React, { useState, useRef } from "react";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";
import QuizDisplay from "../components/QuizDisplay";
import axios from "axios";
import { motion } from "framer-motion";

const LandingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(""); // "generating" or "scanning"
  const [loadingContext, setLoadingContext] = useState(""); // Will hold topic and difficulty
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

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
    
    // Set loading context for the loader screen
    if (selectedFile) {
      setLoadingStage("scanning");
      setLoadingContext(`${selectedFile.name} with ${difficulty} difficulty level`);
      
      // Simulate OCR scanning before actual generation - for better UX
      setTimeout(() => {
        setLoadingStage("generating");
      }, 2000);
    } else {
      setLoadingStage("generating");
      setLoadingContext(`${input} with ${difficulty} difficulty level`);
    }
  
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
  
      // Create FormData if a file is selected
      let data;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        // No need to append prompt when sending a file - backend will generate from OCR results
        // The difficulty can still be used if needed
        formData.append('difficulty', difficulty);
        data = formData;
      } else {
        data = { prompt: formattedPrompt };
      }
  
      // Send request to the backend
      const response = await axios.post('http://localhost:3000/api/gemini/generate', data, {
        headers: selectedFile ? { 'Content-Type': 'multipart/form-data' } : {}
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
      setLoadingStage("");
      setLoadingContext("");
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const input = inputValue.trim();
    const difficultySelect = e.target.elements.difficulty;
    const difficulty = difficultySelect ? difficultySelect.value : "Medium";

    if (!input && !selectedFile) {
      setError('Please enter a topic or upload a file for your quiz');
      return;
    }

    handleSubmit(input || (selectedFile ? `content from ${selectedFile.name}` : ""), difficulty);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    // If user types anything, clear any selected file
    if (value.trim() !== "" && selectedFile) {
      handleFileRemove();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Clear input value when file is selected
      setInputValue("");
      setError(null);
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFinishQuiz = () => {
    setShowQuiz(false);
    setQuizData(null);
  };

  const isInputDisabled = !!selectedFile;
  const isUploadDisabled = inputValue.trim() !== "";
  const isGenerateButtonDisabled = isLoading || (!inputValue.trim() && !selectedFile);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const buttonVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  // Loading screen spinner animation
  const spinTransition = {
    repeat: Infinity,
    ease: "linear",
    duration: 1
  };

  // Render the loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={spinTransition}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
              {loadingStage === "scanning" ? "Scanning Document" : "Generating Quiz"}
            </h2>
            
            <div className="text-gray-700 dark:text-gray-300 mb-4">
              {loadingStage === "scanning" ? (
                <>
                  <p>OCR processing: {loadingContext}</p>
                  <p className="text-sm mt-2">This may take a moment...</p>
                </>
              ) : (
                <>
                  <p>Creating quiz on {loadingContext}</p>
                  <p className="text-sm mt-2">Crafting engaging questions...</p>
                </>
              )}
            </div>
            
            <motion.div
              className="flex space-x-2 justify-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <span className="bg-indigo-200 dark:bg-indigo-900/40 w-2 h-2 rounded-full animate-pulse"></span>
              <span className="bg-indigo-400 dark:bg-indigo-700 w-2 h-2 rounded-full animate-pulse delay-150"></span>
              <span className="bg-indigo-600 dark:bg-indigo-500 w-2 h-2 rounded-full animate-pulse delay-300"></span>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto text-center">
        {!showQuiz ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div className="mb-8" variants={itemVariants}>
              <motion.h1 
                className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 mb-4"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
              >
                GenIQ
              </motion.h1>
              <motion.p 
                className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-2"
                variants={itemVariants}
              >
                AI-Powered Quiz Generator
              </motion.p>
              <motion.p 
                className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                variants={itemVariants}
              >
                Create engaging quizzes instantly based on your topics or uploaded files. Perfect for educators, students, and curious minds.
              </motion.p>
            </motion.div>

            <motion.div 
              className="w-full max-w-2xl mx-auto mb-6"
              variants={itemVariants}
            >
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <motion.div 
                  className="mb-4"
                  variants={itemVariants}
                >
                  <PlaceholdersAndVanishInput
                    placeholders={placeholders}
                    className="w-full"
                    value={inputValue}
                    onChange={handleInputChange}
                    disabled={isInputDisabled}
                  />
                </motion.div>

                <motion.div 
                  className="relative flex items-center py-5"
                  variants={itemVariants}
                >
                  <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                  <span className="flex-shrink mx-4 text-gray-500 dark:text-gray-400">OR</span>
                  <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                </motion.div>

                <motion.div 
                  className="mb-4"
                  variants={itemVariants}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <motion.label 
                          className={`flex items-center justify-center px-4 py-2 ${isUploadDisabled ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900/60'} rounded-md transition-colors`}
                          whileHover={!isUploadDisabled ? { scale: 1.02 } : {}}
                          whileTap={!isUploadDisabled ? { scale: 0.98 } : {}}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0l-4 4m4-4v12" />
                          </svg>
                          Upload Resume
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.png,.jpg,.jpeg"
                            disabled={isUploadDisabled}
                          />
                        </motion.label>

                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          PDF, PNG, JPG (Max : 1MB)
                        </span>
                      </div>

                      {selectedFile && (
                        <motion.div 
                          className="flex items-center justify-between mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex items-center overflow-hidden">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 truncate">
                              {selectedFile.name}
                            </span>
                          </div>
                          <motion.button
                            type="button"
                            onClick={handleFileRemove}
                            className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex justify-center space-x-4 mt-6"
                  variants={itemVariants}
                >
                  <motion.select
                    name="difficulty"
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium" defaultValue>Medium</option>
                    <option value="Hard">Hard</option>
                  </motion.select>

                  <motion.button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md transition-colors duration-200 disabled:opacity-50"
                    disabled={isGenerateButtonDisabled}
                    variants={buttonVariants}
                    initial="idle"
                    whileHover={!isGenerateButtonDisabled ? "hover" : "idle"}
                    whileTap={!isGenerateButtonDisabled ? "tap" : "idle"}
                  >
                    {isLoading ? 'Generating...' : 'Generate Quiz'}
                  </motion.button>
                </motion.div>
              </form>

              {error && (
                <motion.div 
                  className="mt-4 text-red-500 dark:text-red-400"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <QuizDisplay quizContent={quizData} onFinish={handleFinishQuiz} />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;