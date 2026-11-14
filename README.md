# Everlight WebApp

Eine statische Website. Sie braucht keinen Server und keine Datenbank. Der Fortschritt liegt im Safari-Speicher auf dem Telefon von Sandra.

## Dateien

- index.html: Seitengerüst
- style.css: Aussehen
- app.js: Ablauf der WebApp
- config.js: Codes, Regeln, Oberflächentexte, Zuordnung der Enden
- story.txt: alle Texte, Aufgaben, Lösungen und Hinweise
- sw.js: Zwischenspeicher für den Betrieb bei schlechtem Empfang

- images: ein Bild je Station (STA-01.jpg bis STA-20.jpg), fünf Bilder für die Enden (END-01.jpg bis END-05.jpg) und sudoku.png
- audio: eine Datei je Textblock, benannt wie in der Aufnahmeliste (zum Beispiel STA-01_01.m4a, END-03_01.m4a)

Fehlt eine Bild- oder Audiodatei, zeigt die WebApp kein Bild und einen Hinweis statt des Players. Die Geschichte läuft trotzdem weiter.

## Geschichte bearbeiten

1. Öffne story.txt in einem Texteditor, am besten mit UTF-8.
2. Die Regeln stehen als Kommentar am Anfang der Datei.
3. Jede Zeile unter einem Abschnitt ist ein Absatz. Du kannst Text aus Word zeilenweise einfügen.
4. Die Überschrift einer Station lautet zum Beispiel `## STA-05 | Titel`. Danach folgen typ, kapitel und die Abschnitte in eckigen Klammern.
5. Stationen ohne Aufgabe, Code oder Entscheidung enden nach dem Text. Der nächste Schritt ist dann der nächste NFC-Tag.
6. Mit `weiter-zu: STA-02` unter der Stationsüberschrift zeigt die Station am Ende einen Weiter-Knopf. Er öffnet die genannte Station ohne NFC-Tag. Der Text unter `[weiter]` ist dann die Beschriftung des Knopfes, zum Beispiel „Ich bin bereit und schleiche los!“. Ohne `[weiter]` heißt der Knopf Weiter.
7. Stationen mit Aufgabe, Code oder Entscheidung zeigen zuerst den Text und einen Weiter-Knopf. Erst danach erscheint der interaktive Teil.
8. Besondere Zeilen innerhalb eines Abschnitts:
   - `@audio audio/STA-01_01.m4a` setzt einen Audio-Player an diese Stelle.
   - `@bild images/END-01.jpg` setzt ein Bild an diese Stelle.
   - `?ZUS-01+ Text` zeigt die Zeile nur, wenn ZUS-01 mit Ja entschieden wurde. `?ZUS-01- Text` zeigt sie nur bei Nein. Die Bedingung gilt auch vor `@audio`.
9. `[aufgabe-ende]` ist eine Aufgabe am Ende der Station. Sie erscheint erst nach der Entscheidung und dem Ergebnistext und hat immer den Knopf Erledigt. STA-08 nutzt das für das Nähen.
10. Die fünf Enden stehen als `[ende-1]` bis `[ende-5]` in STA-20. Welches Ende erscheint, legt `endingFor` in config.js fest.
11. Speichere die Datei und lade sie neu hoch. Die WebApp lädt Änderungen beim nächsten Öffnen, sobald das Telefon Empfang hat.

## Codes festlegen

Öffne config.js und ändere:

- adminCode: dein Notfallcode
- finalCode: der Code der Schuppen-Rückseiten, gelesen in der Reihenfolge R, U, 3, D, I (fünf Ziffern)

Die Werte im Ordner (4711 und 52847) sind Beispiele. Ersetze beide vor dem Einsatz.

Die Hinweisstufen bei falschem Code (nach 3 und nach 6 Versuchen) und die Sperre (ab 9 Versuchen, 60 Sekunden) stehen ebenfalls in config.js.

## Veröffentlichen mit GitHub Pages

Quelle: [GitHub Docs, Veröffentlichungsquelle festlegen](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

1. Lege auf github.com ein neues öffentliches Repository an.
2. Lade alle Dateien dieses Ordners in das Repository hoch.
3. Öffne im Repository Settings, dann Pages.
4. Setze unter Build and deployment die Quelle auf Deploy from a branch.
5. Wähle den Branch main und den Ordner root. Klicke auf Save.
6. Die Adresse der Seite zeigt GitHub in den Pages-Einstellungen an.
7. Öffne die Adresse auf deinem iPhone in Safari und prüfe die Startseite.

## NFC-Tags schreiben

1. Öffne die Seite in Safari, tippe siebenmal schnell auf das Wort Everlight oben links und gib den Admincode ein.
2. Im Bereich NFC-Links steht für jede Station ein fertiger Link. Kopiere ihn mit dem Knopf.
3. Schreibe den Link als URL-Datensatz auf den passenden Tag, zum Beispiel mit NFC Tools.
4. Beschrifte den Tag mit der Stations-ID.

Das iPhone liest Tags ab dem iPhone XS bei eingeschaltetem, entsperrtem Display. Der Link öffnet sich in Safari.

## Enden

T ist die Zahl der Ja-Entscheidungen bei ZUS-01 bis ZUS-04. K ist die Entscheidung bei ZUS-05.

- END-03: T ist 0
- END-04: T ist 1
- END-01: K ist Ja und T ist 3 oder 4
- END-05: K ist Ja und T ist 2
- END-02: K ist Nein und T ist 2 bis 4

## Test vor dem Einsatz

1. Gehe alle Stationen mit dem Admin-Fenster durch. Der Notfallcode öffnet jede Station auch außerhalb der Reihenfolge.
2. Prüfe alle Lösungen, Hinweise und Entscheidungen. Im Admin-Fenster setzt du ZUS-01 bis ZUS-05 von Hand und prüfst damit alle fünf Enden.
3. Prüfe den Schuppen-Code mit den echten Schuppen.
4. Lösche den Testfortschritt auf Sandras Telefon: Admin-Fenster, Alles löschen.
5. Prüfe den Empfang an jeder Station.

## Regeln für Sandras Telefon

- Safari ist der Browser. Kein privater Modus.
- Kein Symbol auf dem Home-Bildschirm anlegen. Ein solches Symbol hat einen eigenen Speicher, getrennt von Safari.
- Seiteninhalte nicht über die Safari-Einstellungen löschen.

## Notfälle

- Fortschritt verloren: Im Admin-Fenster Zustände und Station von Hand setzen.
- Sandra kommt nicht weiter: Hinweise in der Aufgabe, danach du als Nebenfigur.
- Seite lädt nicht: Das Notizbuch enthält Tags und Texte als Ersatz.
