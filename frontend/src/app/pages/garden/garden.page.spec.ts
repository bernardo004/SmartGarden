import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GardenPage } from './garden.page';

describe('GardenPage', () => {
  let component: GardenPage;
  let fixture: ComponentFixture<GardenPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GardenPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
