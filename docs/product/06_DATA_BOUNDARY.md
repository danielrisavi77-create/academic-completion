# Data Boundary v0.1

## Principle

Completion App je project-state sustav, ne cloud arhiva akademskog teksta.

Persistence koristi **allowlist**.

Ako polje nije eksplicitno dopušteno, nije shared project state.

## Allowed shared persistence

### Identity
- account ID
- academic project ID
- work type
- institution/faculty/program/profile IDs

### Timeline
- target dates
- official deadline refs
- stage

### Tasks
- task ID
- typed category
- kratki sanitized title
- status
- priority
- authority
- related rule/finding IDs

### Policy
- ruleset/version
- rule IDs
- capability decision
- conditions
- source refs
- verification timestamps

### Mentor workflow
Dopušteno:
- datum slanja
- waiting state
- sanitized task title, npr. "Jasnije obrazložiti uzorak"
- user-reported approval state

### Lekta
- analysis ID
- finding ID
- rule ID
- severity
- lifecycle status
- sanitized finding label
- timestamps
- ruleset version

### Analytics
- typed event
- session/user/project ID gdje treba
- UTM/referrer
- timestamp
- non-content metadata

## Prohibited shared project-state persistence

Po defaultu ne spremati:
- raw `.docx`
- thesis body text
- pasted thesis paragraphs
- source passages
- raw literature PDFs kao project state
- cijele mentor emailove/komentare
- interview transcripts s osobnim podacima
- full AI prompts
- full AI responses
- AI response excerpts
- free-form Lekta document issue detail/location
- secrets/keys

## Session-scoped AI content

Korisnik može svjesno poslati sadržaj za jednu AI radnju.

Primjer: zalijepi odlomak za language review.

Completion App mora:
1. jasno reći da action koristi AI
2. upozoriti na osobne/povjerljive/zaštićene podatke
3. poslati samo sadržaj potreban za action
4. ne spremati ga automatski u project state
5. nakon actiona spremiti samo typed event metadata

## First-use AI notice

Primjer:

> Ovaj korak koristi generativnu umjetnu inteligenciju. Odabrani sadržaj šalje se AI procesoru radi odgovora. Ne šalji osobne, povjerljive ili zaštićene podatke.

Gumbi:
- Nastavi
- Kako koristimo AI i podatke

Ne koristiti tvrdnju "ništa ne napušta browser" za cloud AI action.

## Lekta boundary

Lekta posjeduje raw DOCX processing.

Completion App dobiva samo sanitized structured result.

MTK ne povlači raw dokument iz shared backenda.

## Katedra boundary

Completion App smije handoffati:
- project ID
- task ID
- capability
- safe context IDs

Ne stavljati raw thesis content, mentor comment ili source passage u URL.

Ako user content treba destination productu, korisnik ga svjesno unosi tamo prema pravilima tog proizvoda.

## Analytics privacy

Dobar payload:

```json
{
  "event": "blocker_presented",
  "blockerType": "MENTOR_FEEDBACK_OPEN",
  "workType": "MASTERS_THESIS",
  "profileId": "fpzg-politologija"
}
```

Loš payload sadrži raw mentor/content tekst.

## Structured event log

Dopušteno je spremiti event type, project/task ID, capability, policy rule IDs, provider/model ID i timestamp. Nije dopušteno spremati prompt/response u taj log.

## Disclosure support

Content-free log može pomoći s alatom/providerom, datumom, capability/purpose i project stageom.

Ako fakultet zahtijeva transcript razgovora, content-free log sam po sebi nije dovoljan i proizvod ne smije tvrditi suprotno.

Ne koristiti naziv "dokaz autorstva".

## Personal-data guardrail

Mogući local warning patterns:
- email
- telefon
- OIB/JMBAG-like pattern
- "POVJERLJIVO"
- označeni identiteti ispitanika

Detector je guardrail, ne garancija.

## Deletion

Projekt mora imati jasan deletion path. Ne obećavati instant deletion iz third-party processor retention sustava ako to tehnički/ugovorno nije istina.

## Security minimum

- service-role server-side only
- ownership check na svaki write
- RLS gdje je primjenjivo
- ne vjerovati client project ID-u bez ownershipa
- rate limit AI endpointa
- content-size limits
- enum allowlists
- nema client-supplied system prompt authority

## Future raw-content persistence

Bilo koji budući prijedlog da se trajno sprema raw academic content zahtijeva Product Constitution review, privacy/security design, retention definition, user-facing disclosure, pravnu/privacy provjeru gdje treba i zaseban schema model.
