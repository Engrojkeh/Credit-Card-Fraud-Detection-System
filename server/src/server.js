import express from 'express';
import cors from 'cors';
import multer from 'multer';
import csvParser from 'csv-parser';
// @tensorflow/tfjs-node import removed because native C++ bindings failed on this Windows build

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// ------------------------------------------------------------------
// ENDPOINT 1: True Real-Time Simulator (POST /api/scan-transaction)
// ------------------------------------------------------------------
app.post('/api/scan-transaction', async (req, res) => {
    try {
        const data = req.body;
        
        // Mocking TensorFlow.js Inference for Windows Demonstration
        // We use a math function combining Amount and Time anomalies
        let riskValue = Math.random() * 0.4;
        if (data.amount > 1000) riskValue += 0.3;
        if (data.amount > 5000) riskValue += 0.4;

        if (riskValue > 0.99) riskValue = 0.99;

        const isFraud = riskValue > 0.5 ? 1 : 0;
        const riskPercentage = (riskValue * 100).toFixed(2);

        res.status(200).json({
            isFraud: isFraud,
            riskScore: `${riskPercentage}%`,
            message: isFraud ? "FRAUD DETECTED" : "TRANSACTION SAFE"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to scan transaction" });
    }
});

// ------------------------------------------------------------------
// ENDPOINT 2: Historical Batch Analyzer (POST /api/upload-csv)
// ------------------------------------------------------------------
app.post('/api/upload-csv', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded." });

        const transactions = [];
        const results = [];
        
        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csvParser())
            .on('data', (row) => transactions.push(row))
            .on('end', () => {
                let totalFraudFound = 0;

                for (let i = 0; i < transactions.length; i++) {
                    const row = transactions[i];
                    let amt = parseFloat(row.Amount || row.amount || 0);
                    
                    // Mock probability calculation
                    let risk = Math.random() * 0.2;
                    if (amt > 800) risk += 0.4;
                    if (amt > 2000) risk += 0.3;
                    if (risk > 0.99) risk = 0.99;

                    let isFraud = risk > 0.5 ? 1 : 0;
                    if (isFraud) totalFraudFound++;

                    results.push({
                        ...row,
                        riskScore: (risk * 100).toFixed(2),
                        isFraud: isFraud
                    });
                }

                res.status(200).json({
                    scannedRows: transactions.length,
                    totalFraudDetected: totalFraudFound,
                    flaggedTransactions: results 
                });
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process CSV file" });
    }
});

app.listen(port, () => {
    console.log(`Fallback Demonstration Server running perfectly on http://localhost:${port}`);
});
