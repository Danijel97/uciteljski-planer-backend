# UČITELJSKI PLANER
## Specifikacija backenda i REST API-ja
**Projektni zadatak – kolegij Web aplikacije | Akademska godina 2026./2027.**
**Verzija dokumenta:** 1.0 (specifikacija za implementaciju)
**Backend:** Node.js, Express | **Baza:** MongoDB | **Frontend:** Vue.js

## 1. Svrha i opseg
Učiteljski planer osobna je web aplikacija u kojoj svaki učitelj zasebno organizira škole, razrede i učenike, evidentira održane nastavne sate i bilješke, izrađuje stalni tjedni raspored te planira pisane i usmene provjere znanja. Svaki prijavljeni učitelj pristupa isključivo vlastitim zapisima. Demonstracija se provodi isključivo s izmišljenim podacima učenika.
Ovaj dokument definira podatkovni model, API adrese, HTTP metode, JSON zahtjeve i odgovore, validaciju i autorizaciju. Služi kao jedinstvena referenca za implementaciju i testiranje. Prototip u Figmi i implementacija frontenda zasebne su projektne cjeline.

## 2. Tehnička pravila i konvencije
- Bazni URL pri lokalnom razvoju: `http://localhost:3000/api`. Testna ruta `GET /` ostaje izvan prefiksa `/api`.
- Sve rute osim registracije i prijave zahtijevaju `Authorization: Bearer <JWT>`. JWT se provjerava na backendu; `korisnikId` se dobiva isključivo iz provjerenog tokena.
- Za podatke se koristi `Content-Type: application/json`. Identifikatori su MongoDB ObjectId i šalju se kao stringovi; nevaljani format daje HTTP 400.
- Datumi su u obliku `YYYY-MM-DD`, mjesec u obliku `YYYY-MM`, a vremena u 24-satnom obliku `HH:mm`; provjerava se stvarnost datuma (npr. 2026-02-30 nije dopušten).
- Za popise se koristi JSON niz `[]`; prazan rezultat je `200 OK` s praznim nizom. Za pojedinačni zapis vraća se objekt. Odgovori ne sadrže lozinku ni njezin hash.
- Za `PATCH` prihvaćaju se samo dozvoljena polja; nedopuštene ključeve backend odbija s 400. Prazan objekt za izmjenu također se odbija.
- Za zapis koji ne postoji ili nije vlasništvo prijavljenog učitelja vraća se `404 Not Found`, bez otkrivanja postojanja tuđih podataka.
- Odjava je brisanje tokena na klijentu; zasebna POST ruta za odjavu u prvoj verziji nije predviđena. JWT ostaje valjan do isteka, pa je potreban kratak rok valjanosti i sigurno rukovanje tokenom.
- Podaci učenika i bilješke su osobni podaci. Za projekt koristiti izmišljena imena i sadržaje. Za stvarnu školsku uporabu bile bi potrebne dodatne pravne i sigurnosne provjere.

## 3. Model podataka (MongoDB)
| Kolekcija | Polja |
|---|---|
| `korisnici` | `_id` ObjectId; `ime` String; `prezime` String; `email` String (jedinstven); `lozinka` String (hashirana). |
| `skole` | `_id` ObjectId; `naziv` String; `korisnikId` ObjectId. |
| `razredi` | `_id` ObjectId; `naziv` String; `skolaId` ObjectId; `korisnikId` ObjectId. |
| `ucenici` | `_id` ObjectId; `ime` String; `prezime` String; `razredId` ObjectId; `korisnikId` ObjectId. |
| `nastavni_sati` | `_id` ObjectId; `razredId` ObjectId; `korisnikId` ObjectId; `datum` String; `vrijemeOd` String; `vrijemeDo` String; `nastavnaJedinica` String; `obradenoGradivo` String?; `biljeska` String?; `planZaSljedeciSat` String?. |
| `biljeske` | `_id` ObjectId; `ucenikId` ObjectId; `korisnikId` ObjectId; `datum` String; `vrsta` String; `sadrzaj` String. |
| `raspored` | `_id` ObjectId; `razredId` ObjectId; `korisnikId` ObjectId; `danUTjednu` Number (1–7); `vrijemeOd` String; `vrijemeDo` String. |
| `provjere` | `_id` ObjectId; `razredId` ObjectId; `korisnikId` ObjectId; `vrsta` String; `nastavnaCjelina` String; `datum` String. |
Relacije: korisnik → škole → razredi → učenici; nastavnim satima, terminima rasporeda i provjerama pridružen je razred; bilješkama je pridružen učenik. Svaka vlasnička kolekcija ima `korisnikId` radi sigurnih upita; uz njega se uvijek provjerava i vlasništvo roditeljskog objekta.
Preporučeni indeksi: jedinstveni `korisnici.email` (normaliziran u mala slova); jedinstveni par `razredi(skolaId, naziv)`; indeksi `(korisnikId, ...)` za popise; `(korisnikId, datum)` za sate/provjere; `(korisnikId, danUTjednu)` za raspored. Dvije osobe s istim imenom i prezimenom u razredu nisu automatski zabranjene.

