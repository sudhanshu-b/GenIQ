// src/components/ui/placeholders-and-vanish-input.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export const PlaceholdersAndVanishInput = ({
  placeholders,
  onChange,
  onSubmit,
  className,
}) => {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!placeholders || placeholders.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [placeholders]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!value) return;
    
    setIsSubmitted(true);
    onSubmit?.(e);
    
    setTimeout(() => {
      setValue("");
      setIsSubmitted(false);
    }, 1500);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    onChange?.(e);
  };

  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="wait">
        {!isSubmitted ? (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex items-center h-12"
            onSubmit={handleSubmit}
            key="input"
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full h-full rounded-lg border border-neutral-300 dark:border-neutral-700 px-4 text-neutral-900 dark:text-neutral-100 bg-transparent outline-none transition-all duration-300"
              style={{
                boxShadow: isFocused
                  ? "0 0 0 2px rgba(0, 0, 0, 0.1)"
                  : "none",
              }}
            />

            {!value && placeholders && placeholders.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 dark:text-neutral-400"
                  key={currentPlaceholder}
                >
                  {placeholders[currentPlaceholder]}
                </motion.div>
              </AnimatePresence>
            )}

            <button
              type="submit"
              className="absolute right-2 h-8 px-4 rounded-md bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 text-sm font-medium transition-all duration-300 hover:bg-neutral-800 dark:hover:bg-neutral-200"
            >
              Generate
            </button>
          </motion.form>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="h-12 w-full flex items-center justify-center font-medium text-neutral-900 dark:text-neutral-100"
            key="submitted"
          >
            Creating your quiz...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
