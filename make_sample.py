from PIL import Image, ImageDraw
import os

# Create a black background image (28x28) - MNIST format
# 'L' mode = 8-bit pixels, black and white
img = Image.new('L', (28, 28), color=0)
d = ImageDraw.Draw(img)

# Draw a number '7' in white (255)
# Top horizontal line
d.line((6, 6, 22, 6), fill=255, width=2)
# Diagonal line
d.line((22, 6, 8, 24), fill=255, width=2)

output_path = "sample_7.png"
img.save(output_path)
print(f"Sample image created at: {os.path.abspath(output_path)}")
