export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Rota da API de Pagamento
    if (url.pathname === "/api/pagamento" && request.method === "POST") {
      const accessToken = env.MP_ACCESS_TOKEN;

      if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Configuração pendente: Defina MP_ACCESS_TOKEN no painel do Cloudflare.' }), {
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

        return new Response(JSON.stringify({ url: data.init_point || null, error: data.init_point ? null : 'Erro na API do MP' }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Fallback: Servir os arquivos estáticos do site (index.html, etc)
    return env.ASSETS.fetch(request);
  }
};
