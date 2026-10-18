export type AcademicYear = 1 | 2 | 3 | 4 | 5;

export interface UniversityInfo {
  id: string;
  nameAr: string;
  nameEn: string;
  city: string;
  departmentAr: string;
}

export interface StudentUser {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  university: string;
  specialization?: string;
  academicYear?: AcademicYear;
  isAcademySubscriber: boolean;
  isActivated: boolean;
  registeredAt: string;
  role: 'student' | 'owner';
  expiresAt?: string;
  accessDuration?: string;
  accessCode?: string;
}

export interface AccessRequest {
  id: string;
  phone: string;
  email?: string;
  name: string;
  university: string;
  specialization?: string;
  academicYear: AcademicYear;
  isAcademySubscriber: boolean;
  status: 'pending' | 'approved' | 'rejected';
  deviceInfo?: string;
  notes?: string;
  accessCode?: string;
  createdAt?: string;
}

export interface NewLessonToolPayload {
  title: string;
  titleEn: string;
  year: AcademicYear;
  category: LabCategory;
  theory: string;
  componentsNeeded: string[];
  steps: string[];
  mode: 'circuit' | 'pid' | 'robotics' | 'plc' | 'arduino' | 'pneumatics';
}

export type LabCategory = 
  | 'circuits'
  | 'electronics'
  | 'embedded'
  | 'control'
  | 'robotics'
  | 'pneumatics'
  | 'plc'
  | 'graduation';

export interface Experiment {
  id: string;
  title: string;
  titleEn: string;
  year: AcademicYear;
  category: LabCategory;
  levelBadge: string;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
  objectives: string[];
  theory: string;
  equations: { name: string; formula: string; explanation: string }[];
  componentsNeeded: string[];
  steps: string[];
  expectedResults: string;
  preconfiguredCircuitId?: string;
  mode: 'circuit' | 'pid' | 'robotics' | 'plc' | 'arduino' | 'pneumatics';
}

export type ComponentType =
  | 'dc_power'
  | 'ac_source'
  | 'ground'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'diode'
  | 'led'
  | 'bjt_npn'
  | 'mosfet_n'
  | 'opamp'
  | 'pushbutton'
  | 'switch_spdt'
  | 'potentiometer'
  | 'dc_motor'
  | 'servo_motor'
  | 'stepper_motor'
  | 'ultrasonic_sensor'
  | 'ldr_sensor'
  | 'lm35_temp'
  | 'buzzer'
  | 'logic_and'
  | 'logic_or'
  | 'logic_not'
  | 'relay_module';

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  name: string;
  x: number;
  y: number;
  value: number; // e.g. resistance in ohms, capacitance in uF, etc.
  unit: string;
  state?: {
    voltage?: number;
    current?: number;
    active?: boolean;
    angle?: number;
    speed?: number;
    color?: string;
    resistance?: number;
  };
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPin: string;
  toComponentId: string;
  toPin: string;
  color: string;
  voltage?: number;
  current?: number;
}

export interface OscilloscopeState {
  enabled: boolean;
  timePerDiv: number; // in ms
  voltsPerDivCH1: number; // in Volts
  voltsPerDivCH2: number; // in Volts
  yPosCH1: number;
  yPosCH2: number;
  ch1Enabled: boolean;
  ch2Enabled: boolean;
  run: boolean;
  frequencyCH1: number;
  vppCH1: number;
  frequencyCH2: number;
  vppCH2: number;
  waveCH1: 'sine' | 'square' | 'triangle' | 'pwm';
  waveCH2: 'sine' | 'square' | 'triangle' | 'pwm';
}

export interface MultimeterState {
  enabled: boolean;
  mode: 'V_DC' | 'V_AC' | 'I_DC' | 'RES' | 'CONT';
  value: number;
  unit: string;
  probeRedConnectedTo: string | null;
  probeBlackConnectedTo: string | null;
  beep: boolean;
}

export interface PowerSupplyState {
  enabled: boolean;
  setVoltage: number;
  setCurrentLimit: number;
  measuredVoltage: number;
  measuredCurrent: number;
}

export interface PIDParameters {
  kp: number;
  ki: number;
  kd: number;
  setpoint: number;
  systemType: 'motor' | 'ball_beam' | 'tank' | 'pendulum';
}

export interface LadderElement {
  id: string;
  type: 'contact_no' | 'contact_nc' | 'coil' | 'timer';
  address: string; // e.g. I0.0, Q0.0, T1
  name: string;
  row: number;
  col: number;
  active?: boolean;
  presetTime?: number; // for timer
  elapsedTime?: number;
}
