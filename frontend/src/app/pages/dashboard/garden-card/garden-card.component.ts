import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-garden-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './garden-card.component.html',
  styleUrls: ['./garden-card.component.scss']
})
export class GardenCardComponent {
  @Input() data: any;
}
