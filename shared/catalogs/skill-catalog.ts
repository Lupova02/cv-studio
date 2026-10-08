// Katalog der auswählbaren Kenntnisse (IT, Büro, Handwerk, Pflege usw.), gruppiert nach Kategorien, in de/en/tr.
// Liefert Auswahllisten für den Editor, die gruppierte Anzeige mit Sternen im Lebenslauf und die Zuordnung von Freitext aus älteren Daten.
import type { CvLanguage, SkillItem } from '../cv/cv-data';
import { umlautSpelling } from './umlaut-spelling';

/** Ein Text in allen drei Lebenslauf-Sprachen. */
interface Localized {
  de: string;
  en: string;
  tr: string;
}

/** Interne Definition einer Kenntnis im Katalog. */
interface SkillDef {
  id: string;
  /** ID aus SKILL_CATEGORIES. */
  category: string;
  name: Localized;
  /** Weitere Schreibweisen, unter denen die Kenntnis beim Import erkannt wird. */
  aliases?: string[];
}

/** Eine Kenntnis, bereits in die Lebenslauf-Sprache übersetzt. */
export interface CatalogSkill {
  id: string;
  name: string;
}

/** Eine Kategorie mit ihren Kenntnissen, z. B. für die Auswahl im Editor. */
export interface CatalogGroup {
  id: string;
  name: string;
  skills: CatalogSkill[];
}

/** Eine Kategorie mit den tatsächlich gewählten Kenntnissen und deren Bewertung (1–5 Sterne) für die Anzeige im Lebenslauf. */
export interface SkillGroupView extends CatalogGroup {
  skills: Array<CatalogSkill & { stars: number }>;
}

/** Für Eigennamen wie 'Python', die in allen Sprachen gleich lauten. */
const same = (label: string): Localized => ({ de: label, en: label, tr: label });

const text = (de: string, en: string, tr: string): Localized => ({ de, en, tr });

/** Alle Kategorien in Anzeige-Reihenfolge. */
export const SKILL_CATEGORIES: Array<{ id: string; name: Localized }> = [
  { id: 'programming', name: text('Programmiersprachen', 'Programming languages', 'Programlama dilleri') },
  { id: 'frameworks', name: text('Frameworks', 'Frameworks', 'Frameworkler') },
  { id: 'data', name: text('Datenbanken', 'Databases', 'Veritabanları') },
  { id: 'platforms', name: text('Plattformen', 'Platforms', 'Platformlar') },
  { id: 'tools', name: text('Werkzeuge', 'Tools', 'Araçlar') },
  { id: 'methods', name: text('Methoden', 'Methods', 'Yöntemler') },
  { id: 'design', name: text('Gestaltung', 'Design', 'Tasarım') },
  { id: 'office', name: text('Büro', 'Office', 'Ofis') },
  { id: 'collaboration', name: text('Zusammenarbeit', 'Collaboration', 'İş birliği') },
  { id: 'sales', name: text('Verkauf', 'Sales', 'Satış') },
  { id: 'marketing', name: text('Marketing', 'Marketing', 'Pazarlama') },
  { id: 'finance', name: text('Finanzen', 'Finance', 'Finans') },
  { id: 'health', name: text('Gesundheit und Pflege', 'Health and care', 'Sağlık ve bakım') },
  { id: 'craft', name: text('Handwerk und Technik', 'Trades and engineering', 'Zanaat ve teknik') },
  { id: 'hospitality', name: text('Gastronomie und Service', 'Hospitality', 'Yiyecek ve servis') },
  { id: 'logistics', name: text('Logistik', 'Logistics', 'Lojistik') },
  { id: 'education', name: text('Bildung', 'Education', 'Eğitim') },
];

