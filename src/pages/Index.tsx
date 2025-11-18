import { useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Microscope, ArrowLeft } from "lucide-react";

type View = "capture" | "analysis" | "chat";

const Index = () => {
  const [view, setView] = useState<View>("capture");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);

  const handleImageCapture = (file: File) => {
    // Create local URL for the image
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    setView("analysis");
  };

  const handleBack = () => {
    if (view === "chat") {
      setView("analysis");
    } else if (view === "analysis") {
      setView("capture");
      setSelectedImage(null);
      setCurrentAnalysis(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <header className="bg-card shadow-soft border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view !== "capture" && (
                <Button onClick={handleBack} variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Microscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">DermaScan AI</h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Skin Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {view === "capture" && <CameraCapture onImageCapture={handleImageCapture} />}
        
        {view === "analysis" && selectedImage && (
          <ImageAnalysis
            imageUrl={selectedImage}
            onAnalysisComplete={setCurrentAnalysis}
            onStartChat={() => setView("chat")}
          />
        )}

        {view === "chat" && (
          <ChatInterface
            analysisContext={currentAnalysis?.analysis}
            analysisId={currentAnalysis?.id}
          />
        )}
      </main>
    </div>
  );
};

export default Index;