
import { useState, useEffect, useCallback } from 'react';
import type { DeviceSensorsData } from '../types';
import { SHAKE_THRESHOLD, MOVE_THRESHOLD } from '../constants';

const useDeviceSensors = (enabled: boolean) => {
  const [data, setData] = useState<DeviceSensorsData>({
    rotation: { alpha: null, beta: null, gamma: null },
    acceleration: { x: null, y: null, z: null },
    isShaking: false,
    isMoving: false,
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [lastAccel, setLastAccel] = useState({ x: 0, y: 0, z: 0 });

  const requestPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setPermissionGranted(true);
        }
      } catch (error) {
        console.error("Device motion permission request failed:", error);
      }
    } else {
      // For browsers that don't require explicit permission (non-iOS 13+)
      setPermissionGranted(true);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !permissionGranted) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      setData(prev => ({ ...prev, rotation: { alpha: event.alpha, beta: event.beta, gamma: event.gamma } }));
    };

    const handleMotion = (event: DeviceMotionEvent) => {
      const { x, y, z } = event.accelerationIncludingGravity || { x: 0, y: 0, z: 0 };
      
      const deltaX = Math.abs((x || 0) - lastAccel.x);
      const deltaY = Math.abs((y || 0) - lastAccel.y);
      const deltaZ = Math.abs((z || 0) - lastAccel.z);

      const isShaking = deltaX > SHAKE_THRESHOLD || deltaY > SHAKE_THRESHOLD || deltaZ > SHAKE_THRESHOLD;
      const isMoving = !isShaking && (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD || deltaZ > MOVE_THRESHOLD);

      setData(prev => ({ ...prev, acceleration: { x, y, z }, isShaking, isMoving }));
      setLastAccel({ x: x || 0, y: y || 0, z: z || 0 });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('devicemotion', handleMotion);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('devicemotion', handleMotion);
      setData(prev => ({...prev, isShaking: false, isMoving: false}));
    };
  }, [enabled, permissionGranted, lastAccel]);

  return { sensorData: data, requestPermission };
};

export default useDeviceSensors;
