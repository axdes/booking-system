function getCostBreakdownDaily(

plan,

daySelections,

adults,

kids,

babies,

babyBed,

pets

){

const cfg= getFullConfig();

const arr= getOptions();

const map={};

arr.forEach(o=> map[o.id]=o);



const rules= getGuestRules();

let lines=[];

let total=0;

let nights= daySelections.length;



daySelections.forEach(dsObj=>{

let dateStr= dsObj.date;

let chosen= dsObj.chosen||[];



let d=new Date(dateStr+'T12:00:00');

let wd=d.getDay();

let base=0;

if([1,2,3,4].includes(wd)){

base= cfg.weekday_price;

} else if(wd===5){

base= cfg.friday_price;

} else if(wd===6){

base= cfg.saturday_price;

} else{

base= cfg.sunday_price;

}



if(plan==='max'){

base+=100;

} else if(plan==='custom'){

base-= (cfg.custom_discount||0);

if(base<0) base=0;

}

let dayCost= base;

lines.push({label:`День ${dateStr}`, cost:0});

lines.push({label:'Дом', cost: base});



// гости

let guestAdd=0;

if(adults> rules.baseGuests){

let extra= adults- rules.baseGuests;

guestAdd += extra* rules.extraAdultPrice;

lines.push({label:`Доп.взрослые x${extra}`, cost: extra*rules.extraAdultPrice});

}

if(kids>0){

guestAdd += kids* rules.kidPrice;

lines.push({label:`Дети x${kids}`, cost: kids*rules.kidPrice});

}

if(babies>0 && babyBed){

guestAdd += rules.babyBedPrice;

lines.push({label:'Кроватка', cost: rules.babyBedPrice});

}

if(pets>0){

guestAdd += pets*rules.petPrice;

lines.push({label:`Животные x${pets}`, cost: pets*rules.petPrice});

}

dayCost+= guestAdd;



// опции

chosen.forEach(optId=>{

const op= map[optId];

if(!op)return;



if(plan==='max'){

// все baseIncluded бесплатно

if(getIncludedItems().includes(optId)){

lines.push({label: op.title+' (MAX)', cost:0});

} else {

dayCost+= op.price;

lines.push({label: op.title, cost: op.price});

}

}

else if(plan==='relax'){

// free banya/chan/bath_broom

if(['banya','chan','bath_broom'].includes(optId)){

lines.push({label: op.title+' (RELAX)', cost:0});

} else {

dayCost+= op.price;

lines.push({label: op.title, cost: op.price});

}

}

else {

// custom => всё платно

dayCost+= op.price;

lines.push({label: op.title, cost: op.price});

}

});



lines.push({label:`Итого за ${dateStr}`, cost: dayCost});

total+= dayCost;

});



return { nights, lines, total };

}



function getIncludedItems(){

return [

'banya','chan','sup','boat','firewood_grill','firewood_bowl','bath_broom'

];

}