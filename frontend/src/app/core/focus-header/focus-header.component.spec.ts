import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FocusHeaderComponent } from './focus-header.component';

describe('FocusHeaderComponent', () => {
  let component: FocusHeaderComponent;
  let fixture: ComponentFixture<FocusHeaderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), FocusHeaderComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FocusHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
