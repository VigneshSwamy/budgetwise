import { NextResponse } from 'next/server'

type ParsedRow = {
  date: string
  amount: number
  merchant: string
  category?: string | null
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

const extractMindeeRows = (data: any): ParsedRow[] => {
  const prediction =
    data?.document?.inference?.prediction || data?.inference?.result?.fields || {}

  const listItems = prediction?.list_of_transactions?.items
  const v2Transactions = Array.isArray(listItems)
    ? listItems.map((item: any) => item?.fields || item)
    : null

  const transactions =
    v2Transactions ||
    prediction?.transactions ||
    prediction?.line_items ||
    prediction?.operations ||
    prediction?.statement_lines ||
    []

  if (!Array.isArray(transactions)) {
    return []
  }

  return transactions
    .map((tx: any) => {
      const date =
        readField(tx.date) ||
        readField(tx.transaction_date) ||
        readField(tx.posting_date) ||
        ''
      const merchant =
        readField(tx.description) ||
        readField(tx.label) ||
        readField(tx.payee) ||
        readField(tx.merchant) ||
        readField(tx.name) ||
        ''
      const amount =
        parseAmount(readField(tx.amount)) ??
        parseAmount(readField(tx.debit)) ??
        parseAmount(readField(tx.credit)) ??
        parseAmount(readField(tx.value))
      const category =
        readField(tx.category) ||
        readField(tx.transaction_type) ||
        readField(tx.type) ||
        null

      return {
        date,
        amount: amount ?? NaN,
        merchant,
        category,
      }
    })
    .filter((row: ParsedRow) => row.date && Number.isFinite(row.amount) && row.merchant)
}

export async function POST(request: Request) {
  const mindeeKey = process.env.MINDEE_API_KEY
  const mindeeEndpoint =
    process.env.MINDEE_BANK_STATEMENT_ENDPOINT ||
    'https://api.mindee.net/v1/products/mindee/bank_statement/v1/predict'
  const mindeeModelId = process.env.MINDEE_MODEL_ID
  const useEnqueue = !process.env.MINDEE_BANK_STATEMENT_ENDPOINT && !!mindeeModelId

  if (!mindeeKey) {
    return NextResponse.json({ error: 'Mindee API key is not configured.' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing PDF file.' }, { status: 400 })
  }

  const upstreamForm = new FormData()
  if (useEnqueue) {
    upstreamForm.append('file', file)
    upstreamForm.append('model_id', mindeeModelId as string)
  } else {
    upstreamForm.append('document', file)
  }

  let data: any = null

  if (useEnqueue) {
    const enqueueResponse = await fetch('https://api-v2.mindee.net/v2/inferences/enqueue', {
      method: 'POST',
      headers: {
        Authorization: mindeeKey,
        Accept: 'application/json',
      },
      body: upstreamForm,
    })

    if (!enqueueResponse.ok && enqueueResponse.status !== 404) {
      const details = await enqueueResponse.text()
      return NextResponse.json(
        { error: 'Statement parser failed.', details },
        { status: 400 }
      )
    }

    if (enqueueResponse.status === 404) {
      const fallbackEndpoint = `https://api.mindee.net/v1/models/${mindeeModelId}/predict`
      const response = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: {
          Authorization: `Token ${mindeeKey}`,
          'X-API-Key': mindeeKey,
          Accept: 'application/json',
        },
        body: upstreamForm,
      })

      if (!response.ok) {
        const details = await response.text()
        return NextResponse.json(
          { error: 'Statement parser failed.', details },
          { status: 400 }
        )
      }

      data = await response.json()
    } else {
      const enqueueData = await enqueueResponse.json()
      const enqueueJob = enqueueData?.job || enqueueData
      let pollingUrl = enqueueJob?.polling_url

      if (!pollingUrl) {
        return NextResponse.json(
          { error: 'Statement parser failed.', details: enqueueData },
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
          resultUrl =
            pollResponse.headers.get('Location') || pollResponse.headers.get('location')
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
          { error: 'Statement parser timed out. Try again.' },
          { status: 408 }
        )
      }

      const resultResponse = await fetch(resultUrl, {
        headers: { Authorization: mindeeKey, Accept: 'application/json' },
      })

      if (!resultResponse.ok) {
        const details = await resultResponse.text()
        return NextResponse.json(
          { error: 'Statement parser failed.', details },
          { status: 400 }
        )
      }

      data = await resultResponse.json()
    }
  } else {
    const response = await fetch(mindeeEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${mindeeKey}`,
        'X-API-Key': mindeeKey,
        Accept: 'application/json',
      },
      body: upstreamForm,
    })

    if (!response.ok) {
      const details = await response.text()
      return NextResponse.json(
        { error: 'Statement parser failed.', details },
        { status: 400 }
      )
    }

    data = await response.json()
  }

  const rows = extractMindeeRows(data)

  if (!rows.length) {
    return NextResponse.json(
      {
        error: 'No transactions found in this statement.',
        details: data,
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ rows })
}