## 4. Pregled REST API ruta
### Autentifikacija
| Metoda | Adresa | Namjena |
|---|---|---|
| **POST** | `/api/auth/registracija` | Registracija |
| **POST** | `/api/auth/prijava` | Prijava |
| **GET** | `/api/auth/profil` | Profil prijavljenoga učitelja |
### Škole
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/skole` | Popis vlastitih škola |
| **GET** | `/api/skole/:id` | Jedna škola |
| **POST** | `/api/skole` | Nova škola |
| **PATCH** | `/api/skole/:id` | Promjena naziva |
| **DELETE** | `/api/skole/:id` | Brisanje prazne škole |
### Razredi
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/skole/:skolaId/razredi` | Razredi vlastite škole |
| **GET** | `/api/razredi/:id` | Jedan razred |
| **POST** | `/api/skole/:skolaId/razredi` | Novi razred |
| **PATCH** | `/api/razredi/:id` | Promjena naziva |
| **DELETE** | `/api/razredi/:id` | Brisanje praznog razreda |
### Učenici
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/razredi/:razredId/ucenici` | Učenici razreda |
| **GET** | `/api/ucenici/:id` | Jedan učenik |
| **POST** | `/api/razredi/:razredId/ucenici` | Novi učenik |
| **PATCH** | `/api/ucenici/:id` | Promjena imena/prezimena |
| **DELETE** | `/api/ucenici/:id` | Brisanje bez bilješki |
### Nastavni sati
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/razredi/:razredId/sati` | Sati razreda |
| **GET** | `/api/sati/:id` | Jedan sat |
| **POST** | `/api/razredi/:razredId/sati` | Evidentiranje sata |
| **PATCH** | `/api/sati/:id` | Uređivanje sata |
| **DELETE** | `/api/sati/:id` | Brisanje sata |
### Bilješke
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/ucenici/:ucenikId/biljeske` | Bilješke učenika |
| **GET** | `/api/biljeske/:id` | Jedna bilješka |
| **POST** | `/api/ucenici/:ucenikId/biljeske` | Nova bilješka |
| **PATCH** | `/api/biljeske/:id` | Uređivanje bilješke |
| **DELETE** | `/api/biljeske/:id` | Brisanje bilješke |
### Tjedni raspored
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/raspored` | Svi termini |
| **GET** | `/api/raspored/:id` | Jedan termin |
| **POST** | `/api/raspored` | Novi termin |
| **PATCH** | `/api/raspored/:id` | Izmjena termina |
| **DELETE** | `/api/raspored/:id` | Brisanje termina |
### Provjere znanja
| Metoda | Adresa | Namjena |
|---|---|---|
| **GET** | `/api/provjere` | Sve provjere; opcionalno `?mjesec=YYYY-MM` |
| **GET** | `/api/razredi/:razredId/provjere` | Provjere razreda |
| **GET** | `/api/provjere/:id` | Jedna provjera |
| **POST** | `/api/provjere` | Nova provjera |
| **PATCH** | `/api/provjere/:id` | Izmjena provjere |
| **DELETE** | `/api/provjere/:id` | Brisanje provjere |

