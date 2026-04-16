import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from sklearn.metrics import f1_score, roc_auc_score, classification_report
import tensorflow as tf
import tensorflowjs as tfjs
import json

# Ensure output directory exists
OUTPUT_DIR = '../server/model_output'
os.makedirs(OUTPUT_DIR, exist_ok=True)

print("Starting AI Training Pipeline...")

# 1. Ingest & Clean
DATASET_PATH = 'dataset/creditcard.csv'

# Fallback block used in testing if the massive Kaggle dataset is not locally downloaded
if not os.path.exists(DATASET_PATH):
    print(f"Warning: Main dataset not found at {DATASET_PATH}.")
    print("Generating a dummy mock dataset to simulate pipeline execution...")
    np.random.seed(42)
    # 28 PCA + Time + Amount = 30 features
    X_dummy = np.random.randn(2000, 30)
    y_dummy = np.random.randint(0, 2, 2000)
    y_dummy[:1950] = 0 # Simulate severe imbalance
    
    df = pd.DataFrame(X_dummy, columns=[f'V{i}' for i in range(1, 29)] + ['Time', 'Amount'])
    df['Class'] = y_dummy
else:
    print("Loading Kaggle Kaggle European Credit Card dataset...")
    df = pd.read_csv(DATASET_PATH)

print("Applying Standard Scaling to 'Time' and 'Amount'...")
scaler_amount = StandardScaler()
scaler_time = StandardScaler()

df['Amount'] = scaler_amount.fit_transform(df['Amount'].values.reshape(-1, 1))
df['Time'] = scaler_time.fit_transform(df['Time'].values.reshape(-1, 1))

# Save scaler stats so Node.js can apply the exact same transformation
# We save mean and scale (std dev) to reconstruct it manually in Javascript
scaler_stats = {
    "amount_mean": float(scaler_amount.mean_[0]),
    "amount_scale": float(scaler_amount.scale_[0]),
    "time_mean": float(scaler_time.mean_[0]),
    "time_scale": float(scaler_time.scale_[0])
}
with open(os.path.join(OUTPUT_DIR, 'scaler_config.json'), 'w') as f:
    json.dump(scaler_stats, f, indent=4)
print("Scaler configuration exported successfully.")

# Separate features and target
X = df.drop('Class', axis=1)
y = df['Class']

# Split data completely BEFORE applying SMOTE to prevent data leakage!
print("Splitting train and test sets...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

# 2. Balance (SMOTE)
print("Applying SMOTE to balance the training data...")
smote = SMOTE(random_state=42)
X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)

print(f"Original training shape: {X_train.shape}, Class 1: {sum(y_train==1)}, Class 0: {sum(y_train==0)}")
print(f"Resampled training shape:  {X_train_resampled.shape}, Class 1: {sum(y_train_resampled==1)}, Class 0: {sum(y_train_resampled==0)}")

# 3. Train & Evaluate
print("Building TensorFlow Dense Neural Network Model...")
model = tf.keras.Sequential([
    tf.keras.layers.Dense(64, activation='relu', input_shape=(X_train_resampled.shape[1],)),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(32, activation='relu'),
    tf.keras.layers.Dropout(0.3),
    tf.keras.layers.Dense(16, activation='relu'),
    tf.keras.layers.Dense(1, activation='sigmoid')
])

model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])

print("Training model...")
# Used low epochs for pipeline testing. In production, increase epochs and use EarlyStopping callbacks.
model.fit(X_train_resampled, y_train_resampled, epochs=5, batch_size=256, validation_split=0.2, verbose=1)

print("Evaluating model on original (unseen) test set...")
y_pred_prob = model.predict(X_test)
y_pred = (y_pred_prob > 0.5).astype(int).reshape(-1)

# Ensure y_pred structure matches y_test for metrics calculation
f1 = f1_score(y_test, y_pred)
auc_roc = roc_auc_score(y_test, y_pred_prob)

print("\n" + "="*50)
print("             PERFORMANCE METRICS")
print("="*50)
print(f"F1-Score: {f1:.4f}")
print(f"AUC-ROC:  {auc_roc:.4f}")
print("="*50)
print(classification_report(y_test, y_pred))

# 4. Export to TensorFlow.js framework
print(f"Exporting model to TensorFlow.js format in '{OUTPUT_DIR}'...")
tfjs.converters.save_keras_model(model, OUTPUT_DIR)
print("Export complete! model.json and .bin weight files are ready for Node.js.")
