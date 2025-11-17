import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const emailRequestSchema = z.object({
  to: z.string().email({ message: "Invalid email address" }).max(255, { message: "Email must be less than 255 characters" }),
  subject: z.string().trim().min(1, { message: "Subject cannot be empty" }).max(200, { message: "Subject must be less than 200 characters" }),
  html: z.string().min(1, { message: "HTML content cannot be empty" }).max(50000, { message: "HTML content must be less than 50000 characters" })
});

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://twtvzmyvhthvhvulaxfc.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const body = await req.json();

    // Validate and sanitize inputs
    const validation = emailRequestSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input',
          details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { to, subject, html } = validation.data;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Planik <onboarding@resend.dev>', // Using Resend's default domain
        to,
        subject,
        html
      })
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend API error:', data);
      
      // Handle specific Resend errors with appropriate HTTP status codes
      if (data.statusCode === 403 && data.error?.includes('verify a domain')) {
        return new Response(
          JSON.stringify({ 
            error: 'Domain verification required', 
            message: 'Please verify your domain at resend.com/domains to send emails to other recipients',
            details: data 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Return 500 for other Resend API errors
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: data }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});