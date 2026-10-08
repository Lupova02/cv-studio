import { Routes } from '@angular/router';
import { EditorPage } from './features/editor/editor-page';
import { PrintPage } from './features/print/print-page';

/** Routen der App: `''` ist der Editor, `print` die unsichtbare Seite für den PDF-Export. */
export const routes: Routes = [
  { path: '', component: EditorPage },
  { path: 'print', component: PrintPage },
];
