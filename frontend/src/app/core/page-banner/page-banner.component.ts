import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-page-banner',
  standalone: true,
  imports: [CommonModule, RouterLink, AnimateOnScrollDirective],
  templateUrl: './page-banner.component.html',
  styleUrls: ['./page-banner.component.scss']
})
export class PageBannerComponent {
  @Input() bgImageUrl: string = '';
  @Input() bgPosY: number = 50;
  @Input() bgZoom: number = 0;

  @Input() backLinkUrl: string = '';
  @Input() backLinkText: string = 'Indietro';

  @Input() title: string = '';
  @Input() subtitle?: string;

  @Input() statusIcon?: string;
  @Input() statusText?: string;
  @Input() statusClass?: string;

  @Input() showEditBtn: boolean = false;
  @Input() showEditTitleBtn: boolean = false;
  @Input() showEditDescBtn: boolean = false;

  // Controlli per la data di semina
  @Input() showAddDateBtn: boolean = false;
  @Output() onAddDate = new EventEmitter<void>();

  @Output() onEdit = new EventEmitter<void>();
  @Output() onEditTitle = new EventEmitter<void>();
  @Output() onEditDesc = new EventEmitter<void>();
}
