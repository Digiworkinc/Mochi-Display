
import React, { useState, useEffect } from 'react';

// 8x8 pixel art representations
const boredImages = [
    // Zzz...
    [
        '00001000',
        '00010100',
        '00100010',
        '00000000',
        '00001000',
        '00010100',
        '00100010',
        '00000000',
    ],
    // Sad face
    [
        '01111110',
        '10000001',
        '10100101',
        '10000001',
        '10000001',
        '10111101',
        '10000001',
        '01111110',
    ],
    // Hourglass
    [
        '01111110',
        '00111100',
        '00011000',
        '00100100',
        '00100100',
        '00011000',
        '00111100',
        '01111110',
    ]
];

const colors = ['#333', '#888']; // Simple grayscale

const BoredScreen: React.FC = () => {
    const [image, setImage] = useState<string[]>([]);

    useEffect(() => {
        // Pick a random image on mount
        const randomIndex = Math.floor(Math.random() * boredImages.length);
        setImage(boredImages[randomIndex]);
    }, []);

    return (
        <div className="flex items-center justify-center w-full h-full">
            <div 
                className="grid gap-px p-2 bg-gray-700"
                style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}
            >
                {image.map((row, rowIndex) => 
                    row.split('').map((pixel, colIndex) => (
                        <div 
                            key={`${rowIndex}-${colIndex}`}
                            className="w-8 h-8 md:w-10 md:h-10 transition-colors duration-300"
                            style={{ backgroundColor: colors[parseInt(pixel)] }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default BoredScreen;
