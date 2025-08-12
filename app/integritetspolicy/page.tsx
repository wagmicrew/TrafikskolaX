import React from 'react';

export const dynamic = 'force-static';

export default function IntegritetspolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-100">
      <h1 className="text-3xl font-extrabold mb-4">Integritetspolicy</h1>
      <p className="mb-4">Vi värnar om din integritet. Läs våra villkor och integritetspolicy nedan.</p>
      <div className="space-y-3">
        <p>
          För fullständiga köpvillkor och integritetspolicy, besök sidan
          {" "}
          <a href="/kopvillkor" className="text-sky-400 underline">/kopvillkor</a>.
        </p>
        <p>
          Denna sida finns för att tillgodose externa integreringar som förväntar sig en separat URL för
          integritetspolicy. Innehållet är detsamma som på sidan <strong>/kopvillkor</strong>.
        </p>
      </div>
    </main>
  );
}


