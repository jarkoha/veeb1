const monthNamesET = ["Jaanuar", "Veebruar", "Märts","Aprill","Mai","Juuni","Juuli","August","September","Oktoober","November","Detsember"];

const dateETFormatted = function(){
    let dateNow = new Date();
    return dateNow.getDate() + ". " + monthNamesET[dateNow.getMonth()] + " " + dateNow.getFullYear();
}

const timeFormatted = function(){
    function addZero(i) {            //see osa on lisatud
        if (i < 10) {i = "0" + i}
        return i;
      }   //see osa on lisatud koos all olevate addZerodega
    let timeNow = new Date();
    return timeET = addZero(timeNow.getHours()) + ":" + addZero(timeNow.getMinutes()) + ":" + addZero(timeNow.getSeconds());
}

const timeOfDayET = function(){
    let partOfDay = "suvaline hetk"; //kas võib ka tühjaks jätta?
    let hourNow = new Date().getHours();
    if (hourNow >= 3 && hourNow < 6) {
        partOfDay = "varahommik";
    } else if (hourNow >= 6 && hourNow < 12){
        partOfDay = "hommik";
    } else if (hourNow >= 12 && hourNow < 14) {
        partOfDay = "lõuna";
    } else if (hourNow >= 14 && hourNow < 18) {
        partOfDay = "pärastlõuna";
    } else if (hourNow >= 18 && hourNow < 21) {
        partOfDay = "õhtu";
    } else if (hourNow >= 21 && hourNow < 23) {
        partOfDay = "hilisõhtu";
    } else if (hourNow >= 23 && hourNow < 3) {
        partOfDay = "öö";
    } else {
        partOfDay = "vigane ajamoment"
    }
    return partOfDay;
}

/*const dateConverter = function (date, format){
    let dateParts = date.split('/');
    let month = parseInt(dateParts[0]);
    let day = parseInt(dateParts[1]);
    let year = parseInt(dateParts[2]);

    if (format === 'ET'){
        return day + '.' + month + year;
    } else if (format === 'EN') {
        return month + ' ' + day + ' ' + year;
    }
};*/

const dateConverter = function (date, format){
    //console.log("Type of date:", typeof date);  // Debugging line
    //console.log("Value of date:", date); 
    let dateParts = date.split('/');
    let month = parseInt(dateParts[0]).toString().padStart(2, '0');
    let day = parseInt(dateParts[1]).toString().padStart(2, '0');
    let year = parseInt(dateParts[2]);

    if (format === 'ET'){
        return day + '.' + month + '.' + year;
    } else if (format === 'EN') {
        return month + ' ' + day + ' ' + year;
    } else {
        console.warn('Unexpected format:', format);
        return date; // return the original date or handle it differently
    }
};

//ekspordin kõik asjad
module.exports = {dateETFormatted: dateETFormatted, timeFormatted: timeFormatted, monthsET: monthNamesET, timeOfDayET: timeOfDayET, dateConverter: dateConverter};