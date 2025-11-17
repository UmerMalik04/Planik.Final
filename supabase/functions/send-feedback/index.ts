import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const feedbackSchema = z.object({
  feedback: z.string().trim().min(1, { message: "Feedback cannot be empty" }).max(2000, { message: "Feedback is too long (max 2000 characters)" }),
  userEmail: z.string().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }).optional()
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://twtvzmyvhthvhvulaxfc.supabase.co",
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
    const body = await req.json();

    // Validate and sanitize inputs
    const validation = feedbackSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid input",
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const { feedback, userEmail } = validation.data;

    const emailResponse = await resend.emails.send({
      from: "Planik Feedback <onboarding@resend.dev>",
      to: ["u.malik3104@gmail.com"],
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
