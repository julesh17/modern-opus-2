import * as XLSX from 'xlsx';
import { addDays, setHours, setMinutes, parse, format, isDate } from 'date-fns';

// Helpers
const isTimeLike = (val) => {
  if (!val) return false;
  if (typeof val === 'string' && val.match(/^\d{1,2}[:h]\d{2}/)) return true;
  return false;
};

const parseTime = (val) => {
  if (!val) return null;
  // Gestion simple des heures Excel (fraction de jour) ou string "08:30"
  if (typeof val === 'number') {
    const totalMinutes = Math.round(val * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return { h, m };
  }
  if (typeof val === 'string') {
    const clean = val.replace('h', ':').replace('H', ':');
    const parts = clean.split(':');
    return { h: parseInt(parts[0]), m: parseInt(parts[1]) };
  }
  return null;
};

export const parseExcelEngine = async (file) => {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { cellDates: true });
  
  let allEvents = [];
  const promoSheets = workbook.SheetNames.filter(n => n.toUpperCase().includes("EDT") && (n.toUpperCase().includes("P1") || n.toUpperCase().includes("P2")));

  promoSheets.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // Conversion en tableau de tableaux (matrix)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    
    // Détection des lignes S (Semaines) et H (Heures)
    // Note: C'est une simplification de ta logique Python pour aller droit au but
    // En JS, on itère souvent sur la grille.
    
    const promoLabel = sheetName.includes("P1") ? "P1" : (sheetName.includes("P2") ? "P2" : sheetName);
    
    // On cherche les lignes de dates
    for (let r = 0; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || !row[0]) continue;
      
      const firstCell = String(row[0]).trim();
      
      // Si on trouve une ligne qui commence par H... (ex: H08:30)
      if (/^H\s*\d+/.test(firstCell)) {
          // La ligne de date est souvent r - 1 ou r - 2 selon ton algo python
          // Ici on suppose que la date est juste au dessus ou 2 cases au dessus
          // On va scanner les colonnes
          
          for (let c = 1; c < row.length; c++) {
             // Essayer de trouver une date valide dans les lignes au dessus (r-1 ou r-2)
             let dateVal = null;
             if (rawData[r-1] && isDate(rawData[r-1][c])) dateVal = rawData[r-1][c];
             else if (rawData[r-2] && isDate(rawData[r-2][c])) dateVal = rawData[r-2][c];
             
             if (!dateVal) continue;

             const cellContent = row[c];
             if (!cellContent) continue;
             
             const summary = String(cellContent).trim();
             if (summary === "") continue;

             // Trouver les profs et l'heure de fin en descendant les lignes
             let teachers = [];
             let endTime = null;
             let startTime = parseTime(firstCell.replace(/^H\s*/, '')); // Ex: H 8:30 -> 8:30
             
             // Scan vertical pour profs et heure fin
             for (let offset = 1; offset < 12; offset++) {
                const nextRow = rawData[r + offset];
                if (!nextRow) break;
                const nextCell = nextRow[c]; // Contenu
                const nextHeader = nextRow[0]; // Heure colonne 0

                // Si colonne 0 est une heure, c'est peut-être la fin
                if (nextHeader && isTimeLike(nextHeader)) {
                    // Si le contenu change, c'est la fin du cours
                    if (String(nextCell).trim() !== summary) {
                        endTime = parseTime(nextHeader.replace(/^H\s*/, ''));
                        break;
                    }
                }

                // Détection prof (heuristique simple : pas une date, pas vide, pas le summary)
                if (nextCell && String(nextCell).trim() !== summary && !isDate(nextCell)) {
                    teachers.push(String(nextCell).trim());
                }
             }
             
             // Fallback fin
             if (!startTime) startTime = {h: 8, m: 30};
             if (!endTime) endTime = { h: startTime.h + 1, m: 30 }; // Défaut 1h30

             const startDt = setMinutes(setHours(dateVal, startTime.h), startTime.m);
             const endDt = setMinutes(setHours(dateVal, endTime.h), endTime.m);

             // Groupes (simplifié : regarde la ligne au dessus ou en dessous)
             let groups = [];
             // Logique à adapter selon la position exacte des groupes dans ton excel

             allEvents.push({
                 id: crypto.randomUUID(),
                 title: summary,
                 start: startDt,
                 end: endDt,
                 teachers: [...new Set(teachers)], // unique
                 promo: promoLabel,
                 groups: groups
             });
          }
      }
    }
  });

  return allEvents;
};

// Générateur ICS simple
export const generateICS = (events) => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//ModernOpus//FR\n";
    events.forEach(ev => {
        const formatDate = (date) => format(date, "yyyyMMdd'T'HHmmss");
        icsContent += "BEGIN:VEVENT\n";
        icsContent += `DTSTART:${formatDate(ev.start)}\n`;
        icsContent += `DTEND:${formatDate(ev.end)}\n`;
        icsContent += `SUMMARY:${ev.title}\n`;
        icsContent += `DESCRIPTION:Enseignants: ${ev.teachers.join(', ')}\n`;
        icsContent += "END:VEVENT\n";
    });
    icsContent += "END:VCALENDAR";
    return icsContent;
};