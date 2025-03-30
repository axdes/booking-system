const SPREADSHEET_ID = '1z3sqKwmXBWfcdCNmT_vyJMLF2oVfVXqMxdth_7PpcNk';
const ANSWERS_SHEET = 'Answers';
const RECEIPT_FOLDER_ID = '1qCi4kN6Vjs8G6Hx_i92wSnZ-WzjLEAtQ';
const CALENDAR_ID = 'kvetka.trusovichi@gmail.com';

// Главная точка входа — отображение HTML-формы
function doGet() {
  const tpl = HtmlService.createTemplateFromFile('index');

  tpl.busyDatesJson = JSON.stringify(listBookings());
  tpl.configJson = JSON.stringify(getFullConfig());
  tpl.optionsJson = JSON.stringify(getOptions());
  tpl.includedJson = JSON.stringify(getIncludedItems());

  return tpl.evaluate().setTitle('Kvetka Booking');
}

// Вставка HTML-фрагментов
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Получение всех занятых дат из таблицы бронирований
function listBookings() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues().slice(1); // Без заголовка
  const dates = [];

  data.forEach(row => {
    const [ , , cInRaw, cOutRaw ] = row; // Индексы B и C
    if (!cInRaw || !cOutRaw) return;

    const checkin = new Date(cInRaw);
    const checkout = new Date(cOutRaw);
    if (isNaN(checkin) || isNaN(checkout)) return;

    const day = new Date(checkin);
    while (day < checkout) {
      const dateStr = Utilities.formatDate(day, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      dates.push(dateStr);
      day.setDate(day.getDate() + 1);
    }
  });

  return dates;
}

// Добавление новой брони
function addReservation(formData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);
  if (!sheet) throw new Error('Answers sheet not found!');

  const breakdownStr = JSON.stringify(formData.breakdown || {});
  const daySelectionsStr = JSON.stringify(formData.daySelections || []);
// === УЧИТЫВАЕМ ВТОРОЙ ДОМИК ===
if (formData.includeSecondHouse) {
  formData.fullCost += 150;
  if (!formData.breakdown.total) formData.breakdown.total = 0;
  formData.breakdown.total += 150;

  if (!formData.breakdown.lines) formData.breakdown.lines = [];
  formData.breakdown.lines.push({ label: 'Второй домик', cost: 150 });
}
  sheet.appendRow([
    new Date(),                       // A: Timestamp
    formData.email || '',             // B
    new Date(formData.checkin),       // C
    new Date(formData.checkout),      // D
    formData.name || '',              // E
    formData.phone || '',             // F
    formData.adults || 0,             // G
    formData.kids || 0,               // H
    formData.babies || 0,             // I
    formData.babyBed ? 'Yes' : 'No',  // J
    formData.pets || 0,               // K
    formData.format || '',            // L
    daySelectionsStr,                 // M: JSON
    formData.comment || '',           // N
    formData.receiptFileUrl || '',    // O
    formData.fullCost || 0,           // P
    formData.prepayment || 0,         // Q
    'ожидание',                       // R: статус
    breakdownStr,                      // S: JSON
    formData.includeSecondHouse ? 'да' : 'нет' // или true/false

  ]);

  // Уведомления
  const msg = `Новая бронь: ${formData.name} (${formData.email}), ${formData.checkin}–${formData.checkout}, итого ${formData.fullCost} BYN`;
  sendTelegramNotification(msg);
  createCalendarEvent(formData);
  createReminders(formData);

  return 'Спасибо! Ваша бронь сохранена.';
}

// Сохраняем загруженный чек в Google Drive и возвращаем ссылку
function saveFile(obj) {
  const folder = DriveApp.getFolderById(RECEIPT_FOLDER_ID);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(obj.data),
    obj.mimeType,
    obj.fileName
  );

  const file = folder.createFile(blob);
  return file.getUrl();
}

// Создание события в календаре
function createCalendarEvent(formData) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) return;

  const config = getFullConfig();
  const checkin = new Date(formData.checkin);
  const checkout = new Date(formData.checkout);

  const [inH = 15, inM = 0] = (config.checkin_time || '15:00').split(':').map(Number);
  const [outH = 12, outM = 0] = (config.checkout_time || '12:00').split(':').map(Number);

  checkin.setHours(inH, inM);
  checkout.setHours(outH, outM);

  calendar.createEvent(
    `Бронь: ${formData.name}`,
    checkin,
    checkout,
    {
      description: `${formData.email}, ${formData.phone}\nИтого: ${formData.fullCost}`
    }
  );
}
