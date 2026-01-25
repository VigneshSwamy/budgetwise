'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function AddTransactionChooser({
  groupId,
  label = 'Add Transaction',
  buttonClassName,
}: {
  groupId: string
  label?: string
  buttonClassName?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          buttonClassName ||
          'inline-flex items-center gap-2 rounded-full bg-[#2a7d66] px-5 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#1f6f5b]'
        }
      >
        + {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">
                Choose how to add a transaction
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-stone-200 px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href={`/groups/${groupId}/expenses/voice`}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700 hover:border-sage-300 hover:bg-sage-50"
                onClick={() => setOpen(false)}
              >
                Voice
                <p className="mt-2 text-xs text-stone-500">
                  Record or upload audio
                </p>
              </Link>
              <Link
                href={`/groups/${groupId}/imports`}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700 hover:border-sage-300 hover:bg-sage-50"
                onClick={() => setOpen(false)}
              >
                Upload
                <p className="mt-2 text-xs text-stone-500">
                  Receipt or document
                </p>
              </Link>
              <Link
                href={`/groups/${groupId}/expenses/new`}
                className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm font-medium text-stone-700 hover:border-sage-300 hover:bg-sage-50"
                onClick={() => setOpen(false)}
              >
                Manual
                <p className="mt-2 text-xs text-stone-500">
                  Fill out the form
                </p>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
