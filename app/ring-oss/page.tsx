export const dynamic = 'force-static';

export default function RingOssPage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Ring oss</h1>
        <p>Klicka på knappen nedan för att ringa oss direkt.</p>
        <a className="inline-block rounded bg-red-600 px-4 py-2 text-white" href="tel:0760389192">
          Ring 0760-389192
        </a>
      </div>
    </div>
  );
}


