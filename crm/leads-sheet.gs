/**
 * Location Clôture Chantier — miroir Google Sheet (Apps Script Web App).
 *
 * OPTIONNEL. La base de données SQLite de l'application (visible dans /admin)
 * est la source de vérité; ce script ne sert qu'à garder une copie des leads
 * dans un Sheet et à envoyer l'alerte courriel à chaque soumission.
 *
 *   Extensions ▸ Apps Script ▸ coller ce fichier ▸ Deploy ▸ New deployment
 *   Type: Web app · Execute as: Me · Who has access: Anyone
 * Copier l'URL /exec dans la variable d'environnement APPS_SCRIPT_URL et
 * utiliser le même TOKEN des deux côtés (APPS_SCRIPT_TOKEN).
 */

const TOKEN = 'CHANGE-ME-long-random-shared-secret';
const SHEET_NAME = 'Leads';
const NOTIFY_EMAIL = 'info@locationcloturechantier.ca'; // '' pour désactiver les alertes

const HEADERS = [
  'Timestamp', 'Source', 'Ville', 'Type de clôture', 'Longueur',
  'Durée', 'Courriel', 'Téléphone', 'Détails', 'IP', 'Statut CRM',
];

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    if (body.token !== TOKEN) return json_({ ok: false, error: 'unauthorized' });

    if (body.action !== 'append_form') return json_({ ok: false, error: 'unknown action' });

    appendForm_(getSheet_(), body.row || {});
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendForm_(sheet, r) {
  sheet.appendRow([
    r.timestamp || new Date().toISOString(),
    r.source || '', r.ville || '', r.type_cloture || '', r.longueur || '',
    r.duree || '', r.email || '', r.telephone || '', r.details || '',
    r.ip || '', 'Nouveau',
  ]);
  notify_('Nouvelle soumission — ' + (r.ville || 'Québec'),
    'Ville: ' + (r.ville || '') + '\nType: ' + (r.type_cloture || '') +
    '\nLongueur: ' + (r.longueur || '') + '\nDurée: ' + (r.duree || '') +
    '\nCourriel: ' + (r.email || '') + '\nTéléphone: ' + (r.telephone || '') +
    '\nDétails: ' + (r.details || '') +
    '\n\nToutes les soumissions : https://locationcloturechantier.ca/admin');
}

function notify_(subject, body) {
  if (NOTIFY_EMAIL) MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
