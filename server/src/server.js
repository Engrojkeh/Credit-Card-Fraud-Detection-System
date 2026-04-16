import express from 'express';
import cors from 'cors';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import csvParser from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';
import pg from 'pg';
import stream from 'stream';

const { Pool } = pg;

// ──────────────────────────────────────────────────────────
//  CONFIGURATION
// ──────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'aegis-fraud-core-secret-key-2024';
const MODEL_VERSION = 'TFjs-SMOTE-v2.1';

// ──────────────────────────────────────────────────────────
//  1. SECURITY MIDDLEWARE (Helmet + Rate Limiter)
// ──────────────────────────────────────────────────────────
app.use(helmet());                            // Masks server fingerprint headers
app.use(cors());
app.use(express.json());

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,                      // 1 minute window
    max: 100,                                 // 100 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Rate limit exceeded. Maximum 100 requests per minute.' }
});
app.use('/api/', apiLimiter);                 // Apply to all /api routes

const upload = multer({ storage: multer.memoryStorage() });

// ──────────────────────────────────────────────────────────
//  2. POSTGRESQL DATABASE CONNECTION (Graceful Fallback)
// ──────────────────────────────────────────────────────────
let dbPool = null;
let dbConnected = false;

async function initializeDatabase() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.log('[DB] No DATABASE_URL provided. Running in memory-only mode.');
        return;
    }

    try {
        dbPool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false }
        });

        // Test the connection
        await dbPool.query('SELECT NOW()');
        console.log('[DB] PostgreSQL connected successfully.');

        // Auto-create the transaction_history table
        await dbPool.query(`
            CREATE TABLE IF NOT EXISTS transaction_history (
                id SERIAL PRIMARY KEY,
                transaction_id VARCHAR(50) UNIQUE NOT NULL,
                timestamp BIGINT NOT NULL,
                transaction_amount DECIMAL(12,2) NOT NULL,
                risk_score DECIMAL(5,4) NOT NULL,
                model_version VARCHAR(50) DEFAULT '${MODEL_VERSION}',
                final_status VARCHAR(20) NOT NULL,
                card_last_four VARCHAR(4),
                merchant VARCHAR(100),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log('[DB] transaction_history table ready.');
        dbConnected = true;

    } catch (err) {
        console.warn('[DB] PostgreSQL connection failed. Falling back to memory-only mode.');
        console.warn('[DB] Error:', err.message);
        dbConnected = false;
    }
}

// Save a transaction to the database (non-blocking, graceful)
async function saveTransaction(txData) {
    if (!dbConnected || !dbPool) return;
    try {
        await dbPool.query(
            `INSERT INTO transaction_history 
             (transaction_id, timestamp, transaction_amount, risk_score, model_version, final_status, card_last_four, merchant)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                txData.transaction_id,
                txData.timestamp,
                txData.transaction_amount,
                txData.risk_score,
                MODEL_VERSION,
                txData.status,
                txData.card_last_four || null,
                txData.merchant || null
            ]
        );
    } catch (err) {
        console.warn('[DB] Failed to save transaction:', err.message);
    }
}

// ──────────────────────────────────────────────────────────
//  3. JWT AUTHENTICATION
// ──────────────────────────────────────────────────────────

// Admin credentials (for demo purposes)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// POST /api/login — Generates a signed JWT token
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        const token = jwt.sign(
            { role: 'administrator', username },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.status(200).json({
            message: 'Authentication successful',
            token,
            user: { username, role: 'administrator' }
        });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// JWT Verification Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
}

// ──────────────────────────────────────────────────────────
//  4. PROTECTED API ROUTES
// ──────────────────────────────────────────────────────────

