
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Gomoji from './components/Gomoji';
import useDeviceSensors from './hooks/useDeviceSensors';
import type { PupilPosition } from './types';
import { EyeExpression } from './types';
import {
  EXPRESSION_TIMEOUT,
  AUTONOMOUS_INTERVAL,
} from './constants';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [expression, setExpression] = useState<EyeExpression>(EyeExpression.NEUTRAL);
  const [pupilPosition, setPupilPosition] = useState<PupilPosition>({ x: 0, y: 0 });

  const { sensorData, requestPermission } = useDeviceSensors(hasStarted);

  const expressionTimeoutRef = useRef<number | null>(null);
  const autonomousIntervalRef = useRef<number | null>(null);
  const blinkTimeoutRef = useRef<number | null>(null);

  const setTemporaryExpression = useCallback((newExpression: EyeExpression, duration: number) => {
    if (expressionTimeoutRef.current) {
      clearTimeout(expressionTimeoutRef.current);
    }
    setExpression(newExpression);

    expressionTimeoutRef.current = window.setTimeout(() => {
      setExpression(EyeExpression.NEUTRAL);
      expressionTimeoutRef.current = null;
    }, duration);
  }, []);
  
  // Handle autonomous blinking
  useEffect(() => {
    if (!hasStarted) return;

    const scheduleNextBlink = () => {
        if (blinkTimeoutRef.current) {
            clearTimeout(blinkTimeoutRef.current);
        }
        
        const blink = () => {
             // Only blink if neutral, to not interrupt other actions
             if (expression === EyeExpression.NEUTRAL) {
                setTemporaryExpression(EyeExpression.BLINK, EXPRESSION_TIMEOUT.BLINK);
             }
             // Schedule the next one regardless
             scheduleNextBlink();
        }

        const blinkDelay = Math.random() * 3000 + 2000; // Blink every 2-5 seconds
        blinkTimeoutRef.current = window.setTimeout(blink, blinkDelay);
    };

    scheduleNextBlink();

    return () => {
      if (blinkTimeoutRef.current) {
        clearTimeout(blinkTimeoutRef.current);
      }
    };
  }, [hasStarted, expression, setTemporaryExpression]);

  // Handle Autonomous Looking Around
  useEffect(() => {
    const activeExpression = expression !== EyeExpression.NEUTRAL;
    
    // Manage autonomous behavior timer
    if(activeExpression && autonomousIntervalRef.current) {
        clearInterval(autonomousIntervalRef.current);
        autonomousIntervalRef.current = null;
    } else if (!activeExpression && !autonomousIntervalRef.current && hasStarted) {
        autonomousIntervalRef.current = window.setInterval(() => {
            const expressions = [
                { exp: EyeExpression.LOOK_LEFT, time: EXPRESSION_TIMEOUT.LOOK },
                { exp: EyeExpression.LOOK_RIGHT, time: EXPRESSION_TIMEOUT.LOOK },
                { exp: EyeExpression.LOOK_UP, time: EXPRESSION_TIMEOUT.LOOK },
                { exp: EyeExpression.LOOK_DOWN, time: EXPRESSION_TIMEOUT.LOOK },
            ];
            const random = expressions[Math.floor(Math.random() * expressions.length)];
            setTemporaryExpression(random.exp, random.time);
        }, AUTONOMOUS_INTERVAL);
    }
  }, [expression, hasStarted, setTemporaryExpression]);

  // Handle Device Motion
  useEffect(() => {
    const { rotation, isShaking, isMoving } = sensorData;
    
    if (isShaking) {
      if(expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
      setExpression(EyeExpression.DIZZY);
      expressionTimeoutRef.current = window.setTimeout(() => {
          setTemporaryExpression(EyeExpression.ANGRY, EXPRESSION_TIMEOUT.ANGRY);
      }, EXPRESSION_TIMEOUT.DIZZY);
      return;
    }

    if (isMoving && expression === EyeExpression.NEUTRAL) {
       setTemporaryExpression(EyeExpression.SQUINT, EXPRESSION_TIMEOUT.SQUINT);
    }
    
    // Pupil movement based on device tilt
    const x = (rotation.gamma || 0) / 2; // Left-right tilt
    const y = (rotation.beta || 0) / 2 - 20; // Front-back tilt
    setPupilPosition({ 
        x: Math.max(-30, Math.min(30, x)), 
        y: Math.max(-25, Math.min(25, y)) 
    });

  }, [sensorData, expression, setTemporaryExpression]);
  
  const handleStart = async () => {
    await requestPermission();
    setHasStarted(true);
  };

  return (
    <div className="bg-black w-screen h-screen flex items-center justify-center overflow-hidden">
      {!hasStarted ? (
        <div className="text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Gomoji</h1>
          <p className="text-xl mb-8">An interactive friend in your phone.</p>
          <button
            onClick={handleStart}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full text-2xl transition-transform transform hover:scale-105"
          >
            Start
          </button>
        </div>
      ) : (
        <Gomoji expression={expression} pupilPosition={pupilPosition} />
      )}
    </div>
  );
};

export default App;
