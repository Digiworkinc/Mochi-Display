
export enum EyeExpression {
  NEUTRAL,
  BLINK,
  SQUINT,
  LOOK_LEFT,
  LOOK_RIGHT,
  LOOK_UP,
  LOOK_DOWN,
  DIZZY,
  ANGRY,
  HAPPY,
  SCARED,
  NODDING,
}

export type PupilPosition = {
  x: number;
  y: number;
};

export type DeviceSensorsData = {
  rotation: {
    alpha: number | null;
    beta: number | null;
    gamma: number | null;
  };
  acceleration: {
    x: number | null;
    y: number | null;
    z: number | null;
  };
  isShaking: boolean;
  isMoving: boolean;
};
