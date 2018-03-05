import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { AlxDraggable, AlxDropzone, AlxDragDrop }  from "./directives/DragDrop";

@NgModule({
    declarations: [
        AlxDragDrop,
        AlxDraggable,
        AlxDropzone,
    ],
    exports: [
        AlxDragDrop,
        AlxDraggable,
        AlxDropzone,
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
