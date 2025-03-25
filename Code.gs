const SPREADSHEET_ID = '1zh1xlryoyNByoobUIvKtMFIdpopHaBEeMHh4nIcS7wg';
const ANSWERS_SHEET = 'Answers';
const CONFIG_SHEET = 'Config';
const CALENDAR_ID = 'kvetka.trusovichi@gmail.com';
const FOLDER_ID = '1qCi4kN6Vjs8G6Hx_i92wSnZ-WzjLEAtQ';
const STATUS_COLUMN = 13;
const TELEGRAM_TOKEN = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN'); // Securely stored
const TELEGRAM_CHAT_ID = PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID'); // Securely stored

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.config = getConfig();
  template.bookings = listBookings();
  return template.evaluate().setTitle('Форма бронирования');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function saveFile({ data, mimeType, fileName }) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const source = Utilities.base64Decode(data);
  const blob = Utilities.newBlob(source, mimeType, fileName);
  const file = folder.createFile(blob);
  return file.getUrl();
}

function getConfig() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(CONFIG_SHEET);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  return values.slice(1).reduce((config, row) => {
    config[row[0]] = Number(row[1]) || row[1];
    return config;
  }, {});
}

function listBookings() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);
  if (!sheet) return [];
  return sheet.getDataRange().getValues().slice(1).map(row => ({
    checkin: new Date(row[2]),
    checkout: new Date(row[3])
  })).filter(booking => !isNaN(booking.checkin) && !isNaN(booking.checkout));
}

function calculateCost(checkinDate, checkoutDate, guests, children, pets) {
  const config = getConfig();
  const nightCount = Math.round((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  const day = checkinDate.getDay();
  const basePrice = [1, 2, 3, 4].includes(day) ? config.weekdayPrice :
    day === 5 ? config.fridayPrice :
    day === 6 ? config.saturdayPrice : config.sundayPrice;
  const totalBase = basePrice * nightCount;
  const extraGuests = Math.max(0, guests - 2) * config.extraGuest;
  const extraChildren = Math.max(0, children - 1) * config.extraChild;
  const extraPets = pets * config.extraPet;
  const total = totalBase + extraGuests + extraChildren + extraPets;
  const prepayment = config.prepayment * nightCount;
  const toPay = total - prepayment;
  let priceDetails = `<p><b>Кол-во ночей:</b> ${nightCount}</p>
                      <p><b>Базовая ставка:</b> ${totalBase.toFixed(2)} BYN</p>`;
  if (extraGuests > 0)
    priceDetails += `<p><b>Доп. гости:</b> ${extraGuests.toFixed(2)} BYN</p>`;
  if (extraChildren > 0)
    priceDetails += `<p><b>Доп. дети:</b> ${extraChildren.toFixed(2)} BYN</p>`;
  if (extraPets > 0)
    priceDetails += `<p><b>Доп. животные:</b> ${extraPets.toFixed(2)} BYN</p>`;
  priceDetails += `<p><b>Итого:</b> ${total.toFixed(2)} BYN</p>`;
  return { total, prepayment, toPay, priceDetails };
}

function addReservation(formData) {
  if (!formData.receiptFileUrl) throw new Error("Пожалуйста, загрузите чек перед отправкой.");

  const sheet = getOrCreateSheet();
  const checkinDate = new Date(formData.checkin);
  const checkoutDate = new Date(formData.checkout);
  const { total, prepayment, toPay, priceDetails } = calculateCost(checkinDate, checkoutDate, formData.guests, formData.children, formData.pets);

  sheet.appendRow([
    new Date(), formData.email, checkinDate, checkoutDate, formData.name, formData.phone,
    formData.guests, formData.children, formData.pets, formData.paymentMethod,
    formData.receiptFileUrl, formData.comment, '', 'ожидание'
  ]);

  sendTelegramNotification(formData, checkinDate, checkoutDate, priceDetails, formData.receiptFileUrl);
  createReminders(checkinDate, formData.email, formData.name);

  return `Спасибо! Заявка отправлена. Мы свяжемся после подтверждения.\n${priceDetails}`;
}

function sendTelegramNotification(formData, checkinDate, checkoutDate, priceDetails, fileUrl) {
  const message = `🛎 Новая заявка на бронирование:\n<b>${formData.name}</b> (${formData.email})\n📅 ${checkinDate.toLocaleDateString()} – ${checkoutDate.toLocaleDateString()}\n👨‍👩‍👧‍👦 Взрослые: ${formData.guests}, Дети: ${formData.children}, Животные: ${formData.pets}\n💳 Оплата: ${formData.paymentMethod}\n📝 Комментарий: ${formData.comment || '—'}\n📎 <a href="${fileUrl}">Чек</a>\n${priceDetails}\n\n✅ <a href="https://script.google.com/macros/s/AKfycbz9WIzhaxDvYSJ0DofisHXjXX-yrDMU9lwpn6La-gruhBH2q-51ZB2EWDJ1woCXYM7M/exec?email=${encodeURIComponent(formData.email)}">Подтвердить</a>`;

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: TELEGRAM_CHAT_ID,
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}

function confirmBooking(e) {
  const email = e.parameter.email;
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][1] === email) {
      sheet.getRange(i + 1, STATUS_COLUMN).setValue('ok');
      const checkinDate = new Date(rows[i][2]);
      const checkoutDate = new Date(rows[i][3]);
      const formData = {
        email: rows[i][1],
        name: rows[i][4],
      };
      const guests = rows[i][6];
      const children = rows[i][7];
      const pets = rows[i][8];
      const { total, prepayment, toPay, priceDetails } = calculateCost(checkinDate, checkoutDate, guests, children, pets);
      sendConfirmationEmail(formData, checkinDate, checkoutDate, total, toPay, priceDetails);
      break;
    }
  }
  return HtmlService.createHtmlOutput("Бронирование подтверждено!");
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(ANSWERS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ANSWERS_SHEET);
    sheet.appendRow(['Timestamp','Email','Checkin','Checkout','Name','Phone','Guests','Children','Pets','PaymentMethod','FileUrl','Comment','Price','Status']);
  }
  return sheet;
}

