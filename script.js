// State Management
const state = {
  vitals: {
    heartRate: 95,
    systolic: 120,
    diastolic: 80,
    spo2: 98,
    co2: 38,
    temperature: 36.5,
    peakPressure: 18,
    meanPressure: 15,
  },
  controls: {
    tidalVolume: 500,
    respiratoryRate: 12,
    peep: 5,
    fio2: 40,
    freshGasFlow: 2.0,
    anestheticAgent: 2.0,
  },
  derived: {
    inspiredAgent: 0.5,
    expiredAgent: 1.8,
    ieRatio: 2.0,
  },
  alarms: [],
  timeElapsed: 0,
};

// Alarm Thresholds
const alarmLimits = {
  heartRate: { low: 50, high: 100, critical: { low: 40, high: 130 } },
  systolic: { low: 90, high: 140, critical: { low: 70, high: 180 } },
  spo2: { low: 94, critical: { low: 90 } },
  co2: { low: 30, high: 45, critical: { low: 25, high: 55 } },
  temperature: { low: 36.0, high: 37.5, critical: { low: 35.0, high: 38.5 } },
  peakPressure: { high: 30, critical: { high: 40 } },
};

//graphs

class WaveformRenderer {
  constructor(canvasId, color, type) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext("2d");
    this.color = color;
    this.type = type;
    this.data = [];
    this.maxPoints = 300;
    this.time = 0;
    this.drawPosition = 0;

