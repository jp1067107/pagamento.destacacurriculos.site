export async function onRequestPost(context) {
  const { request, env } = context;
  
  // No Cloudflare Pages Functions, as variáveis de ambiente 
  // são acessadas através do objeto 'env' dentro do 'context'.
  const accessToken = env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    return new Response(JSON.stringify({ 
      error: 'ERRO: MP_ACCESS_TOKEN não encontrado.',
      ajuda: 'Vá em Settings > Functions > Variables no painel do Pages e adicione a variável lá.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const preference = {
      items: [
        {
          title: "Pacote de Currículos Premium",
          unit_price: 23.00,
          quantity: 1,
          currency_id: "BRL"
        }
      ],
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

    return new Response(JSON.stringify({ url: data.init_point || null }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
