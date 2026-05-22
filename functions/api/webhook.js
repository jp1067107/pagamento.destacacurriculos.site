export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const env = context.env;

    console.log("1. Webhook recebido do Mercado Pago. ID:", body.data?.id);

    if (!body.data || !body.data.id) return new Response("OK", { status: 200 });

    const paymentId = body.data.id;

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}` }
    });
    
    const paymentData = await mpResponse.json();
    console.log("2. Status real do pagamento no MP:", paymentData.status);

    if (paymentData.status === "approved") {
      console.log("3. PIX Aprovado! A processar dados para o Facebook...");
      
      const email = paymentData.payer?.email || "";
      const firstName = paymentData.payer?.first_name || "";
      const value = paymentData.transaction_amount;

      const hashData = async (text) => {
        if (!text) return "";
        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim().toLowerCase()));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      };

      const hashedEmail = await hashData(email);
      const hashedName = await hashData(firstName);

      const eventData = {
        data: [{
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: hashedEmail ? [hashedEmail] : [],
            fn: hashedName ? [hashedName] : []
          },
          custom_data: { 
            currency: "BRL", 
            value: value 
          }
        }]
      };

      const fbResponse = await fetch(`https://graph.facebook.com/v19.0/${env.META_PIXEL_ID}/events?access_token=${env.META_ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });

      const fbResult = await fbResponse.json();
      console.log("4. RESPOSTA DO FACEBOOK:", JSON.stringify(fbResult));
    }

    return new Response("OK", { status: 200 });
    
  } catch (error) {
    console.log("ERRO FATAL NO CÓDIGO:", error.message);
    return new Response("Erro interno", { status: 500 });
  }
}
