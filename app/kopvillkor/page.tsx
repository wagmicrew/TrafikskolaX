'use client';

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
}

interface AccordionEntryProps {
  question: string;
  answer: string;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children }) => (
    <div className="mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">{title}</h2>
      <Accordion type="single" collapsible className="w-full">
        {children}
      </Accordion>
    </div>
  );
  
  const AccordionEntry: React.FC<AccordionEntryProps> = ({ question, answer }) => (
    <AccordionItem value={question}>
      <AccordionTrigger className="text-lg font-semibold text-gray-700 hover:text-blue-600">{question}</AccordionTrigger>
      <AccordionContent className="text-gray-600 leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );

function KopvillkorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-12 text-gray-900">Köpvillkor & Integritetspolicy</h1>
        
        <AccordionSection title="Köpvillkor">
          <AccordionEntry 
            question="Minderåriga"
            answer="Kunder under 18 år måste ha målsmans eller förmyndares skriftliga samtycke för att ingå avtal med Din Trafikskola Hässleholm AB."
          />
          <AccordionEntry 
            question="Avtalets Giltighetstid"
            answer="Avtalets löptid är 24 månader från tecknandedatum och avslutas automatiskt därefter om inget annat anges vid köpet (t.ex. vid presentkort eller kampanjer där giltighetstiden tydligt framgår)."
          />
          <AccordionEntry 
            question="Priser"
            answer="Samtliga priser anges i svenska kronor (SEK) och inkluderar moms. Priserna som gäller är de som anges på vår webbplats vid köptillfället. Paketpriser gäller endast vid förköp och kan inte kombineras med andra erbjudanden om inget annat anges. Vi reserverar oss för eventuella uppenbara prisfel."
          />
          <AccordionEntry 
            question="Köp av Lektioner och Paket"
            answer="Lektioner och paket köps via vår webbplats eller direkt på trafikskolan. Vid köp av paket erhåller kunden ett antal krediter som används för bokning av körlektioner. Krediter är personliga och kan inte överlåtas till annan person."
          />
          <AccordionEntry 
            question="Betalningsvillkor"
            answer="Betalning ska ske i förskott innan körlektion eller kurs startar. Vi accepterar betalning via Swish och Qliro. Vid betalning med Swish anges Din Trafikskola Hässleholm AB som mottagare. Vid betalning via Qliro gäller Qliros egna villkor för faktura och delbetalning. Kontant betalning accepteras ej."
          />
          <AccordionEntry 
            question="Återbetalning och Återköp av Paket"
            answer="Vid avbrytande av utbildning och begäran om återköp av paket, återbetalas kvarvarande krediter enligt ordinarie lektionspris, inte paketpris. Det innebär att genomförda lektioner debiteras till ordinarie pris och mellanskillnaden mellan paketpris och ordinarie pris dras av från det belopp som återstår av paketet. Exempel: Om ett paket om 10 lektioner köps till paketpris och 4 lektioner har utnyttjats vid avbrytande, debiteras dessa 4 lektioner till ordinarie pris. Resterande belopp återbetalas."
          />
          <AccordionEntry 
            question="Avbokningsregler"
            answer="Avbokning av körlektion ska ske senast 24 timmar före bokad tid för att undvika debitering. Vid sen avbokning eller utebliven närvaro debiteras hela lektionspriset."
          />
          <AccordionEntry 
            question="Reklamation"
            answer="Reklamation av tjänst eller produkt ska ske snarast möjligt efter upptäckt fel. Kontakta oss via e-post eller telefon."
          />
          <AccordionEntry 
            question="Ångerrätt"
            answer="Du som kund har rätt att ångra ditt köp inom 14 dagar från köptillfället vid distansavtal, enligt konsumentlagstiftningen. Ångerrätten gäller inte om tjänsten (t.ex. körlektion) redan har påbörjats eller utnyttjats. Vid åberopande av ångerrätt ska du kontakta oss via e-post eller telefon."
          />
        </AccordionSection>

        <AccordionSection title="Integritetspolicy">
            <AccordionEntry 
                question="Hantering av Personuppgifter"
                answer="Din Trafikskola Hässleholm AB behandlar personuppgifter i enlighet med Dataskyddsförordningen (GDPR). Personuppgifter som samlas in inkluderar namn, personnummer, kontaktuppgifter, elevregister, betalningsuppgifter samt information om bokade och genomförda lektioner. Uppgifterna används för administration av utbildning, bokningar, betalningar och för att uppfylla lagkrav."
            />
            <AccordionEntry 
                question="Lagring och Skydd"
                answer="Personuppgifter lagras säkert och endast så länge det är nödvändigt för att uppfylla ändamålen med behandlingen. Endast behörig personal har tillgång till personuppgifter. Vi vidtar tekniska och organisatoriska åtgärder för att skydda personuppgifter mot obehörig åtkomst, förlust eller förstörelse."
            />
            <AccordionEntry 
                question="Delning av Uppgifter"
                answer="Personuppgifter delas inte med tredje part utanför Din Trafikskola Hässleholm AB, förutom när det krävs enligt lag eller för att fullgöra avtal (t.ex. rapportering till myndigheter)."
            />
            <AccordionEntry 
                question="Dina Rättigheter"
                answer="Du har rätt att begära information om vilka personuppgifter vi behandlar om dig. Du kan begära rättelse, radering eller begränsning av behandlingen av dina personuppgifter. Kontakta oss via kontaktuppgifterna nedan för att utöva dina rättigheter."
            />
        </AccordionSection>

        <div className="mt-12 p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Kontaktuppgifter och Tvistlösning</h2>
            <p className="text-gray-600">
                <strong>Din Trafikskola Hässleholm AB</strong><br />
                Organisationsnummer: 559021-2347<br />
                Norra Stationsgatan 8, 281 48 Hässleholm<br />
                Telefon: 0451-123 45<br />
                E-post: info@dintrafikskola.se<br />
                Webbplats: www.dintrafikskola.se
            </p>
            <p className="mt-4 text-gray-600">
                Vid tvist som inte kan lösas mellan parterna rekommenderar vi att ärendet prövas av Allmänna reklamationsnämnden (ARN). Vi följer ARN:s rekommendationer vid eventuell tvist.
            </p>
        </div>

      </div>
    </div>
  );
}

export default KopvillkorPage;

