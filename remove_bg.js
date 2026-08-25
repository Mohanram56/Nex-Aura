const Jimp = require('jimp');

async function removeWhiteBg() {
  try {
    const inputPath = "C:/Users/ims.security/.gemini/antigravity/brain/dfa7dc9a-6659-441c-b33e-60cd8a779246/.user_uploaded/media_1787565729851.png";
    const outputPath = "C:/Users/ims.security/.gemini/antigravity/scratch/wfm-app/public/nex-aura-logo.png";
    
    console.log("Reading image...");
    const image = await Jimp.read(inputPath);
    
    // Auto-crop to remove excess white space and make the logo larger
    console.log("Cropping image margins...");
    image.autocrop(); 
    
    // Remove white background (tolerance for off-white compression artifacts)
    console.log("Removing white background...");
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];

      if (red > 230 && green > 230 && blue > 230) {
        this.bitmap.data[idx + 3] = 0; 
      }
    });

    await image.writeAsync(outputPath);
    console.log("Transparent logo successfully saved to public/nex-aura-logo.png!");
  } catch (err) {
    console.error("Error processing image:", err);
  }
}

removeWhiteBg();
