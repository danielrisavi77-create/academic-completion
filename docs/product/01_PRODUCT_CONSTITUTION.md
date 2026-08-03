# Product Constitution — Completion App v0.1

## 1. Identitet proizvoda

Completion App je **policy-aware academic completion system**.

Njegov posao nije biti najbolji writer, najbolji document checker ni najbolji generalni AI.

Njegov posao je održavati pouzdan model jednog akademskog projekta i odgovoriti:

> **Gdje rad stvarno stoji, što ga blokira i što student treba napraviti sljedeće?**

Centralni product primitive je **project state**, ne chat.  
Centralni output je **Next Best Action**, ne generirani tekst.

## 2. Academic Suite granice

### Completion App
Posjeduje:
- academic project state
- rok i fazu
- blockere
- taskove i prioritete
- mentor workflow state
- službena pravila
- AI-policy authorization
- orkestraciju prema Katedri ili Lekti
- completion workflow

Pitanje: **Što trebam napraviti sljedeće?**

### Katedra
Posjeduje:
- hrvatsku akademsku content pomoć
- writing/rewriting
- semantičku recenziju
- jezik i argumentaciju
- research/content assistance

Pitanje: **Kako mogu raditi na ovom sadržaju?**

### Lekta
Posjeduje:
- stvarni `.docx`
- determinističke provjere
- verificirana formalna/document pravila
- nalaze
- AutoFix gdje je podržan
- re-check verification

Pitanje: **Što je stvarno istina o dokumentu?**

## 3. Šest nepregovaračkih zakona

### Zakon 1 — Institutional truth > aplikacijska pretpostavka
Službeni institucionalni izvor ima prednost nad inferenceom aplikacije. Ako je informacija nejasna ili nedostaje, proizvod izlaže nesigurnost.

### Zakon 2 — Project state > chat
Free-form chat nikad nije canonical source projektnog statusa. Status se mijenja typed eventima.

### Zakon 3 — Policy authorization > AI capability
Činjenica da model nešto može napraviti ne znači da ga Completion App smije pozvati za aktivni projekt.

### Zakon 4 — Mentor i institucija odlučuju; Completion App koordinira
Aplikacija ne odobrava rad, obranu, ocjenu niti nadjačava mentora/fakultet.

### Zakon 5 — Completion App ne certificira dokument; Lekta ne posjeduje akademski sadržaj
Samo novi Lekta check može deterministički nalaz označiti `VERIFIED_FIXED`.

### Zakon 6 — Feature je core samo ako povećava barem jedno:
- institutional truth
- project-state awareness
- policy safety
- verification
- completion probability
- trust

## 4. Authority model

Svaki važan status ima izvor:

- `USER_REPORTED`
- `OFFICIAL_RULE`
- `MENTOR_REPORTED`
- `SYSTEM_ASSESSED`
- `KATEDRA_ASSESSED`
- `LEKTA_VERIFIED`

Primjeri:
- "poslao sam mentoru" -> USER_REPORTED
- "FPZG zahtijeva X" -> OFFICIAL_RULE
- "mentor traži jasnije opravdanje uzorka" -> MENTOR_REPORTED
- "rok je blizu i critical task je otvoren" -> SYSTEM_ASSESSED
- "argument je slab" -> KATEDRA_ASSESSED
- "pravilo margine pada na stvarnom DOCX-u" -> LEKTA_VERIFIED

## 5. Nema globalnog readiness postotka

Nikad "rad je 83% spreman".

Prikazujemo:
- stage
- critical blockers
- open tasks
- waiting-external
- official-rule state
- Lekta verification state

## 6. Zabranjene overclaim tvrdnje

Bez stvarne vanjske potvrde ne koristiti:
- "100% spreman"
- "garantirano prolazi"
- "faculty approved"
- "dokaz autorstva"
- "AI je legalan"
- "obrana verificirana"
- "Completion App ovjerio rad"

Preferirati:
- "Prema službenom izvoru..."
- "Prema tvojoj evidenciji..."
- "Lekta je pronašla..."
- "Sustav trenutačno ne prati otvoren critical blocker..."

## 7. AI integrity boundary

Completion App ne smije pozvati Katedru ili drugi AI za capability koji aktivni project policy zabranjuje.

Kod zahtjeva za zabranjenu radnju:
1. ne izvrši zabranjeni capability
2. neutralno objasni aktivno pravilo
3. pokaži službeni source
4. ponudi najbliži dopušten workflow

Completion App ne orkestrira zaobilaženje svog policy enginea. Katedra ostaje odvojeni standalone proizvod.

## 8. Core loop

`STATE -> BLOCKER -> NEXT ACTION -> ACTION -> RESOLUTION -> VERIFICATION -> NEXT ACTION`

Broj AI poruka nije product outcome.

## 9. Prvi market scope

MTK podržava samo duboko verificirani launch profil iz MTK specifikacije. Nema tvrdnje "svi hrvatski fakulteti".

## 10. Persistence princip

Shared project state je strukturirani metadata model, ne arhiva akademskog sadržaja. Backend koristi allowlist.

## 11. Commerce princip

Korisnik kupuje **jedan Project Pass za jedan akademski projekt**.

Ne kupuje:
- tokene
- riječi
- poruke
- vidljive AI kredite

## 12. Feature-freeze

Nakon MTK launch milestonea feature development se zamrzava do tržišnog checkpointa.
