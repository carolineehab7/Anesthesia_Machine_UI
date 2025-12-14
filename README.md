# Anesthesia Machine UI
An interactive, web-based anesthesia machine simulator featuring real-time vital signs monitoring, physiological waveforms, and intelligent alarm systems.

## Features

### Real-Time Vital Signs Monitoring
- **Heart Rate (HR)**: Dynamic ECG-based monitoring with visual feedback
- **Blood Pressure (BP)**: Systolic/Diastolic with Mean Arterial Pressure (MAP)
- **Oxygen Saturation (SpO₂)**: Real-time pulse oximetry simulation
- **End-Tidal CO₂**: Capnography monitoring
- **Temperature**: Core body temperature tracking
- **Airway Pressure**: Peak and mean pressure monitoring

### Physiological Waveforms
- **ECG Waveform**: Realistic electrocardiogram with QRS complex
- **Capnography**: CO₂ waveform with respiratory cycle
- **Plethysmography**: SpO₂ pulse waveform

### Ventilator Controls
- **Tidal Volume**: Adjustable from 300-700 mL
- **Respiratory Rate**: 8-20 breaths per minute
- **PEEP**: 0-15 cmH₂O
- **FiO₂**: 21-100% oxygen concentration
- **Fresh Gas Flow**: 0.5-6 L/min
- **Sevoflurane**: 0-5% anesthetic agent with MAC calculation

### Intelligent Alarm System
- **Priority-Based Alerts**: Warning and critical alarm levels
- **Audio Alarms**: Distinctive sounds for different priorities
- **Visual Indicators**: Color-coded vital sign cards
- **Alarm Silencing**: Temporary silence with auto-reset
- **Real-Time Monitoring**: Continuous parameter checking

### Physiological Simulation
The simulator models  physiological relationships:
- **Anesthetic Depth** → Decreased heart rate and blood pressure
- **FiO₂** → SpO₂ levels
- **Minute Ventilation** → End-tidal CO₂
- **Tidal Volume & Compliance** → Airway pressures
- **Time-Based Effects** → Temperature drift during anesthesia

## Usage

### Basic Operation
1. **Monitor Vital Signs**: Observe the real-time vital signs displayed in the top panel
2. **Adjust Controls**: Use the sliders to modify ventilator and anesthesia settings
3. **Watch Waveforms**: View live ECG, CO₂, and SpO₂ waveforms
4. **Respond to Alarms**: Monitor the alerts panel and respond to warnings/critical alarms

### Control Panel

#### Ventilation Settings
- **Tidal Volume**: Adjust the volume of air delivered per breath
- **Respiratory Rate**: Set the number of breaths per minute
- **PEEP**: Configure positive end-expiratory pressure
#### Oxygenation
- **FiO₂**: Set the fraction of inspired oxygen
- **Fresh Gas Flow**: Adjust the flow rate of fresh gas

#### Anesthesia
- **Sevoflurane**: Control anesthetic agent concentration
- **MAC Display**: Monitor Minimum Alveolar Concentration
- **Inspired/Expired**: View real-time agent concentrations

### Alarm Management
- **Silence Button**: Temporarily silence alarms (auto-resets after 2 minutes)
- **Clear Alerts Button**: Remove all current alarms
- **Visual Feedback**: Cards change color based on parameter status:
  - **Normal**: Green border
  - **Warning**: Yellow border with a beep sound
  - **Critical**: Red border with pulsing animation and a faster beep sound
 
### Alarm Thresholds

| Parameter | Warning Range | Critical Range |
|-----------|---------------|----------------|
| Heart Rate | 50-100 bpm | <40 or >130 bpm |
| Systolic BP | 90-160 mmHg | <70 or >180 mmHg |
| SpO₂ | <94% | <90% |
| CO₂ | 30-45 mmHg | <25 or >55 mmHg |
| Temperature | 35.5-37.5°C | <35.0 or >38.5°C |
| Peak Pressure | <30 cmH₂O | >40 cmH₂O |

## Some Screenshots for the UI
<img width="2506" height="1177" alt="image" src="https://github.com/user-attachments/assets/c63b5110-5e10-46d5-8034-b32c41b845dc" />
<img width="2476" height="643" alt="image" src="https://github.com/user-attachments/assets/e75dc174-f515-4808-8fe6-bf2719664c2a" />

### Alarms
<img width="2492" height="706" alt="image" src="https://github.com/user-attachments/assets/a0344c58-6764-41bd-b23e-d11300e7208e" />


