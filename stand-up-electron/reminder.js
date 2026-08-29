const elapsedSeconds = document.getElementById('elapsed-seconds');
const okButton = document.getElementById('ok-button');

let interval;
let seconds = 0;

function renderSeconds() {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    elapsedSeconds.textContent = `${hours}h${minutes}m${remainingSeconds}s`;
    return;
  }

  if (minutes > 0) {
    elapsedSeconds.textContent = `${minutes}m${remainingSeconds}s`;
    return;
  }

  elapsedSeconds.textContent = `${remainingSeconds}s`;
}

function startElapsedCounter() {
  clearInterval(interval);
  seconds = 0;
  renderSeconds();
  interval = setInterval(() => {
    seconds += 1;
    renderSeconds();
  }, 1000);
}

window.standUp.onReminderStart(startElapsedCounter);

okButton.addEventListener('click', () => {
  clearInterval(interval);
  window.standUp.acknowledgeReminder();
});
