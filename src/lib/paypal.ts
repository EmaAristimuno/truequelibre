import "server-only";

const API_BASE = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET no están configuradas");
  }

  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`No se pudo autenticar con PayPal (${res.status})`);
  }

  const data: { access_token: string } = await res.json();
  return data.access_token;
}

export interface CreateOrderParams {
  amount: string;
  currency: string;
  description: string;
  referenceId: string;
  returnUrl: string;
  cancelUrl: string;
}

export async function createOrder(params: CreateOrderParams): Promise<{
  id: string;
  approveUrl: string;
}> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: params.referenceId,
          custom_id: params.referenceId,
          description: params.description,
          amount: {
            currency_code: params.currency,
            value: params.amount,
          },
        },
      ],
      application_context: {
        brand_name: "TruequeLibre",
        user_action: "PAY_NOW",
        return_url: params.returnUrl,
        cancel_url: params.cancelUrl,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`No se pudo crear la orden de PayPal (${res.status})`);
  }

  const data: { id: string; links: { rel: string; href: string }[] } = await res.json();
  const approveUrl = data.links.find((link) => link.rel === "approve")?.href;

  if (!approveUrl) {
    throw new Error("PayPal no devolvió un link de aprobación");
  }

  return { id: data.id, approveUrl };
}

export async function captureOrder(orderId: string): Promise<{ status: string }> {
  const accessToken = await getAccessToken();

  const res = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data: { status: string } = await res.json();

  if (!res.ok) {
    throw new Error(`No se pudo capturar la orden de PayPal (${res.status})`);
  }

  return { status: data.status };
}
