const range = document.getElementById('notify-range');
const selectedMinutes = document.getElementById('selected-minutes');
const startButton = document.getElementById('start-button');
const allowedMinutes = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

function snapToAllowedMinutes(value) {
  const numericValue = Number(value);
  return allowedMinutes.reduce((nearest, candidate) => {
    return Math.abs(candidate - numericValue) < Math.abs(nearest - numericValue) ? candidate : nearest;
  }, allowedMinutes[0]);
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function setMode(mode) {
  const input = document.querySelector(`input[name="mode"][value="${mode}"]`);
  if (input) {
    input.checked = true;
  }
}

function updateSelectedMinutes() {
  range.value = snapToAllowedMinutes(range.value);
  selectedMinutes.textContent = range.value;
}

function startCountdown() {
  window.standUp.startTimer({
    minutes: Number(range.value),
    mode: getMode()
  });
}

range.addEventListener('input', updateSelectedMinutes);
startButton.addEventListener('click', startCountdown);

window.standUp.onSettingsSync((config) => {
  range.value = config.minutes;
  setMode(config.mode);
  updateSelectedMinutes();
});

window.standUp.getSettings().then((config) => {
  range.value = config.minutes;
  setMode(config.mode);
  updateSelectedMinutes();
});
