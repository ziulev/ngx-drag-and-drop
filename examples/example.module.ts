import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { ExampleComponent } from './example.component';
import { NgxDragAndDropModule } from '../index';

@NgModule({
    declarations: [
        ExampleComponent
    ],
    imports: [
        BrowserModule,
        NgxDragAndDropModule
    ],
    providers: [],
    bootstrap: [ExampleComponent]
})
export class ExampleModule { }
