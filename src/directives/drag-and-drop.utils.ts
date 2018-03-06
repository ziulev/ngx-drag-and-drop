/* Polyfill */
export interface MyDocument extends Document {
  elementsFromPoint(x:number, y:number) : Array<Element>;
}
export let myDoc = <MyDocument>document;

//(<MyDocument>document).elementsFromPoint = (<MyDocument>document).elementsFromPoint ||
myDoc.elementsFromPoint = myDoc.elementsFromPoint || function(x:number, y:number) : Array<Element> {
  let element, elements = [];
  let old_visibility = [];
  while (true) {
      element = document.elementFromPoint(x, y);
      if (!element || element === document.documentElement) {
          break;
      }
      elements.push(element);
      old_visibility.push(element.style.visibility);
      element.style.visibility = 'hidden'; // Temporarily hide the element (without changing the layout)
  }
  for (let k = 0; k < elements.length; k++) {
      elements[k].style.visibility = old_visibility[k];
  }
  return elements;
};

