import { Directive, ElementRef, Input, HostListener, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { myDoc } from './ngx-drag-and-drop.utils';

/* Polyfill TouchEvent */
export interface MyTouchEvent extends TouchEvent {}
/*
interface ShadowRoot extends DocumentFragment {
    styleSheets     : StyleSheetList;
    innerHTML       : string;
    host            : Element;
    activeElement   : Element;
    elementFromPoint        (x : number, y : number) : Element;
    elementsFromPoint       (x : number, y : number) : Element[];
    caretPositionFromPoint  (x : number, y : number); // => CaretPosition
};

interface ElementWithShadowRoot extends HTMLElement {
    shadowRoot  : ShadowRoot;
};*/
const dragPointerId = 'dragPointer';
type Pointer = {x: number, y: number};
class DragManager {
  draggingPointer     = new Map<string, Pointer>();
  draggedStructures   = new Map<string, Draggable | DragEvent>();
  dropZones           = new Map<Element, Dropzone >();

  public preStartDrag(
    idPointer: string,
    x: number,
    y: number,
    delay: number,
    dist: number,
  ): Promise<any> {
    this.draggingPointer  .set(idPointer, {x: x, y: y});
    return new Promise<void>( (resolve, reject) => {
      setTimeout(() => {
        const ptr   = this.draggingPointer.get(idPointer);
        const gogo  = ptr && (Math.abs(x - ptr.x) + Math.abs(y - ptr.y)) < dist;
        this.draggingPointer.delete(idPointer);

        gogo ? resolve() : reject();
      }, Math.max(0, delay));
    });
  }

  public startDrag(
    idPointer: string,
    dragged: Draggable | DragEvent,
  ): Map<Element, Dropzone> {
    this.draggedStructures.set(idPointer, dragged);
    const possibleDropZones = new Map<Element, Dropzone>();
    this.dropZones.forEach(dz => {
        if (dz.checkAccept(dragged)) {
            dz.appendDropCandidatePointer(idPointer);
            possibleDropZones.set(dz.root, dz);
        }
    });
    return possibleDropZones;
  }

  public isAssociatedToDropZone(element: Element): boolean {
    return this.dropZones.has(element);
  }

  public registerDropZone(dropzone: Dropzone) {
    this.dropZones.set(dropzone.root, dropzone);
  }

  public unregisterDropZone(dropzone: Dropzone) {
    this.dropZones.delete(dropzone.root);
  }

  public pointerMove(idPointer: string, x: number, y: number): boolean {
    const ptr = this.draggingPointer.get(idPointer);
    if (ptr) {
      ptr.x = x; ptr.y = y;
    }

    const dragged = this.draggedStructures.get(idPointer);

    if (dragged && dragged instanceof Draggable) {
      dragged.move(x, y);
    }
    return dragged !== undefined;
  }

  public pointerRelease(idPointer: string): boolean {
    const dragged = this.draggedStructures.get(idPointer);
    if (dragged) {
      if (dragged instanceof Draggable) {
        dragged.stop();
      }
    }
    this.draggedStructures.delete(idPointer);
    this.draggingPointer.delete(idPointer);
    return dragged !== undefined;
  }
}

const DM = new DragManager();

let dragDropInit = false;


@Directive({
    selector: '*[drag-and-drop-wrapper]'
})
export class DragDrop {
  nbDragEnter = 0;
  constructor() {
    if (dragDropInit) {
      console.error('Do not create multiple instance of directive drag-and-drop-wrapper !');
    } else {
      dragDropInit = true;
    }
  }

  removeFeedbackForDragPointer() {
    this.nbDragEnter = 0;
    DM.dropZones.forEach(dz => {
      dz.removePointerHover(dragPointerId);
      dz.removeDropCandidatePointer(dragPointerId);
    });
  }

  @HostListener('document: drop', ['$event']) drop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.removeFeedbackForDragPointer();
  }

  @HostListener('document: dragover', ['$event']) dragover(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  @HostListener('document: dragenter', ['$event']) dragenter(e) {
    this.nbDragEnter++;
    if (this.nbDragEnter === 1) {
      DM.startDrag(dragPointerId, e);
    }
  }

  @HostListener('document: dragleave', ['$event']) dragleave(e) {
    this.nbDragEnter--;
    if (this.nbDragEnter === 0) {
      this.removeFeedbackForDragPointer();
      DM.pointerRelease(dragPointerId);
    }
  }

  @HostListener('document: dragend', ['$event']) dragend(e) {
    DM.pointerRelease(dragPointerId);
    this.removeFeedbackForDragPointer();
    e.preventDefault();
  }

  @HostListener('document: mousemove', ['$event']) mousemove(e) {
    DM.pointerMove('mouse', e.clientX, e.clientY);
  }

  @HostListener('document: mouseup', ['$event']) mouseup(e) {
    DM.pointerRelease('mouse');
  }

  @HostListener('document: touchmove', ['$event']) touchmove(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch: Touch = e.changedTouches.item(i);
      if (DM.pointerMove(touch.identifier.toString(), touch.clientX, touch.clientY)) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }

  @HostListener('document: touchend', ['$event']) touchend(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch: Touch = e.changedTouches.item(i);
      if (DM.pointerRelease(touch.identifier.toString())) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  }
}

const offsetElement = (element: HTMLElement): { left: number, top: number } => {
  let left = 0, top = 0;
  while (element) {
    top += element.offsetTop - element.scrollTop + element.clientTop;
    left += element.offsetLeft - element.scrollLeft + element.clientLeft;
    element = element.offsetParent as HTMLElement;
  }
  return { left: left, top: top };
};

@Directive({
    selector: '*[draggable]'
})
export class Draggable implements OnInit, OnDestroy {
  @Input('draggable') draggedData: any;
  @Input('drag-start-delay') startDelay: number;
  @Input('start-distance') startDistance: number;
  @Input('disabled') disabled: boolean = false;
  @Output('drag-start') onDragStart = new EventEmitter<any>();
  @Output('drag-end') onDragEnd = new EventEmitter<any>();
  private isBeingDragged: boolean = false;
  private cloneNode: HTMLElement = null;
  private currentDropZone: Dropzone;
  private possibleDropZones = new Map<Element, Dropzone>();
  private dx: number;
  private dy: number;
  public ox: number;
  public oy: number;
  public tx: number;
  public ty: number;
  private idPointer: string;
  private root: HTMLElement;

  constructor(el: ElementRef) {
    this.root = el.nativeElement;
    if (!dragDropInit) {
      console.error('You should add one dragdrop attribute to your code before using draggable');
    }
  }

  ngOnInit() {
    //
  }

  ngOnDestroy() {
    // XXX No stop in case of unplug while dragging... : // this.stop();
  }

  @HostListener('mousedown', ['$event']) onMouseDown(event: MouseEvent) {
    if (!this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      this.prestart('mouse', event.clientX, event.clientY);
    }
  }

  @HostListener('touchstart', ['$event']) onTouchStart(event: MyTouchEvent) {
    event.stopPropagation();
    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch: Touch = event.changedTouches.item(i);
      this.prestart(touch.identifier.toString(), touch.clientX, touch.clientY);
    }
  }

  prestart(idPointer: string, x: number, y: number) {
    DM.preStartDrag(idPointer, x, y, this.startDelay || 0, this.startDistance || 10).then(
      () => {
        this.start(idPointer, x, y);
      },
      () => {
        // console.error('skip the drag');
      }
    );
  }

  start(idPointer: string, x: number, y: number) {
    if (!this.isBeingDragged) {
      this.isBeingDragged = true;
      this.idPointer = idPointer;
      const offset = offsetElement(this.root);
      this.ox = x; this.oy = y;
      this.dx = x - offset.left;
      this.dy = y - offset.top;
      this.tx = this.root.offsetWidth;
      this.ty = this.root.offsetHeight;

      this.getClone();
      this.cloneNode.style.left = (x - this.dx) + 'px';
      this.cloneNode.style.top = (y - this.dy) + 'px';
      this.onDragStart.emit(this.draggedData);
      this.possibleDropZones = DM.startDrag(idPointer, this);
    }
  }

  stop() {
    this.possibleDropZones.forEach(dz => {
      dz.removePointerHover(this.idPointer);
      dz.removeDropCandidatePointer(this.idPointer);
    });
    this.isBeingDragged = false;
    this.possibleDropZones.clear();
    this.idPointer = null;
    if (this.currentDropZone) {
      this.currentDropZone.drop(this.draggedData);
    }
    this.currentDropZone = null;
    this.onDragEnd.emit(this.draggedData);
    this.deleteClone();
  }

  move(x: number, y: number): this {
    let element: Element = null;
    if (this.cloneNode === null) {
      this.getClone();
    }
    if (this.cloneNode) {
      this.cloneNode.style.left = (x - this.dx) + 'px';
      this.cloneNode.style.top = (y - this.dy) + 'px';
      const visibility = this.cloneNode.style.visibility;
      this.cloneNode.style.visibility = 'hidden';
      const top = this.cloneNode.style.top;
      this.cloneNode.style.top = '999999999px';

      element = myDoc.elementFromPoint(x, y);

      this.cloneNode.style.top = top;
      this.cloneNode.style.visibility = visibility;

      const prevDropZone = this.currentDropZone;
      while (element) {
        this.currentDropZone = this.possibleDropZones.get(element);
        if (this.currentDropZone) { break; }
        element = <Element>element.parentElement;
      }

      if (prevDropZone !== this.currentDropZone) {
        if (prevDropZone) {
          prevDropZone.removePointerHover(this.idPointer);
        }
        if (this.currentDropZone) {
          this.currentDropZone.appendPointerHover(this.idPointer);
        }
      }
    }
    return this;
  }

  deepStyle(original: Element, clone: Element) {
    if (original instanceof HTMLElement) {
      const style = window.getComputedStyle(original);

      for (let i = 0; i < style.length; i++) {
        const att = style[i];
        (clone as HTMLElement).style[att] = style[att];
      }

      for (let i = 0; i < original.children.length; i++) {
        this.deepStyle(original.children.item(i), (clone as HTMLElement).children.item(i));
      }
    }
  }

  deleteClone() {
    if (this.cloneNode) {
      if (this.cloneNode.parentNode) {
        this.cloneNode.parentNode.removeChild(this.cloneNode);
      }
      this.cloneNode = null;
    }
  }

  getClone(): HTMLElement {
    if (this.cloneNode === null) {
      this.cloneNode = <HTMLElement>this.root.cloneNode(true);
      this.deepStyle(this.root, this.cloneNode);

      document.body.appendChild(this.cloneNode);
      this.cloneNode.style.position = 'absolute';
      this.cloneNode.style.zIndex = '999';
      this.cloneNode.style.marginLeft = '0';
      this.cloneNode.style.marginTop = '0';
      this.cloneNode.style.marginRight = '0';
      this.cloneNode.style.marginBottom = '0';
      this.cloneNode.style.opacity = '';
      this.cloneNode.style.cursor = '';
      this.cloneNode.style.transform = '';
      this.cloneNode.style.transformOrigin = '';
      this.cloneNode.style.animation = '';
      this.cloneNode.style.transition = '';
      this.cloneNode.classList.add('drag-and-drop-clone-node');
    }
    return this.cloneNode;
  }
}

