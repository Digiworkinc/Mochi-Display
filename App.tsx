
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Gomoji from './components/Gomoji';
import BoredScreen from './components/BoredScreen';
import CodingScreen from './components/CodingScreen';
import useDeviceSensors from './hooks/useDeviceSensors';
import type { PupilPosition, IdleState } from './types';
import { EyeExpression } from './types';
import {
  EXPRESSION_TIMEOUT,
  AUTONOMOUS_INTERVAL,
} from './constants';
import { preloadSounds, playSound } from './services/audioService';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [expression, setExpression] = useState<EyeExpression>(EyeExpression.NEUTRAL);
  const [pupilPosition, setPupilPosition] = useState<PupilPosition>({ x: 0, y: 0 });
  const [isInteracting, setIsInteracting] = useState(false);
  const [idleState, setIdleState] = useState<IdleState>('NONE');

  const { sensorData, requestPermission } = useDeviceSensors(hasStarted);

  const expressionTimeoutRef = useRef<number | null>(null);
  const autonomousIntervalRef = useRef<number | null>(null);
  const blinkTimeoutRef = useRef<number | null>(null);
  
  // Refs for touch interaction logic
  const touchCountRef = useRef(0);
  const interactionTimeoutRef = useRef<number | null>(null);

  const setTemporaryExpression = useCallback((newExpression: EyeExpression, duration: number) => {
    if (expressionTimeoutRef.current) {
      clearTimeout(expressionTimeoutRef.current);
    }
    
    if (newExpression === EyeExpression.BLINK) {
      playSound('blink');
    }

    setExpression(newExpression);

    expressionTimeoutRef.current = window.setTimeout(() => {
      setExpression(EyeExpression.NEUTRAL);
      expressionTimeoutRef.current = null;
    }, duration);
  }, []);

  // Handle touch/click interaction sequence
  const handleInteractionStart = useCallback(() => {
    if (isInteracting) return;
    
    setIdleState('NONE'); // Exit any idle state on interaction
    touchCountRef.current += 1;

    // Stop autonomous actions and any pending expressions on any tap.
    if (autonomousIntervalRef.current) clearInterval(autonomousIntervalRef.current);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    if (expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
    if (interactionTimeoutRef.current) clearTimeout(interactionTimeoutRef.current);
    
    // Immediate anger trigger
    if (touchCountRef.current >= 4) {
      touchCountRef.current = 0;
      setIsInteracting(true);

      setExpression(EyeExpression.ANGRY);
      
      let angrySoundCount = 0;
      const angrySoundInterval = setInterval(() => {
        playSound('angry');
        angrySoundCount++;
        if (angrySoundCount >= 4) clearInterval(angrySoundInterval);
      }, 150);

      setTimeout(() => {
        setExpression(EyeExpression.NEUTRAL);
        setIsInteracting(false);
      }, EXPRESSION_TIMEOUT.ANGRY);
      return; // Stop further processing
    }

    // Schedule an interaction based on the final tap count after a delay
    interactionTimeoutRef.current = window.setTimeout(() => {
      const finalTapCount = touchCountRef.current;
      touchCountRef.current = 0; // Reset for next interaction
      setIsInteracting(true);

      if (finalTapCount === 3) {
        // Growing Smile sequence
        setExpression(EyeExpression.GROWING_SMILE);
        setTimeout(() => {
          setExpression(EyeExpression.NEUTRAL);
          setIsInteracting(false);
        }, EXPRESSION_TIMEOUT.GROWING_SMILE);

      } else { // 1 or 2 taps
        // Default Happy sequence
        setExpression(EyeExpression.SQUINT);
        setTimeout(() => setExpression(EyeExpression.SHAKE), EXPRESSION_TIMEOUT.SQUINT);
        setTimeout(() => setExpression(EyeExpression.HAPPY), EXPRESSION_TIMEOUT.SQUINT + EXPRESSION_TIMEOUT.SHAKE);
        setTimeout(() => {
          setExpression(EyeExpression.NEUTRAL);
          setIsInteracting(false);
        }, EXPRESSION_TIMEOUT.SQUINT + EXPRESSION_TIMEOUT.SHAKE + EXPRESSION_TIMEOUT.HAPPY);
      }
    }, 400); // Wait 400ms for more taps
  }, [isInteracting]);
  
  // Handle autonomous blinking
  useEffect(() => {
    if (!hasStarted || isInteracting || idleState !== 'NONE') {
        if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
        return;
    };

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
  }, [hasStarted, expression, setTemporaryExpression, isInteracting, idleState]);

  // Handle Autonomous Actions (Looking, Thinking, Coding, Bored)
  useEffect(() => {
    const activeExpression = expression !== EyeExpression.NEUTRAL;
    
    if(activeExpression || isInteracting || idleState !== 'NONE') {
        if(autonomousIntervalRef.current) {
            clearInterval(autonomousIntervalRef.current);
            autonomousIntervalRef.current = null;
        }
    } else if (!autonomousIntervalRef.current && hasStarted) {
        autonomousIntervalRef.current = window.setInterval(() => {
            const actions = [
                'LOOK', 'LOOK', 'LOOK', 'LOOK', // Look is most common
                'THINK',
                'CODE',
                'BORED',
            ];
            const randomAction = actions[Math.floor(Math.random() * actions.length)];

            switch(randomAction) {
                case 'LOOK':
                    const expressions = [
                        { exp: EyeExpression.LOOK_LEFT, time: EXPRESSION_TIMEOUT.LOOK },
                        { exp: EyeExpression.LOOK_RIGHT, time: EXPRESSION_TIMEOUT.LOOK },
                        { exp: EyeExpression.LOOK_UP, time: EXPRESSION_TIMEOUT.LOOK },
                        { exp: EyeExpression.LOOK_DOWN, time: EXPRESSION_TIMEOUT.LOOK },
                    ];
                    const random = expressions[Math.floor(Math.random() * expressions.length)];
                    setTemporaryExpression(random.exp, random.time);
                    break;
                case 'THINK':
                    setIdleState('THINKING');
                    setTimeout(() => setIdleState('NONE'), 4000);
                    break;
                case 'CODE':
                    setIdleState('CODING');
                    setTimeout(() => setIdleState('NONE'), 12000);
                    break;
                case 'BORED':
                    setIdleState('BORED');
                    setTimeout(() => setIdleState('NONE'), 6000);
                    break;
            }
        }, AUTONOMOUS_INTERVAL);
    }
  }, [expression, hasStarted, setTemporaryExpression, isInteracting, idleState]);

  // Handle Device Motion
  useEffect(() => {
    if (isInteracting) return;
    
    const { rotation, isShaking, isMoving } = sensorData;
    
    if (isShaking) {
      setIdleState('NONE');
      if(expressionTimeoutRef.current) clearTimeout(expressionTimeoutRef.current);
      setExpression(EyeExpression.DIZZY);
      expressionTimeoutRef.current = window.setTimeout(() => {
          setTemporaryExpression(EyeExpression.ANGRY, EXPRESSION_TIMEOUT.ANGRY);
      }, EXPRESSION_TIMEOUT.DIZZY);
      return;
    }

    if (isMoving && expression === EyeExpression.NEUTRAL) {
       setIdleState('NONE');
       setTemporaryExpression(EyeExpression.SQUINT, EXPRESSION_TIMEOUT.SQUINT);
    }
    
    // Pupil movement based on device tilt
    const x = (rotation.gamma || 0) / 2; // Left-right tilt
    const y = (rotation.beta || 0) / 2 - 20; // Front-back tilt
    setPupilPosition({ 
        x: Math.max(-30, Math.min(30, x)), 
        y: Math.max(-25, Math.min(25, y)) 
    });

  }, [sensorData, expression, setTemporaryExpression, isInteracting]);
  
  const handleStart = async () => {
    await requestPermission();
    await preloadSounds();
    setHasStarted(true);
  };

  const isAngry = expression === EyeExpression.ANGRY;

  const renderContent = () => {
    if (!hasStarted) {
      return (
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
      );
    }

    switch (idleState) {
      case 'THINKING':
        return (
          <div className="text-white text-4xl md:text-6xl font-mono animate-pulse">
            Thinking....
          </div>
        );
      case 'CODING':
        return <CodingScreen />;
      case 'BORED':
        return <BoredScreen />;
      case 'NONE':
      default:
        return <Gomoji expression={expression} pupilPosition={pupilPosition} isAngry={isAngry} />;
    }
  };

  return (
    <div 
      className="bg-black w-screen h-screen flex items-center justify-center overflow-hidden"
      onPointerDown={hasStarted ? handleInteractionStart : undefined}
    >
      {renderContent()}
    </div>
  );
};

export default App;
