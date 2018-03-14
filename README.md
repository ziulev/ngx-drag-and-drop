# ngx drag and drop
[![npm version](https://badge.fury.io/js/ngx-drag-and-drop.svg)](https://badge.fury.io/js/ngx-drag-and-drop)

Angular 5 library that allow you to build drag and drop without the native HTML5 drag & drop API.

## Usage

Start by importing DragDropModule module

```ts
import { NgxDragAndDropModule } from 'ngx-drag-and-drop';

@NgModule({
    imports: [
        NgxDragAndDropModule
    ],
})

export class ExampleModule { }
```

Add the 'drag-and-drop-wrapper', 'draggable' and 'dropzone' directives
```html
<div class="container" drag-and-drop-wrapper>

  <div class="drag" draggable="card">
    Drag me
  </div>

  <div class="drop" dropzone>
    Drop at me
  </div>

</div>
```

## How to Contribute

1. [Fork the repo](https://github.com/jet8a/ngx-drag-and-drop/fork)
2. Create a branch in your repo with a descriptive name
3. Code your fix
4. [Create a pull request](https://github.com/jet8a/ngx-drag-and-drop/compare)
5. Await response from the maintainers!