// POST /api/scan-transaction — Real-Time Single Swipe (JWT Protected)
app.post('/api/scan-transaction',
    authenticateToken,
    [
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
        body('time').isInt({ min: 0 }).withMessage('Time must be a non-negative integer')
    ],
    async (req, res) => {
        // Express-Validator: Check for malicious/invalid input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        try {
            const data = req.body;
            const transactionId = uuidv4();

            // Anomaly scoring logic (simulating TF.js model inference)
            let riskValue = Math.random() * 0.4;
            if (data.amount > 1000) riskValue += 0.3;
            if (data.amount > 5000) riskValue += 0.4;
            if (riskValue > 0.99) riskValue = 0.99;

            const isFraud = riskValue > 0.5 ? 1 : 0;
            const status = isFraud ? 'Declined' : 'Approved';

            // Build the formatted enterprise response
            const result = {
                transaction_id: transactionId,
                risk_score: parseFloat(riskValue.toFixed(4)),
                riskScore: `${(riskValue * 100).toFixed(2)}%`,
                status: status,
                isFraud: isFraud,
                model_version: MODEL_VERSION,
                message: isFraud ? 'FRAUD DETECTED — Transaction Declined' : 'TRANSACTION SAFE — Approved'
            };

            // Persist to PostgreSQL (non-blocking)
            await saveTransaction({
                transaction_id: transactionId,
                timestamp: data.time,
                transaction_amount: data.amount,
                risk_score: riskValue,
                status: status,
                card_last_four: data.cardLastFour || null,
                merchant: data.merchant || null
            });

            res.status(200).json(result);

        } catch (error) {
            console.error('[API] Scan error:', error);
            res.status(500).json({ error: 'Internal server failure during transaction scan.' });
        }
    }
);

// POST /api/upload-csv — Batch CSV Analyzer (JWT Protected)
app.post('/api/upload-csv', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });

        const transactions = [];
        const results = [];

        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        bufferStream
            .pipe(csvParser())
            .on('data', (row) => transactions.push(row))
            .on('end', async () => {
                let totalFraudFound = 0;

                for (let i = 0; i < transactions.length; i++) {
                    const row = transactions[i];
                    const amt = parseFloat(row.Amount || row.amount || 0);
                    const txId = uuidv4();

                    // Mock probability calculation
                    let risk = Math.random() * 0.2;
                    if (amt > 800) risk += 0.4;
                    if (amt > 2000) risk += 0.3;
                    if (risk > 0.99) risk = 0.99;

                    const isFraud = risk > 0.5 ? 1 : 0;
                    const status = isFraud ? 'Declined' : 'Approved';
                    if (isFraud) totalFraudFound++;

                    const entry = {
                        transaction_id: txId,
                        risk_score: parseFloat(risk.toFixed(4)),
                        riskScore: `${(risk * 100).toFixed(2)}%`,
                        status: status,
                        isFraud: isFraud,
                        amount: amt,
                        ...row
                    };
                    results.push(entry);

                    // Persist each row to PostgreSQL
                    await saveTransaction({
                        transaction_id: txId,
                        timestamp: parseInt(row.Time || row.time || 0),
                        transaction_amount: amt,
                        risk_score: risk,
                        status: status
                    });
                }

                res.status(200).json({
                    scannedRows: transactions.length,
                    totalFraudDetected: totalFraudFound,
                    model_version: MODEL_VERSION,
                    flaggedTransactions: results
                });
            });
    } catch (error) {
        console.error('[API] CSV upload error:', error);
        res.status(500).json({ error: 'Failed to process CSV file.' });
    }
});

// GET /api/status — Health check (public)
app.get('/api/status', (req, res) => {
    res.json({
        server: 'online',
        database: dbConnected ? 'connected' : 'memory-only',
        model_version: MODEL_VERSION,
        security: {
            helmet: true,
            rateLimiter: '100 req/min',
            jwt: true,
            inputValidation: true
        }
    });
});

// ──────────────────────────────────────────────────────────
//  BOOT SEQUENCE
// ──────────────────────────────────────────────────────────
export default app;

if (process.env.NODE_ENV !== 'production') {
    initializeDatabase().then(() => {
        app.listen(port, () => {
            console.log(`\n══════════════════════════════════════════════`);
            console.log(`  AEGIS FRAUD DETECTION ENGINE v2.0`);
            console.log(`  Server:     http://localhost:${port}`);
            console.log(`  Security:   Helmet + Rate-Limit + JWT`);
            console.log(`  Database:   ${dbConnected ? 'PostgreSQL Connected' : 'Memory-Only (No DB URL)'}`);
            console.log(`  Model:      ${MODEL_VERSION}`);
            console.log(`══════════════════════════════════════════════\n`);
        });
    });
}
