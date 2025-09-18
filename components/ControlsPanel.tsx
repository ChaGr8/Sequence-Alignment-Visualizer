import React, { useRef } from 'react';
import { Algorithm, Scoring } from '../types';
import { DEFAULT_SCORING } from '../constants';
import { alignmentService } from '../services/alignmentService';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';

interface ControlsPanelProps {
  seq1: string;
  setSeq1: (s: string) => void;
  seq2: string;
  setSeq2: (s: string) => void;
  algorithm: Algorithm;
  setAlgorithm: (a: Algorithm) => void;
  scoring: Scoring;
  setScoring: (s: Scoring) => void;
  onAlign: () => void;
  isLoading: boolean;
  onClear: () => void;
}

const EXAMPLES = [
    { name: 'DNA (Basic)', seq1: 'GATTACA', seq2: 'GCATGCA' },
    { name: 'DNA (Insertion/Deletion)', seq1: 'AGCTAGCTAGCT', seq2: 'AGCTAGCT' },
    { name: 'Protein (Hemoglobin)', seq1: 'MVLSPADKTNVKAAWGKVGAHAGEYGAEALE', seq2: 'MVLSEGEWQLVLHVWAKVEADVAGHGQDILIR' },
];

const SequenceInput: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  onFileLoad: (content: string) => void;
  title: string;
}> = ({ id, value, onChange, onFileLoad, title }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileLoad(alignmentService.parseFasta(content));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <h4 className="text-lg font-semibold mb-2 text-light-text dark:text-dark-text">{title}</h4>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Paste sequence or upload FASTA...`}
        className="w-full h-32 p-2 font-mono text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors duration-300"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".fasta,.fa,.fna,.ffn,.faa,.frn"
        id={`${id}-file`}
      />
      <label htmlFor={`${id}-file`} className="mt-2 text-sm text-primary hover:underline cursor-pointer">
        Upload FASTA file
      </label>
    </div>
  );
};

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  seq1, setSeq1, seq2, setSeq2, algorithm, setAlgorithm,
  scoring, setScoring, onAlign, isLoading, onClear
}) => {

  const handleExampleChange = (name: string) => {
    const example = EXAMPLES.find(e => e.name === name);
    if (example) {
        setSeq1(example.seq1);
        setSeq2(example.seq2);
    }
  };

  const generateRandomDNA = (length: number = 15): string => {
    const chars = 'ATCG';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  return (
    <div className="space-y-6">
      <Card title="Input Sequences">
        <div className="space-y-4">
           <div>
            <Select
              key={`${seq1}-${seq2}`}
              label="Load Example"
              onChange={(e) => handleExampleChange(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Select an example...</option>
              {EXAMPLES.map(ex => <option key={ex.name} value={ex.name}>{ex.name}</option>)}
            </Select>
          </div>
          <hr className="border-gray-200 dark:border-gray-600"/>
          <SequenceInput id="seq1" title="Sequence 1" value={seq1} onChange={setSeq1} onFileLoad={setSeq1} />
          <SequenceInput id="seq2" title="Sequence 2" value={seq2} onChange={setSeq2} onFileLoad={setSeq2} />
        </div>
      </Card>
      
      <Card title="Configuration">
        <div className="space-y-4">
          <Select
            label="Algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
          >
            {Object.values(Algorithm).map(alg => 
                <option key={alg} value={alg} disabled={alg === Algorithm.MultipleSequenceAlignment}>
                    {alg}
                </option>
            )}
          </Select>
          
          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Match"
              type="number"
              value={scoring.match}
              onChange={(e) => setScoring({...scoring, match: Number(e.target.value)})}
            />
            <Input
              label="Mismatch"
              type="number"
              value={scoring.mismatch}
              onChange={(e) => setScoring({...scoring, mismatch: Number(e.target.value)})}
            />
            <Input
              label="Gap"
              type="number"
              value={scoring.gap}
              onChange={(e) => setScoring({...scoring, gap: Number(e.target.value)})}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setScoring(DEFAULT_SCORING)}>Reset Scores</Button>
            <Button variant="secondary" onClick={() => {
                setSeq1(generateRandomDNA());
                setSeq2(generateRandomDNA());
            }}>Random DNA</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Button onClick={onClear} variant="secondary" disabled={isLoading}>Clear</Button>
        <Button onClick={onAlign} isLoading={isLoading} disabled={!seq1 || !seq2}>Align Sequences</Button>
      </div>
    </div>
  );
};

export default ControlsPanel;