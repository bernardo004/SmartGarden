import { Component, ViewChild } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { FocusHeaderComponent } from '../../core/focus-header/focus-header.component';
import { ShippingComponent } from './shipping/shipping.component';
import { SummaryComponent } from './summary/summary.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    IonContent,
    FocusHeaderComponent,
    ShippingComponent,
    SummaryComponent,
    AnimateOnScrollDirective
  ],
  templateUrl: './checkout.page.html',
  styleUrls: ['./checkout.page.scss']
})
export class CheckoutPage {
  @ViewChild(SummaryComponent) summaryCmp!: SummaryComponent;

  ionViewWillEnter() {
    if (this.summaryCmp) {
      this.summaryCmp.refresh();
    }
  }
}
