import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, userId } = await req.json();
    console.log('Analyzing skin image:', { imageUrl, userId });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call Lovable AI with vision capabilities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an AI dermatology assistant. Analyze skin images and provide:
1. Preliminary diagnosis (with disclaimer that this is NOT medical advice)
2. Confidence level (0-100%)
3. Key observations
4. Recommendations for next steps
5. When to seek professional medical attention

IMPORTANT: Always emphasize that this is preliminary analysis and users should consult a licensed dermatologist for proper diagnosis.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this skin image and provide a preliminary assessment.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices[0].message.content;
    console.log('Analysis completed successfully');

    // Parse the analysis to extract structured data
    const diagnosis = analysis.split('\n')[0] || 'Analysis completed';
    const confidence = 75; // Default confidence

    return new Response(
      JSON.stringify({
        analysis,
        diagnosis,
        confidence,
        recommendations: analysis
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in analyze-skin:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});