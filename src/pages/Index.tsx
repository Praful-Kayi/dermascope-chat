import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Auth } from "@/components/Auth";
import { CameraCapture } from "@/components/CameraCapture";
import { ImageAnalysis } from "@/components/ImageAnalysis";
import { ChatInterface } from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { Microscope, LogOut, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type View = "capture" | "analysis" | "chat";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("capture");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleImageCapture = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("skin-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("skin-images").getPublicUrl(fileName);

      setSelectedImage(publicUrl);
      setView("analysis");
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setView("capture");
    setSelectedImage(null);
    setCurrentAnalysis(null);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

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
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
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