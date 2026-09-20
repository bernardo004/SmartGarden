import { Component, Input, Output, EventEmitter } from '@angular/core';
import { PlantItemComponent } from './plant-item/plant-item.component';

@Component({
  selector: 'app-plant-list',
  standalone: true,
  imports: [PlantItemComponent],
  templateUrl: './plant-list.component.html',
  styleUrls: ['./plant-list.component.scss']
})
export class PlantListComponent {
  @Input() plants: any[] = [];
  @Input() currentUserRole: string = 'Membro'; 
  @Input() isLoading: boolean = true; 
  
  @Output() onAddPlant = new EventEmitter<void>(); 
}