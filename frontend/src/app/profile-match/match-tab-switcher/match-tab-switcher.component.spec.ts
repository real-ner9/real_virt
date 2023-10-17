import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchTabSwitcherComponent } from './match-tab-switcher.component';

describe('MatchTabSwitcherComponent', () => {
  let component: MatchTabSwitcherComponent;
  let fixture: ComponentFixture<MatchTabSwitcherComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MatchTabSwitcherComponent]
    });
    fixture = TestBed.createComponent(MatchTabSwitcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
