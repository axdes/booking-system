const SPREADSHEET_ID = '1zOj-7iOTP_RXpbvvoAGq2v5g2RHIypw0ZMCpZKcjrOY'; // <-- ВАШ ID

const ANSWERS_SHEET = 'Answers';

const RECEIPT_FOLDER_ID= '1qCi4kN6Vjs8G6Hx_i92wSnZ-WzjLEAtQ'; // <-- ВАШ ID

const CALENDAR_ID = 'kvetka.trusovichi@gmail.com';



function doGet() {

const tpl = HtmlService.createTemplateFromFile('index');

// Передаем JSON-данные в index.html

tpl.busyDatesJson = JSON.stringify(listBookings());

tpl.configJson = JSON.stringify(getFullConfig());

tpl.optionsJson = JSON.stringify(getOptions());

tpl.includedJson = JSON.stringify(getIncludedItems());

return tpl.evaluate().setTitle('Kvetka Booking');


}



function include(filename) {

return HtmlService.createHtmlOutputFromFile(filename).getContent();

}



// Собираем все занятые даты (каждый день) из таблицы

function listBookings() {

const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);

if(!sheet)return [];

const data= sheet.getDataRange().getValues().slice(1);

const arr= [];

data.forEach(row=>{

const cInRaw=row[2], cOutRaw=row[3];

if(!cInRaw||!cOutRaw)return;

const cIn= new Date(cInRaw), cOut= new Date(cOutRaw);

if(isNaN(cIn)||isNaN(cOut))return;

const d= new Date(cIn);

while(d< cOut){

arr.push( Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd') );

d.setDate(d.getDate()+1);

}

});

return arr;

}



function addReservation(formData){

const sheet= SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ANSWERS_SHEET);

if(!sheet) throw new Error('Answers sheet not found!');



const breakdownStr= JSON.stringify(formData.breakdown||{});

const daySelectionsStr= JSON.stringify(formData.daySelections||[]);



sheet.appendRow([

new Date(), // timestamp

formData.email||'', // B

new Date(formData.checkin), // C

new Date(formData.checkout), // D

formData.name||'', // E

formData.phone||'', // F

formData.adults||0, // G

formData.kids||0, // H

formData.babies||0, // I

(formData.babyBed?'Yes':'No'), // J

formData.pets||0, // K

formData.format||'', // L

daySelectionsStr, // M (JSON)

formData.comment||'', // N

formData.receiptFileUrl||'', // O

formData.fullCost||0, // P

formData.prepayment||0, // Q

'ожидание', // R

breakdownStr // S

]);



// Telegram

const msg= `Новая бронь: ${formData.name} (${formData.email}), ${formData.checkin}–${formData.checkout}, итого ${formData.fullCost} BYN`;

sendTelegramNotification(msg);



createCalendarEvent(formData);

createReminders(formData);



return 'Спасибо! Ваша бронь сохранена.';

}



function saveFile(obj){

const folder= DriveApp.getFolderById(RECEIPT_FOLDER_ID);

const blob= Utilities.newBlob(

Utilities.base64Decode(obj.data),

obj.mimeType,

obj.fileName

);

const file= folder.createFile(blob);

return file.getUrl();

}



function createCalendarEvent(formData){

const cal= CalendarApp.getCalendarById(CALENDAR_ID);

if(!cal)return;

const cfg= getFullConfig();

const cIn= new Date(formData.checkin);

const cOut= new Date(formData.checkout);

let inParts= (cfg.checkin_time||'15:00').split(':');

cIn.setHours(+inParts[0], +inParts[1]);

let outParts= (cfg.checkout_time||'12:00').split(':');

cOut.setHours(+outParts[0], +outParts[1]);



cal.createEvent(`Бронь: ${formData.name}`, cIn,cOut,{

description: `${formData.email}, ${formData.phone}\nИтого: ${formData.fullCost}`

});

}