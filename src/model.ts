import type { Characteristic } from 'homebridge';

export interface BoilerState {
  climate: { powered: boolean; jobMode: string; temperatureSource: string; currentTemperature: number; targetTemperature: number };
  hotWater: { enabled: boolean; currentTemperature: number; targetTemperature: number };
}

type CharacteristicConstants = typeof Characteristic;

export function currentClimateState(state: BoilerState, C: CharacteristicConstants): number {
  if (!state.climate.powered) {return C.CurrentHeatingCoolingState.OFF;}
  return state.climate.jobMode === 'COOL' ? C.CurrentHeatingCoolingState.COOL : C.CurrentHeatingCoolingState.HEAT;
}

export function targetClimateState(state: BoilerState, C: CharacteristicConstants): number {
  if (!state.climate.powered) {return C.TargetHeatingCoolingState.OFF;}
  if (state.climate.jobMode === 'COOL') {return C.TargetHeatingCoolingState.COOL;}
  if (state.climate.jobMode === 'HEAT') {return C.TargetHeatingCoolingState.HEAT;}
  return C.TargetHeatingCoolingState.AUTO;
}
