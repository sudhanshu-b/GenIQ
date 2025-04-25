import React, { useState, useRef, useEffect } from "react";
import { Trash2, Upload, Download, Scissors, FileText, Plus } from "lucide-react";
import { Stage, Layer, Image, Line, Circle, Group, Text } from "react-konva";
import useImage from "use-image";

function App() {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  const [croppedImages, setCroppedImages] = useState([]);
  const [savingStatus, setSavingStatus] = useState('');
  const [bucketName, setBucketName] = useState('');
  const [currentPolygonCount, setCurrentPolygonCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [excelFileURL, setExcelFileURL] = useState(null);
  
  // Konva state
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [uploadedImage] = useImage(previewURL, 'Anonymous');
  const [scale, setScale] = useState(1);
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  
  // Polygon state
  const [polygons, setPolygons] = useState([]);
  const [activePolygon, setActivePolygon] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState([]);
  const [selectedPolygonIndex, setSelectedPolygonIndex] = useState(null);
  const [mousePosition, setMousePosition] = useState(null);

  // Initialize and create a bucket on component mount
  useEffect(() => {
    initializeBucket();
  }, []);

  const initializeBucket = async () => {
    try {
      setIsLoading(true);
      setSavingStatus("Initializing storage...");
      console.log("Starting storage initialization...");

      const response = await fetch("http://localhost:5000/api/create-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Using bucket: ${data.bucketName}`);
        setBucketName(data.bucketName);
        setSavingStatus("Connected to storage successfully!");
      } else {
        throw new Error("Failed to initialize storage");
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
      setSavingStatus("Error initializing storage");
    } finally {
      setTimeout(() => setSavingStatus(""), 3000);
      setIsLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setPreviewURL(URL.createObjectURL(selectedFile));
      setCroppedImages([]);
      setPolygons([]);
      setActivePolygon(null);
      setCurrentPoints([]);
      setSelectedPolygonIndex(null);
      setCurrentPolygonCount(1);
      setIsDrawing(false); // Reset drawing mode
      setMousePosition(null); // Reset mouse position
    }
  };

  const handleDeleteImage = () => {
    setFile(null);
    setPreviewURL(null);
    setCroppedImages([]);
    setPolygons([]);
    setActivePolygon(null);
    setCurrentPoints([]);
    setSelectedPolygonIndex(null);
    setCurrentPolygonCount(1);
    setIsDrawing(false); // Reset drawing mode
    setMousePosition(null); // Reset mouse position
  };

  // Update stage size when image loads or container resizes
  useEffect(() => {
    if (!uploadedImage || !containerRef.current) return;
    
    const updateSize = () => {
      const containerWidth = containerRef.current.offsetWidth;
      
      // Calculate scaling to fit image width to container
      const newScale = containerWidth / uploadedImage.width;
      
      setScale(newScale);
      setStageSize({
        width: containerWidth,
        height: uploadedImage.height * newScale
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [uploadedImage]);

  // Start drawing a new polygon
  const startDrawPolygon = () => {
    setIsDrawing(true);
    setCurrentPoints([]);
    setSelectedPolygonIndex(null);
    setMousePosition(null);
  };
  
  // Stop drawing the current polygon
  const cancelDrawing = () => {
    setIsDrawing(false);
    setCurrentPoints([]);
    setMousePosition(null);
  };
  
  // Handle mouse move during polygon drawing
  const handleMouseMove = (e) => {
    if (isDrawing) {
      const stage = stageRef.current;
      const pos = stage.getPointerPosition();
      setMousePosition(pos);
    }
  };
  
  // Handle canvas click during polygon drawing
  const handleStageClick = (e) => {
    if (!isDrawing) return;
    
    // Get click position
    const stage = stageRef.current;
    const pointerPosition = stage.getPointerPosition();
    
    // Check if we're closing the polygon (clicking near first point)
    if (currentPoints.length >= 6) { // at least 3 points (x,y pairs)
      const firstX = currentPoints[0];
      const firstY = currentPoints[1];
      const dx = pointerPosition.x - firstX;
      const dy = pointerPosition.y - firstY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 20) {
        // Close the polygon
        const newPolygon = {
          points: [...currentPoints],
          id: Date.now()
        };
        
        setPolygons([...polygons, newPolygon]);
        setIsDrawing(false);
        setCurrentPoints([]);
        setSelectedPolygonIndex(polygons.length);
        setMousePosition(null); // Reset mouse position
        return;
      }
    }
    
    // Add the point
    setCurrentPoints([...currentPoints, pointerPosition.x, pointerPosition.y]);
  };
  
  // Handle click on a polygon or vertex
  const handlePolygonClick = (index) => {
    setSelectedPolygonIndex(index);
  };
  
  // Delete selected polygon
  const deleteSelectedPolygon = () => {
    if (selectedPolygonIndex !== null) {
      const newPolygons = [...polygons];
      newPolygons.splice(selectedPolygonIndex, 1);
      setPolygons(newPolygons);
      setSelectedPolygonIndex(null);
    }
  };
  
  // Handle vertex drag
  const handleVertexDragMove = (e, vertexIndex, polygonIndex) => {
    const newPolygons = [...polygons];
    
    // Update the vertex position
    newPolygons[polygonIndex].points[vertexIndex * 2] = e.target.x();
    newPolygons[polygonIndex].points[vertexIndex * 2 + 1] = e.target.y();
    
    setPolygons(newPolygons);
  };

  // Crop and save the selected polygon
  const cropSelectedPolygon = async () => {
    if (selectedPolygonIndex === null || !uploadedImage) {
      setSavingStatus("Please select a polygon to crop");
      setTimeout(() => setSavingStatus(""), 3000);
      return;
    }
    
    try {
      // Get the selected polygon points
      const polygon = polygons[selectedPolygonIndex];
      const points = polygon.points;
      
      // Create a temporary canvas for cropping
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Find bounding box of polygon
      const xPoints = [];
      const yPoints = [];
      
      for (let i = 0; i < points.length; i += 2) {
        xPoints.push(points[i]);
        yPoints.push(points[i + 1]);
      }
      
      const minX = Math.min(...xPoints);
      const maxX = Math.max(...xPoints);
      const minY = Math.min(...yPoints);
      const maxY = Math.max(...yPoints);
      
      // Set canvas size to bounding box dimensions
      canvas.width = maxX - minX;
      canvas.height = maxY - minY;
      
      // Draw the polygon path
      ctx.beginPath();
      for (let i = 0; i < points.length; i += 2) {
        const x = points[i] - minX;
        const y = points[i + 1] - minY;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.clip();
      
      // Scale back from display to original image coordinates
      const invScale = 1 / scale;
      
      // Draw the image portion within the polygon
      ctx.drawImage(
        uploadedImage,
        minX * invScale, minY * invScale,
        (maxX - minX) * invScale, (maxY - minY) * invScale,
        0, 0, canvas.width, canvas.height
      );
      
      // Get the cropped image as data URL
      const croppedDataURL = canvas.toDataURL('image/png');
      setCroppedImages(prev => [...prev, croppedDataURL]);
      
      // Upload to server
      setSavingStatus("Saving to server...");
      
      const imageName = file.name.replace(/\.[^/.]+$/, "");
      
      // Convert points to original image coordinates
      const originalPoints = [];
      for (let i = 0; i < points.length; i += 2) {
        originalPoints.push({
          x: points[i] * invScale,
          y: points[i + 1] * invScale
        });
      }
      
      // Prepare polygon data for server
      const polygonData = {
        points: originalPoints,
        boundingBox: {
          x: minX * invScale,
          y: minY * invScale,
          width: (maxX - minX) * invScale,
          height: (maxY - minY) * invScale
        }
      };
      
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("file", blob, `polygon_${currentPolygonCount}.png`);
        formData.append("imageName", imageName);
        formData.append("polygonNumber", currentPolygonCount);
        formData.append("polygonData", JSON.stringify(polygonData));
        
        const response = await fetch("http://localhost:5000/api/upload-cropped-image", {
          method: "POST",
          body: formData,
        });
        
        if (response.ok) {
          setSavingStatus(`Saved polygon_${currentPolygonCount} successfully!`);
          setCurrentPolygonCount(prev => prev + 1);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error saving image");
        }
      }, 'image/png');
      
    } catch (error) {
      console.error("Error cropping image:", error);
      setSavingStatus("Error saving to server: " + error.message);
    }
  };

  // Create spreadsheet from cropped images
  const createSpreadsheet = async () => {
    if (!file) {
      setSavingStatus("No uploaded file found.");
      return;
    }

    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension

    try {
      setSavingStatus("Generating spreadsheet...");

      // Step 1: Hit API to generate the spreadsheet
      const generateResponse = await fetch("http://172.25.50.104:8088/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          bucketName: "imagetoexcel",
          fileName: fileName,
          folderName: "cropped_images"
        })
      });

      if (!generateResponse.ok) {
        throw new Error(`Failed to generate spreadsheet: ${generateResponse.status}`);
      }

      console.log("✅ Spreadsheet generated successfully!");

      // Step 2: Fetch Excel File from MinIO
      const excelFetchResponse = await fetch(`http://localhost:5000/api/get-excel?imageName=${fileName}`);

      const data = await excelFetchResponse.json();

      if (excelFetchResponse.ok && data.excelUrl) {
        setExcelFileURL(data.excelUrl);
        setSavingStatus("Spreadsheet ready for download!");
      } else {
        throw new Error("Error fetching spreadsheet from MinIO");
      }
    } catch (error) {
      console.error("Error creating spreadsheet:", error);
      setSavingStatus("Error creating spreadsheet: " + error.message);
    }
  };

  // Delete a specific cropped image
  const deleteCroppedImage = async (index) => {
    try {
      // Request deletion from the server
      const imageName = file.name.replace(/\.[^/.]+$/, "");

      const response = await fetch('172.25.50.104/api/delete-cropped-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketName: bucketName,
          imageName: imageName,
          polygonNumber: index + 1
        })
      });

      if (response.ok) {
        // Remove from UI
        setCroppedImages(prev => prev.filter((_, i) => i !== index));
        setSavingStatus('Image deleted successfully');
        setTimeout(() => setSavingStatus(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error deleting image');
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      // If the server call fails, just remove from UI
      setCroppedImages(prev => prev.filter((_, i) => i !== index));
      setSavingStatus('Warning: Image may not be deleted from server');
      setTimeout(() => setSavingStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-zinc-900 flex flex-col items-center justify-start text-white py-10 overflow-auto">
      <div className="w-[90%] md:w-3/4 lg:w-2/3 xl:w-1/2 bg-zinc-800 rounded-lg shadow-lg p-6 flex flex-col items-center gap-4 border border-gray-700">
        <h2 className="text-2xl font-semibold">Image to Spreadsheet</h2>
        <p className="text-sm">Step 1: Upload Image</p>
        <p className="text-sm">Step 2: Create polygon around column and Save</p>
        <p className="text-sm">Step 3: Create Spreadsheet</p>

        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2">Initializing storage...</p>
          </div>
        ) : !file ? (
          <label className="px-6 py-3 flex items-center bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer shadow-md transition-all duration-300">
            <input
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*"
            />
            <Upload className="mr-2" />
            Choose Spreadsheet Image
          </label>
        ) : (
          <div className="w-full relative" ref={containerRef}>
            {uploadedImage && (
              <Stage 
                width={stageSize.width} 
                height={stageSize.height} 
                ref={stageRef}
                onClick={handleStageClick}
                onMouseMove={handleMouseMove}
              >
                <Layer>
                  {/* Main image */}
                  <Image 
                    image={uploadedImage} 
                    width={stageSize.width}
                    height={stageSize.height}
                  />
                  
                  {/* Completed polygons */}
                  {polygons.map((polygon, index) => (
                    <Group key={polygon.id}>
                      <Line
                        points={polygon.points}
                        closed={true}
                        fill={selectedPolygonIndex === index ? 'rgba(0, 123, 255, 0.2)' : 'rgba(0, 123, 255, 0.1)'}
                        stroke={selectedPolygonIndex === index ? '#007bff' : '#0066cc'}
                        strokeWidth={selectedPolygonIndex === index ? 3 : 2}
                        onClick={() => handlePolygonClick(index)}
                      />
                      
                      {/* Vertices for selected polygon */}
                      {selectedPolygonIndex === index && 
                        polygon.points.map((_, i) => {
                          if (i % 2 === 0) {
                            return (
                              <Circle
                                key={i}
                                x={polygon.points[i]}
                                y={polygon.points[i + 1]}
                                radius={6}
                                fill="#007bff"
                                draggable
                                onDragMove={(e) => handleVertexDragMove(e, i / 2, index)}
                              />
                            );
                          }
                          return null;
                        })
                      }
                      
                      {/* Polygon label */}
                      <Text
                        text={(index + 1).toString()}
                        x={polygon.points.reduce((sum, val, i) => i % 2 === 0 ? sum + val : sum, 0) / (polygon.points.length / 2)}
                        y={polygon.points.reduce((sum, val, i) => i % 2 === 1 ? sum + val : sum, 0) / (polygon.points.length / 2)}
                        fontSize={16}
                        fill="white"
                        align="center"
                        verticalAlign="middle"
                        offsetX={8}
                        offsetY={8}
                      />
                    </Group>
                  ))}
                  
                  {/* Current polygon being drawn */}
                  {currentPoints.length > 0 && (
                    <Line
                      points={[
                        ...currentPoints,
                        ...(mousePosition ? [mousePosition.x, mousePosition.y] : [])
                      ]}
                      stroke="#00ff00"
                      strokeWidth={2}
                    />
                  )}
                  
                  {/* Points of current polygon */}
                  {currentPoints.length > 0 &&
                    currentPoints.map((_, i) => {
                      if (i % 2 === 0) {
                        return (
                          <Circle
                            key={i}
                            x={currentPoints[i]}
                            y={currentPoints[i + 1]}
                            radius={6}
                            fill="#00ff00"
                          />
                        );
                      }
                      return null;
                    })
                  }
                  
                  {/* Close indicator when near starting point */}
                  {currentPoints.length >= 6 && isDrawing && stageRef.current && (
                    (() => {
                      const pos = stageRef.current.getPointerPosition();
                      const firstX = currentPoints[0];
                      const firstY = currentPoints[1];
                      
                      if (pos) {
                        const dx = pos.x - firstX;
                        const dy = pos.y - firstY;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < 20) {
                          return (
                            <Circle
                              x={firstX}
                              y={firstY}
                              radius={8}
                              fill="#ff0000"
                            />
                          );
                        }
                      }
                      return null;
                    })()
                  )}
                </Layer>
              </Stage>
            )}

            <div className="flex flex-wrap gap-4 mt-4 justify-center">
              {!isDrawing ? (
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow-md flex items-center"
                  onClick={startDrawPolygon}
                >
                  <Plus size={18} className="mr-2" />
                  Draw Polygon
                </button>
              ) : (
                <button
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center"
                  onClick={cancelDrawing}
                >
                  Cancel Drawing
                </button>
              )}

              {selectedPolygonIndex !== null && (
                <>
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center"
                    onClick={cropSelectedPolygon}
                  >
                    <Scissors size={18} className="mr-2" />
                    Crop & Save Column
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center"
                    onClick={deleteSelectedPolygon}
                  >
                    <Trash2 size={18} className="mr-2" />
                    Delete Polygon
                  </button>
                </>
              )}

              <button
                onClick={handleDeleteImage}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md flex items-center"
              >
                <Trash2 size={18} className="mr-2" />
                Delete Image
              </button>
              
              {croppedImages.length > 0 && (
                <button
                  onClick={createSpreadsheet}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md flex items-center"
                >
                  <FileText size={18} className="mr-2" />
                  Create Spreadsheet
                </button>
              )}
            </div>

            {/* Status message */}
            {savingStatus && (
              <div className="mt-2 text-center">
                <p className={`text-sm ${savingStatus.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                  {savingStatus}
                </p>
              </div>
            )}

            {/* Instructions */}
            {isDrawing && (
              <div className="mt-2 text-center text-yellow-300 text-sm">
                <p>Click to place points around the column.</p>
                <p>Click near the first point to complete the polygon.</p>
              </div>
            )}

            {/* Excel download link */}
            {excelFileURL && (
              <div className="mt-4 text-center">
                <a
                  href={excelFileURL}
                  download="spreadsheet.xlsx"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg shadow-md flex items-center justify-center mx-auto w-fit"
                >
                  <Download size={18} className="mr-2" />
                  Download Excel Spreadsheet
                </a>
              </div>
            )}
          </div>
        )}

        {croppedImages.length > 0 && (
          <div className="mt-4 w-full">
            <h3 className="text-lg mb-2">Cropped Columns ({croppedImages.length}):</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {croppedImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`Cropped ${index + 1}`}
                    className="w-full rounded-lg border border-gray-600"
                  />
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button
                      onClick={() => deleteCroppedImage(index)}
                      className="bg-red-500 hover:bg-red-600 p-1 rounded-full"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-1 text-center">
                    <span className="text-xs">polygon_{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;