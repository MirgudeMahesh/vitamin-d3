import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
console.log("IMACX Direct Session function booted ✅");
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json().catch(()=>({}));
    const { imacx_id } = body;
    if (!imacx_id) {
      return new Response(JSON.stringify({
        error: "Missing imacx_id"
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const JWT_SECRET = Deno.env.get("JWT_SECRET");
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !JWT_SECRET) {
      throw new Error("Missing environment variables (SUPABASE_URL, SERVICE_ROLE_KEY, JWT_SECRET)");
    }
    // ✅ Properly import key for signing
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(JWT_SECRET), {
      name: "HMAC",
      hash: "SHA-256"
    }, false, [
      "sign",
      "verify"
    ]);
    // Supabase admin client
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: user, error: userError } = await supabase.from("users").select("id, email").eq("imacx_id", imacx_id).single();
    if (userError || !user) {
      return new Response(JSON.stringify({
        error: "Invalid or unknown IMACX ID"
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // ✅ Create JWT
    const payload = {
      aud: "authenticated",
      exp: getNumericDate(60 * 60),
      sub: user.id,
      email: user.email,
      role: "authenticated"
    };
    const access_token = await create({
      alg: "HS256",
      typ: "JWT"
    }, payload, key);
    // ✅ Return JWT session
    return new Response(JSON.stringify({
      session: {
        access_token,
        token_type: "bearer",
        user
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({
      error: err.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
