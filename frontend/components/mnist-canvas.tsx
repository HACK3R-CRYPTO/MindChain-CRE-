'use client'

import { useRef, useEffect, useState, MouseEvent, TouchEvent } from 'react'

interface MNISTCanvasProps {
    onPredict: (imageData: number[][]) => void
    isLoading?: boolean
}

export function MNISTCanvas({ onPredict, isLoading }: MNISTCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas background to black
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }, [])

    const startDrawing = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true)
        draw(e)
    }

    const stopDrawing = () => {
        setIsDrawing(false)
    }

    const draw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        let x, y

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left
            y = e.touches[0].clientY - rect.top
        } else {
            x = e.clientX - rect.left
            y = e.clientY - rect.top
        }

        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x - 10, y - 10, 20, 20)
    }

    const clearCanvas = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const handlePredict = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Get image data and convert to 28x28 grayscale array
        const imageData = ctx.getImageData(0, 0, 280, 280)
        const data = imageData.data

        // Downsample to 28x28
        const mnist: number[][] = []
        for (let i = 0; i < 28; i++) {
            mnist[i] = []
            for (let j = 0; j < 28; j++) {
                const x = Math.floor(j * 10)
                const y = Math.floor(i * 10)
                const idx = (y * 280 + x) * 4
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
                mnist[i][j] = gray / 255 // Normalize to 0-1
            }
        }

        onPredict(mnist)
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    width={280}
                    height={280}
                    className="border-2 border-purple-500 rounded-lg cursor-crosshair bg-black"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                    </div>
                )}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={clearCanvas}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    disabled={isLoading}
                >
                    Clear
                </button>
                <button
                    onClick={handlePredict}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Predicting...' : 'Predict Digit'}
                </button>
            </div>
        </div>
    )
}
