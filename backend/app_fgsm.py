from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import io
import base64
from model import load_model, Net
from fgsm import Attack

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "mnist_model.pth"

# Normalization layer to include in the model
# This allows us to attack the image in [0,1] space while the model sees normalized data
class Normalize(nn.Module):
    def __init__(self, mean, std):
        super(Normalize, self).__init__()
        self.mean = torch.tensor(mean).to(DEVICE)
        self.std = torch.tensor(std).to(DEVICE)

    def forward(self, x):
        return (x - self.mean.view(1, 1, 1)) / self.std.view(1, 1, 1)

# Load Model
# We reload the base model and wrap it
base_model = load_model(MODEL_PATH, DEVICE)
normalization = Normalize(mean=[0.1307], std=[0.3081])
model = nn.Sequential(normalization, base_model)
model.eval()
print("Model loaded and wrapped with Normalization.")

# Initialize Attack
attacker = Attack(model, DEVICE)

def image_to_base64(image_tensor):
    # Convert tensor back to PIL image
    # Tensor is [1, 1, H, W] in [0, 1]
    img = image_tensor.squeeze().cpu().numpy()
    # Scale to 0-255
    img = (img * 255).astype('uint8')
    pil_img = Image.fromarray(img, mode='L') # L for Grayscale
    
    buff = io.BytesIO()
    pil_img.save(buff, format="PNG")
    img_str = base64.b64encode(buff.getvalue()).decode("utf-8")
    return img_str

@app.post("/attack")
async def perform_attack(
    file: UploadFile = File(...),
    epsilon: float = Form(0.1)
):
    try:
        # Read and Process Image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('L')
        
        # Resize to 28x28 as expected by MNIST model
        image = image.resize((28, 28))
        
        # Transform to Tensor [0, 1]
        transform = transforms.ToTensor()
        image_tensor = transform(image).unsqueeze(0).to(DEVICE) # Add batch dim -> [1, 1, 28, 28]

        # Get initial prediction (Clean)
        with torch.no_grad():
            output = model(image_tensor)
            clean_pred = output.max(1, keepdim=True)[1].item()

        # Perform Attack
        # Attacker code assumes target is the initial prediction (untargeted attack? or targeted?)
        # FGSM is usually used to move AWAY from the true label (untargeted) 
        # using the gradient of the loss w.r.t true label.
        # Since we don't have the true label from the user, we will assume the model's clean prediction is "correct"
        # and try to generate an adversarial example that deviates from it.
        # Ideally, we should ask for true label, but the prompt says Input is Image and Epsilon.
        
        # We use clean_pred as the target to calculate gradient. 
        # Maximizing loss w.r.t this class will push it away.
        
        init_pred, final_pred, perturbed_data = attacker.perform_attack(image_tensor, epsilon, clean_pred)
        
        # Get Base64 of adversarial image
        adv_base64 = image_to_base64(perturbed_data)
        
        success = (init_pred != final_pred)

        return JSONResponse(content={
            "clean_prediction": init_pred,
            "adversarial_prediction": final_pred,
            "adversarial_image": f"data:image/png;base64,{adv_base64}",
            "success": success
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
