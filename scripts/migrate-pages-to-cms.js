const fs = require('fs');
const path = require('path');

// Pages to migrate with their content
const pagesToMigrate = [
  {
    slug: 'integritetspolicy',
    title: 'Integritetspolicy',
    file: 'app/integritetspolicy/page.tsx',
    content: `
<h1>Integritetspolicy</h1>
<p>Denna integritetspolicy förklarar hur vi samlar in, använder och skyddar din personliga information.</p>

<h2>1. Insamlad information</h2>
<p>Vi kan samla in följande typer av information:</p>
<ul>
  <li>Personuppgifter som namn och kontaktinformation</li>
  <li>Demografisk information</li>
  <li>Teknisk information om din enhet och webbläsare</li>
  <li>Användningsdata för att förbättra våra tjänster</li>
</ul>

<h2>2. Hur vi använder informationen</h2>
<p>Den insamlade informationen används för att:</p>
<ul>
  <li>Tillhandahålla och förbättra våra tjänster</li>
  <li>Kommunicera med dig angående dina bokningar</li>
  <li>Skicka viktig information om våra tjänster</li>
  <li>Följa lagliga krav och förordningar</li>
</ul>

<h2>3. Informationsdelning</h2>
<p>Vi delar inte din personliga information med tredje part, förutom:</p>
<ul>
  <li>När det krävs enligt lag</li>
  <li>För att tillhandahålla tjänster som du har begärt</li>
  <li>Med ditt uttryckliga samtycke</li>
</ul>

<h2>4. Dataskydd</h2>
<p>Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda din information mot obehörig åtkomst, ändring eller förstörelse.</p>

<h2>5. Dina rättigheter</h2>
<p>Du har rätt att:</p>
<ul>
  <li>Få tillgång till din personliga information</li>
  <li>Begära rättelse av felaktig information</li>
  <li>Begära radering av din information</li>
  <li>Invända mot behandling av din information</li>
</ul>

<h2>6. Kontakt</h2>
<p>Om du har frågor om denna integritetspolicy, kontakta oss på info@trafikskolax.se</p>
    `
  },
  {
    slug: 'kopvillkor',
    title: 'Köpvillkor',
    file: 'app/kopvillkor/page.tsx',
    content: `
<h1>Köpvillkor</h1>
<p>Dessa köpvillkor gäller för alla köp och tjänster från Trafikskola X.</p>

<h2>1. Allmänna bestämmelser</h2>
<p>Genom att boka en tjänst accepterar du dessa köpvillkor. Alla tjänster tillhandahålls av Trafikskola X.</p>

<h2>2. Bokning och betalning</h2>
<p>Bokningar kan göras online eller via telefon. Betalning ska ske i förskott enligt de priser som anges vid bokningstillfället.</p>

<h2>3. Avbokning och ändringar</h2>
<p>Avbokning kan göras senast 24 timmar innan tjänsten. Vid senare avbokning eller utebliven närvaro debiteras full avgift.</p>

<h2>4. Priser</h2>
<p>Alla priser anges inklusive moms. Trafikskola X förbehåller sig rätten att ändra priser.</p>

<h2>5. Ansvarsbegränsning</h2>
<p>Trafikskola X ansvarar inte för indirekta skador eller följdskador som kan uppstå i samband med våra tjänster.</p>

<h2>6. Force majeure</h2>
<p>Trafikskola X ansvarar inte för förseningar eller inställda tjänster på grund av omständigheter utanför vår kontroll.</p>
    `
  },
  {
    slug: 'lokalerna',
    title: 'Lokalerna',
    file: 'app/lokalerna/page.tsx',
    content: `
<h1>Våra lokaler</h1>
<p>Välkommen till våra moderna och välutrustade lokaler för trafikutbildning.</p>

<h2>Adress</h2>
<p>Din Trafikskola Hässleholm<br>
Storgatan 12<br>
281 31 Hässleholm<br>
Sverige</p>

<h2>Öppettider</h2>
<p><strong>Måndag - Fredag:</strong> 08:00 - 17:00<br>
<strong>Lördag:</strong> 09:00 - 15:00<br>
<strong>Söndag:</strong> Stängt</p>

<h2>Faciliteter</h2>
<p>Våra lokaler är utrustade med:</p>
<ul>
  <li>Moderna körsimulatorer</li>
  <li>Teorilokaler med digital utrustning</li>
  <li>Praktiska övningsområden</li>
  <li>Parkering för elever</li>
  <li>Handikappanpassade lokaler</li>
</ul>

<h2>Transport</h2>
<p>Busslinje 123 stannar utanför våra lokaler. Det finns goda parkeringsmöjligheter i närheten.</p>
    `
  },
  {
    slug: 'vara-tjanster',
    title: 'Våra tjänster',
    file: 'app/vara-tjanster/page.tsx',
    content: `
<h1>Våra tjänster</h1>
<p>Vi erbjuder ett komplett utbud av trafikutbildningar och körkortsutbildningar.</p>

<h2>Körkortsutbildningar</h2>
<h3>B-körkort (Personbil)</h3>
<p>Vår grundläggande körkortsutbildning för personbil. Utbildningen omfattar:</p>
<ul>
  <li>Teoretisk utbildning (kunskapsprov)</li>
  <li>Praktisk körning (körprov)</li>
  <li>Riskettan (obligatorisk del)</li>
  <li>Intensivkurs och paketlösningar</li>
</ul>

<h3>Övriga körkortsklasser</h3>
<p>Vi erbjuder även utbildning för:</p>
<ul>
  <li>A-körkort (Motorcykel)</li>
  <li>BE-körkort (Personbil med släp)</li>
  <li>C-körkort (Lastbil)</li>
  <li>D-körkort (Buss)</li>
  <li>Taxiförarlegitimation</li>
</ul>

<h2>Ytterligare tjänster</h2>
<h3>Riskettan</h3>
<p>Obligatorisk del av körkortsutbildningen med fokus på trafiksäkerhet och riskmedvetenhet.</p>

<h3>Bedömningslektion</h3>
<p>Få en professionell bedömning av dina körkunskaper och råd inför fortsatt utbildning.</p>

<h3>Förarprov</h3>
<p>Vi hjälper dig att boka och förbereda dig för det officiella förarprovet.</p>
    `
  },
  {
    slug: 'villkor',
    title: 'Villkor',
    file: 'app/villkor/page.tsx',
    content: `
<h1>Allmänna villkor</h1>
<p>Dessa allmänna villkor gäller för alla tjänster och utbildningar från Trafikskola X.</p>

<h2>1. Tjänstbeskrivning</h2>
<p>Trafikskola X tillhandahåller trafikutbildningar och körkortsutbildningar enligt gällande lagar och förordningar.</p>

<h2>2. Bokningsvillkor</h2>
<p>Bokningar görs genom vår webbplats eller via telefon. Bokningen är bindande när betalning erlagts.</p>

<h2>3. Avbokningsregler</h2>
<p>Avbokning ska ske senast 24 timmar före lektionen. Vid senare avbokning debiteras 50% av lektionspriset.</p>

<h2>4. Ansvarsområden</h2>
<p>Eleven ansvarar för att vara i tid till lektioner och ha giltig legitimation. Trafikskola X ansvarar för professionell undervisning.</p>

<h2>5. Priser och betalning</h2>
<p>Alla priser anges inklusive moms. Betalning sker via faktura, Swish eller kortbetalning.</p>

<h2>6. Force Majeure</h2>
<p>Vi ansvarar inte för förseningar eller inställda lektioner på grund av omständigheter utanför vår kontroll.</p>

<h2>7. Ändringar</h2>
<p>Vi förbehåller oss rätten att ändra dessa villkor. Ändringar meddelas via vår webbplats.</p>
    `
  }
];

