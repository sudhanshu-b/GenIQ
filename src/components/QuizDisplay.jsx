import React, { useState, useEffect } from 'react';

const QuizDisplay = ({ quizContent, onFinish }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (quizContent) {
      const parsedQuestions = parseQuizContent(quizContent);
      setQuestions(parsedQuestions);
      setIsLoading(false);
    }
  }, [quizContent]);

  // Parse text-based quiz content into structured format
  const parseQuizContent = (content) => {
    // Check if content is already in JSON format
    if (typeof content === 'object' && !Array.isArray(content)) {
      return content.response ? parseTextContent(content.response) : content;
    }

    try {
      // Try parsing as JSON if it's a JSON string
      const jsonContent = JSON.parse(content);
      return jsonContent.response ? parseTextContent(jsonContent.response) : jsonContent;
    } catch (e) {
      // Parse text-based content
      return parseTextContent(content);
    }
  };

  const parseTextContent = (contentStr) => {
    if (!contentStr || typeof contentStr !== 'string') return [];
    
    // Clean the content by removing all duplicate answer key sections
    // Only keep content up to the first occurrence of "Answer Key:"
    const parts = contentStr.split(/\*\*Answer Key:\*\*/);
    if (parts.length <= 1) return []; // No answer key found
    
    const questionsContent = parts[0];
    const answerKeyContent = parts[1];
    
    const parsedQuestions = [];
    
    // Split content by question markers
    const questionBlocks = questionsContent.split(/\*\*\d+\./);
    
    // Skip the first element if it's empty (often the case)
    const startIndex = questionBlocks[0].trim() === '' ? 1 : 0;
    
    for (let i = startIndex; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (block === '') continue;
      
      // Extract question text
      const questionMatch = block.match(/^(.*?)\*\*\s*\n/);
      if (!questionMatch) continue;
      
      const questionText = questionMatch[1].trim();
      
      // Extract options
      const options = [];
      const optionsText = block.substring(questionMatch[0].length);
      
      // Regex to extract options
      const optionRegex = /([a-d]\))(.*?)(?=\s+[a-d]\)|$)/gs;
      let optionMatch;
      
      while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
        const optionLetter = optionMatch[1].charAt(0); // Extract just the letter
        const optionText = optionMatch[2].trim();
        
        // Make sure this isn't part of an answer key that got mixed in
        if (!optionText.includes("*Explanation:") && !optionText.includes("Answer Key:")) {
          options.push({ letter: optionLetter, text: optionText });
        }
      }
      
      parsedQuestions.push({
        id: i.toString(),
        question: questionText,
        options: options,
        correctLetter: null // Will be filled in later
      });
    }
    
    // Extract answer key
    const answerMatches = answerKeyContent.matchAll(/(\d+)\.\s+([a-d])\)(.*?)(?=\n\d+\.|$)/gs);
    
    for (const match of answerMatches) {
      const questionNum = parseInt(match[1]) - 1;
      const correctLetter = match[2];
      
      if (questionNum >= 0 && questionNum < parsedQuestions.length) {
        parsedQuestions[questionNum].correctLetter = correctLetter;
        
        // Find the index of the correct answer
        const correctIndex = parsedQuestions[questionNum].options.findIndex(
          option => option.letter === correctLetter
        );
        
        parsedQuestions[questionNum].correctAnswer = correctIndex;
        
        // Extract explanation
        const explanationText = match[3] || '';
        const explanationMatch = explanationText.match(/\*Explanation:(.*?)(?=\n\d+\.|$)/s);
        
        if (explanationMatch) {
          parsedQuestions[questionNum].explanation = explanationMatch[1].trim();
        }
      }
    }
    
    return parsedQuestions;
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion]: index
    });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((question, index) => {
      if (selectedAnswers[index] === question.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  };

  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestion(0);
    setShowResults(false);
  };

  const handleCreateNewQuiz = () => {
    if (onFinish) onFinish();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-center text-lg text-gray-800 dark:text-gray-200">Unable to parse quiz content. Please try again.</p>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleCreateNewQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            Create New Quiz
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">Quiz Results</h2>
        <div className="text-center mb-6">
          <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
            {score.correct} / {score.total}
          </div>
          <div className="text-xl text-gray-700 dark:text-gray-300">
            {score.percentage}% Correct
          </div>
        </div>

        <div className="space-y-6 mt-8">
          {questions.map((question, index) => {
            const isCorrect = selectedAnswers[index] === question.correctAnswer;
            const selectedOption = question.options?.[selectedAnswers[index]];
            const correctOption = question.options?.[question.correctAnswer];
            
            return (
              <div 
                key={index} 
                className={`p-4 rounded-lg ${
                  isCorrect 
                    ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                    : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                }`}
              >
                <div className="font-medium text-gray-800 dark:text-gray-100">{index + 1}. {question.question}</div>
                <div className="ml-4 mt-2">
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    Correct: {correctOption?.letter || ""}) {correctOption?.text || "N/A"}
                  </div>
                  {!isCorrect && selectedAnswers[index] !== undefined && (
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      Your answer: {selectedOption?.letter || ""}) {selectedOption?.text || "No answer selected"}
                    </div>
                  )}
                  {question.explanation && (
                    <div className="mt-2 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-gray-700 pt-2">
                      <span className="font-medium">Explanation:</span> {question.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleRetakeQuiz}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md"
          >
            Retake Quiz
          </button>
          <button
            onClick={handleCreateNewQuiz}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md"
          >
            Create New Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQuizQuestion = questions[currentQuestion];
  const options = currentQuizQuestion?.options || [];
  const questionProgress = Math.round(((currentQuestion + 1) / questions.length) * 100);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Question {currentQuestion + 1} of {questions.length}</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {Object.keys(selectedAnswers).length} of {questions.length} answered
        </div>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full" 
          style={{ width: `${questionProgress}%` }}
        ></div>
      </div>

      <div className="mb-6">
        <div className="text-xl mb-4 text-gray-800 dark:text-gray-100">{currentQuizQuestion.question}</div>
        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`p-3 rounded-lg cursor-pointer border flex items-start ${
                selectedAnswers[currentQuestion] === index
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 dark:border-indigo-500 text-gray-900 dark:text-gray-100'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/70 text-gray-800 dark:text-gray-200'
              }`}
            >
              <div className="mr-3 font-medium">{option.letter})</div>
              <div>{option.text}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md disabled:opacity-50 text-gray-800 dark:text-gray-200"
        >
          Previous
        </button>

        <button
          onClick={handleNext}
          className={`px-4 py-2 ${
            selectedAnswers[currentQuestion] !== undefined ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-400'
          } text-white rounded-md`}
        >
          {currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      </div>
    </div>
  );
};

export default QuizDisplay;