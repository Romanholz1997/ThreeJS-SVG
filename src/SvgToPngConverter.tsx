import React, { useState } from 'react';

const SvgToPngConverter: React.FC = () => {
    const [pngDataUrl, setPngDataUrl] = useState<string | null>(null);

    const svgString = `
    `;

    const svgToPng = async (svg: string, width: number, height: number) => {
        const img = new Image();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        return new Promise<string>((resolve, reject) => {
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const pngDataUrl = canvas.toDataURL('image/png');
                    URL.revokeObjectURL(url); // Clean up the URL
                    resolve(pngDataUrl);
                } else {
                    reject(new Error('Failed to get canvas context'));
                }
            };

            img.onerror = (error) => {
                reject(error);
            };

            img.src = url;
        });
    };

    const handleConvert = async () => {
        try {
            const pngUrl = await svgToPng(svgString, 2000, 300);
            setPngDataUrl(pngUrl);
        } catch (error) {
            console.error('Error converting SVG to PNG:', error);
        }
    };

    return (
        <div>
            <h1>SVG to PNG Converter</h1>
            <button onClick={handleConvert}>Convert SVG to PNG</button>
            {pngDataUrl && (
                <div>
                    <h2>Resulting PNG:</h2>
                    <img src={pngDataUrl} alt="Converted PNG" />
                    <a href={pngDataUrl} download="converted-image.png">Download PNG</a>
                </div>
            )}
        </div>
    );
};

export default SvgToPngConverter;
