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

    // Restrict redirect URL to a hardcoded allowlist to prevent open redirect / phishing attacks.
    // Never trust the caller-controlled Origin header for building auth redirect URLs.
    const ALLOWED_ORIGINS = [
      'https://planik.org.uk',
    ];
    const requestOrigin = req.headers.get('origin') || '';
    const origin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
    const redirectUrl = `${origin}/auth?type=recovery`;

    console.log("Redirect URL:", redirectUrl);

    // Generate password reset link via Supabase with proper redirect
    const { data, error } = await supabaseClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (error) {
      console.error("Error generating reset link:", error);
      throw error;
    }

    const resetLink = data.properties.action_link;

    console.log("Sending password reset email via Resend...");

    // Send email via Resend with your custom template
    const emailResult = await resend.emails.send({
      from: "Planik <onboarding@resend.dev>",
      to: [email],
      subject: "Reset Your Planik Password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Reset Your Password</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f9fafc;
                color: #333;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                background-color: #ffffff;
                margin: 40px auto;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              }
              h2 {
                text-align: center;
                color: #222;
                margin-bottom: 4px;
              }
              h4 {
                text-align: center;
                color: #666;
                font-weight: normal;
                margin-top: 0;
              }
              .message {
                background-color: #f5f7fa;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                text-align: left;
              }
              .button {
                display: inline-block;
                background-color: #007bff;
                color: #ffffff !important;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 6px;
                margin: 20px 0;
                font-weight: bold;
              }
              .button:hover {
                background-color: #0056b3;
              }
              .warning {
                background-color: #fff8e1;
                color: #8a6d3b;
                border-left: 4px solid #ffcc00;
                padding: 12px 16px;
                border-radius: 4px;
                font-size: 14px;
                margin-bottom: 20px;
              }
              .note {
                background-color: #e8f0fe;
                color: #2f4f90;
                padding: 10px;
                border-radius: 4px;
                font-size: 13px;
                margin-top: 20px;
              }
              p {
                line-height: 1.5;
              }
              footer {
                font-size: 13px;
                text-align: center;
                color: #777;
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Reset Your Password</h2>
              <h4>Planik Fitness App</h4>

              <div class="message">
                <p>Hello,</p>
                <p>You requested to reset your password for your Planik account.</p>
                <p>Click the button below to reset your password:</p>

                <p style="text-align:center;">
                  <a href="${resetLink}" class="button">Reset My Password</a>
                </p>

                <div class="warning">
                  <strong>Security tip:</strong> This link will expire in 24 hours for your security.
                </div>

                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>

                <hr />

                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

                <footer>
                  This email was sent from Planik Fitness App.<br />
                  <div class="note">
                    Note: Check your inbox and spam folder. The email should arrive within a few minutes.
                  </div>
                </footer>
              </div>
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
    // Return a generic message — never leak internal error details to clients.
    return new Response(
      JSON.stringify({ error: "Failed to send password reset email" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
