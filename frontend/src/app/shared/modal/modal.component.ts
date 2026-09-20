import { Component, Input, Output, EventEmitter, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() closeEvent = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  ngOnInit() {
    document.body.appendChild(this.el.nativeElement);
  }

  ngOnDestroy() {
    if (this.el.nativeElement.parentNode) {
      this.el.nativeElement.parentNode.removeChild(this.el.nativeElement);
    }
  }

  close() {
    this.isVisible = false;
    this.closeEvent.emit();
    document.body.style.overflow = 'auto'; 
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}