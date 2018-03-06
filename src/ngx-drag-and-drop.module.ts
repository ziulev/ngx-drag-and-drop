import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { Draggable, Dropzone, DragDrop }  from './directives/drag-and-drop.directive';

@NgModule({
    declarations: [
        DragDrop,
        Draggable,
        Dropzone,
    ],
    exports: [
        DragDrop,
        Draggable,
        Dropzone,
    ],
    imports: [
        CommonModule
    ]
})
export class NgxDragAndDropModule {
    static forRoot() {
        return {
            ngModule: NgxDragAndDropModule,
            providers: []
        };
    }
}
