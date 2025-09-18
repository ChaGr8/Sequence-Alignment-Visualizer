import React, { useState, useCallback, useEffect } from 'react';
import { Algorithm, Scoring, AlignmentResult } from './types';
import { DEFAULT_SCORING } from './constants';
import { alignmentService } from './services/alignmentService';
import ControlsPanel from './components/ControlsPanel';
import ResultsDisplay from './components/ResultsDisplay';

const App: React.FC = () => {
  const [seq1, setSeq1] = useState<string>('GATTACA');
  const [seq2, setSeq2] = useState<string>('GCATGCA');
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.NeedlemanWunsch);
  const [scoring, setScoring] = useState<Scoring>(DEFAULT_SCORING);
  const [result, setResult] = useState<AlignmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAlign = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Simulate async work to show loader
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
        const cleanedSeq1 = alignmentService.cleanSequence(seq1);
        const cleanedSeq2 = alignmentService.cleanSequence(seq2);
        
        if (!cleanedSeq1 || !cleanedSeq2) {
            throw new Error("Both sequences must not be empty.");
        }

        let alignmentResult;
        if (algorithm === Algorithm.NeedlemanWunsch) {
            alignmentResult = alignmentService.runNeedlemanWunsch(cleanedSeq1, cleanedSeq2, scoring);
        } else {
            alignmentResult = alignmentService.runSmithWaterman(cleanedSeq1, cleanedSeq2, scoring);
        }
        setResult(alignmentResult);
    } catch (e) {
        setError(e instanceof Error ? e.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  }, [seq1, seq2, algorithm, scoring]);

  const handleClear = () => {
    setSeq1('');
    setSeq2('');
    setResult(null);
    setError(null);
    setScoring(DEFAULT_SCORING);
  };
  
  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary">Sequence Alignment Visualizer</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Global & Local Alignment with Dynamic Programming</p>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Toggle dark mode"
          >
             {isDarkMode ? '☀️' : '🌙'}
          </button>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="lg:sticky top-8">
            <ControlsPanel
              seq1={seq1}
              setSeq1={setSeq1}
              seq2={seq2}
              setSeq2={setSeq2}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              scoring={scoring}
              setScoring={setScoring}
              onAlign={handleAlign}
              isLoading={isLoading}
              onClear={handleClear}
            />
          </div>
          
          <main>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            {!result && !isLoading && (
              <div className="text-center p-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-500">Awaiting Alignment</h2>
                <p className="mt-2 text-gray-400">Enter sequences and configure parameters to see the results here.</p>
              </div>
            )}
            
            {isLoading && (
                <div className="text-center p-10">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg font-semibold">Calculating Alignment...</p>
                </div>
            )}

            {result && <ResultsDisplay result={result} algorithm={algorithm} />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
