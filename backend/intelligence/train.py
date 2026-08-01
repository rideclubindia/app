import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_separation_model():
    data_path = 'intelligence/data/dummy_gps_data.csv'
    if not os.path.exists(data_path):
        print("Data not found. Run data_generator.py first.")
        return

    df = pd.read_csv(data_path)
    
    # Features for predicting if a rider will be separated from the group
    features = ['speed_kmh', 'dist_to_leader', 'hour_of_day', 'day_of_week']
    X = df[features]
    y = df['is_separated']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost Classifier for Separation Prediction...")
    model = xgb.XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42)
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model Accuracy: {acc:.4f}")
    print(classification_report(y_test, preds))
    
    os.makedirs('intelligence/models', exist_ok=True)
    joblib.dump(model, 'intelligence/models/separation_model.pkl')
    print("Model saved to intelligence/models/separation_model.pkl")

if __name__ == "__main__":
    train_separation_model()
