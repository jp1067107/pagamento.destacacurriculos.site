export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        
        // Identificar se é uma notificação de pagamento
        // O Mercado Pago envia o ID do pagamento no body.data.id ou via query params dependendo da versão
        const paymentId = body.data?.id || body.resource?.split('/').pop();
        const action = body.action || body.topic;

        if (paymentId && (action === 'payment.updated' || action === 'payment')) {
            const accessToken = env.MP_ACCESS_TOKEN;
            
            // Consultar o status atual do pagamento na API do Mercado Pago
            const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (response.ok) {
                const payment = await response.json();

                if (payment.status === 'approved') {
                    // TODO: Inserir disparo da API de Conversões do Meta (CAPI) e liberação do serviço aqui
                    console.log(`Pagamento ${paymentId} aprovado! Processando entrega...`);
                }
            }
        }

        // Retornar 200 OK imediatamente para o Mercado Pago
        return new Response('OK', { status: 200 });

    } catch (error) {
        // Mesmo em erro, retornamos 200 para evitar retentativas infinitas do Webhook 
        // a menos que queiramos que o MP tente novamente.
        console.error('Erro no Webhook:', error.message);
        return new Response('Webhook Error', { status: 200 });
    }
}