// Generate SQL INSERT statements
function generateSQL() {
  let sql = `-- CMS Pages Migration\n-- Run this in your Neon database\n\n`;

  pagesToMigrate.forEach(page => {
    const cleanContent = page.content.trim().replace(/'/g, "''");

    sql += `-- Insert ${page.title}\n`;
    sql += `INSERT INTO pages (slug, title, content, excerpt, status, created_at, updated_at)\n`;
    sql += `VALUES ('${page.slug}', '${page.title}', '${cleanContent}', 'Migrerad från statisk sida', 'published', NOW(), NOW())\n`;
    sql += `ON CONFLICT (slug) DO UPDATE SET\n`;
    sql += `  title = EXCLUDED.title,\n`;
    sql += `  content = EXCLUDED.content,\n`;
    sql += `  excerpt = EXCLUDED.excerpt,\n`;
    sql += `  status = EXCLUDED.status,\n`;
    sql += `  updated_at = NOW();\n\n`;
  });

  return sql;
}

// Generate menu items SQL
function generateMenuSQL() {
  let sql = `-- CMS Menu Items Migration\n\n`;

  pagesToMigrate.forEach(page => {
    sql += `-- Create menu item for ${page.title}\n`;
    sql += `INSERT INTO menu_items (label, url, page_id, is_external, icon, sort_order, is_active, is_admin_menu, created_at, updated_at)\n`;
    sql += `SELECT '${page.title}', NULL, p.id, false, 'FileText', 10, true, false, NOW(), NOW()\n`;
    sql += `FROM pages p WHERE p.slug = '${page.slug}'\n`;
    sql += `ON CONFLICT DO NOTHING;\n\n`;
  });

  return sql;
}

// Main execution
function main() {
  console.log('🔄 Generating CMS migration SQL...\n');

  const pagesSQL = generateSQL();
  const menuSQL = generateMenuSQL();

  const fullSQL = pagesSQL + menuSQL;

  // Write to file
  const outputPath = path.join(__dirname, 'migrate-existing-pages.sql');
  fs.writeFileSync(outputPath, fullSQL, 'utf8');

  console.log('✅ Migration SQL generated!');
  console.log(`📄 File saved: ${outputPath}\n`);

  console.log('📋 Summary:');
  console.log(`   - ${pagesToMigrate.length} pages to migrate`);
  console.log(`   - Each page includes title, content, and menu item`);
  console.log(`   - All pages will be set as 'published'`);

  console.log('\n🚀 Next steps:');
  console.log('1. Run the generated SQL in your Neon database');
  console.log('2. Visit /dashboard/admin/setup to verify setup');
  console.log('3. Go to /dashboard/admin/cms to manage pages');
  console.log('4. Check that the main menu includes the new pages');

  // Also print the SQL to console
  console.log('\n📄 Generated SQL:');
  console.log('=' .repeat(50));
  console.log(fullSQL);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { pagesToMigrate, generateSQL, generateMenuSQL };
