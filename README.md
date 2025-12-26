# DevNeuron Software Engineer AI Assessment

This project demonstrates an Adversarial Attack (FGSM) on a simple MNIST CNN model using **FastAPI** (Backend) and **Next.js** (Frontend).

## Project Structure

- `backend/`: Python FastAPI application and ML model.
- `frontend/`: Next.js web application.

## Prerequisites

- Python 3.8+
- Node.js 16+
- pip

## Setup & Running Locally

### 1. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Train the MNIST model (Required first time):

```bash
python train_model.py
```

*This will download the MNIST dataset, train the model, and save `mnist_model.pth`.*

Run the FASTAPI Server:

```bash
python app_fgsm.py
```

The backend will start at `http://localhost:8000`.

### 2. Frontend Setup

Navigate to the `frontend` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Explanation of FGSM (Fast Gradient Sign Method)

The Fast Gradient Sign Method (FGSM) is a "white-box" adversarial attack technique. It works by using the gradients of the neural network's loss function with respect to the input image.

Instead of minimizing the loss to train the model (like in standard backpropagation), FGSM **maximizes** the loss to fool the model. It calculates the gradient of the loss for a given input image and class label, takes the **sign** of that gradient (to determine the direction of greatest error), and adds a small perturbation (scaled by epsilon $\epsilon$) to the original image in that direction.

Formula:
$x' = x + \epsilon \cdot \text{sign}(\nabla_x J(\theta, x, y))$

Where:

- $x$ is the original image.
- $x'$ is the adversarial image.
- $\epsilon$ is the magnitude of the perturbation.
- $\nabla_x J$ is the gradient of the loss with respect to the input.

## Deployment (AWS Free Tier)

### Frontend (AWS Amplify)

1. Push the `frontend` code to a Git repository (GitHub/GitLab/AWS CodeCommit).
2. Connect AWS Amplify to the repository.
3. Configure build settings (Next.js presets are usually auto-detected).
4. Deploy.

### Backend (AWS EC2)

1. Launch an EC2 instance (t2.micro for Free Tier).
2. SSH into the instance.
3. specific Python environment and copy `backend` files.
4. Install requirements: `pip install -r requirements.txt`.
5. Run with Uvicorn (using `gunicorn` with worker class for production is recommended):

   ```bash
   uvicorn app_fgsm:app --host 0.0.0.0 --port 8000
   ```

6. Ensure Security Group allows inbound traffic on port 8000.

## Observations

- **Epsilon Impact**: As epsilon increases (e.g., from 0.05 to 0.3), the noise becomes more visible to the human eye, and the model's confidence in the correct class drops significantly.
- **Robustness**: Simple CNNs trained on clean data are highly susceptible to FGSM. Even effectively "invisible" noise ($\epsilon = 0.05$) can flip predictions.
