import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { NgxDragAndDropModule } from './ngx-drag-and-drop/ngx-drag-and-drop.module';


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    NgxDragAndDropModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
