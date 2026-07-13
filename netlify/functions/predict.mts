function modelParameters() {
  return {
    coefficients: [
      0.03428335189394184,
      -1.0460704191099142,
      -0.007209257213608298,
      -0.01314110579659732,
      0.678314588750492,
      0.10165319359287958,
      -0.05251692387556945,
      -0.005492807262324324,
      -0.005421046709343367,
      0.05487804310991572,
    ],
    intercept: -0.3868892343400534,
  }
}

function featureDefinitions() {
  return [
    { key: "age", label: "Age", min: 18, max: 100 },
    { key: "gender", label: "Gender", min: 0, max: 1 },
    { key: "tenure", label: "Tenure", min: 0, max: 120 },
    { key: "usageFrequency", label: "Usage frequency", min: 0, max: 100 },
    { key: "supportCalls", label: "Support calls", min: 0, max: 100 },
    { key: "paymentDelay", label: "Payment delay", min: 0, max: 365 },
    { key: "subscriptionType", label: "Subscription type", min: 0, max: 2 },
    { key: "contractLength", label: "Contract length", min: 0, max: 2 },
    { key: "totalSpend", label: "Total spend", min: 0, max: 1000000 },
    { key: "lastInteraction", label: "Last interaction", min: 0, max: 365 },
  ]
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  })
}

export default async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204 })
  }

  if (request.method !== "POST") {
    return json({ error: "Send customer data with a POST request." }, 405)
  }

  let body

  try {
    body = await request.json()
  } catch {
    return json({ error: "The request body must be valid JSON." }, 400)
  }

  const definitions = featureDefinitions()
  const values = []

  for (const feature of definitions) {
    const value = Number(body[feature.key])

    if (!Number.isFinite(value)) {
      return json({ error: `${feature.label} must be a number.` }, 400)
    }

    if (value < feature.min || value > feature.max) {
      return json(
        { error: `${feature.label} must be between ${feature.min} and ${feature.max}.` },
        400,
      )
    }

    values.push(value)
  }

  const { coefficients, intercept } = modelParameters()
  const score = values.reduce(
    (total, value, index) => total + value * coefficients[index],
    intercept,
  )
  const probability = 1 / (1 + Math.exp(-score))
  const prediction = probability >= 0.5 ? 1 : 0

  return json({
    prediction,
    churn: prediction === 1 ? "Yes" : "No",
    probability: Number(probability.toFixed(6)),
    probabilityPercent: Number((probability * 100).toFixed(1)),
  })
}

export const config = {
  path: ["/api/predict", "/predict"],
}
