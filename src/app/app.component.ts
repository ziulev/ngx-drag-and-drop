import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  cards = [
    {
      id: 0,
      title: 'Card 1'
    },
    {
      id: 1,
      title: 'Card 2'
    },
    {
      id: 2,
      title: 'Card 3'
    },
    {
      id: 3,
      title: 'Card 4'
    }
  ];
  droppedCards = [];

  onDropComplete(event) {
    // this.cards = this.cards.filter((card) => card.id !== event.id)
    this.droppedCards.push(event)
  }

}
