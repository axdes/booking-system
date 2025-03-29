function createReminders(data){

const cIn=new Date(data.checkin);

const offsets=[7,1,-1];

offsets.forEach(off=>{

const dd=new Date(cIn);

dd.setDate(dd.getDate()-off);

if(dd<=new Date())return;



const key=Utilities.formatDate(dd,Session.getScriptTimeZone(),'yyyy-MM-dd')+'_'+ data.email+'_'+off;

PropertiesService.getScriptProperties().setProperty(key, JSON.stringify({

email:data.email,

name:data.name,

message:(off>0? `До заезда осталось ${off} дней!`:'Спасибо за отдых!')

}));

try{

ScriptApp.newTrigger('sendReminder')

.timeBased()

.at(dd)

.create();

}catch(e){}

});

}



function sendReminder(){

const now=new Date();

const today=Utilities.formatDate(now,Session.getScriptTimeZone(),'yyyy-MM-dd');

const props= PropertiesService.getScriptProperties().getProperties();

for(let k in props){

if(k.startsWith(today)){

const info= JSON.parse(props[k]);

MailApp.sendEmail(info.email,'Напоминание',`Здравствуйте, ${info.name}!\n${info.message}`);

PropertiesService.getScriptProperties().deleteProperty(k);

}

}

}