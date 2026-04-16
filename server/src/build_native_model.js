import * as tf from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, '..', 'model_output');

async function buildAndSaveMockModel() {
    console.log("Building native TF.js Neural Network for demonstration...");
    
    // Ensure directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Exact architecture required from blueprint
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 64, activation: 'relu', inputShape: [30] }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.3 }));
    model.add(tf.layers.dense({ units: 16, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy', metrics: ['accuracy'] });

    // Train on a quick batch of synthetic data just to initialize weights
    console.log("Initializing dummy weight tensors...");
    const xs = tf.randomNormal([100, 30]); 
    // Random risk scores so it will classify roughly 50% as safe/fraud for demonstration
    const ys = tf.randomUniform([100, 1], 0, 1).round(); 

    console.log("Training model natively... ");
    await model.fit(xs, ys, { epochs: 2, verbose: 0 });

    console.log(`Exporting model configuration natively to ${OUTPUT_DIR}...`);
    await model.save(`file://${OUTPUT_DIR}`);
    
    // Injecting synthetic standard scaling stats typical of credit card data
    const scalerPath = path.join(OUTPUT_DIR, 'scaler_config.json');
    const scalerStats = {
        amount_mean: 88.34,
        amount_scale: 250.12,
        time_mean: 94813.0,
        time_scale: 47488.0
    };
    fs.writeFileSync(scalerPath, JSON.stringify(scalerStats, null, 4));

    console.log("SUCCESS! The Model Engine files have been written directly without Python.");
}

buildAndSaveMockModel().catch(console.error);
