export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const env = context.env;

    // 1. Confirma o recebimento rápido para o Mercado Pago não travar ou reenviar
    if (!body.data || !body.data.id) return new Response("OK", { status: 200 });

    const paymentId = body.data.id;

    // 2. Consulta a API do Mercado Pago para resgatar os dados REAIS do comprador
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { "Authorization": `Bearer ${env.MP_ACCESS_TOKEN}` }
    });
    
    const paymentData = await mpResponse.json();

    // 3. Se o PIX foi pago, processamos o rastreamento avançado
    if (paymentData.status === "approved") {
      
      // Captura o e-mail e o primeiro nome do cliente retornados pelo MP
      const email = paymentData.payer?.email || "";
      const firstName = paymentData.payer?.first_name || "";
      const value = paymentData.transaction_amount;

      // Função de Criptografia SHA-256 (Obrigatória pela API de Conversões do Meta)
      const hashData = async (text) => {
        if (!text) return "";
        const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text.trim().toLowerCase()));
        return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, "0")).join("");
      };

      const hashedEmail = await hashData(email);
      const hashedName = await hashData(firstName);

      // 4. Monta o payload incluindo o bloco 'user_data' de alta qualidade
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

      // 5. Dispara a conversão completa para o Facebook
      await fetch(`https://graph.facebook.com/v19.0/${env.META_PIXEL_ID}/events?access_token=${env.META_ACCESS_TOKEN}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData)
      });
    }

    return new Response("OK", { status: 200 });
    
  } catch (error) {
    return new Response("Erro interno", { status: 500 });
  }
}
