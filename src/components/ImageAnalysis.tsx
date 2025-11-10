import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ImageAnalysisProps {
  imageUrl: string;
  onAnalysisComplete: (analysis: any) => void;
  onStartChat: () => void;
}

export const ImageAnalysis = ({ imageUrl, onAnalysisComplete, onStartChat }: ImageAnalysisProps) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeImage = async () => {
    setAnalyzing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Extract the file path from the imageUrl
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === 'skin-images');
      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      // Generate a signed URL that the AI can access (valid for 1 hour)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('skin-images')
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrlData) {
        throw new Error("Failed to generate image access URL");
      }

      const { data, error } = await supabase.functions.invoke("analyze-skin", {
        body: { imageUrl: signedUrlData.signedUrl, userId: user.id },
      });

      if (error) throw error;

      // Save to database
      const { data: analysisRecord, error: dbError } = await supabase
        .from("skin_analyses")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          analysis_result: data,
          diagnosis: data.diagnosis,
          confidence_score: data.confidence,
          recommendations: data.recommendations,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setAnalysis(data);
      onAnalysisComplete({ ...data, id: analysisRecord.id });
      
      toast({
        title: "Analysis Complete",
        description: "Your skin image has been analyzed successfully.",
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden shadow-medical">
        <img src={imageUrl} alt="Skin analysis" className="w-full h-64 object-cover" />
      </Card>

      {!analysis && (
        <Button
          onClick={analyzeImage}
          disabled={analyzing}
          className="w-full"
          size="lg"
        >
          {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {analyzing ? "Analyzing..." : "Analyze Image"}
        </Button>
      )}

      {analysis && (
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Analysis Results</CardTitle>
              <Badge variant="secondary">
                {analysis.confidence}% Confidence
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  <strong>Important:</strong> This is a preliminary AI analysis and NOT a medical diagnosis. 
                  Always consult a licensed dermatologist for proper diagnosis and treatment.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Preliminary Assessment:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysis.analysis}
              </p>
            </div>

            <Button onClick={onStartChat} className="w-full" variant="default">
              <MessageSquare className="mr-2 h-4 w-4" />
              Ask Questions About This Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};