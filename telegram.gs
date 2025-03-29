function sendTelegramNotification(msg){

const token = PropertiesService.getScriptProperties().getProperty('TELEGRAM_TOKEN');

const chatId=PropertiesService.getScriptProperties().getProperty('TELEGRAM_CHAT_ID');

if(!token||!chatId){

Logger.log('Telegram props missing');

return;

}

const url=`https://api.telegram.org/bot${token}/sendMessage`;

const payload={

chat_id:chatId,

text: msg,

parse_mode:'HTML'

};

try{

const resp= UrlFetchApp.fetch(url,{

method:'post',

contentType:'application/json',

payload: JSON.stringify(payload)

});

Logger.log(resp.getContentText());

} catch(e){

Logger.log('Telegram error:'+ e);

}

}