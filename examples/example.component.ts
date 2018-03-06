import { Component } from '@angular/core';

@Component({
    selector: 'example-root',
    templateUrl: './example.component.html',
    styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
    onDropComplete(event) {
        console.log('onDropComplete')
    }
}
