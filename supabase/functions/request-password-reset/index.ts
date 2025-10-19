import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    console.log("Password reset requested for:", email);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Generate password reset link via Supabase
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    const resetLink = data.properties.action_link;

    console.log("Sending password reset email via Resend...");

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: "Planik <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Planik Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #1a1a1a; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { color: #ffffff; font-size: 32px; font-weight: bold; text-align: center; margin: 30px 0 10px; }
              .subtitle { color: #999999; font-size: 16px; text-align: center; margin: 0 0 30px; }
              .message-box { background-color: #2a2a2a; border-radius: 8px; padding: 30px; margin: 20px 0; }
              .text { color: #cccccc; font-size: 16px; line-height: 24px; margin: 0 0 16px; }
              .button-container { text-align: center; margin: 30px 0; }
              .button { background-color: #4A9EFF; border-radius: 8px; color: #000000; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 40px; display: inline-block; }
              .security-tip { background-color: #4a4a2a; border-radius: 8px; padding: 20px; margin: 20px 0; }
              .security-text { color: #d4c894; font-size: 14px; margin: 0; }
              .footer-text { color: #999999; font-size: 13px; margin: 20px 0 10px; }
              .link-text { color: #4A9EFF; font-size: 12px; word-break: break-all; margin: 0 0 20px; }
              .footer { color: #666666; font-size: 13px; margin: 30px 0 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 class="header">Reset Your Password</h1>
              <p class="subtitle">Planik Fitness App</p>
              
              <div class="message-box">
                <p class="text">Hello,</p>
                <p class="text">You requested to reset your password for your Planik account.</p>
                <p class="text">Click the button below to reset your password:</p>
              </div>

              <div class="button-container">
                <a href="${resetLink}" class="button">Reset My Password</a>
              </div>

              <div class="security-tip">
                <p class="security-text"><strong>Security tip:</strong> This link will expire in 24 hours for your security.</p>
              </div>

              <p class="footer-text">If you can't click the button, copy and paste this link into your browser:</p>
              <p class="link-text">${resetLink}</p>

              <p class="footer">If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in request-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
