# L'app per iPhone, iPad e Mac

L'app è la città stessa, la stessa costruita da Vite e pubblicata su GitHub Pages, dentro un guscio nativo fatto con [Capacitor](https://capacitorjs.com). È lo schema di *Dopo il 79*. Il codice resta uno solo: una modifica a `src/` arriva al sito e all'app con la stessa build.

Funziona senza rete. Tutti i file sono nel pacchetto (texture, figure, animali, kit, monumenti: circa 118 MB) e la città non scarica niente da fuori.

Il 9 ottobre 2026 Domenico ha deciso di prepararla subito, come per Pompei, senza aspettare il MacBook di novembre.

## Com'è fatta

```
capacitor.config.json   nome, identificativo, cartella dei file
scripts/app-www.mjs     copia dist/ in app/www/
app/www/                (generata, non versionata) ciò che entra nel pacchetto
app/ios/                il progetto Xcode, generato da Capacitor 8.5.2 e versionato
```

- **Identificativo:** `io.github.d0m3n1c0x.firenze1216`, costruito sul dominio GitHub Pages del progetto come quello di Pompei. Si può cambiare fino alla prima pubblicazione, poi non più: un identificativo nuovo è un'app nuova per l'App Store.
- **Nome sotto l'icona:** «Firenze 1216».
- **Icona:** `public/icon-1024.png`, la città vista dall'alto sopra l'Arno, con il ponte e le torri. È senza trasparenza, come chiede Apple. La stessa immagine, a 180 px, è l'icona del sito sulla schermata Home (`public/apple-touch-icon.png`).
- **Cifratura:** l'app non ne usa una propria (`ITSAppUsesNonExemptEncryption = false`), così App Store Connect non fa la domanda sull'esportazione.

## Aggiornare l'app dopo una modifica

```bash
npm run app
```

Ricostruisce la città, ricompone `app/www/` e la copia nel progetto Xcode. I file della città dentro Xcode (`app/ios/App/App/public/`) non vanno in git: si rigenerano ogni volta.

## Il vincolo: questo Mac

Il Mac di oggi (macOS 13, Intel) non installa l'Xcode che App Store Connect accetta. Dal 28 aprile 2026 servono build fatte con Xcode 26, che chiede almeno macOS Sequoia 15.6 (verificato per Pompei il 25 settembre 2026, *app/README.md* di quel progetto).

La compilazione e il caricamento avvengono quindi su un Mac di GitHub Actions, nel repository pubblico della città:

- **App iOS** (`.github/workflows/app-ios.yml`) compila per il simulatore, senza firma. Parte da solo quando cambia il progetto Xcode, e si può lanciare a mano dalla scheda Actions.
- **App su TestFlight** (`.github/workflows/app-testflight.yml`) firma e carica. Si lancia solo a mano.

Con il MacBook Apple Silicon di novembre si potrà aprire `app/ios/App/App.xcodeproj` in Xcode e provarla sul simulatore e su un iPad vero: è lì che si giudica la fluidità.

## Per pubblicarla davvero

I passi sono quelli di Pompei, con l'identificativo della città:

1. **Apple Developer Program**: 99 USD l'anno. È lo stesso account che servirà a Pompei: basta pagarlo una volta.
2. **Registrare l'identificativo** `io.github.d0m3n1c0x.firenze1216` in *Certificates, Identifiers & Profiles → Identifiers*. Poi, in **App Store Connect → App → «+» → Nuova app**, creare la scheda dell'app con quell'identificativo.
3. **Chiave API**: App Store Connect → *Utenti e accessi* → *Integrazioni* → *Team Keys*, con accesso **Admin**. Il file `.p8` si scarica una volta sola. La stessa chiave vale per Pompei e per la città.
4. **Quattro secrets** nel repository pubblico `D0M3N1C0X/firenze-1216-citta`, in *Settings → Secrets and variables → Actions*: `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_P8`, `APPLE_TEAM_ID`.
5. **Lanciare** il flusso *App su TestFlight* dalla scheda Actions; dopo qualche minuto la build compare in TestFlight.

Il flusso TestFlight non è mai stato eseguito: il primo lancio è anche il suo collaudo.

**Il rischio in revisione** è lo stesso di Pompei. La linea guida 4.2 chiede più di un sito reimpacchettato. A favore di questa app ci sono tre cose: funziona offline, è una città 3D da percorrere, ha un racconto guidato. Lo stesso contenuto, però, è anche un sito pubblico.

**Il peso.** Circa 118 MB di contenuti, accettati da Domenico il 9 ottobre: l'hardware di riferimento è di fascia alta.
