const getCroppedImg = (imageSrc, crop) => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc;
      image.crossOrigin = "anonymous"; // Prevent CORS issues
  
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
  
        // Set canvas size to crop selection
        canvas.width = crop.width;
        canvas.height = crop.height;
  
        // Draw cropped image
        ctx.drawImage(
          image,
          crop.x, crop.y, crop.width, crop.height, // Source crop area
          0, 0, crop.width, crop.height // Destination on canvas
        );
  
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };
  
  export default getCroppedImg;
  