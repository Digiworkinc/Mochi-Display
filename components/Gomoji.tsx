
import React, { useMemo } from 'react';
import type { PupilPosition } from '../types';
import { EyeExpression } from '../types';

interface GomojiProps {
  expression: EyeExpression;
  pupilPosition: PupilPosition;
  isAngry: boolean;
}

const Eye: React.FC<{ expression: EyeExpression; isLeft?: boolean, isAngry: boolean }> = ({ expression, isLeft = false, isAngry }) => {
  const eyeColor = isAngry ? '#ff0000' : '#00ffff';
  
  const eyePath = useMemo(() => {
    switch (expression) {
      case EyeExpression.BLINK:
        return 'M 10,50 L 90,50'; // Thin line
      case EyeExpression.SQUINT:
      case EyeExpression.SHAKE:
        return 'M 10,50 Q 50,40 90,50 T 10,50'; // Squinted
      case EyeExpression.HAPPY:
        return 'M 10,60 Q 50,20 90,60'; // Curved up (like ^^)
      case EyeExpression.SCARED:
         return 'M 50,10 A 40,40 0 1,1 50,90 A 40,40 0 1,1 50,10'; // Wide circle
      case EyeExpression.ANGRY:
        return 'M 50,15 A 35,35 0 1,1 49.9,15 Z'; // Circle eye for more intensity
      default:
        return 'M 10,30 Q 10,10 30,10 L 70,10 Q 90,10 90,30 L 90,70 Q 90,90 70,90 L 30,90 Q 10,90 10,70 Z'; // Default rounded square
    }
  }, [expression]);

  const eyeTransform = useMemo(() => {
    const transforms = [];
    if (expression === EyeExpression.ANGRY) {
      // Angle the eyes inwards for an angry look
      transforms.push(`rotate(${isLeft ? 15 : -15}deg)`);
    }
     if (expression === EyeExpression.NODDING) {
      transforms.push('translateY(-15px)');
    }
    return transforms.join(' ');
  }, [expression, isLeft]);
  
  const transitionDuration = 'duration-300';

  return (
    <svg viewBox="0 0 100 100" className={`w-32 h-32 md:w-44 md:h-44 transition-transform ${transitionDuration} ease-in-out`} style={{ transform: eyeTransform, filter: 'url(#glow)' }}>
       <path 
        d={eyePath} 
        fill={eyeColor}
        stroke={eyeColor}
        strokeWidth={expression === EyeExpression.BLINK || expression === EyeExpression.SQUINT || expression === EyeExpression.SHAKE ? 10 : 4}
        strokeLinecap="round"
        className={`transition-all ${transitionDuration} ease-in-out`}
      />
      {/* Add Eyebrow for ANGRY expression */}
      {expression === EyeExpression.ANGRY && (
        <path
          d="M 10,25 L 90,25" // A straight, thick line for the eyebrow, rotated by parent transform
          stroke={eyeColor}
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          className={`transition-all ${transitionDuration} ease-in-out`}
        />
      )}
    </svg>
  );
};

const Mouth: React.FC<{ expression: EyeExpression }> = ({ expression }) => {
    const mouthPath = useMemo(() => {
        switch (expression) {
            case EyeExpression.HAPPY:
            case EyeExpression.GROWING_SMILE:
                return 'M 20,50 Q 50,90 80,50'; // Big smile
            case EyeExpression.ANGRY:
            case EyeExpression.SCARED:
                return 'M 20,60 Q 50,20 80,60'; // Frown / Scared
            case EyeExpression.NEUTRAL:
            case EyeExpression.SQUINT:
            case EyeExpression.SHAKE:
                 return 'M 30,50 Q 50,60 70,50'; // Neutral small curve
            default:
                return ''; // No mouth for some expressions
        }
    }, [expression]);

    const animationClass = expression === EyeExpression.GROWING_SMILE ? 'animate-grow-smile' : '';

    return (
        <svg viewBox="0 0 100 100" className={`w-24 h-24 -mt-8 ${animationClass}`} style={{ filter: 'url(#glow)' }}>
            <path
                d={mouthPath}
                fill="none"
                stroke="#00ffff"
                strokeWidth="6"
                strokeLinecap="round"
                className="transition-all duration-300 ease-in-out"
            />
        </svg>
    );
}

const Gomoji: React.FC<GomojiProps> = ({ expression, pupilPosition, isAngry }) => {
  const containerTransform = useMemo(() => {
    let transform = `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`;
     if (expression === EyeExpression.LOOK_LEFT) {
       transform = `translate(-25px, 0px)`;
    }
    if (expression === EyeExpression.LOOK_RIGHT) {
       transform = `translate(25px, 0px)`;
    }
    if (expression === EyeExpression.LOOK_UP) {
        transform = `translate(0px, -20px)`;
    }
    if (expression === EyeExpression.LOOK_DOWN) {
        transform = `translate(0px, 20px)`;
    }
    return transform;
  }, [pupilPosition, expression]);

  const dizzyClass = expression === EyeExpression.DIZZY ? 'animate-spin-slow' : '';

  return (
    <div
      className={`relative flex flex-col items-center justify-center transition-transform duration-300 ease-in-out ${dizzyClass}`}
      style={{ transform: containerTransform }}
    >
      <div className="flex items-center justify-center space-x-8">
        <Eye expression={expression} isLeft isAngry={isAngry} />
        <Eye expression={expression} isAngry={isAngry} />
      </div>
      <Mouth expression={expression} />
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default Gomoji;
