import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './action-dropdown.component.html',
  styleUrls: ['./action-dropdown.component.scss'] 
})
export class ActionDropdownComponent {
  @Input() targetRole: string = 'Membro';
  @Input() currentUserRole: string = 'Membro';
  
  @Output() onPromote = new EventEmitter<void>();
  @Output() onDemote = new EventEmitter<void>();
  @Output() onKick = new EventEmitter<void>();

  isOpen = false;

  constructor(private eRef: ElementRef) {}

  toggleDropdown() {
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}