@Directive({ selector: '*[dropzone]' })
export class Dropzone implements OnInit, OnDestroy {
  nbDragEnter = 0;
  public root: HTMLElement;
  @Input('drag-css') dragCSS: string;
  @Input('drag-over-css') dragOverCSS: string;
  @Input('drag-over-css-for-draggable') dragOverCSS_pointer: string;
  @Input('accept-function') acceptFunction: (data: any) => boolean;
  @Output('ondrop') onDropEmitter = new EventEmitter<any>();
  @Output('drag-start') onDragStart = new EventEmitter<any>();
  @Output('drag-end') onDragEnd = new EventEmitter<any>();
  @Output('drag-enter') onDragEnter = new EventEmitter<any>();
  @Output('drag-leave') onDragLeave = new EventEmitter<any>();

  private dropCandidateofPointers: Array<string> = [];
  private pointersHover: Array<string> = [];

  constructor(el: ElementRef) {
    if (!dragDropInit) {
      console.error('You should add one dragdrop attribute to your code before using dropzone');
    }
    this.root = el.nativeElement;
    DM.registerDropZone(this);
  }

  ngOnInit() {
    //
  }

  ngOnDestroy() {
    DM.unregisterDropZone(this);
  }

  @HostListener('dragenter', ['$event']) BrowserDragEnter(event: MouseEvent) {
    this.nbDragEnter++;
    if (this.nbDragEnter === 1) {
      this.appendPointerHover(dragPointerId);
    }
  }

