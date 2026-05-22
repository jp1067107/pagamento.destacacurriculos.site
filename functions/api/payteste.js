export async function onRequestPost(context) {
    // v1.0.2-teste - Checkout Transparente PIX (R$ 1,00) para Diagnóstico
    const { request, env } = context;

    try {
        const body = await request.json();
        const { full_name, email, cpf } = body;

        // Validação básica
        if (!full_name || !email || !cpf) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }

        const accessToken = env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN não configurado' }), { status: 500 });
        }

        // Limpar CPF (deixar apenas números)
        const cleanCpf = cpf.replace(/\D/g, '');
        
        // Separar Nome e Sobrenome
        const nameParts = full_name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Sobrenome';

        const paymentData = {
            transaction_amount: 2.00,
            description: "Teste de Diagnóstico (R$ 2,00)",
            payment_method_id: "pix",
            payer: {
                email: email,
                first_name: firstName,
                last_name: lastName,
                identification: {
                    type: "CPF",
                    number: cleanCpf
                }
            },
            metadata: {
                source: "diagnostico_capi"
            }
        };

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': crypto.randomUUID()
            },
            body: JSON.stringify(paymentData)
        });

        const result = await response.json();

        if (response.ok) {
            const transactionData = result.point_of_interaction.transaction_data;
            return new Response(JSON.stringify({
                id: result.id,
                qr_code: transactionData.qr_code,
                qr_code_base64: transactionData.qr_code_base64
            }), { 
                headers: { 'Content-Type': 'application/json' } 
            });
        } else {
            return new Response(JSON.stringify({ error: 'Erro no Mercado Pago', details: result }), { status: 400 });
        }

    } catch (error) {
        return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), { status: 500 });
    }
}
