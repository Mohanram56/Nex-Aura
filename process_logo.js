const { Jimp } = require('jimp');

async function processLogo() {
  const inputPath = 'C:/Users/ims.security/.gemini/antigravity/brain/dfa7dc9a-6659-441c-b33e-60cd8a779246/.user_uploaded/media_1787633790344.jpg';
  const outputPath = 'C:/Users/ims.security/.gemini/antigravity/scratch/wfm-app/public/nex-aura-logo.png';

  console.log("Loading image...");
  const image = await Jimp.read(inputPath);
  
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  console.log("Processing pixels...");
  image.scan(0, 0, w, h, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    // Calculate luminance
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    // Background Removal: If pixel is light, make it transparent
    if (lum > 210) {
      // Soft edge anti-aliasing
      const alpha = Math.max(0, 255 - ((lum - 210) * (255 / 45)));
      this.bitmap.data[idx + 3] = alpha;
      
      // Push edge pixels towards white to avoid dark halos
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
    } 
    // Text brightening: The text "NEX AURA" is very dark teal
    else if (lum < 100) {
      // Invert it to be bright white for dark mode
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    }
    // Color Remapping: Shift Orange and Teal to Indigo and Cyan
    else {
      if (r > g && r > b) {
        // Pixel is Orange/Red -> Turn it into Indigo (High B, Med R)
        this.bitmap.data[idx + 0] = g; 
        this.bitmap.data[idx + 1] = b; 
        this.bitmap.data[idx + 2] = r; 
      } else if (g > r && b > r) {
        // Pixel is Teal/Cyan -> Turn into a lighter Cyan/Blue
        this.bitmap.data[idx + 0] = r * 0.5;
        this.bitmap.data[idx + 1] = g;
        this.bitmap.data[idx + 2] = 255;
      }
    }
  });

  console.log("Saving image...");
  await image.write(outputPath);
  console.log("Done!");
}

processLogo().catch(console.error);
