// Hilfsfunktionen zum Umsortieren von Einträgen in einer FormArray –
// per Pfeil-Knopf oder per Drag & Drop (Angular CDK).
import type { CdkDragDrop } from '@angular/cdk/drag-drop';
import { FormArray, type AbstractControl } from '@angular/forms';
import { haptic } from '../../../core/native/native-bridge';

/** Verschiebt einen Eintrag um `delta` Positionen; Ziele außerhalb der Liste werden ignoriert. */
export function moveFormItem<T extends AbstractControl>(array: FormArray<T>, index: number, delta: number): void {
  const target = index + delta;
  if (target < 0 || target >= array.length) {
    return;
  }
  const control = array.at(index) as T;
  array.removeAt(index);
  array.insert(target, control);
  haptic('light');
}

/** Übernimmt eine Drag-&-Drop-Verschiebung in die FormArray (dasselbe Control wird umgehängt, nicht kopiert). */
export function dropFormItem<T extends AbstractControl>(array: FormArray<T>, event: CdkDragDrop<unknown>): void {
  if (event.previousIndex === event.currentIndex) {
    return;
  }
  const control = array.at(event.previousIndex) as T;
  array.removeAt(event.previousIndex);
  array.insert(event.currentIndex, control);
  haptic('light');
}
