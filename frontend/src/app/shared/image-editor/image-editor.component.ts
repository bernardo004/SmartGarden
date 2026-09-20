import { Component, Input, Output, EventEmitter, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-image-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-editor.component.html',
  styleUrls: ['./image-editor.component.scss']
})
export class ImageEditorComponent {
  @Input() imageUrl: string = '';
  @Input() format: 'circle' | 'landscape' = 'landscape';
  @Input() showControls: boolean = false;
  
  @Input() objPosY: number = 50; 
  @Output() objPosYChange = new EventEmitter<number>(); 

  @Input() zoomLevel: number = 0; 
  @Output() zoomLevelChange = new EventEmitter<number>();
  
  isDragging: boolean = false;
  startY: number = 0;
  startObjPosY: number = 0;

  constructor(private el: ElementRef) {}

  startDrag(event: MouseEvent | TouchEvent) {
    event.preventDefault();
    this.isDragging = true;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.startY = clientY;
    this.startObjPosY = this.objPosY;
  }

  @HostListener('window:mousemove', ['$event'])
  @HostListener('window:touchmove', ['$event'])
  doDrag(event: MouseEvent | TouchEvent) {
    if (!this.isDragging) return; 
    
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const deltaY = clientY - this.startY;
    const containerHeight = this.el.nativeElement.querySelector('.image-editor-container').getBoundingClientRect().height;
    
    const currentScale = 1 + (this.zoomLevel / 100);
    const moveYPct = (deltaY / (containerHeight * currentScale)) * 100;
    
    this.objPosY = Math.max(0, Math.min(100, this.startObjPosY - moveYPct));
    this.objPosYChange.emit(this.objPosY); 
  }

  @HostListener('window:mouseup')
  @HostListener('window:touchend')
  endDrag() {
    this.isDragging = false;
  }

  onZoomChange() {
    this.zoomLevelChange.emit(this.zoomLevel);
  }
}