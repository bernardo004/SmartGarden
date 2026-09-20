import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive'; 

@Component({
  selector: 'app-focus-header',
  standalone: true,
  imports: [RouterLink, AnimateOnScrollDirective],
  templateUrl: './focus-header.component.html',
  styleUrls: ['./focus-header.component.scss']
})
export class FocusHeaderComponent {
  @Input() title: string = '';
  @Input() backLinkUrl: string = '';
  @Input() backLinkText: string = 'Indietro';
}