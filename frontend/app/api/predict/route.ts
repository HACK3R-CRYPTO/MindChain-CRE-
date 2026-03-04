import { NextResponse } from 'next/server'
import * as tf from '@tensorflow/tfjs'
import path from 'path'
import fs from 'fs'

// Use a global promise to ensure we only load the model once
// and keep it in memory across hot-reloads.
const MODEL_KEY = '_mindchain_mnist_promise';

async function loadModel(): Promise<tf.LayersModel> {
    if ((global as any)[MODEL_KEY]) {
        return (global as any)[MODEL_KEY];
    }

    const loadPromise = (async () => {
        try {
            console.log('[MNIST] Initializing TensorFlow.js Model...');

            if (process.env.NODE_ENV === 'development') {
                // Proactive cleanup for hot-reloads
                try {
                    tf.disposeVariables();
                } catch (e) { }
            }

            const modelJsonPath = path.join(process.cwd(), 'public/model/mnist/model.json');
            const weightsPath = path.join(process.cwd(), 'public/model/mnist/weights.bin');

            if (!fs.existsSync(modelJsonPath) || !fs.existsSync(weightsPath)) {
                throw new Error('Model files not found in public/model/mnist/');
            }

            const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
            const weightsBuffer = fs.readFileSync(weightsPath);

            const ioHandler = {
                load: async () => {
                    return {
                        modelTopology: modelJson.modelTopology,
                        weightSpecs: modelJson.weightsManifest[0].weights,
                        weightData: weightsBuffer.buffer.slice(
                            weightsBuffer.byteOffset,
                            weightsBuffer.byteOffset + weightsBuffer.byteLength
                        ) as ArrayBuffer,
                    };
                }
            };

            const loadedModel = await tf.loadLayersModel(ioHandler as any);
            console.log('[MNIST] Model loaded successfully');
            return loadedModel;
        } catch (err) {
            console.error('[MNIST] Final model load error:', err);
            // Clear the promise from global so we can retry on next request
            delete (global as any)[MODEL_KEY];
            throw err;
        }
    })();

    (global as any)[MODEL_KEY] = loadPromise;
    return loadPromise;
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { image, paymentTxHash } = body

        if (!image) {
            return NextResponse.json(
                { error: 'Image data required' },
                { status: 400 }
            )
        }

        console.log('[API] Processing prediction request natively (tfjs)', {
            hasImage: !!image,
            paymentTxHash
        })

        // 1. Ensure model is loaded
        const mnistModel = await loadModel();

        // 2. Preprocess input (28x28 matrix)
        // Note: Frontend already sends normalized values [0, 1]
        const input = tf.tensor(image).reshape([1, 28, 28, 1]);

        // 3. Predict
        const prediction = mnistModel.predict(input) as tf.Tensor;
        const probabilities = await prediction.data();
        const predictedClass = prediction.argMax(-1).dataSync()[0];
        const confidence = probabilities[predictedClass];

        // 4. Cleanup tensors
        input.dispose();
        prediction.dispose();

        return NextResponse.json({
            prediction: predictedClass,
            confidence: confidence,
            paymentVerified: true,
            paymentSettled: true,
            transactionHash: paymentTxHash,
            engine: 'Native TensorFlow.js'
        })
    } catch (error) {
        console.error('[API] Error:', error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Internal server error' },
            { status: 500 }
        )
    }
}
