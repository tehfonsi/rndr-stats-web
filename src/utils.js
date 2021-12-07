module.exports = {

fromNow: (date) => {
  let minutes = (new Date().getTime() - date.getTime()) / 1000 / 60;
  if (minutes < 60) {
    return `${minutes.toFixed(0)} minutes`;
  }
  const hours = minutes / 60;
  minutes = minutes % 60;
  if (hours < 24) {
    return `${hours.toFixed(0)} hours ${minutes.toFixed(0)} minutes`;
  }
},


}