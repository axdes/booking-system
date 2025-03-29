function getFullConfig(){

return {

weekday_price:600,

friday_price:700,

saturday_price:700,

sunday_price:650,



custom_discount:200, // -200 if plan=custom

checkin_time:'15:00',

checkout_time:'12:00'

};

}



function getGuestRules(){

return {

baseGuests:2,

extraAdultPrice:50,

kidPrice:30,

babyBedPrice:10,

petPrice:30,

maxPets:2,

maxTotalPeople:4

};

}



function getOptions(){

return [

// baseIncluded

{ id:'banya', title:'Баня', price:100, description:'Традиционная баня', baseIncluded:true },

{ id:'chan', title:'Чан', price:170, description:'Горячий чан', baseIncluded:true },

{ id:'sup', title:'SUP', price:30, description:'Прогулка по озеру', baseIncluded:true },

{ id:'boat', title:'Лодка',price:30, description:'Прогулка по воде', baseIncluded:true },

{ id:'firewood_grill', title:'Дрова (мангал)', price:20, description:'Жар для гриля', baseIncluded:true },

{ id:'firewood_bowl', title:'Дрова (чаша)', price:20, description:'Огонь у дома', baseIncluded:true },

{ id:'bath_broom', title:'Веник', price:15,description:'Ароматный веник', baseIncluded:true },



// extra

{ id:'photo_session', title:'Фотосессия', price:200, description:'Профессиональные кадры', isExtra:true },

{ id:'song', title:'Песня', price:100, description:'Персональная песня', isExtra:true },

{ id:'decor', title:'Декор', price:150, description:'Праздничный антураж', isExtra:true },

{ id:'steam_ritual', title:'Парение', price:40, description:'Ритуал прогрева', isExtra:true },

{ id:'forest_walk', title:'Экскурсия', price:30, description:'Прогулка по лесу', isExtra:true },



// Питание

{ id:'breakfast', title:'Завтрак', price:30, description:'Полноценный', isExtra:true },

{ id:'lunch', title:'Обед', price:60, description:'Домашний', isExtra:true },

{ id:'dinner', title:'Ужин', price:50, description:'Сытный', isExtra:true }

];

}



function getIncludedItems(){

return [

'banya','chan','sup','boat','firewood_grill','firewood_bowl','bath_broom'

];

}