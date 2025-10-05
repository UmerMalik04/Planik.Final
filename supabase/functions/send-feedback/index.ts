import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface FeedbackRequest {
  feedback: string;
  userEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { feedback, userEmail }: FeedbackRequest = await req.json();

    // Validate input
    if (!feedback || feedback.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Feedback cannot be empty" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (feedback.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Feedback is too long (max 2000 characters)" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const emailResponse = await resend.emails.send({
      from: "Planik Feedback <onboarding@resend.dev>",
      to: ["support@planik.com"],
      replyTo: userEmail || undefined,
      subject: "New Feedback from Planik App",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            New Feedback Received
          </h2>
          
          ${userEmail ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
            <strong>From:</strong> ${userEmail}
          </div>
          ` : ''}
          
          <div style="margin: 20px 0;">
            <h3 style="color: #555;">Feedback:</h3>
            <div style="padding: 15px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px;">
              <p style="margin: 0; white-space: pre-wrap;">${feedback}</p>
            </div>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This feedback was submitted via the Planik Fitness App</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `,
    });

    console.log("Feedback email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-feedback function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
