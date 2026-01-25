import { NextResponse } from 'next/server'

type ParsedReceipt = {
  date: string | null
  amount: number | null
  merchant: string | null
}

const readField = (field: any) => {
  if (field === null || field === undefined) return null
  if (typeof field === 'string' || typeof field === 'number') return field
  if (typeof field.value !== 'undefined') return field.value
  if (typeof field.raw !== 'undefined') return field.raw
  return null
}

const parseAmount = (value: any) => {
  if (value === null || value === undefined) return null
  const numberValue = Number.parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  if (Number.isNaN(numberValue)) return null
  return Math.abs(numberValue)
}

const extractReceipt = (data: any): ParsedReceipt => {
  const fields =
    data?.document?.inference?.prediction || data?.inference?.result?.fields || {}

  const merchant =
    readField(fields.merchant_name) ||
    readField(fields.supplier_name) ||
    readField(fields.supplier) ||
    readField(fields.company) ||
    readField(fields.store) ||
    readField(fields.name) ||
    null

  const amount =
    parseAmount(readField(fields.total_amount)) ??
    parseAmount(readField(fields.total)) ??
    parseAmount(readField(fields.total_amount_incl)) ??
    parseAmount(readField(fields.total_amount_excl)) ??
    parseAmount(readField(fields.amount)) ??
    null

  const date =
    readField(fields.date) ||
    readField(fields.receipt_date) ||
    readField(fields.invoice_date) ||
    null

  return { date, amount, merchant }
}

export async function POST(request: Request) {
  const mindeeKey = process.env.MINDEE_API_KEY
  const receiptModelId = process.env.MINDEE_RECEIPT_MODEL_ID

  if (!mindeeKey || !receiptModelId) {
    return NextResponse.json(
      { error: 'Receipt parser is not configured.' },
      { status: 400 }
    )
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing receipt file.' }, { status: 400 })
  }

  const upstreamForm = new FormData()
  upstreamForm.append('file', file)
  upstreamForm.append('model_id', receiptModelId)

  const enqueueResponse = await fetch('https://api-v2.mindee.net/v2/inferences/enqueue', {
    method: 'POST',
    headers: {
      Authorization: mindeeKey,
      Accept: 'application/json',
    },
    body: upstreamForm,
  })

  if (!enqueueResponse.ok) {
    const details = await enqueueResponse.text()
    return NextResponse.json(
      { error: 'Receipt parser failed.', details },
      { status: 400 }
    )
  }

  const enqueueData = await enqueueResponse.json()
  const enqueueJob = enqueueData?.job || enqueueData
  let pollingUrl = enqueueJob?.polling_url

  if (!pollingUrl) {
    return NextResponse.json(
      { error: 'Receipt parser failed.', details: enqueueData },
      { status: 400 }
    )
  }

  let resultUrl: string | null = null
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const pollResponse = await fetch(pollingUrl, {
      headers: { Authorization: mindeeKey, Accept: 'application/json' },
      redirect: 'manual',
    })

    if (pollResponse.status === 302) {
      resultUrl = pollResponse.headers.get('Location') || pollResponse.headers.get('location')
      if (resultUrl) break
    } else {
      const pollData = await pollResponse.json().catch(() => null)
      const pollJob = pollData?.job || pollData
      resultUrl = pollJob?.result_url || null
      if (pollJob?.polling_url) {
        pollingUrl = pollJob.polling_url
      }
      if (resultUrl) break
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  if (!resultUrl) {
    return NextResponse.json(
      { error: 'Receipt parser timed out. Try again.' },
      { status: 408 }
    )
  }

  const resultResponse = await fetch(resultUrl, {
    headers: { Authorization: mindeeKey, Accept: 'application/json' },
  })

  if (!resultResponse.ok) {
    const details = await resultResponse.text()
    return NextResponse.json(
      { error: 'Receipt parser failed.', details },
      { status: 400 }
    )
  }

  const data = await resultResponse.json()
  const receipt = extractReceipt(data)

  if (!receipt.merchant && !receipt.amount) {
    return NextResponse.json(
      { error: 'No receipt fields detected.', details: data },
      { status: 400 }
    )
  }

  return NextResponse.json({ receipt })
}
