function sendConfirmationEmail(email, name, checkin, checkout, fullCost){

MailApp.sendEmail({

to:email,

subject:'Kvetka: Ваше бронирование',

htmlBody:`

Здравствуйте, ${name}!<br><br>

Ваш заезд: ${checkin} – ${checkout}<br>

Итого: <b>${fullCost} BYN</b><br><br>

Спасибо, ждём вас!

`

});

}