  @HostListener('dragleave', ['$event']) BrowserDragLeave(event: MouseEvent) {
    this.nbDragEnter--;
    if (this.nbDragEnter === 0) {
      this.removePointerHover(dragPointerId);
    }
  }

  @HostListener('drop', ['$event']) BrowserDrop(event: MouseEvent) {
    DM.pointerRelease(dragPointerId);
    this.nbDragEnter = 0;
    this.onDropEmitter.emit(event);
  }

  drop(obj) {
    this.onDropEmitter.emit(obj);
  }

  checkAccept(drag: Draggable | DragEvent): boolean {
    let res: boolean;
    if (drag instanceof Draggable) {
      res = this.acceptFunction ? this.acceptFunction(drag.draggedData) : true;
    } else {
      res = this.acceptFunction ? this.acceptFunction(drag) : true;
    }
    return res;
  }

  hasPointerHover(idPointer: string) {
    return this.pointersHover.indexOf(idPointer) >= 0;
  }

  appendPointerHover(idPointer: string) {
    if (this.pointersHover.indexOf(idPointer) === -1) {
      const dragged = DM.draggedStructures.get(idPointer);
      this.pointersHover.push(idPointer);
      if (dragged instanceof Draggable) {
        if (this.dragOverCSS_pointer) {
          dragged.getClone().classList.add(this.dragOverCSS_pointer);
        }
        this.onDragEnter.emit(dragged.draggedData);
      } else {
        this.onDragEnter.emit(dragged);
      }
      if (this.dragOverCSS) {
        this.root.classList.add(this.dragOverCSS);
      }
    }
  }

