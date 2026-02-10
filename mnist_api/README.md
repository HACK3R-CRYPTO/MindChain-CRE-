# Vision Node (MNIST API)

Specialized compute. Python muscle. TensorFlow brains. DePIN in action.

## What This Does

Acts as a "Compute Node" in the network. Receives raw pixels. Validates payment on-chain. Runs inference model. Returns digit prediction. Proves specialized hardware can be outsourced.

## Features

- **TensorFlow Backend**: Runs a pre-trained CNN model.
- **On-Chain Auth**: Checks user credits before processing.
- **Flask API**: Fast, lightweight REST endpoint.

## Prerequisites

- Python 3.9+
- Virtualenv

## Installation

Navigate to directory:
```bash
cd mnist_api
```

Create virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Node

Start the server:
```bash
export FLASK_APP=app.py
flask run --port 3002
```

Server runs on `http://localhost:3002`. Accepts POST requests to `/predict`.