/** Alle wählbaren Kenntnisse, nach Kategorie geordnet; die Reihenfolge bestimmt auch die gespeicherte Reihenfolge. */
const SKILLS: SkillDef[] = [
  skill('javascript', 'programming', 'JavaScript', ['js']),
  skill('typescript', 'programming', 'TypeScript', ['ts']),
  skill('python', 'programming', 'Python'),
  skill('java', 'programming', 'Java'),
  skill('csharp', 'programming', 'C#', ['csharp']),
  skill('cpp', 'programming', 'C++', ['cpp']),
  skill('c', 'programming', 'C'),
  skill('go', 'programming', 'Go', ['golang']),
  skill('rust', 'programming', 'Rust'),
  skill('php', 'programming', 'PHP'),
  skill('ruby', 'programming', 'Ruby'),
  skill('swift', 'programming', 'Swift'),
  skill('kotlin', 'programming', 'Kotlin'),
  skill('sql', 'programming', 'SQL'),
  skill('html', 'programming', 'HTML'),
  skill('css', 'programming', 'CSS'),
  skill('r', 'programming', 'R'),
  skill('dart', 'programming', 'Dart'),
  skill('bash', 'programming', 'Bash', ['shell']),
  skill('scala', 'programming', 'Scala'),
  skill('angular', 'frameworks', 'Angular'),
  skill('react', 'frameworks', 'React'),
  skill('vue', 'frameworks', 'Vue'),
  skill('nextjs', 'frameworks', 'Next.js', ['next', 'nextjs']),
  skill('nodejs', 'frameworks', 'Node.js', ['node', 'nodejs']),
  skill('nestjs', 'frameworks', 'NestJS', ['nest', 'nestjs']),
  skill('spring', 'frameworks', 'Spring'),
  skill('django', 'frameworks', 'Django'),
  skill('flask', 'frameworks', 'Flask'),
  skill('dotnet', 'frameworks', '.NET', ['dotnet', 'net']),
  skill('laravel', 'frameworks', 'Laravel'),
  skill('express', 'frameworks', 'Express'),
  skill('svelte', 'frameworks', 'Svelte'),
  skill('flutter', 'frameworks', 'Flutter'),
  skill('jquery', 'frameworks', 'jQuery', ['jquery']),
  skill('postgresql', 'data', 'PostgreSQL', ['postgres']),
  skill('mysql', 'data', 'MySQL'),
  skill('mongodb', 'data', 'MongoDB', ['mongo']),
  skill('redis', 'data', 'Redis'),
  skill('sqlite', 'data', 'SQLite'),
  skill('elasticsearch', 'data', 'Elasticsearch'),
  skill('oracle', 'data', 'Oracle'),
  skill('sqlserver', 'data', 'SQL Server', ['mssql', 'microsoft sql server']),
  skill('git', 'platforms', 'Git'),
  skill('docker', 'platforms', 'Docker'),
  skill('kubernetes', 'platforms', 'Kubernetes', ['k8s']),
  skill('linux', 'platforms', 'Linux'),
  skill('aws', 'platforms', 'AWS', ['amazon web services']),
  skill('azure', 'platforms', 'Azure'),
  skill('gcp', 'platforms', 'Google Cloud', ['google cloud', 'google cloud platform']),
  skill('cicd', 'platforms', 'CI/CD', ['cicd', 'continuous integration']),
  skill('nginx', 'platforms', 'Nginx'),
  skill('github', 'tools', 'GitHub'),
  skill('gitlab', 'tools', 'GitLab'),
  skill('jira', 'tools', 'Jira'),
  skill('figma', 'tools', 'Figma'),
  skill('vscode', 'tools', 'Visual Studio Code', ['vs code', 'visual studio code']),
  skill('intellij', 'tools', 'IntelliJ'),
  skill('postman', 'tools', 'Postman'),
  skill('photoshop', 'tools', 'Photoshop'),
  skill('illustrator', 'tools', 'Illustrator'),
  skill('indesign', 'tools', 'InDesign'),
  skill('autocad', 'tools', 'AutoCAD', ['auto cad']),
  skill('sap', 'tools', 'SAP'),
  skill('salesforce', 'tools', 'Salesforce'),
  skill('wordpress', 'tools', 'WordPress'),
  skill('canva', 'tools', 'Canva'),
  skill('agile', 'methods', 'Agile'),
  skill('scrum', 'methods', 'Scrum'),
  skill('kanban', 'methods', 'Kanban'),
  skill('testing', 'methods', text('Testen', 'Testing', 'Test'), ['testen', 'testing', 'test']),
  skill('rest', 'methods', 'REST'),
  skill('graphql', 'methods', 'GraphQL'),
  skill('oop', 'methods', text('Objektorientierung', 'Object-oriented programming', 'Nesne yönelimli programlama'), ['oop']),
  skill('cleancode', 'methods', 'Clean Code', ['clean code']),
  skill('devops', 'methods', 'DevOps'),
  skill('statistics', 'methods', text('Statistik', 'Statistics', 'İstatistik'), ['statistik']),
  skill('ui', 'design', text('UI-Design', 'UI design', 'UI tasarımı'), ['ui', 'ui design']),
  skill('ux', 'design', text('UX-Design', 'UX design', 'UX tasarımı'), ['ux', 'ux design']),
  skill('typography', 'design', text('Typografie', 'Typography', 'Tipografi'), ['typografie', 'typography']),
  skill('accessibility', 'design', text('Barrierefreiheit', 'Accessibility', 'Erişilebilirlik'), ['a11y', 'barrierefreiheit']),
  skill('responsive', 'design', text('Responsives Design', 'Responsive design', 'Duyarlı tasarım')),
  skill('msoffice', 'office', 'Microsoft Office', ['microsoft office', 'ms office', 'office']),
  skill('excel', 'office', 'Excel'),
  skill('powerpoint', 'office', 'PowerPoint', ['power point']),
  skill('word', 'office', 'Word', ['microsoft word']),
  skill('outlook', 'office', 'Outlook'),
  skill('teams', 'office', 'Microsoft Teams', ['ms teams', 'teams']),
  skill('documentation', 'office', text('Dokumentation', 'Documentation', 'Dokümantasyon')),
  skill('projectmanagement', 'office', text('Projektmanagement', 'Project management', 'Proje yönetimi'), ['projektmanagement', 'project management']),
  skill('communication', 'collaboration', text('Kommunikation', 'Communication', 'İletişim')),
  skill('presentation', 'collaboration', text('Präsentation', 'Presentation', 'Sunum')),
  skill('teamwork', 'collaboration', text('Teamarbeit', 'Teamwork', 'Ekip çalışması')),
  skill('leadership', 'collaboration', text('Führung', 'Leadership', 'Liderlik')),
  skill('organization', 'collaboration', text('Organisation', 'Organization', 'Organizasyon')),
  skill('timemanagement', 'collaboration', text('Zeitmanagement', 'Time management', 'Zaman yönetimi'), ['zeitmanagement', 'time management']),
  skill('problemsolving', 'collaboration', text('Problemlösung', 'Problem solving', 'Problem çözme'), ['problemlosung', 'problem solving']),
  skill('conflict', 'collaboration', text('Konfliktlösung', 'Conflict resolution', 'Çatışma çözümü')),
  skill('intercultural', 'collaboration', text('Interkulturelle Kompetenz', 'Intercultural competence', 'Kültürlerarası yetkinlik')),
  skill('selling', 'sales', text('Verkauf', 'Sales', 'Satış')),
  skill('customercounsel', 'sales', text('Kundenberatung', 'Customer consulting', 'Müşteri danışmanlığı')),
  skill('negotiation', 'sales', text('Verhandlung', 'Negotiation', 'Müzakere')),
  skill('acquisition', 'sales', text('Akquise', 'Lead generation', 'Müşteri kazanımı')),
  skill('customerservice', 'sales', text('Kundenservice', 'Customer service', 'Müşteri hizmetleri')),
  skill('checkout', 'sales', text('Kassieren', 'Checkout', 'Kasa')),
  skill('ecommerce', 'sales', 'E-Commerce', ['e commerce']),
  skill('merchandising', 'sales', text('Warenpräsentation', 'Merchandising', 'Ürün sergileme')),
  skill('marketing', 'marketing', 'Marketing'),
  skill('socialmedia', 'marketing', 'Social Media', ['social media']),
  skill('seo', 'marketing', 'SEO'),
  skill('content', 'marketing', text('Content-Erstellung', 'Content creation', 'İçerik üretimi')),
  skill('campaigns', 'marketing', text('Kampagnen', 'Campaigns', 'Kampanyalar')),
  skill('accounting', 'finance', text('Buchhaltung', 'Accounting', 'Muhasebe')),
  skill('controlling', 'finance', 'Controlling'),
  skill('payroll', 'finance', text('Lohnabrechnung', 'Payroll', 'Bordro')),
  skill('datev', 'finance', 'DATEV'),
  skill('costaccounting', 'finance', text('Kostenrechnung', 'Cost accounting', 'Maliyet muhasebesi')),
  skill('tax', 'finance', text('Steuern', 'Tax', 'Vergi')),
  skill('financeplanning', 'finance', text('Finanzplanung', 'Financial planning', 'Finansal planlama')),
  skill('nursing', 'health', text('Pflege', 'Nursing', 'Hemşirelik')),
  skill('firstaid', 'health', text('Erste Hilfe', 'First aid', 'İlk yardım')),
  skill('medication', 'health', text('Medikamentengabe', 'Medication administration', 'İlaç uygulaması')),
  skill('hygiene', 'health', text('Hygiene', 'Hygiene', 'Hijyen')),
  skill('woundcare', 'health', text('Wundversorgung', 'Wound care', 'Yara bakımı')),
  skill('patientcare', 'health', text('Patientenbetreuung', 'Patient care', 'Hasta bakımı')),
  skill('electrical', 'craft', text('Elektroinstallation', 'Electrical installation', 'Elektrik tesisatı')),
  skill('welding', 'craft', text('Schweißen', 'Welding', 'Kaynak')),
  skill('woodwork', 'craft', text('Holzverarbeitung', 'Woodworking', 'Ahşap işleme')),
  skill('assembly', 'craft', text('Montage', 'Assembly', 'Montaj')),
  skill('machineoperation', 'craft', text('Maschinenbedienung', 'Machine operation', 'Makine kullanımı')),
  skill('technicaldrawing', 'craft', text('Technische Zeichnung', 'Technical drawing', 'Teknik çizim')),
  skill('qualitycontrol', 'craft', text('Qualitätsprüfung', 'Quality inspection', 'Kalite kontrol')),
  skill('automotive', 'craft', text('Kfz-Technik', 'Automotive technology', 'Otomotiv tekniği')),
  skill('cooking', 'hospitality', text('Kochen', 'Cooking', 'Aşçılık')),
  skill('tableservice', 'hospitality', text('Service', 'Table service', 'Servis')),
  skill('barista', 'hospitality', 'Barista'),
  skill('haccp', 'hospitality', 'HACCP'),
  skill('guestcare', 'hospitality', text('Gästebetreuung', 'Guest care', 'Misafir ilişkileri')),
  skill('housekeeping', 'hospitality', text('Zimmerreinigung', 'Housekeeping', 'Kat hizmetleri')),
  skill('reception', 'hospitality', text('Rezeption', 'Reception', 'Resepsiyon')),
  skill('warehousing', 'logistics', text('Lagerhaltung', 'Warehousing', 'Depolama')),
  skill('picking', 'logistics', text('Kommissionierung', 'Order picking', 'Sipariş toplama')),
  skill('forklift', 'logistics', text('Gabelstapler', 'Forklift', 'Forklift')),
  skill('dispatch', 'logistics', text('Disposition', 'Dispatch planning', 'Sevkiyat planlama')),
  skill('transport', 'logistics', text('Transport', 'Transport', 'Taşımacılık')),
  skill('inventory', 'logistics', text('Inventur', 'Stocktaking', 'Envanter')),
  skill('driving', 'logistics', text('Fahrpraxis', 'Driving', 'Sürüş')),
  skill('teaching', 'education', text('Unterricht', 'Teaching', 'Öğretim')),
  skill('didactics', 'education', text('Didaktik', 'Didactics', 'Didaktik')),
  skill('childcare', 'education', text('Betreuung', 'Childcare', 'Çocuk bakımı')),
  skill('moderation', 'education', text('Moderation', 'Facilitation', 'Moderasyon')),
  skill('training', 'education', text('Schulung', 'Training', 'Eğitim verme')),
];

