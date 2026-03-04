import { NextResponse } from 'next/server'
import * as tf from '@tensorflow/tfjs'
import path from 'path'
import fs from 'fs'

// Dynamic loading of the model
let model: tf.LayersModel | null = null;

async function loadModel() {
    if (model) return model;

    console.log('[MNIST] Loading model from filesystem...');
    const modelJsonPath = path.join(process.cwd(), 'public/model/mnist/model.json');
    const weightsPath = path.join(process.cwd(), 'public/model/mnist/weights.bin');

    const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
    const weightsBuffer = fs.readFileSync(weightsPath);

    // We create a custom IO handler that returns the files from memory
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

    model = await tf.loadLayersModel(ioHandler as any);
    console.log('[MNIST] Model loaded successfully from memory');
    return model;
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
        const input = tf.tensor(image).reshape([1, 28, 28, 1]).div(255.0);

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
