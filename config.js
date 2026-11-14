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
  version: '2',

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
    Zuordnung der Enden. Die Funktion erhält die fünf Entscheidungen ZUS-01 bis ZUS-05 als Liste von true (Ja) und false (Nein).
    T ist die Anzahl der Ja bei ZUS-01 bis ZUS-04. K ist die Entscheidung bei ZUS-05.
      T = 0                    END-03
      T = 1                    END-04
      K Ja und T 3 bis 4       END-01
      K Ja und T = 2           END-05
      K Nein und T 2 bis 4     END-02
    Die Regel deckt alle 32 Kombinationen ab.
  */
  endingFor: function (z) {
    var t = (z[0] ? 1 : 0) + (z[1] ? 1 : 0) + (z[2] ? 1 : 0) + (z[3] ? 1 : 0);
    var k = !!z[4];
    if (t === 0) return 'END-03';
    if (t === 1) return 'END-04';
    if (k) return t >= 3 ? 'END-01' : 'END-05';
    return 'END-02';
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
    taskDoneNote: 'Erledigt.',
    // Leer lassen, wenn kleine Stationen nach der Lösung keinen eigenen Text zeigen sollen.
    rewardDefault: '',

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
    listen: 'Anhören',
    audioMissing: 'Die Aufnahme ist gerade nicht verfügbar.'
  }
};
