const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateMemberCode(name: string, roleSalt: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cleanName = name.trim().toLowerCase();
  const seed = cleanName + roleSalt.toLowerCase();
  const prefix = cleanName.slice(0, 3).toUpperCase().padEnd(3, 'X');
  const segments: string[] = [];
  let hash = hashString(seed);
  for (let s = 0; s < 4; s++) {
    let seg = '';
    for (let c = 0; c < 4; c++) {
      seg += chars[hash % chars.length];
      hash = Math.floor(hash / chars.length) + hashString(seed + s + c) * 31;
    }
    segments.push(seg);
  }
  return `KK-${prefix}-${segments.join('-')}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { name, role } = await req.json();

    if (!name || typeof name !== 'string' || !name.trim()) {
      return new Response(
        JSON.stringify({ error: "Name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!role || typeof role !== 'string') {
      return new Response(
        JSON.stringify({ error: "Role is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const maxLength = 30;
    const sanitizedName = name.trim().slice(0, maxLength);
    const sanitizedRole = role.trim().slice(0, 100);

    const memberCode = generateMemberCode(sanitizedName, sanitizedRole);

    return new Response(
      JSON.stringify({ memberCode }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message ?? "Failed to generate member code" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
