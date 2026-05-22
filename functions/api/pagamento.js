export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Obter o Access Token das variáveis de ambiente do Cloudflare
  // Você deve configurar a variável MP_ACCESS_TOKEN no painel do Cloudflare Pages
  const accessToken = env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Access Token não configurado.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. Criar a Preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: "Pacote de Currículos Premium",
          unit_price: 23.00,
          quantity: 1,
          currency_id: "BRL"
        }
      ],
      payment_methods: {
        excluded_payment_types: [],
        installments: 1 // Opcional: limitar parcelas
      },
      // Aqui inserimos os dados de rastreamento para o Mercado Pago enviar ao Facebook
      tracks: [
        {
          type: "facebook_ad",
          values: {
            pixel_id: "780585197508218"
          }
        }
      ],
      back_urls: {
        success: "https://pagamento.destacacurriculos.site/",
        failure: "https://pagamento.destacacurriculos.site/",
        pending: "https://pagamento.destacacurriculos.site/"
      },
      auto_return: "approved"
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preference)
    });

    const data = await response.json();

    if (data.init_point) {
      return new Response(JSON.stringify({ url: data.init_point }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Erro ao criar preferência.', details: data }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno no servidor.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
