import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Download, AlertCircle } from "lucide-react";
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
      // Convert blob URL to base64 for AI analysis
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64Image = await base64Promise;

      const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-skin`;
      const analysisResponse = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ imageUrl: base64Image }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Analysis failed");
      }

      const data = await analysisResponse.json();
      if (!data || !data.analysis) throw new Error("No analysis returned");

      const analysisData = {
        ...data,
        id: Date.now().toString(),
      };

      setAnalysis(analysisData);
      onAnalysisComplete(analysisData);
      
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

  const downloadAnalysis = () => {
    if (!analysis) return;

    const content = `DermaScan AI Analysis Report
Generated: ${new Date().toLocaleString()}

Diagnosis: ${analysis.diagnosis || 'See full analysis'}
Confidence: ${analysis.confidence}%

Full Analysis:
${analysis.analysis}

---
Disclaimer: This is a preliminary AI analysis and NOT a medical diagnosis. 
Please consult a licensed dermatologist for proper diagnosis and treatment.
`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dermascan-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Analysis report has been downloaded",
    });
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

            <div className="flex gap-2">
              <Button onClick={downloadAnalysis} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button onClick={onStartChat} className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                Ask Questions
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};