/** Kurzschreibweise für einen Katalogeintrag; ein einfacher String gilt als Name in allen Sprachen. */
function skill(id: string, category: string, name: string | Localized, aliases: string[] = []): SkillDef {
  return { id, category, name: typeof name === 'string' ? same(name) : name, aliases };
}

/** Normalisiert Text für den Vergleich: ohne Akzente, kleingeschrieben, nur Buchstaben und Ziffern. */
function fold(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    // Sonderzeichen in Namen wie C++, C# und .NET vorher ersetzen, sonst würden sie gleich 'c' bzw. 'net'.
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/\.net/g, 'dotnet')
    .replace(/[^a-z0-9]+/g, '');
}

/** Normalisierte Schreibweise → Kenntnis-ID; wird unten beim Laden des Moduls gefüllt. */
const ALIASES = new Map<string, string>();

/** Trägt eine Schreibweise ein; wirft einen Fehler, wenn sie schon für eine andere Kenntnis vergeben ist (fällt so sofort beim Start auf). */
function register(key: string, id: string): void {
  const folded = fold(key);
  if (!folded) {
    return;
  }
  const existing = ALIASES.get(folded);
  if (existing && existing !== id) {
    throw new Error(`Kenntnis-Alias kollidiert: ${key}`);
  }
  ALIASES.set(folded, id);
}

