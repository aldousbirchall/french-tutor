import { useMemo } from 'react';
import { fsrs, FSRS } from 'ts-fsrs';

export function useFSRS(): FSRS {
  return useMemo(() => fsrs(), []);
}
