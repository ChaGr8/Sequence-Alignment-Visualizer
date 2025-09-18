import React, { useState, useRef } from 'react';
import { AlignmentResult, Algorithm } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import MatrixVisualization from './MatrixVisualization';

interface ResultsDisplayProps {
  result: AlignmentResult;
  algorithm: Algorithm;
}

const AlignedSequence: React.FC<{ s1: string, s2: string }> = ({ s1, s2 }) => {
  const s1Spans = [];
  const s2Spans = [];
  const matchSpans = [];

  for (let i = 0; i < s1.length; i++) {
    let colorClass = '';
    let matchChar = ' ';
    if (s1[i] === '-' || s2[i] === '-') {
      // Gaps are colored blue as per user request
      colorClass = 'text-blue-500 dark:text-blue-400';
    } else if (s1[i] === s2[i]) {
      // Matches are colored green
      colorClass = 'text-match dark:text-green-400 font-bold';
      matchChar = '|';
    } else {
      // Mismatches are colored red
      colorClass = 'text-mismatch dark:text-red-400 font-bold';
    }
    s1Spans.push(<span key={`s1-${i}`} className={colorClass}>{s1[i]}</span>);
    s2Spans.push(<span key={`s2-${i}`} className={colorClass}>{s2[i]}</span>);
    matchSpans.push(<span key={`match-${i}`}>{matchChar}</span>);
  }

  return (
    <div className="font-mono p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto text-lg">
      <div className="inline-block whitespace-nowrap">
        <div>{s1Spans}</div>
        <div className="text-gray-500">{matchSpans}</div>
        <div>{s2Spans}</div>
      </div>
    </div>
  );
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ result, algorithm }) => {
  const [showMatrix, setShowMatrix] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownload = () => {
    const { alignedSeq1, alignedSeq2, score, identity } = result;
    const content = `Alignment Result\n` +
      `================\n` +
      `Algorithm: ${algorithm}\n`+
      `Score: ${score}\n` +
      `Identity: ${identity.toFixed(2)}%\n` +
      `Length: ${alignedSeq1.length}\n` +
      `\n` +
      `Seq1: ${alignedSeq1}\n` +
      `Seq2: ${alignedSeq2}\n`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alignment_result.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    const { alignedSeq1, alignedSeq2, score, identity } = result;
    
    const toCsvRow = (row: (string|number)[]) => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');

    const summaryHeaders = ['Parameter', 'Value'];
    const summaryData = [
      ['Algorithm', algorithm],
      ['Score', score],
      ['Identity (%)', identity.toFixed(2)],
      ['Length', alignedSeq1.length],
    ];

    const alignmentHeaders = ['Index', 'Sequence 1', 'Match', 'Sequence 2'];
    const alignmentData = [];
    for (let i = 0; i < alignedSeq1.length; i++) {
        let matchChar = ' ';
        if (alignedSeq1[i] !== '-' && alignedSeq2[i] !== '-' && alignedSeq1[i] === alignedSeq2[i]) {
            matchChar = '|';
        }
        alignmentData.push([i + 1, alignedSeq1[i], matchChar, alignedSeq2[i]]);
    }
    
    let csvContent = toCsvRow(summaryHeaders) + '\r\n';
    summaryData.forEach(row => {
      csvContent += toCsvRow(row) + '\r\n';
    });
    csvContent += '\r\n';
    csvContent += toCsvRow(alignmentHeaders) + '\r\n';
    alignmentData.forEach(row => {
      csvContent += toCsvRow(row) + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alignment_result.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Draw background color
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#1A202C' : '#F5F7FA';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw the visualization canvas on top
    ctx.drawImage(canvas, 0, 0);

    const pngFile = exportCanvas.toDataURL("image/png");
      
    const downloadLink = document.createElement("a");
    downloadLink.download = "alignment_matrix.png";
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  return (
    <div className="space-y-6">
      <Card title="Alignment Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
            <p className="text-3xl font-bold text-primary">{result.score}</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Identity</p>
            <p className="text-3xl font-bold text-primary">{result.identity.toFixed(2)}%</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Length</p>
            <p className="text-3xl font-bold text-primary">{result.alignedSeq1.length}</p>
          </div>
        </div>
      </Card>

      <Card title="Aligned Sequences">
        <AlignedSequence s1={result.alignedSeq1} s2={result.alignedSeq2} />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button onClick={handleDownload} variant="secondary">
              Download TXT
            </Button>
            <Button onClick={handleDownloadCSV} variant="secondary">
              Download CSV
            </Button>
        </div>
      </Card>
      
      <Card>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <h3 className="text-xl font-bold text-light-text dark:text-dark-text">DP Matrix & Traceback</h3>
          <div className="flex items-center space-x-2 flex-shrink-0">
             <Button onClick={handleExportPNG} variant="secondary" className="w-auto py-2 px-4 text-sm">
                Export PNG
             </Button>
             <Button onClick={() => setShowMatrix(!showMatrix)} variant="secondary" className="w-auto py-2 px-4 text-sm">
                {showMatrix ? 'Hide' : 'Show'} Matrix
             </Button>
          </div>
        </div>
        {showMatrix && <MatrixVisualization result={result} algorithm={algorithm} ref={canvasRef} />}
      </Card>
    </div>
  );
};

export default ResultsDisplay;