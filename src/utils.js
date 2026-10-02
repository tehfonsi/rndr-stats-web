export const fromNow = (date) => {
    if (typeof date === 'string' || typeof date === 'number') {
      date = new Date(date);
    }
    let minutes = (new Date().getTime() - date.getTime()) / 1000 / 60;
    if (minutes < 60) {
      return `${minutes.toFixed(0)} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    if (hours < 24) {
      return `${hours} hours ${minutes.toFixed(0)} minutes`;
    }
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'} ${hours % 24} hours`;
  }
