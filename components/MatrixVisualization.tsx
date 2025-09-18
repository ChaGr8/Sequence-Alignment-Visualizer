import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { AlignmentResult, Algorithm, Move } from '../types';

interface MatrixVisualizationProps {
  result: AlignmentResult;
  algorithm: Algorithm;
}

const MatrixVisualization = React.forwardRef<HTMLCanvasElement, MatrixVisualizationProps>(({ result, algorithm }, ref) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const localCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = ref || localCanvasRef;
  const lastHoveredCell = useRef<{ i: number, j: number } | null>(null);

  useEffect(() => {
    if (!result || !canvasRef || !('current' in canvasRef) || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { matrix, path, seq1, seq2, scoring, trace } = result;
    const n = matrix.length;
    const m = matrix[0].length;

    const margin = { top: 50, right: 20, bottom: 20, left: 50 };
    const cellSize = 30;
    const width = m * cellSize + margin.left + margin.right;
    const height = n * cellSize + margin.top + margin.bottom;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const values = matrix.flat();
    const colorScale = d3.scaleSequential(d3.interpolateBlues)
      .domain([d3.min(values) ?? 0, d3.max(values) ?? 1]);

    // --- DRAWING ---
    ctx.clearRect(0, 0, width, height);
    
    // Draw cells and scores
    ctx.save();
    ctx.translate(margin.left, margin.top);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const value = matrix[i][j];
        ctx.fillStyle = colorScale(value);
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);

        ctx.fillStyle = d3.lab(colorScale(value)).l > 70 ? '#2D3748' : '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '12px sans-serif';
        ctx.fillText(String(value), j * cellSize + cellSize / 2, i * cellSize + cellSize / 2);
      }
    }

    // Draw traceback path
    ctx.lineWidth = 3.5;
    path.forEach(p => {
        if (p.row === 0 && p.col === 0) return;
        
        const isSWEnd = algorithm === Algorithm.SmithWaterman && path.length > 0 && path[path.length - 1].row === p.row && path[path.length - 1].col === p.col;
        if (isSWEnd) {
            ctx.strokeStyle = '#A0AEC0'; // Gray
        } else {
            const move = trace[p.row][p.col];
            if (move === Move.DIAGONAL) {
                ctx.strokeStyle = seq1[p.row - 1] === seq2[p.col - 1] ? '#48BB78' : '#F56565'; // Green/Red
            } else {
                ctx.strokeStyle = '#3B82F6'; // Blue
            }
        }
        ctx.strokeRect(p.col * cellSize, p.row * cellSize, cellSize, cellSize);
    });
    ctx.restore();
    
    // Draw sequence labels
    ctx.save();
    ctx.translate(margin.left, margin.top);
    ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#E2E8F0' : '#2D3748';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px monospace';
    const seq1Chars = ['-', ...seq1.split('')];
    const seq2Chars = ['-', ...seq2.split('')];
    seq1Chars.forEach((char, i) => ctx.fillText(char, -cellSize / 2, i * cellSize + cellSize / 2));
    seq2Chars.forEach((char, i) => ctx.fillText(char, i * cellSize + cellSize / 2, -cellSize / 2));
    ctx.restore();


    // --- TOOLTIP LOGIC ---
    const tooltip = d3.select(tooltipRef.current);

    const handleMouseMove = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left - margin.left;
        const y = event.clientY - rect.top - margin.top;

        const j = Math.floor(x / cellSize);
        const i = Math.floor(y / cellSize);

        if (i >= 0 && i < n && j >= 0 && j < m) {
            if (lastHoveredCell.current?.i === i && lastHoveredCell.current?.j === j) return;
            lastHoveredCell.current = { i, j };
            
            const d = { i, j, value: matrix[i][j] };
            let tooltipHtml = `Score: <b>${d.value}</b><br>Coords: (${d.i}, ${d.j})`;

            if (d.i > 0 && d.j > 0) {
              const diagScore = matrix[d.i - 1][d.j - 1];
              const upScore = matrix[d.i - 1][d.j];
              const leftScore = matrix[d.i][d.j - 1];
              
              const matchValue = seq1[d.i - 1] === seq2[d.j - 1] ? scoring.match : scoring.mismatch;
              const gapValue = scoring.gap;

              const calculatedDiag = diagScore + matchValue;
              const calculatedUp = upScore + gapValue;
              const calculatedLeft = leftScore + gapValue;

              const currentMove = trace[d.i][d.j];
              const getClass = (move: Move) => currentMove === move ? 'font-bold text-primary' : 'text-gray-400';
              
              tooltipHtml = `
                <div class="text-sm">
                    <div>Score: <b>${d.value}</b></div>
                    <div>Coords: (${d.i}, ${d.j})</div>
                    <hr class="my-1 border-gray-500"/>
                    <div class="${getClass(Move.DIAGONAL)}">
                        ↖ Diag: ${diagScore} + (${seq1[d.i - 1]}↔${seq2[d.j - 1]} → ${matchValue}) = <b>${calculatedDiag}</b>
                    </div>
                    <div class="${getClass(Move.UP)}">
                        ↑ Up: ${upScore} + (${gapValue}) = <b>${calculatedUp}</b>
                    </div>
                    <div class="${getClass(Move.LEFT)}">
                        ← Left: ${leftScore} + (${gapValue}) = <b>${calculatedLeft}</b>
                    </div>
                    ${algorithm === Algorithm.SmithWaterman ? `<div class="${d.value === 0 ? 'font-bold text-primary' : 'text-gray-400'}">◎ Stop: <b>0</b></div>` : ''}
                </div>
              `;
            }

            tooltip
              .style('opacity', 1)
              .html(tooltipHtml)
              .style('left', `${event.pageX + 15}px`)
              .style('top', `${event.pageY + 15}px`);
        } else {
             handleMouseOut();
        }
    };
    
    const handleMouseOut = () => {
        lastHoveredCell.current = null;
        tooltip.style('opacity', 0);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);

    return () => {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseout', handleMouseOut);
    };

  }, [result, algorithm, canvasRef]);

  return (
    <>
      <div className="w-full overflow-x-auto bg-light-card dark:bg-dark-card rounded-lg p-2 cursor-pointer">
        <canvas ref={canvasRef}></canvas>
      </div>
      <div 
        ref={tooltipRef} 
        className="fixed opacity-0 pointer-events-none z-50 p-3 text-xs bg-gray-900/90 dark:bg-black/90 text-white rounded-md shadow-lg transition-opacity duration-200"
        style={{minWidth: '220px'}}
      ></div>
    </>
  );
});

export default MatrixVisualization;