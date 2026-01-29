'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CategoryIcon } from '@/components/shared/CategoryIcon'

 type TransactionRowProps = {
   id: string
   name: string
   category: string
   amount: number
   date: string
 }

 export default function TransactionRow({
   id,
   name,
   category,
   amount,
   date,
 }: TransactionRowProps) {
   const router = useRouter()
   const [isDeleting, setIsDeleting] = useState(false)
   const [error, setError] = useState<string | null>(null)

   const handleDelete = async () => {
     if (isDeleting) return
     const confirmed = window.confirm('Delete this transaction? This cannot be undone.')
     if (!confirmed) return

     setIsDeleting(true)
     setError(null)
     try {
       const supabase = createClient()
       const { error: deleteError } = await supabase
         .from('expenses')
         .delete()
         .eq('id', id)

       if (deleteError) {
         setError(deleteError.message)
         setIsDeleting(false)
         return
       }

       router.refresh()
     } catch (err) {
       setError('Unable to delete transaction.')
       setIsDeleting(false)
     }
   }

   return (
     <div className="flex items-center justify-between gap-4 px-6 py-4">
       <div className="flex min-w-0 items-center gap-4">
         <CategoryIcon category={category} />
         <div className="min-w-0">
           <p className="truncate font-medium text-stone-900">{name}</p>
           <p className="text-sm text-stone-500">{category}</p>
           {error ? (
             <p className="mt-1 text-xs text-terracotta-600">{error}</p>
           ) : null}
         </div>
       </div>
       <div className="flex items-center gap-4">
         <div className="text-right">
           <p className="font-semibold text-stone-900">-${amount.toFixed(2)}</p>
           <p className="text-xs text-stone-400">{date}</p>
         </div>
         <button
           type="button"
           onClick={handleDelete}
           disabled={isDeleting}
           className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
           aria-label="Delete transaction"
         >
           <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
             <path d="M3 6h18" strokeWidth="1.8" strokeLinecap="round" />
             <path d="M8 6V4h8v2" strokeWidth="1.8" strokeLinecap="round" />
             <path d="M6 6l1 14h10l1-14" strokeWidth="1.8" strokeLinecap="round" />
             <path d="M10 11v6M14 11v6" strokeWidth="1.8" strokeLinecap="round" />
           </svg>
         </button>
       </div>
     </div>
   )
 }
