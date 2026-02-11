# MindChain Vision Node (MNIST API) 👁️

A lightweight Python/Flask service that acts as a "Compute Node" for the MindChain network. It receives raw pixel data from the frontend, runs it through a TensorFlow/Keras model, and returns the predicted digit.

## 🧠 Features

- **TensorFlow Backend**: Runs a pre-trained CNN model for digit recognition.
- **REST API**: Simple `POST /predict` endpoint used by the frontend.
- **On-Chain Verification**: Designed to work in tandem with the Payment Gateway (validating that the request paid for compute).

## 🛠️ Tech Stack

- **Python 3.9+**
- **Flask**: Web Server
- **TensorFlow (CPU)**: Inference Engine
- **NumPy**: Data processing

## 🚀 Getting Started

### Prerequisites
- Python 3.9 or higher
- `pip`

### Installation
1. Navigate to the directory:
   ```bash
   cd mnist_api
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Node
Start the server on port 3002:

```bash
python app.py
```

The server will start at `http://localhost:3002`.

### API Usage
**Endpoint**: `POST /predict`
**Body**: 28x28 matrix of pixel values (0-1 floats or 0-255 ints).
**Response**:
```json
{
  "prediction": 7,
  "confidence": 0.99
}
```