for (const entry of SKILLS) {
  register(entry.id, entry.id);
  register(entry.name.de, entry.id);
  register(entry.name.en, entry.id);
  register(entry.name.tr, entry.id);
  for (const alias of entry.aliases ?? []) {
    register(alias, entry.id);
  }
}

/** Übersetzt Niveau-Wörter aus älteren Daten (bereits normalisiert wie durch fold) in Sterne von 2 bis 5. */
const LEVEL_STARS: Record<string, number> = {
  anfaenger: 2,
  grundkenntnisse: 2,
  grundlegend: 2,
  basic: 2,
  beginner: 2,
  baslangic: 2,
  mittel: 3,
  gut: 3,
  good: 3,
  intermediate: 3,
  orta: 3,
  sicher: 4,
  fortgeschritten: 4,
  advanced: 4,
  ileri: 4,
  sehrgut: 5,
  experte: 5,
  expert: 5,
  excellent: 5,
  uzman: 5,
};

/** Ermittelt die Kenntnis-ID aus ID, Name (de/en/tr) oder Alias, z. B. 'JS' → 'javascript'; null, wenn unbekannt. Für Import/Migration. */
export function skillIdFrom(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  return ALIASES.get(fold(value)) ?? ALIASES.get(fold(umlautSpelling(value))) ?? null;
}