function sendConfirmationEmail(formData, checkinDate, checkoutDate, total, toPay, priceDetails) {
  MailApp.sendEmail({
    to: formData.email,
    subject: `Kvetka: Бронирование подтверждено (${checkinDate.toLocaleDateString()} – ${checkoutDate.toLocaleDateString()})`,
    htmlBody: `Здравствуйте, ${formData.name}!<br><br>Ваше бронирование подтверждено.<br><br>${priceDetails}<br><br>Осталось к оплате: <b>${toPay.toFixed(2)} BYN</b><br><br>До скорой встречи!`
  });
}

function createReminders(checkinDate, email, name) {
  const reminders = [
    { offset: 7, message: 'Ваш отдых уже через 7 дней!' },
    { offset: 1, message: 'Завтра выезжаете к нам! Дом будет ждать вас с 15:00.' },
    { offset: -1, message: 'Спасибо за отдых! Будем рады вашему отзыву.' }
  ];

  reminders.forEach(({ offset, message }) => {
    const date = new Date(checkinDate);
    date.setDate(date.getDate() - offset);
    if (date > new Date()) {
      const key = `${date.toISOString().slice(0, 10)}_${email}_${offset}`;
      PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({ email, name, message }));
      try {
        ScriptApp.newTrigger('sendReminder')
          .timeBased()
          .at(new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0))
          .create();
      } catch (e) {
        Logger.log('Не удалось создать триггер: ' + e);
      }
    }
  });
}

function sendReminder() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const props = PropertiesService.getScriptProperties().getProperties();
  for (let key in props) {
    if (key.startsWith(today)) {
      const data = JSON.parse(props[key]);
      MailApp.sendEmail({
        to: data.email,
        subject: 'Напоминание от Kvetka',
        body: `Здравствуйте, ${data.name}!

${data.message}

До скорой встречи!`
      });
      PropertiesService.getScriptProperties().deleteProperty(key);
    }
  }
}