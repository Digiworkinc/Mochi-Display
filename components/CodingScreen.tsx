
import React, { useState, useEffect, useRef } from 'react';

const codeSnippets = [
`function Gomoji() {
  const [mood, setMood] = useState('happy');

  return (
    <div className={mood}>
      {/* Eyes and mouth go here */}
    </div>
  );
}`,
`const styles = {
  container: {
    backgroundColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eye: {
    width: '100px',
    height: '100px',
    backgroundColor: '#00ffff',
    borderRadius: '50%',
  }
};`,
`<!-- My Cool Gomoji -->
<div id="gomoji-container">
  <div class="eye left"></div>
  <div class="eye right"></div>
  <div class="mouth smile"></div>
</div>`
];


const CodingScreen: React.FC = () => {
    const [typedCode, setTypedCode] = useState('');
    const snippetRef = useRef('');
    const indexRef = useRef(0);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        // Select a random snippet on mount
        snippetRef.current = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
        
        intervalRef.current = window.setInterval(() => {
            if (indexRef.current < snippetRef.current.length) {
                setTypedCode(prev => prev + snippetRef.current[indexRef.current]);
                indexRef.current++;
            } else {
                if(intervalRef.current) clearInterval(intervalRef.current);
            }
        }, 50); // Typing speed

        return () => {
            if(intervalRef.current) clearInterval(intervalRef.current);
        }
    }, []);

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <pre className="text-lime-400 font-mono text-sm md:text-lg whitespace-pre-wrap w-full">
                <span className="code-cursor">{typedCode}</span>
            </pre>
        </div>
    );
};

export default CodingScreen;