/** Liest eine Bewertung als 1–5 Sterne: Zahl, Ziffer als Text oder Niveau-Wort wie 'fortgeschritten'; null, wenn nicht erkennbar. */
export function starsFromLevel(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (/^[1-5]$/.test(trimmed)) {
    return Number(trimmed);
  }
  return LEVEL_STARS[fold(trimmed)] ?? LEVEL_STARS[fold(umlautSpelling(trimmed))] ?? null;
}

/** Kompletter Katalog als Kategorien mit Kenntnissen, übersetzt in die Lebenslauf-Sprache; leere Kategorien entfallen. */
export function skillCatalog(language: CvLanguage): CatalogGroup[] {
  return SKILL_CATEGORIES.map((category) => ({
    id: category.id,
    name: category.name[language],
    skills: SKILLS.filter((entry) => entry.category === category.id).map((entry) => ({
      id: entry.id,
      name: entry.name[language],
    })),
  })).filter((group) => group.skills.length > 0);
}

/** Gewählte Kenntnisse für die Anzeige im Lebenslauf, nach Kategorie gruppiert und in Katalog-Reihenfolge; Kategorien ohne Auswahl entfallen. */
export function groupedSkills(items: SkillItem[], language: CvLanguage): SkillGroupView[] {
  const stars = new Map(items.map((item) => [item.id, item.stars]));
  return skillCatalog(language)
    .map((group) => ({
      ...group,
      skills: group.skills.flatMap((entry) => {
        const value = stars.get(entry.id);
        return value ? [{ ...entry, stars: value }] : [];
      }),
    }))
    .filter((group) => group.skills.length > 0);
}

/** Wandelt eine Auswahl (Kenntnis-ID → Sterne) in die gespeicherte Liste um – in fester Katalog-Reihenfolge; unbekannte IDs und 0 Sterne entfallen. */
export function skillsInCatalogOrder(chosen: Map<string, number>): SkillItem[] {
  return SKILLS.flatMap((entry) => {
    const stars = chosen.get(entry.id);
    return stars ? [{ id: entry.id, stars }] : [];
  });
}

/** Bewertung als Text aus fünf Sternen, z. B. 3 → '★★★☆☆' (auf 0–5 begrenzt). */
export function starMarks(stars: number): string {
  const count = Math.max(0, Math.min(5, Math.trunc(stars)));
  return `${'★'.repeat(count)}${'☆'.repeat(5 - count)}`;
}
