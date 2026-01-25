export type MerchantRule = {
  match_text: string
  category: string
  is_regex: boolean
}

const categoryRules: { category: string; patterns: RegExp[] }[] = [
  {
    category: 'Groceries',
    patterns: [
      /walmart/i,
      /whole\s*foods/i,
      /trader\s*joe/i,
      /kroger/i,
      /harris\s*teeter/i,
      /giant/i,
      /safeway/i,
      /aldi/i,
      /costco/i,
      /grocery/i,
      /supermarket/i,
    ],
  },
  {
    category: 'Dining',
    patterns: [
      /starbucks/i,
      /cafe/i,
      /coffee/i,
      /restaurant/i,
      /domino/i,
      /pizza/i,
      /tiffin/i,
      /bakery/i,
      /diner/i,
      /grill/i,
      /hello\s*2\s*india/i,
    ],
  },
  {
    category: 'Transport',
    patterns: [/uber/i, /lyft/i, /taxi/i, /shell/i, /chevron/i, /exxon/i, /bp/i],
  },
  {
    category: 'Shopping',
    patterns: [
      /amazon/i,
      /amzn/i,
      /target/i,
      /best\s*buy/i,
      /walmart\.com/i,
      /dollar\s*tree/i,
      /shop/i,
    ],
  },
  {
    category: 'Entertainment',
    patterns: [
      /netflix/i,
      /spotify/i,
      /hulu/i,
      /cinemark/i,
      /movie/i,
      /youtube\s*member/i,
    ],
  },
  {
    category: 'Bills',
    patterns: [/rent/i, /mortgage/i, /utility/i, /internet/i, /payment/i],
  },
  {
    category: 'Health',
    patterns: [/pharmacy/i, /cvs/i, /clinic/i, /dermatology/i, /health/i],
  },
]

export const normalizeMerchantKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const applyMerchantRules = (merchant: string, rules: MerchantRule[]) => {
  const normalized = normalizeMerchantKey(merchant)
  for (const rule of rules) {
    if (!rule.match_text) continue
    if (rule.is_regex) {
      try {
        const regex = new RegExp(rule.match_text, 'i')
        if (regex.test(merchant)) {
          return rule.category
        }
      } catch (err) {
        continue
      }
    } else if (normalized.includes(rule.match_text)) {
      return rule.category
    }
  }
  return null
}

export const categorizeMerchant = (merchant: string) => {
  const value = merchant.toLowerCase()
  for (const rule of categoryRules) {
    if (rule.patterns.some((pattern) => pattern.test(value))) {
      return rule.category
    }
  }
  return 'Uncategorized'
}
