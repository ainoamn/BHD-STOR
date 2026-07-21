'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8F5F0]">
      <div className="max-w-md w-full text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#006400]">حدث خطأ</h2>
        <p className="text-muted-foreground text-sm">
          تعذر عرض الصفحة. حاول مرة أخرى.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-[#006400] text-white px-5 py-2.5 text-sm font-medium"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  );
}