    // Set proper canvas dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = rect.height || 120;
  }

  generateECGPoint() {
    const t = this.time % 1.0;
    let value = 0;

    if (t > 0.1 && t < 0.2) {
      value = 0.15 * Math.sin(((t - 0.1) * Math.PI) / 0.1);
    } else if (t > 0.3 && t < 0.4) {
      const qrsT = (t - 0.3) / 0.1;
      if (qrsT < 0.3) value = -0.2;
      else if (qrsT < 0.5) value = 1.0;
      else value = -0.3;
    } else if (t > 0.5 && t < 0.7) {
      value = 0.25 * Math.sin(((t - 0.5) * Math.PI) / 0.2);
    }

    return value + (Math.random() - 0.5) * 0.02;
  }

  generateCapnoPoint() {
    const t = this.time % 1.0;
    let value = 0;

    if (t < 0.3) {
      value = 0;
    } else if (t < 0.5) {
      value = (t - 0.3) / 0.2;
    } else if (t < 0.8) {
      value = 1.0;
    } else {
      value = 1.0 - (t - 0.8) / 0.2;
    }

    return value + (Math.random() - 0.5) * 0.03;
  }

  update() {
    const speed = state.vitals.heartRate / 75;
    const timeIncrement =
      this.type === "ecg"
        ? 0.008 * speed
        : 0.008 * (state.controls.respiratoryRate / 12);

    let point;
    if (this.type === "ecg") {
      point = this.generateECGPoint();
    } else if (this.type === "capno") {
      point = this.generateCapnoPoint();
    }

    this.data.push(point);
    this.drawPosition++;

    if (this.drawPosition >= this.maxPoints) {
      this.data = [];
      this.drawPosition = 0;
    }

    this.time += timeIncrement;
    this.render();
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = this.canvas;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.fillRect(0, 0, width, height);

    // Grid
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Waveform
    if (this.data.length < 2) return;

    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const stepX = width / this.maxPoints;

    for (let i = 0; i < this.data.length; i++) {
      const x = i * stepX;
      const y = height - (this.data[i] * height * 0.8 + height * 0.1);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Draw sweep line
    const sweepX = this.drawPosition * stepX;
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(sweepX, 0);
    this.ctx.lineTo(sweepX, height);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
}

let ecgWaveform;
let capnoWaveform;
let plethWaveform;

// Simple plethysmography waveform
class PlethWaveform {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas ${canvasId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext("2d");
    this.color = "#4d9fff";
    this.data = [];
    this.maxPoints = 300;
    this.time = 0;
    this.drawPosition = 0;

    // Set proper canvas dimensions
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width || 600;
    this.canvas.height = rect.height || 120;
  }

  generatePoint() {
    const t = this.time % 1.0;
    let value = 0;

    // Simple pulse wave
    if (t < 0.3) {
      value = Math.sin((t / 0.3) * Math.PI) * 0.8;
    } else if (t < 0.5) {
      value = 0.2 * Math.sin(((t - 0.3) / 0.2) * Math.PI);
    }

    const amplitude = state.vitals.spo2 / 100;
    return value * amplitude + (Math.random() - 0.5) * 0.05;
  }

  update() {
    const speed = state.vitals.heartRate / 75;
    this.time += 0.008 * speed;

    const point = this.generatePoint();
    this.data.push(point);
    this.drawPosition++;

    if (this.drawPosition >= this.maxPoints) {
      this.data = [];
      this.drawPosition = 0;
    }

    this.render();
  }

  render() {
    if (!this.ctx) return;
    const { width, height } = this.canvas;

    this.ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    this.ctx.fillRect(0, 0, width, height);

    // Grid
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.lineWidth = 1;

    for (let i = 0; i < 5; i++) {
      const y = (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Waveform
    if (this.data.length < 2) return;

    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();

    const stepX = width / this.maxPoints;

    for (let i = 0; i < this.data.length; i++) {
      const x = i * stepX;
      const y = height - (this.data[i] * height * 0.8 + height * 0.1);

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    this.ctx.stroke();

    // Sweep line
    const sweepX = this.drawPosition * stepX;
    this.ctx.strokeStyle = this.color;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.3;
    this.ctx.beginPath();
    this.ctx.moveTo(sweepX, 0);
    this.ctx.lineTo(sweepX, height);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
}

function updateVitals() {
  const anestheticDepth = state.controls.anestheticAgent / 2.0;
  const minuteVentilation =
    (state.controls.tidalVolume / 1000) * state.controls.respiratoryRate;

  // HEART RATE: Decreased by anesthetics (negative chronotropic effect)
  const baseHR = 75;
  const targetHR = baseHR - anestheticDepth * 20 + (Math.random() - 0.5) * 3;
  state.vitals.heartRate += (targetHR - state.vitals.heartRate) * 0.08;
  state.vitals.heartRate = Math.max(40, Math.min(130, state.vitals.heartRate));

  // BLOOD PRESSURE: Decreased by anesthetics (vasodilation + negative inotropic)
  const baseSystolic = 120;
  const targetSystolic =
    baseSystolic - anestheticDepth * 25 + (Math.random() - 0.5) * 4;
  state.vitals.systolic += (targetSystolic - state.vitals.systolic) * 0.08;
  state.vitals.systolic = Math.max(60, Math.min(180, state.vitals.systolic));

  state.vitals.diastolic =
    state.vitals.systolic - 40 + (Math.random() - 0.5) * 4;
  state.vitals.diastolic = Math.max(35, Math.min(100, state.vitals.diastolic));

  // SPO2: Dependent on FiO2
  let targetSpO2 = 98;
  if (state.controls.fio2 >= 40) {
    targetSpO2 = 99 + (Math.random() - 0.5) * 0.5;
  } else if (state.controls.fio2 >= 30) {
    targetSpO2 = 97 + (Math.random() - 0.5) * 1;
  } else if (state.controls.fio2 >= 21) {
    targetSpO2 = 94 + ((state.controls.fio2 - 21) / 9) * 3;
  }
  state.vitals.spo2 += (targetSpO2 - state.vitals.spo2) * 0.1;
  state.vitals.spo2 = Math.max(85, Math.min(100, state.vitals.spo2));

  // CO2: Inverse relationship with minute ventilation
  let targetCO2;
  if (minuteVentilation < 4) {
    targetCO2 = 50; // Hypoventilation
  } else if (minuteVentilation < 5) {
    targetCO2 = 45;
  } else if (minuteVentilation <= 7) {
    targetCO2 = 38; // Normal
  } else if (minuteVentilation <= 9) {
    targetCO2 = 33;
  } else {
    targetCO2 = 28; // Hyperventilation
  }
  state.vitals.co2 += (targetCO2 - state.vitals.co2) * 0.1;
  state.vitals.co2 = Math.max(20, Math.min(60, state.vitals.co2));

  // TEMPERATURE: Slowly drifts down during anesthesia
  state.timeElapsed += 2; // seconds
  const tempDrift = (state.timeElapsed / 3600) * 0.5; // 0.5°C per hour
  const targetTemp = 36.5 - tempDrift + (Math.random() - 0.5) * 0.1;
  state.vitals.temperature += (targetTemp - state.vitals.temperature) * 0.02;
  state.vitals.temperature = Math.max(
    35.0,
    Math.min(38.0, state.vitals.temperature)
  );

  // AIRWAY PRESSURES: Based on tidal volume and compliance
  // Simple model: Peak = (TV / 50) + PEEP
  const compliance = 50; // mL/cmH2O (normal lung compliance)
  state.vitals.peakPressure =
    state.controls.tidalVolume / compliance +
    state.controls.peep +
    (Math.random() - 0.5) * 2;
  state.vitals.peakPressure = Math.max(
    5,
    Math.min(50, state.vitals.peakPressure)
  );

  state.vitals.meanPressure =
    state.vitals.peakPressure * 0.7 + (Math.random() - 0.5) * 1;

  // AGENT CONCENTRATIONS
  // Inspired concentration rises toward vaporizer setting
  const targetInspired = state.controls.anestheticAgent * 0.3; // Diluted by fresh gas
  state.derived.inspiredAgent +=
    (targetInspired - state.derived.inspiredAgent) * 0.15;

  // Expired concentration follows inspired with delay (uptake)
  const targetExpired = state.controls.anestheticAgent * 0.85; // Close to vaporizer setting
  state.derived.expiredAgent +=
    (targetExpired - state.derived.expiredAgent) * 0.08;

  // I:E RATIO: Typical is 1:2
  state.derived.ieRatio = 2.0 + (Math.random() - 0.5) * 0.2;

  updateVitalsDisplay();
  checkAlarms();
}

function updateVitalsDisplay() {
  // Heart Rate
  document.getElementById("hr-value").textContent = Math.round(
    state.vitals.heartRate
  );
  document.getElementById("ecg-rate").textContent =
    Math.round(state.vitals.heartRate) + " bpm";

  // Blood Pressure
  const sys = Math.round(state.vitals.systolic);
  const dia = Math.round(state.vitals.diastolic);
  const map = Math.round((sys + 2 * dia) / 3);
  document.getElementById("bp-value").textContent = `${sys}/${dia}`;
  document.getElementById("map-value").textContent = map;

  // SpO2
  document.getElementById("spo2-value").textContent = Math.round(
    state.vitals.spo2
  );
  document.getElementById("pleth-value").textContent =
    Math.round(state.vitals.spo2) + "%";

  // CO2
  document.getElementById("co2-value").textContent = Math.round(
    state.vitals.co2
  );
  document.getElementById("capno-value").textContent =
    Math.round(state.vitals.co2) + " mmHg";

  // Temperature
  document.getElementById("temp-value").textContent =
    state.vitals.temperature.toFixed(1);

  // Airway Pressures
  document.getElementById("pressure-value").textContent = Math.round(
    state.vitals.meanPressure
  );
  document.getElementById("peak-pressure").textContent = Math.round(
    state.vitals.peakPressure
  );

  // Agent Concentrations
  document.getElementById("inspired-agent").textContent =
    state.derived.inspiredAgent.toFixed(1);
  document.getElementById("expired-agent").textContent =
    state.derived.expiredAgent.toFixed(1);

  // I:E Ratio
  document.getElementById("ie-ratio").textContent =
    "1:" + state.derived.ieRatio.toFixed(1);

  // Update MAC value
  const mac = (state.controls.anestheticAgent / 2.0).toFixed(1);
  document.getElementById("mac-value").textContent = mac;

  // Update card status
  updateCardStatus("hr-card", state.vitals.heartRate, alarmLimits.heartRate);
  updateCardStatus("bp-card", state.vitals.systolic, alarmLimits.systolic);
  updateCardStatus("spo2-card", state.vitals.spo2, alarmLimits.spo2);
  updateCardStatus("co2-card", state.vitals.co2, alarmLimits.co2);
  updateCardStatus(
    "temp-card",
    state.vitals.temperature,
    alarmLimits.temperature
  );
  updateCardStatus(
    "pressure-card",
    state.vitals.peakPressure,
    alarmLimits.peakPressure
  );
}

function updateCardStatus(cardId, value, limits) {
  const card = document.getElementById(cardId);
  card.classList.remove("warning", "critical");

  if (limits.critical) {
    if (
      (limits.critical.low && value < limits.critical.low) ||
      (limits.critical.high && value > limits.critical.high)
    ) {
      card.classList.add("critical");
      return;
    }
  }

  if (
    (limits.low && value < limits.low) ||
    (limits.high && value > limits.high)
  ) {
    card.classList.add("warning");
  }
}

// Audio context for alarm sounds
let audioContext = null;
let alarmInterval = null;
let isSilenced = false;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playAlarmSound(priority) {
  if (isSilenced) return;

  initAudio();

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  if (priority === "critical") {
    // Critical: rapid high-pitched beeps
    oscillator.frequency.value = 1000;
    gainNode.gain.value = 0.3;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } else if (priority === "warning") {
    // Warning: slower medium-pitched beep
    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.2;
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
  }
}

function startAlarmSounds() {
  stopAlarmSounds();

  if (state.alarms.length === 0) return;

  // Find highest priority alarm
  const hasCritical = state.alarms.some((a) => a.priority === "critical");
  const hasWarning = state.alarms.some((a) => a.priority === "warning");

  if (hasCritical) {
    alarmInterval = setInterval(() => {
      playAlarmSound("critical");
    }, 500); // Rapid beeping every 500ms
  } else if (hasWarning) {
    alarmInterval = setInterval(() => {
      playAlarmSound("warning");
    }, 1500); // Slower beeping every 1.5s
  }
}

function stopAlarmSounds() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

function checkAlarms() {
  // Check heart rate
  if (
    state.vitals.heartRate < alarmLimits.heartRate.critical.low ||
    state.vitals.heartRate > alarmLimits.heartRate.critical.high
  ) {
    addAlarm(
      "critical",
      "Heart Rate Critical",
      `${Math.round(state.vitals.heartRate)} bpm`
    );
  } else if (
    state.vitals.heartRate < alarmLimits.heartRate.low ||
    state.vitals.heartRate > alarmLimits.heartRate.high
  ) {
    addAlarm(
      "warning",
      "Heart Rate Abnormal",
      `${Math.round(state.vitals.heartRate)} bpm`
    );
  }

  // Check SpO2
  if (state.vitals.spo2 < alarmLimits.spo2.critical.low) {
    addAlarm("critical", "SpO₂ Critical", `${Math.round(state.vitals.spo2)}%`);
  } else if (state.vitals.spo2 < alarmLimits.spo2.low) {
    addAlarm("warning", "SpO₂ Low", `${Math.round(state.vitals.spo2)}%`);
  }

  // Check blood pressure
  if (
    state.vitals.systolic < alarmLimits.systolic.critical.low ||
    state.vitals.systolic > alarmLimits.systolic.critical.high
  ) {
    addAlarm(
      "critical",
      "Blood Pressure Critical",
      `${Math.round(state.vitals.systolic)}/${Math.round(
        state.vitals.diastolic
      )} mmHg`
    );
  } else if (
    state.vitals.systolic < alarmLimits.systolic.low ||
    state.vitals.systolic > alarmLimits.systolic.high
  ) {
    addAlarm(
      "warning",
      "Blood Pressure Abnormal",
      `${Math.round(state.vitals.systolic)}/${Math.round(
        state.vitals.diastolic
      )} mmHg`
    );
  }

  // Check CO2
  if (
    state.vitals.co2 < alarmLimits.co2.critical.low ||
    state.vitals.co2 > alarmLimits.co2.critical.high
  ) {
    addAlarm(
      "critical",
      "CO₂ Critical",
      `${Math.round(state.vitals.co2)} mmHg`
    );
  } else if (
    state.vitals.co2 < alarmLimits.co2.low ||
    state.vitals.co2 > alarmLimits.co2.high
  ) {
    addAlarm("warning", "CO₂ Abnormal", `${Math.round(state.vitals.co2)} mmHg`);
  }

  // Check Temperature
  if (
    state.vitals.temperature < alarmLimits.temperature.critical.low ||
    state.vitals.temperature > alarmLimits.temperature.critical.high
  ) {
    addAlarm(
      "critical",
      "Temperature Critical",
      `${state.vitals.temperature.toFixed(1)}°C`
    );
  } else if (
    state.vitals.temperature < alarmLimits.temperature.low ||
    state.vitals.temperature > alarmLimits.temperature.high
  ) {
    addAlarm(
      "warning",
      "Temperature Abnormal",
      `${state.vitals.temperature.toFixed(1)}°C`
    );
  }

  // Check Airway Pressure
  if (state.vitals.peakPressure > alarmLimits.peakPressure.critical.high) {
    addAlarm(
      "critical",
      "High Airway Pressure",
      `${Math.round(state.vitals.peakPressure)} cmH₂O`
    );
  } else if (state.vitals.peakPressure > alarmLimits.peakPressure.high) {
    addAlarm(
      "warning",
      "Elevated Airway Pressure",
      `${Math.round(state.vitals.peakPressure)} cmH₂O`
    );
  }
}

function addAlarm(priority, title, message) {
  const exists = state.alarms.some(
    (alarm) => alarm.title === title && alarm.priority === priority
  );

  if (exists) return;

  const alarm = {
    id: Date.now(),
    priority,
    title,
    message,
    time: new Date().toLocaleTimeString(),
  };

  state.alarms.unshift(alarm);

  if (state.alarms.length > 8) {
    state.alarms = state.alarms.slice(0, 8);
  }

  renderAlarms();
  startAlarmSounds(); // Start alarm sounds when new alarm added
}

function renderAlarms() {
  const alarmList = document.getElementById("alarm-list");

  if (state.alarms.length === 0) {
    alarmList.innerHTML = '<div class="no-alarms">All parameters normal</div>';
    stopAlarmSounds(); // Stop sounds when no alarms
    return;
  }

  alarmList.innerHTML = state.alarms
    .map(
      (alarm) => `
        <div class="alarm-item ${alarm.priority}">
            <div class="alarm-header">
                <span class="alarm-priority">${alarm.priority}</span>
                <span class="alarm-time">${alarm.time}</span>
            </div>
            <div class="alarm-message">${alarm.title}: ${alarm.message}</div>
        </div>
    `
    )
    .join("");
}

// ventilator

function setupControlHandlers() {
  // Ventilator settings
  setupSlider("tv-slider", "tv-display", "tidalVolume", "mL");
  setupSlider("rate-slider", "rate-display", "respiratoryRate", "bpm");
  setupSlider("peep-slider", "peep-display", "peep", "cmH₂O");
  setupSlider("fio2-slider", "fio2-display", "fio2", "%");
  setupSlider("fgf-slider", "fgf-display", "freshGasFlow", "L/min");
  setupSlider("agent-slider", "agent-display", "anestheticAgent", "%");

  // System controls
  document.getElementById("reset-btn").addEventListener("click", resetAlarms);
  document
    .getElementById("silence-alarm-btn")
    .addEventListener("click", silenceAlarms);
}

function setupSlider(sliderId, displayId, stateKey, unit) {
  const slider = document.getElementById(sliderId);
  const display = document.getElementById(displayId);

  slider.addEventListener("input", (e) => {
    const value = parseFloat(e.target.value);
    state.controls[stateKey] = value;
    display.textContent = value + " " + unit;
  });
}

function resetAlarms() {
  state.alarms = [];
  isSilenced = false;
  stopAlarmSounds();
  renderAlarms();
}

function silenceAlarms() {
  isSilenced = true;
  stopAlarmSounds();

  // Auto-unsilence after 2 minutes
  setTimeout(() => {
    isSilenced = false;
    if (state.alarms.length > 0) {
      startAlarmSounds();
    }
  }, 120000);

  state.alarms = state.alarms.filter((alarm) => alarm.priority === "critical");
  renderAlarms();
}

function animate() {
  if (ecgWaveform && ecgWaveform.ctx) ecgWaveform.update();
  if (capnoWaveform && capnoWaveform.ctx) capnoWaveform.update();
  if (plethWaveform && plethWaveform.ctx) plethWaveform.update();
  requestAnimationFrame(animate);
}

function init() {
  // Initialize waveforms after DOM is ready
  ecgWaveform = new WaveformRenderer("ecg-canvas", "#00ff88", "ecg");
  capnoWaveform = new WaveformRenderer("capno-canvas", "#ffaa00", "capno");
  plethWaveform = new PlethWaveform("pleth-canvas");

  setupControlHandlers();
  updateVitalsDisplay();
  renderAlarms();

  animate();

  // Update vitals every 2 seconds
  setInterval(updateVitals, 2000);
  console.log("=========================================");
  console.log("Anesthesia Machine - Simplified UI");
  console.log("=========================================");
  console.log("Clinical Relationships:");
  console.log("• Sevoflurane (MAC ~2%) → ↓ HR & BP");
  console.log("• FiO2 → SpO2");
  console.log("• Minute Ventilation → CO2");
  console.log("=========================================");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
