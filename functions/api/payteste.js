export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { full_name, email, cpf } = body;

        console.log("Iniciando geração de PIX de teste (R$ 5,00) para:", email);

        if (!full_name || !email || !cpf) {
            return new Response(JSON.stringify({ error: 'Dados incompletos' }), { status: 400 });
        }

        const accessToken = env.MP_ACCESS_TOKEN;
        const cleanCpf = cpf.replace(/\D/g, '');
        const nameParts = full_name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Sobrenome';

        const paymentData = {
            transaction_amount: 5.00, // Aumentado para 5 para evitar limites mínimos
            description: "Teste de Diagnóstico (R$ 5,00)",
            payment_method_id: "pix",
            payer: {
                email: email,
                first_name: firstName,
                last_name: lastName,
                identification: {
                    type: "CPF",
                    number: cleanCpf
                }
            }
        };

        const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': crypto.randomUUID()
            },
            body: JSON.stringify(paymentData)
        });

        const result = await mpResponse.json();

        if (mpResponse.ok) {
            console.log("PIX de teste gerado com sucesso! ID:", result.id);
            const transactionData = result.point_of_interaction.transaction_data;
            return new Response(JSON.stringify({
                id: result.id,
                qr_code: transactionData.qr_code,
                qr_code_base64: transactionData.qr_code_base64
            }), { headers: { 'Content-Type': 'application/json' } });
        } else {
            console.error("Erro do Mercado Pago no teste:", JSON.stringify(result));
            return new Response(JSON.stringify({ error: 'Erro no Mercado Pago', details: result }), { status: 400 });
        }

    } catch (error) {
        console.error("Erro fatal no payteste:", error.message);
        return new Response(JSON.stringify({ error: 'Erro interno', details: error.message }), { status: 500 });
    }
}