  removePointerHover(idPointer: string) {
    const pos = this.pointersHover.indexOf(idPointer);
    if (pos >= 0) {
      const dragged = DM.draggedStructures.get(idPointer);
      this.pointersHover.splice(pos, 1);
      if (dragged instanceof Draggable) {
        if (this.dragOverCSS_pointer) {
          dragged.getClone().classList.remove(this.dragOverCSS_pointer);
        }
        this.onDragLeave.emit(dragged.draggedData);
      } else {
        this.onDragLeave.emit(dragged);
      }
      if (this.pointersHover.length === 0 && this.dragOverCSS) {
        this.root.classList.remove(this.dragOverCSS);
      }
    }
  }

  appendDropCandidatePointer(idPointer: string) {
    if (this.dropCandidateofPointers.indexOf(idPointer) === -1) {
      const dragged = DM.draggedStructures.get(idPointer);
      if (dragged instanceof Draggable) {
        this.onDragStart.emit(dragged.draggedData);
      } else {
        this.onDragStart.emit(dragged);
      }
      this.dropCandidateofPointers.push(idPointer);
      if (this.dragCSS) {
        this.root.classList.add(this.dragCSS);
      }
    }
  }

  removeDropCandidatePointer(idPointer: string) {
    const pos = this.dropCandidateofPointers.indexOf(idPointer);
    if (pos >= 0) {
      const dragged = DM.draggedStructures.get(idPointer);
      if (dragged instanceof Draggable) {
        this.onDragEnd.emit(dragged.draggedData);
      } else {
        this.onDragEnd.emit(dragged);
      }
      this.dropCandidateofPointers.splice(pos, 1);
      if (this.dropCandidateofPointers.length === 0 && this.dragCSS) {
        this.root.classList.remove(this.dragCSS);
      }
    }
  }
}
