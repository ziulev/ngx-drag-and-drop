import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Draggable, Dropzone, DragDrop } from './ngx-drag-and-drop.directive';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    Draggable,
    Dropzone,
    DragDrop,
  ],
  exports: [
    Draggable,
    Dropzone,
    DragDrop,
  ]
})
export class NgxDragAndDropModule {
  static forRoot(): ModuleWithProviders<NgxDragAndDropModule> {
    return {
        ngModule: NgxDragAndDropModule,
        providers: []
    };
  }
}
