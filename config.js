/*
  EVERLIGHT, Einstellungen

  Diese Datei enthält Codes, Regeln und Oberflächentexte.
  Die Geschichte steht in story.txt.

  Regeln für das Bearbeiten:
  - Texte stehen in einfachen Anführungszeichen. Ein Apostroph im Text muss als \' geschrieben werden.
  - Jede Zeile außer der letzten in einem Block endet mit einem Komma.
  - Lösche keine Zeilen, ändere nur die Werte.
*/
window.EVERLIGHT_CONFIG = {

  // Erhöhe die Zahl bei jeder Veröffentlichung. Sie dient nur der Übersicht.
  version: '1',

  // Notfallcode für dich. Öffnet das Admin-Fenster.
  // Öffnen: Tippe siebenmal schnell auf das Wort Everlight oben links.
  // ÄNDERN vor dem Einsatz.
  adminCode: '1711',

  // Code der fünf Schuppen, gelesen in der Reihenfolge R, U, 3, D, I (Rückseiten).
  // Das ist ein Beispiel. ERSETZEN durch deinen echten Code.
  finalCode: '52847',

  // true: Stationen lassen sich nur in der festen Reihenfolge öffnen.
  // false: jede Station lässt sich jederzeit öffnen.
  enforceOrder: true,

  // Haltedauer des Bestätigungssymbols in Millisekunden.
  holdMs: 2000,

  // Falscheingaben beim Schuppen-Code. Ab dieser Anzahl sperrt die Eingabe.
  codeLockAfter: 9,
  codeLockSeconds: 60,

  // Hinweise von Kim bei Falscheingaben des Schuppen-Codes.
  // Die Meldung mit dem höchsten passenden Wert wird gezeigt.
  codeTiers: [
    { after: 3, text: 'Kim murmelt: „Ich sollte mir die Schuppen nochmal genauer ansehen.“' },
    { after: 6, text: 'Kim murmelt: „Die Vorderseiten haben eine Reihenfolge.“' }
  ],

  /*
    Zuordnung der fünf Zustände zu den fünf Enden. VORLÄUFIGER VORSCHLAG.
    Schlüssel: Zustände ZUS-01 bis ZUS-05 in dieser Reihenfolge, 1 = Ja, 0 = Nein.
    Beispiel: '10110' heißt ZUS-01 Ja, ZUS-02 Nein, ZUS-03 Ja, ZUS-04 Ja, ZUS-05 Nein.
    Die Verteilung ist noch nicht abgestimmt und wird mit dir festgelegt.
  */
  endings: {
    '11111': 'END-01',
    '11110': 'END-02',
    '11101': 'END-05',
    '11100': 'END-02',
    '11011': 'END-04',
    '11010': 'END-04',
    '11001': 'END-04',
    '11000': 'END-04',
    '10111': 'END-02',
    '10110': 'END-02',
    '10101': 'END-02',
    '10100': 'END-02',
    '10011': 'END-04',
    '10010': 'END-04',
    '10001': 'END-03',
    '10000': 'END-03',
    '01111': 'END-05',
    '01110': 'END-02',
    '01101': 'END-05',
    '01100': 'END-02',
    '01011': 'END-04',
    '01010': 'END-04',
    '01001': 'END-04',
    '01000': 'END-04',
    '00111': 'END-02',
    '00110': 'END-02',
    '00101': 'END-02',
    '00100': 'END-02',
    '00011': 'END-04',
    '00010': 'END-04',
    '00001': 'END-03',
    '00000': 'END-03'
  },

  // Oberflächentexte
  ui: {
    startButton: 'Beginnen',
    continueButton: 'Weiter bei deiner Station',
    chapter: 'Kapitel',

    taskTitle: 'Aufgabe',
    answerPlaceholder: 'Deine Lösung',
    check: 'Prüfen',
    wrong: 'Das stimmt noch nicht.',
    solved: 'Gelöst.',
    taskDone: 'Erledigt',
    hint: 'Hinweis anzeigen',
    hintLabel: 'Hinweis',
    rewardDefault: 'Das Rätsel ist gelöst. Du erhältst jetzt das Stück für Kim und Fridolin.',

    codeTitle: 'Die Schuppen',
    codePlaceholder: 'Code',
    codeWrong: 'Dieser Code stimmt nicht.',
    codeLocked: 'Kim braucht einen Moment. Versuche es in einer Minute wieder.',

    decisionTitle: 'Entscheidung',
    decisionNote: 'Diese Entscheidung ist endgültig.',
    yourChoice: 'Deine Entscheidung',
    confirmTitle: 'Endgültige Entscheidung',
    confirmHold: 'Halte das Symbol gedrückt, um zu bestätigen.',
    confirmBack: 'Zurück',
    extraButton: 'Vorher noch etwas erfragen',

    nextLabel: 'Weiter',

    blockedTitle: 'Noch nicht dran',
    blockedText: 'Hier gibt es für dich noch nichts zu sehen. Kehre zu deiner letzten Station zurück.',
    blockedButton: 'Zur aktuellen Station',
    notFound: 'Diese Station gibt es nicht.',
    loadError: 'Die Geschichte konnte nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.',
    retry: 'Erneut versuchen',
    storageWarning: 'Dein Browser speichert den Fortschritt nicht. Beende den privaten Modus und lade die Seite neu.',

    themeLight: 'Hell',
    themeDark: 'Dunkel',
    sizeSmaller: 'A-',
    sizeLarger: 'A+',
    listen: 'Anhören'
  }
};
