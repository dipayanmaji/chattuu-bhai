
const getTime = () => {
    const date = new Date();
    // date
    let dd = date.getDate();
    if (dd < 10) dd = "0" + dd;

    let mm = date.getMonth() + 1;
    if (mm < 10) mm = "0" + mm;

    let yyyy = date.getFullYear();

    let formattedDate = dd + '/' + mm + '/' + yyyy;

    // time
    let xm = "AM";

    let hrs = date.getHours();
    if (hrs === 0) hrs = 12;
    if (hrs > 12) {
        hrs = hrs - 12;
        xm = "PM";
    }
    if (hrs < 10) hrs = "0" + hrs;

    let min = date.getMinutes();
    if (min < 10) min = "0" + min;

    let time = `${hrs}:${min} ${xm}`

    return formattedDate + ', ' + time;
}

export { getTime };