## 5. JSON ugovori po cjelinama
U primjerima su korišteni izmišljeni podaci i testni ObjectId identifikatori. Nazivi polja u JSON primjerima točni su nazivi koje planiramo implementirati. `id` u API odgovorima predstavlja MongoDB `_id` pretvoren u string.
### 5.1. Korisnici i autentifikacija
### Registracija
**POST /api/auth/registracija**  · Uspjeh: **201 Created**
Zahtjev:
```json
{
  "ime": "Ivan", "prezime": "Ivić",
  "email": "ivan.ivic@example.com", "lozinka": "PrimjerLozinke123!"
}
```
Odgovor:
```json
{
  "poruka": "Korisnik je uspjesno registriran",
  "korisnik": {"id": "507f1f77bcf86cd799439011", "ime": "Ivan", "prezime": "Ivić", "email": "ivan.ivic@example.com"}
}
```
Pravila: Obvezna polja, valjan format e-maila, jedinstven e-mail i sigurno hashiranje lozinke. Duplikat e-maila: 409.
### Prijava
**POST /api/auth/prijava**  · Uspjeh: **200 OK**
Zahtjev:
```json
{
  "email": "ivan.ivic@example.com", "lozinka": "PrimjerLozinke123!"
}
```
Odgovor:
```json
{
  "poruka": "Uspjesna prijava", "token": "JWT_TOKEN",
  "korisnik": {"id": "507f1f77bcf86cd799439011", "ime": "Ivan", "prezime": "Ivić", "email": "ivan.ivic@example.com"}
}
```
Pravila: Pogrešan e-mail ili lozinka: 401 s općenitom porukom, bez otkrivanja koji je podatak pogrešan.
### Profil
**GET /api/auth/profil**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439011", "ime": "Ivan", "prezime": "Ivić", "email": "ivan.ivic@example.com"}
```
Pravila: Zahtijeva valjani JWT; profil se određuje iz tokena, ne iz ID-a poslanog od klijenta.
Odjava: frontend uklanja token; nema `POST /api/auth/odjava` u ovoj verziji.
### 5.2. Škole
### Dodavanje škole
**POST /api/skole**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"naziv": "Osnovna škola Primjer"}
```
Odgovor:
```json
{"poruka": "Skola je uspjesno dodana", "skola": {"id": "507f1f77bcf86cd799439012", "naziv": "Osnovna škola Primjer"}}
```
Pravila: `naziv` je neprazan tekst; vlasništvo se pripisuje iz JWT-a.
### Popis škola
**GET /api/skole**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439012", "naziv": "Osnovna škola Primjer"}]
```
### Jedna škola
**GET /api/skole/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439012", "naziv": "Osnovna škola Primjer"}
```
### Uređivanje škole
**PATCH /api/skole/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"naziv": "Osnovna škola Novi naziv"}
```
Odgovor:
```json
{"poruka": "Skola je uspjesno azurirana", "skola": {"id": "507f1f77bcf86cd799439012", "naziv": "Osnovna škola Novi naziv"}}
```
### Brisanje škole
**DELETE /api/skole/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Skola je uspjesno obrisana"}
```
Pravila: Ako postoje razredi, vratiti 409 Conflict; ne brisati kaskadno povezane podatke.
### 5.3. Razredi
### Dodavanje razreda
**POST /api/skole/:skolaId/razredi**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"naziv": "6.b"}
```
Odgovor:
```json
{"poruka": "Razred je uspjesno dodan", "razred": {"id": "507f1f77bcf86cd799439014", "naziv": "6.b", "skolaId": "507f1f77bcf86cd799439012"}}
```
Pravila: Provjeriti vlasništvo škole i jedinstven naziv razreda unutar škole; duplikat: 409.
### Popis razreda škole
**GET /api/skole/:skolaId/razredi**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439014", "naziv": "6.b", "skolaId": "507f1f77bcf86cd799439012"}]
```
### Jedan razred
**GET /api/razredi/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439014", "naziv": "6.b", "skolaId": "507f1f77bcf86cd799439012"}
```
### Uređivanje razreda
**PATCH /api/razredi/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"naziv": "6.a"}
```
Odgovor:
```json
{"poruka": "Razred je uspjesno azuriran", "razred": {"id": "507f1f77bcf86cd799439014", "naziv": "6.a", "skolaId": "507f1f77bcf86cd799439012"}}
```
### Brisanje razreda
**DELETE /api/razredi/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Razred je uspjesno obrisan"}
```
Pravila: Zabranjeno (409) ako postoje učenici, sati, termini rasporeda, provjere ili povezane bilješke. Premještanje razreda između škola nije podržano.
### 5.4. Učenici
### Dodavanje učenika
**POST /api/razredi/:razredId/ucenici**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"ime": "Marko", "prezime": "Marić"}
```
Odgovor:
```json
{"poruka": "Ucenik je uspjesno dodan", "ucenik": {"id": "507f1f77bcf86cd799439016", "ime": "Marko", "prezime": "Marić", "razredId": "507f1f77bcf86cd799439014"}}
```
Pravila: Jedini identifikacijski podaci učenika su ime i prezime; roditeljski razred mora biti učiteljev.
### Popis učenika razreda
**GET /api/razredi/:razredId/ucenici**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439016", "ime": "Marko", "prezime": "Marić", "razredId": "507f1f77bcf86cd799439014"}]
```
Pravila: Sortiranje po prezimenu i imenu.
### Jedan učenik
**GET /api/ucenici/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439016", "ime": "Marko", "prezime": "Marić", "razredId": "507f1f77bcf86cd799439014"}
```
### Uređivanje učenika
**PATCH /api/ucenici/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"prezime": "Marković"}
```
Odgovor:
```json
{"poruka": "Ucenik je uspjesno azuriran", "ucenik": {"id": "507f1f77bcf86cd799439016", "ime": "Marko", "prezime": "Marković", "razredId": "507f1f77bcf86cd799439014"}}
```
### Brisanje učenika
**DELETE /api/ucenici/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Ucenik je uspjesno obrisan"}
```
Pravila: Ako ima bilješke: 409 Conflict. Premještanje u drugi razred nije podržano.
### 5.5. Evidencija nastavnih sati
### Dodavanje nastavnog sata
**POST /api/razredi/:razredId/sati**  · Uspjeh: **201 Created**
Zahtjev:
```json
{
  "datum": "2026-11-23", "vrijemeOd": "08:00", "vrijemeDo": "08:45",
  "nastavnaJedinica": "Programiranje u Pythonu - petlje",
  "obradenoGradivo": "Obradena for petlja i osnovni zadaci.",
  "biljeska": "Ponoviti range funkciju.",
  "planZaSljedeciSat": "Obrada while petlje."
}
```
Odgovor:
```json
{"poruka": "Nastavni sat je uspjesno evidentiran", "sat": {"id": "507f1f77bcf86cd799439018", "razredId": "507f1f77bcf86cd799439014", "datum": "2026-11-23", "vrijemeOd": "08:00", "vrijemeDo": "08:45", "nastavnaJedinica": "Programiranje u Pythonu - petlje", "obradenoGradivo": "Obradena for petlja i osnovni zadaci.", "biljeska": "Ponoviti range funkciju.", "planZaSljedeciSat": "Obrada while petlje."}}
```
Pravila: Obvezni su datum, početak, završetak i nastavna jedinica; vrijeme završetka > početka. Ostala tri tekstualna polja neobvezna su.
### Popis sati razreda
**GET /api/razredi/:razredId/sati**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439018", "datum": "2026-11-23", "vrijemeOd": "08:00", "vrijemeDo": "08:45", "nastavnaJedinica": "Programiranje u Pythonu - petlje"}]
```
Pravila: Najnoviji sati prvi.
### Jedan nastavni sat
**GET /api/sati/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439018", "razredId": "507f1f77bcf86cd799439014", "datum": "2026-11-23", "vrijemeOd": "08:00", "vrijemeDo": "08:45", "nastavnaJedinica": "Programiranje u Pythonu - petlje", "obradenoGradivo": "Obradena for petlja i osnovni zadaci.", "biljeska": "Ponoviti range funkciju.", "planZaSljedeciSat": "Obrada while petlje."}
```
### Uređivanje sata
**PATCH /api/sati/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"planZaSljedeciSat": "Ponavljanje for i uvod u while."}
```
Odgovor:
```json
{"poruka": "Nastavni sat je uspjesno azuriran", "sat": {"id": "507f1f77bcf86cd799439018", "razredId": "507f1f77bcf86cd799439014", "datum": "2026-11-23", "vrijemeOd": "08:00", "vrijemeDo": "08:45", "nastavnaJedinica": "Programiranje u Pythonu - petlje", "obradenoGradivo": "Obradena for petlja i osnovni zadaci.", "biljeska": "Ponoviti range funkciju.", "planZaSljedeciSat": "Ponavljanje for i uvod u while."}}
```
### Brisanje sata
**DELETE /api/sati/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Nastavni sat je uspjesno obrisan"}
```
### 5.6. Bilješke o učenicima
### Dodavanje bilješke
**POST /api/ucenici/:ucenikId/biljeske**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"datum": "2026-11-23", "vrsta": "aktivnost", "sadrzaj": "Ucenik je samostalno rijesio zadatke."}
```
Odgovor:
```json
{"poruka": "Biljeska je uspjesno dodana", "biljeska": {"id": "507f1f77bcf86cd799439020", "ucenikId": "507f1f77bcf86cd799439016", "datum": "2026-11-23", "vrsta": "aktivnost", "sadrzaj": "Ucenik je samostalno rijesio zadatke."}}
```
Pravila: Dozvoljene vrste: `aktivnost`, `rad`, `zalaganje`, `ponasanje`, `ostalo`; sadržaj mora biti neprazan.
### Popis bilješki učenika
**GET /api/ucenici/:ucenikId/biljeske**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439020", "datum": "2026-11-23", "vrsta": "aktivnost", "sadrzaj": "Ucenik je samostalno rijesio zadatke."}]
```
Pravila: Najnovije prve; mogući budući filter po vrsti nije obvezan za prvu verziju.
### Jedna bilješka
**GET /api/biljeske/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439020", "ucenikId": "507f1f77bcf86cd799439016", "datum": "2026-11-23", "vrsta": "aktivnost", "sadrzaj": "Ucenik je samostalno rijesio zadatke."}
```
### Uređivanje bilješke
**PATCH /api/biljeske/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"sadrzaj": "Ucenik je rijesio sve zadatke i pomogao drugima."}
```
Odgovor:
```json
{"poruka": "Biljeska je uspjesno azurirana", "biljeska": {"id": "507f1f77bcf86cd799439020", "ucenikId": "507f1f77bcf86cd799439016", "datum": "2026-11-23", "vrsta": "aktivnost", "sadrzaj": "Ucenik je rijesio sve zadatke i pomogao drugima."}}
```
### Brisanje bilješke
**DELETE /api/biljeske/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Biljeska je uspjesno obrisana"}
```
### 5.7. Stalni tjedni raspored
### Dodavanje termina
**POST /api/raspored**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"razredId": "507f1f77bcf86cd799439014", "danUTjednu": 1, "vrijemeOd": "08:00", "vrijemeDo": "08:45"}
```
Odgovor:
```json
{"poruka": "Termin je uspjesno dodan", "termin": {"id": "507f1f77bcf86cd799439022", "razredId": "507f1f77bcf86cd799439014", "danUTjednu": 1, "vrijemeOd": "08:00", "vrijemeDo": "08:45"}}
```
Pravila: Dan je broj 1–7 (pon–ned); razred pripada korisniku; preklapanje s bilo kojim vlastitim terminom istog dana: 409.
### Popis rasporeda
**GET /api/raspored**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439022", "razredId": "507f1f77bcf86cd799439014", "danUTjednu": 1, "vrijemeOd": "08:00", "vrijemeDo": "08:45"}]
```
Pravila: Sortiranje po danu i vremenu početka.
### Jedan termin
**GET /api/raspored/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439022", "razredId": "507f1f77bcf86cd799439014", "danUTjednu": 1, "vrijemeOd": "08:00", "vrijemeDo": "08:45"}
```
### Uređivanje termina
**PATCH /api/raspored/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"vrijemeOd": "09:00", "vrijemeDo": "09:45"}
```
Odgovor:
```json
{"poruka": "Termin je uspjesno azuriran", "termin": {"id": "507f1f77bcf86cd799439022", "razredId": "507f1f77bcf86cd799439014", "danUTjednu": 1, "vrijemeOd": "09:00", "vrijemeDo": "09:45"}}
```
Pravila: Prije spremanja usporediti s ostalim terminima; uređivani termin izuzeti iz provjere.
### Brisanje termina
**DELETE /api/raspored/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Termin je uspjesno obrisan"}
```
### 5.8. Kalendar pisanih i usmenih provjera
### Dodavanje provjere
**POST /api/provjere**  · Uspjeh: **201 Created**
Zahtjev:
```json
{"razredId": "507f1f77bcf86cd799439014", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu", "datum": "2026-11-27"}
```
Odgovor:
```json
{"poruka": "Provjera je uspjesno dodana", "provjera": {"id": "507f1f77bcf86cd799439024", "razredId": "507f1f77bcf86cd799439014", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu", "datum": "2026-11-27"}}
```
Pravila: Vrsta `pisana` ili `usmena`; dopustiti više provjera različitih razreda istog dana.
### Provjere odabranoga mjeseca
**GET /api/provjere?mjesec=2026-11**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439024", "razredId": "507f1f77bcf86cd799439014", "razred": "6.b", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu", "datum": "2026-11-27"}]
```
Pravila: `mjesec` je neobvezan; bez njega vraćaju se sve vlastite provjere. Polje `razred` je prikazni naziv dobiven iz vlastitog razreda.
### Provjere razreda
**GET /api/razredi/:razredId/provjere**  · Uspjeh: **200 OK**
Odgovor:
```json
[{"id": "507f1f77bcf86cd799439024", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu", "datum": "2026-11-27"}]
```
### Jedna provjera
**GET /api/provjere/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"id": "507f1f77bcf86cd799439024", "razredId": "507f1f77bcf86cd799439014", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu", "datum": "2026-11-27"}
```
### Uređivanje provjere
**PATCH /api/provjere/:id**  · Uspjeh: **200 OK**
Zahtjev:
```json
{"datum": "2026-12-01", "nastavnaCjelina": "Programiranje u Pythonu - petlje"}
```
Odgovor:
```json
{"poruka": "Provjera je uspjesno azurirana", "provjera": {"id": "507f1f77bcf86cd799439024", "razredId": "507f1f77bcf86cd799439014", "vrsta": "pisana", "nastavnaCjelina": "Programiranje u Pythonu - petlje", "datum": "2026-12-01"}}
```
Pravila: Premještanje u drugi razred nije dopušteno u prvoj verziji.
### Brisanje provjere
**DELETE /api/provjere/:id**  · Uspjeh: **200 OK**
Odgovor:
```json
{"poruka": "Provjera je uspjesno obrisana"}
```

## 6. Standardne pogreške i statusi
| HTTP status | Značenje | Tipični slučajevi |
|---|---|---|
| 200 OK | Uspješan GET, PATCH ili DELETE | Dohvat/uređivanje/brisanje vlastitog zapisa |
| 201 Created | Uspješan POST | Registracija, novi objekt |
| 400 Bad Request | Nevaljani podaci | Prazno polje, nevaljan ObjectId, datum, vrijeme, nedopušten ključ |
| 401 Unauthorized | Nema valjane autentifikacije | Token nedostaje, istekao ili nije valjan; neuspjela prijava |
| 404 Not Found | Nije pronađeno ili nije vlastito | Nepostojeći/tuđi zapis |
| 409 Conflict | Sukob poslovnih pravila | Duplikat razreda/e-maila, povezani podaci, preklapanje termina |
| 500 Internal Server Error | Neočekivana pogreška | Ne iznositi interne detalje klijentu |
Primjer odgovora pri pogrešci:
```json
{"greska": "Termin se preklapa s postojecim terminom u rasporedu"}
```
Poruke pogreške mogu biti na hrvatskom; konzistentan oblik `{"greska":"..."}` koristi se kroz sve rute.

## 7. Ključna poslovna pravila
### 7.1. Autorizacija svih zapisa
Svaki backend upit za vlasnički objekt filtrira se po `korisnikId` prijavljenog učitelja. Kod ugniježđenih putanja prethodno se dohvaća i provjerava roditeljski objekt (škola za razred, razred za učenika/sat/provjeru, učenik za bilješku). Ne smije biti moguće slanjem tuđeg ID-a pristupiti tuđim podacima. `korisnikId`, `skolaId`, `razredId` ili `ucenikId` koji se ne smiju uređivati ignoriranjem nisu dovoljni: nedopuštene izmjene odbijamo s 400.
### 7.2. Preklapanje tjednoga rasporeda
Termin A i termin B istog učitelja istog dana preklapaju se kada vrijedi `A.vrijemeOd < B.vrijemeDo` **i** `A.vrijemeDo > B.vrijemeOd` (usporedba nakon pretvorbe u minute). Primjer: 08:00–08:45 i 08:30–09:15 ne smiju koegzistirati; 08:00–08:45 i 08:45–09:30 smiju. Pravilo vrijedi bez obzira na školu ili razred. Kod PATCH zahtjeva uređivani termin isključuje se iz usporedbe. U implementaciji treba osigurati i zaštitu od istodobnih konkurentnih zahtjeva koji bi mogli zaobići običnu provjeru pa spremanje.
### 7.3. Povijest evidentiranih sati
Stalni `raspored` i `nastavni_sati` dvije su neovisne kolekcije. Prilikom unosa sata raspored može unaprijed popuniti razred i vrijeme, ali se datum i vrijeme spremaju unutar zapisa sata. Naknadna promjena ili brisanje termina rasporeda **ne mijenja i ne briše postojeće nastavne sate**. I kalendar provjera ostaje neovisan o rasporedu.
### 7.4. Brisanje i povezani podaci
Škola se ne briše ako sadrži razrede. Razred se ne briše ako ima učenike, sate, raspored ili provjere. Učenik se ne briše ako ima bilješke. U takvim slučajevima vraća se `409 Conflict`. Time se izbjegava slučajni gubitak evidencije; u prvoj verziji nema automatskoga kaskadnog brisanja.
### 7.5. Sigurnost i demonstracijski podaci
Lozinka se pohranjuje samo kao siguran hash (npr. bcrypt), JWT tajna i poveznica baze nalaze se u `.env` koji nije pod Gitom. Treba provjeriti autentifikaciju i autorizaciju i pomoću najmanje dva probna učiteljska računa. Testne podatke učenika i bilješke koristiti isključivo izmišljene.

## 8. Plan testiranja (Postman)
| Test | Očekivano |
|---|---|
| Registracija s valjanim podacima | 201, korisnik bez hashirane lozinke |
| Ponovna registracija istim e-mailom | 409 |
| Prijava ispravnim/neispravnim podacima | 200 i JWT / 401 |
| GET `/api/skole` bez tokena | 401 |
| Učitelj A dohvaća svoju školu | 200 |
| Učitelj B pokušava dohvatiti/izmijeniti/brisati školu A | 404; nema izmjene |
| Učitelj B pokušava dodati razred u školu A | 404; ništa nije dodano |
| Dodavanje razreda s već postojećim nazivom u istoj školi | 409 |
| Brisanje škole koja ima razrede | 409 |
| Brisanje razreda s učenicima ili satima | 409 |
| Dodavanje, izmjena i brisanje vlastitih bilješki | 201 / 200 / 200 |
| Termin 08:00–08:45 pa pokušaj 08:30–09:15 istog dana | 201 pa 409 |
| Termin 08:45–09:30 iza 08:00–08:45 | 201, bez preklapanja |
| Promjena rasporeda nakon spremanja nastavnog sata | Povijesni sat zadržava stari datum i vrijeme |
| GET `/api/provjere?mjesec=2026-11` | Samo provjere u mjesecu i samo vlastite |
| Nevaljan ObjectId ili nepostojeći datum | 400 |
| Nedopušten `korisnikId` u POST/PATCH | 400, bez promjene vlasništva |

## 9. Redoslijed implementacije i commitanja
1. Početni Express server i razvojne ovisnosti (već učinjeno)
2. Spremanje specifikacije backenda u repozitorij
3. Povezivanje MongoDB baze i `.env.example`
4. Model korisnika, registracija i prijava
5. JWT middleware i provjera vlasništva
6. CRUD za škole
7. CRUD za razrede
8. CRUD za učenike
9. CRUD za nastavne sate
10. CRUD za bilješke
11. CRUD za tjedni raspored i provjera preklapanja
12. CRUD za provjere i filtriranje po mjesecu
13. Postman testiranje, ispravci i dokumentiranje
14. Vue frontend, povezivanje i javna objava
Commit se radi nakon smislene i provjerene cjeline, ne radi umjetnog povećanja broja commitova. `README.md` će sadržavati upute za lokalno pokretanje i primjere API poziva.

## 10. Napomena o statusu dokumenta
Ovo je planirana specifikacija, a ne tvrdnja da navedene rute već postoje. Sve primjere potrebno je potvrditi stvarnim testiranjem tijekom implementacije. Ako se u razvoju izmijeni API ugovor, istodobno se ažurira i ovaj dokument.

**Pripremljeno za prijavu projektne specifikacije i kao referenca za daljnji razvoj aplikacije Učiteljski planer.**
