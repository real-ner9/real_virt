import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundForSwitcherComponent } from './background-for-switcher.component';

describe('BackgroundForSwitcherComponent', () => {
  let component: BackgroundForSwitcherComponent;
  let fixture: ComponentFixture<BackgroundForSwitcherComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BackgroundForSwitcherComponent]
    });
    fixture = TestBed.createComponent(BackgroundForSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
